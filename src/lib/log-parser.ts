import {
  EventSource,
  EventCategory,
  RawLogLine,
  ParsedEvent,
  ResponseGroup,
  ConversationItem,
  TokenUsage,
  SessionData,
} from './ui-types';

// ==================== LOG LINE REGEX ====================
// Format: {ISO_TIMESTAMP} [{SESSION_ID}] [{SOURCE}] {JSON_PAYLOAD}
const LOG_LINE_REGEX = /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s+\[([^\]]+)\]\s+\[(OPENAI|USER)\]\s+(.+)$/;

// ==================== EVENT CATEGORY MAPPING ====================
const EVENT_CATEGORY_MAP: Record<string, EventCategory> = {
  // Session events
  'session.created': 'session',
  'session.updated': 'session',
  'session_update': 'session',

  // User input events
  'conversation_input_text': 'user_input',
  'audio_append': 'user_input',
  'audio_commit': 'user_input',
  'audio_clear': 'user_input',
  'conversation_item_create': 'user_input',
  'conversation_item_delete': 'user_input',
  'conversation_item_truncate': 'user_input',
  'response_create': 'user_input',
  'response_cancel': 'user_input',

  // Response lifecycle
  'response.created': 'response',
  'response.done': 'response',
  'response.output_item.added': 'response',
  'response.output_item.done': 'response',
  'response.content_part.added': 'response',
  'response.content_part.done': 'response',

  // Text output
  'response.text.delta': 'response',
  'response.text.done': 'response',

  // Function call events
  'response.function_call_arguments.delta': 'function_call',
  'response.function_call_arguments.done': 'function_call',

  // Audio events
  'response.audio.delta': 'audio',
  'response.audio.done': 'audio',
  'response.audio_transcript.delta': 'audio',
  'response.audio_transcript.done': 'audio',

  // Transcript events
  'conversation.item.input_audio_transcription.delta': 'transcript',
  'conversation.item.input_audio_transcription.completed': 'transcript',

  // Conversation events
  'conversation.created': 'system',
  'conversation.item.created': 'system',
  'conversation.item.deleted': 'system',
  'conversation.item.truncated': 'system',

  // Input audio buffer events
  'input_audio_buffer.committed': 'system',
  'input_audio_buffer.cleared': 'system',
  'input_audio_buffer.speech_started': 'system',
  'input_audio_buffer.speech_stopped': 'system',

  // Error events
  'error': 'error',

  // Rate limits
  'rate_limits.updated': 'system',

  // Custom backend events
  'realtime.data': 'system',
  'data.confirmation.required': 'system',
  'generation.started': 'system',
  'permission.denied': 'error',
  'agent.switch.required': 'system',
};

// ==================== PARSE SINGLE LOG LINE ====================
export function parseLogLine(line: string, index: number): RawLogLine | null {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  const match = trimmedLine.match(LOG_LINE_REGEX);
  if (!match) {
    console.warn(`Failed to parse log line ${index}: ${trimmedLine.substring(0, 100)}...`);
    return null;
  }

  const [, timestamp, sessionId, source, jsonStr] = match;

  try {
    const payload = JSON.parse(jsonStr);
    return {
      id: `log_${index}_${Date.now()}`,
      timestamp,
      sessionId,
      source: source as EventSource,
      eventType: payload.type || 'unknown',
      payload,
      rawLine: trimmedLine,
    };
  } catch (e) {
    console.warn(`Failed to parse JSON in log line ${index}:`, e);
    return null;
  }
}

// ==================== PARSE ENTIRE LOG FILE ====================
export function parseLogFile(content: string): RawLogLine[] {
  const lines = content.split('\n');
  const parsedLines: RawLogLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLogLine(lines[i], i);
    if (parsed) {
      parsedLines.push(parsed);
    }
  }

  return parsedLines;
}

// ==================== GET EVENT CATEGORY ====================
export function getEventCategory(eventType: string): EventCategory {
  return EVENT_CATEGORY_MAP[eventType] || 'unknown';
}

// ==================== CONVERT TO PARSED EVENT ====================
export function toParsedEvent(rawLine: RawLogLine): ParsedEvent {
  const payload = rawLine.payload;

  return {
    ...rawLine,
    category: getEventCategory(rawLine.eventType),
    eventId: payload.event_id as string | undefined,
    responseId: payload.response_id as string | undefined,
    itemId: payload.item_id as string | undefined,
    callId: payload.call_id as string | undefined,
    outputIndex: payload.output_index as number | undefined,
    delta: payload.delta as string | undefined,
    obfuscation: payload.obfuscation as string | undefined,
  };
}

// ==================== GROUP EVENTS BY RESPONSE ID ====================
export function groupEventsByResponseId(events: ParsedEvent[]): Map<string, ParsedEvent[]> {
  const groups = new Map<string, ParsedEvent[]>();

  for (const event of events) {
    if (event.responseId) {
      const existing = groups.get(event.responseId) || [];
      existing.push(event);
      groups.set(event.responseId, existing);
    }
  }

  return groups;
}

// ==================== AGGREGATE FUNCTION CALL DELTAS ====================
export function aggregateFunctionCallDeltas(events: ParsedEvent[]): {
  name?: string;
  arguments?: Record<string, unknown>;
  argumentsRaw?: string;
} {
  const deltas: string[] = [];
  let name: string | undefined;

  for (const event of events) {
    if (event.eventType === 'response.function_call_arguments.delta' && event.delta) {
      deltas.push(event.delta);
    }
    if (event.eventType === 'response.function_call_arguments.done') {
      name = event.payload.name as string;
      // If done event has full arguments, use that
      if (event.payload.arguments) {
        try {
          return {
            name,
            arguments: JSON.parse(event.payload.arguments as string),
            argumentsRaw: event.payload.arguments as string,
          };
        } catch {
          return { name, argumentsRaw: event.payload.arguments as string };
        }
      }
    }
  }

  // Fallback: reconstruct from deltas
  const fullArgs = deltas.join('');
  if (fullArgs) {
    try {
      return { name, arguments: JSON.parse(fullArgs), argumentsRaw: fullArgs };
    } catch {
      return { name, argumentsRaw: fullArgs };
    }
  }

  return { name };
}

// ==================== AGGREGATE AUDIO TRANSCRIPT DELTAS ====================
export function aggregateAudioTranscriptDeltas(events: ParsedEvent[]): string {
  const deltas: string[] = [];

  for (const event of events) {
    if (event.eventType === 'response.audio_transcript.delta' && event.delta) {
      deltas.push(event.delta);
    }
    if (event.eventType === 'response.audio_transcript.done') {
      // If done event has full transcript, prefer that
      const transcript = event.payload.transcript as string;
      if (transcript) return transcript;
    }
  }

  return deltas.join('');
}

// ==================== AGGREGATE TEXT DELTAS ====================
export function aggregateTextDeltas(events: ParsedEvent[]): string {
  const deltas: string[] = [];

  for (const event of events) {
    if (event.eventType === 'response.text.delta' && event.delta) {
      deltas.push(event.delta);
    }
    if (event.eventType === 'response.text.done') {
      const text = event.payload.text as string;
      if (text) return text;
    }
  }

  return deltas.join('');
}

// ==================== AGGREGATE AUDIO DELTAS ====================
export function aggregateAudioDeltas(events: ParsedEvent[]): {
  audioData?: string;
  chunkCount: number;
} {
  const audioChunks: string[] = [];
  let chunkCount = 0;

  for (const event of events) {
    if (event.eventType === 'response.audio.delta') {
      chunkCount++;
      const delta = event.payload.delta as string;
      if (delta) {
        audioChunks.push(delta);
      }
    }
    if (event.eventType === 'response.audio.done') {
      // If done event has full audio, prefer that
      const audio = event.payload.audio as string;
      if (audio) {
        return { audioData: audio, chunkCount };
      }
    }
  }

  // Concatenate audio chunks
  if (audioChunks.length > 0) {
    return { audioData: audioChunks.join(''), chunkCount };
  }

  return { chunkCount };
}

// ==================== EXTRACT TOKEN USAGE ====================
export function extractTokenUsage(events: ParsedEvent[]): TokenUsage | undefined {
  for (const event of events) {
    if (event.eventType === 'response.done') {
      const response = event.payload.response as Record<string, unknown> | undefined;
      const usage = response?.usage as Record<string, unknown> | undefined;

      if (usage) {
        const inputDetails = usage.input_token_details as Record<string, number> | undefined;
        const outputDetails = usage.output_token_details as Record<string, number> | undefined;

        return {
          totalTokens: (usage.total_tokens as number) || 0,
          inputTokens: (usage.input_tokens as number) || 0,
          outputTokens: (usage.output_tokens as number) || 0,
          inputTokenDetails: inputDetails ? {
            textTokens: inputDetails.text_tokens || 0,
            audioTokens: inputDetails.audio_tokens || 0,
            cachedTokens: inputDetails.cached_tokens || 0,
          } : undefined,
          outputTokenDetails: outputDetails ? {
            textTokens: outputDetails.text_tokens || 0,
            audioTokens: outputDetails.audio_tokens || 0,
          } : undefined,
        };
      }
    }
  }
  return undefined;
}

// ==================== CREATE RESPONSE GROUP ====================
export function createResponseGroup(responseId: string, events: ParsedEvent[]): ResponseGroup {
  // Sort events by timestamp
  const sortedEvents = [...events].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );

  // Determine response type
  const hasFunctionCall = sortedEvents.some(
    e => e.eventType.includes('function_call')
  );
  const hasAudio = sortedEvents.some(
    e => e.eventType.includes('audio')
  );
  const hasText = sortedEvents.some(
    e => e.eventType.includes('text')
  );

  let type: ResponseGroup['type'] = 'mixed';
  if (hasFunctionCall && !hasAudio && !hasText) type = 'function_call';
  else if (hasAudio && !hasFunctionCall) type = 'audio_response';
  else if (hasText && !hasFunctionCall && !hasAudio) type = 'text_response';

  // Determine status
  const doneEvent = sortedEvents.find(e => e.eventType === 'response.done');
  const status: ResponseGroup['status'] = doneEvent ? 'completed' : 'in_progress';

  // Aggregate data
  const functionData = hasFunctionCall ? aggregateFunctionCallDeltas(sortedEvents) : undefined;
  const transcript = hasAudio ? aggregateAudioTranscriptDeltas(sortedEvents) : undefined;
  const textContent = hasText ? aggregateTextDeltas(sortedEvents) : undefined;
  const audioResult = hasAudio ? aggregateAudioDeltas(sortedEvents) : undefined;
  const usage = extractTokenUsage(sortedEvents);

  return {
    responseId,
    events: sortedEvents,
    startTime: sortedEvents[0]?.timestamp || '',
    endTime: sortedEvents[sortedEvents.length - 1]?.timestamp,
    status,
    type,
    functionName: functionData?.name,
    functionArguments: functionData?.arguments,
    transcript,
    textContent,
    audioData: audioResult?.audioData,
    audioChunkCount: audioResult?.chunkCount,
    usage,
  };
}

// ==================== EXTRACT SESSION DATA ====================
export function extractSessionData(events: ParsedEvent[]): SessionData | undefined {
  // Find the last session.updated or session.created event
  const sessionEvents = events.filter(
    e => e.eventType === 'session.created' || e.eventType === 'session.updated'
  );

  if (sessionEvents.length === 0) return undefined;

  const lastEvent = sessionEvents[sessionEvents.length - 1];
  const session = lastEvent.payload.session as Record<string, unknown> | undefined;

  if (!session) return undefined;

  const tools = session.tools as Array<Record<string, unknown>> | undefined;

  return {
    id: session.id as string,
    model: session.model as string,
    voice: session.voice as string,
    instructions: session.instructions as string,
    tools: tools?.map(t => ({
      type: t.type as string,
      name: t.name as string,
      description: t.description as string | undefined,
    })),
    modalities: session.modalities as string[],
    turnDetection: session.turn_detection as Record<string, unknown>,
    createdAt: lastEvent.eventType === 'session.created' ? lastEvent.timestamp : undefined,
    updatedAt: lastEvent.timestamp,
  };
}

// ==================== BUILD CONVERSATION ITEMS ====================
export function buildConversationItems(rawLines: RawLogLine[]): ConversationItem[] {
  const parsedEvents = rawLines.map(toParsedEvent);
  const items: ConversationItem[] = [];
  const responseGroups = groupEventsByResponseId(parsedEvents);

  // Track which events have been processed
  const processedEventIds = new Set<string>();

  // First pass: Group response events
  for (const [responseId, groupEvents] of responseGroups) {
    const responseGroup = createResponseGroup(responseId, groupEvents);

    // Mark events as processed
    groupEvents.forEach(e => processedEventIds.add(e.id));

    items.push({
      id: `response_${responseId}`,
      type: 'response_group',
      timestamp: responseGroup.startTime,
      responseGroup,
      events: groupEvents,
    });
  }

  // Second pass: Process remaining events
  for (const event of parsedEvents) {
    if (processedEventIds.has(event.id)) continue;

    // Session events
    if (event.eventType === 'session.created' || event.eventType === 'session.updated') {
      const session = event.payload.session as Record<string, unknown> | undefined;
      const tools = session?.tools as Array<Record<string, unknown>> | undefined;

      items.push({
        id: `session_${event.id}`,
        type: 'session_event',
        timestamp: event.timestamp,
        sessionData: {
          model: session?.model as string,
          voice: session?.voice as string,
          instructions: session?.instructions as string,
          tools: tools?.map(t => ({
            name: t.name as string,
            description: t.description as string,
          })),
          modalities: session?.modalities as string[],
          eventType: event.eventType === 'session.created' ? 'created' : 'updated',
        },
        events: [event],
      });
      continue;
    }

    // User input events
    if (event.source === 'USER') {
      if (event.eventType === 'conversation_input_text') {
        const payload = event.payload.payload as Record<string, unknown> | undefined;
        items.push({
          id: `user_${event.id}`,
          type: 'user_input',
          timestamp: event.timestamp,
          userInput: {
            inputType: 'text',
            text: payload?.text as string,
          },
          events: [event],
        });
      } else if (event.eventType === 'audio_append' || event.eventType === 'audio_commit') {
        // Find or create audio input group
        items.push({
          id: `user_${event.id}`,
          type: 'user_input',
          timestamp: event.timestamp,
          userInput: {
            inputType: 'audio',
            hasAudio: true,
          },
          events: [event],
        });
      } else {
        // Other user events as system events
        items.push({
          id: `system_${event.id}`,
          type: 'system_event',
          timestamp: event.timestamp,
          systemEvent: {
            eventType: event.eventType,
            description: `User action: ${event.eventType}`,
          },
          events: [event],
        });
      }
      continue;
    }

    // Error events
    if (event.eventType === 'error' || event.eventType === 'permission.denied') {
      const errorPayload = event.payload.error as Record<string, unknown> | undefined;
      items.push({
        id: `error_${event.id}`,
        type: 'error',
        timestamp: event.timestamp,
        error: {
          message: (errorPayload?.message || event.payload.message || 'Unknown error') as string,
          code: errorPayload?.code as string,
          type: errorPayload?.type as string,
        },
        events: [event],
      });
      continue;
    }

    // Conversation item created (often contains user message)
    if (event.eventType === 'conversation.item.created') {
      const item = event.payload.item as Record<string, unknown> | undefined;
      if (item?.role === 'user') {
        const content = item.content as Array<Record<string, unknown>> | undefined;
        const textContent = content?.find(c => c.type === 'input_text');
        if (textContent) {
          items.push({
            id: `user_${event.id}`,
            type: 'user_input',
            timestamp: event.timestamp,
            userInput: {
              inputType: 'text',
              text: textContent.text as string,
            },
            events: [event],
          });
          continue;
        }
      }
    }

    // Other system events
    if (event.category === 'system' || event.category === 'unknown') {
      items.push({
        id: `system_${event.id}`,
        type: 'system_event',
        timestamp: event.timestamp,
        systemEvent: {
          eventType: event.eventType,
          description: getEventDescription(event.eventType),
        },
        events: [event],
      });
    }
  }

  // Sort by timestamp
  items.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return items;
}

// ==================== EVENT DESCRIPTION HELPER ====================
function getEventDescription(eventType: string): string {
  const descriptions: Record<string, string> = {
    'conversation.created': 'Conversation initialized',
    'conversation.item.created': 'Conversation item added',
    'conversation.item.deleted': 'Conversation item removed',
    'conversation.item.truncated': 'Conversation item truncated',
    'input_audio_buffer.committed': 'Audio buffer committed',
    'input_audio_buffer.cleared': 'Audio buffer cleared',
    'input_audio_buffer.speech_started': 'Speech detected',
    'input_audio_buffer.speech_stopped': 'Speech ended',
    'rate_limits.updated': 'Rate limits updated',
    'realtime.data': 'Realtime data received',
    'generation.started': 'Generation started',
    'agent.switch.required': 'Agent switch requested',
  };

  return descriptions[eventType] || eventType;
}

// ==================== FORMAT TIMESTAMP ====================
export function formatTimestamp(isoTimestamp: string): string {
  try {
    const date = new Date(isoTimestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    // Extract time from ISO string
    const match = isoTimestamp.match(/T(\d{2}:\d{2}:\d{2})/);
    return match ? match[1] : isoTimestamp;
  }
}

// ==================== FORMAT DURATION ====================
export function formatDuration(startTimestamp: string, endTimestamp: string): string {
  try {
    const start = new Date(startTimestamp).getTime();
    const end = new Date(endTimestamp).getTime();
    const durationMs = end - start;

    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
    return `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;
  } catch {
    return '';
  }
}

// ==================== GET UNIQUE SESSIONS ====================
export function getUniqueSessions(rawLines: RawLogLine[]): string[] {
  const sessions = new Set<string>();
  for (const line of rawLines) {
    sessions.add(line.sessionId);
  }
  return Array.from(sessions);
}

// ==================== FILTER BY SESSION ====================
export function filterBySession(rawLines: RawLogLine[], sessionId: string): RawLogLine[] {
  return rawLines.filter(line => line.sessionId === sessionId);
}
