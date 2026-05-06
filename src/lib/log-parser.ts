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
  'session_created': 'session',
  'session_updated': 'session',
  'session.update': 'session',
  'session_update': 'session',

  // User input events
  'conversation_input_text': 'user_input',
  'conversation.input.text': 'user_input',
  'audio_append': 'user_input',
  'input_audio_buffer.append': 'user_input',
  'audio_commit': 'user_input',
  'input_audio_buffer.commit': 'user_input',
  'audio_clear': 'user_input',
  'input_audio_buffer.clear': 'user_input',
  'conversation_item_create': 'user_input',
  'conversation.item.create': 'user_input',
  'conversation_item_delete': 'user_input',
  'conversation.item.delete': 'user_input',
  'conversation_item_truncate': 'user_input',
  'conversation.item.truncate': 'user_input',
  'response_create': 'user_input',
  'response.create': 'user_input',
  'response_cancel': 'user_input',
  'response.cancel': 'user_input',

  // Response lifecycle
  'response.created': 'response',
  'response_created': 'response',
  'response.done': 'response',
  'response_done': 'response',
  'response.output_item.added': 'response',
  'response_output_item_added': 'response',
  'response.output_item.done': 'response',
  'response_output_item_done': 'response',
  'response.content_part.added': 'response',
  'response_content_part_added': 'response',
  'response.content_part.done': 'response',
  'response_content_part_done': 'response',

  // Text output
  'response.text.delta': 'response',
  'response_text_delta': 'response',
  'response.text.done': 'response',
  'response_text_done': 'response',

  // Function call events
  'response.function_call_arguments.delta': 'function_call',
  'function_call_args_delta': 'function_call',
  'response.function_call_arguments.done': 'function_call',
  'function_call_args_done': 'function_call',

  // Audio events
  'response.audio.delta': 'audio',
  'response.audio.done': 'audio',
  'audio_delta': 'audio',
  'audio_done': 'audio',
  'response.audio_transcript.delta': 'audio',
  'response.audio_transcript.done': 'audio',
  'response_audio_transcript_delta': 'audio',
  'response_audio_transcript_done': 'audio',

  // Transcript events
  'conversation.item.input_audio_transcription.delta': 'transcript',
  'transcript_delta': 'transcript',
  'conversation.item.input_audio_transcription.completed': 'transcript',
  'transcript_completed': 'transcript',

  // Conversation events
  'conversation.created': 'system',
  'conversation_created': 'system',
  'conversation.item.created': 'system',
  'conversation_item_created': 'system',
  'conversation.item.deleted': 'system',
  'conversation_item_deleted': 'system',
  'conversation.item.truncated': 'system',
  'conversation_item_truncated': 'system',

  // Input audio buffer events
  'input_audio_buffer.committed': 'system',
  'input_audio_buffer_committed': 'system',
  'input_audio_buffer.cleared': 'system',
  'input_audio_buffer_cleared': 'system',
  'input_audio_buffer.speech_started': 'system',
  'input_audio_buffer.speech_stopped': 'system',
  'input_audio_buffer_speech_started': 'system',
  'input_audio_buffer_speech_stopped': 'system',

  // Error events
  'error': 'error',

  // Rate limits
  'rate_limits.updated': 'system',
  'rate_limits_updated': 'system',

  // Custom backend events
  'realtime.data': 'system',
  'realtime_data': 'system',
  'data.confirmation.required': 'system',
  'data_confirmation_required': 'system',
  'generation.started': 'system',
  'generation_started': 'system',
  'generation.completed': 'system',
  'generation_completed': 'system',
  'permission.denied': 'error',
  'permission_denied': 'error',
  'agent.switch.required': 'system',
  'agent_switch_required': 'system',
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function getString(record: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === 'string' ? value : undefined;
}

function getNestedString(
  record: Record<string, unknown> | undefined,
  parentKey: string,
  key: string
): string | undefined {
  return getString(asRecord(record?.[parentKey]), key);
}

function getAudioPayload(event: ParsedEvent): string | undefined {
  return (
    getString(event.payload, 'delta') ||
    getString(event.payload, 'audio') ||
    getNestedString(event.payload, 'data', 'audio') ||
    getNestedString(event.payload, 'payload', 'audio')
  );
}

function getTranscriptPayload(event: ParsedEvent): string | undefined {
  return (
    getString(event.payload, 'transcript') ||
    getString(event.payload, 'delta') ||
    getNestedString(event.payload, 'data', 'transcript') ||
    getNestedString(event.payload, 'data', 'delta') ||
    getNestedString(event.payload, 'payload', 'transcript') ||
    getNestedString(event.payload, 'payload', 'delta')
  );
}

function getTextPayload(event: ParsedEvent): string | undefined {
  return (
    getString(event.payload, 'text') ||
    getString(event.payload, 'delta') ||
    getNestedString(event.payload, 'data', 'text') ||
    getNestedString(event.payload, 'data', 'delta') ||
    getNestedString(event.payload, 'payload', 'text') ||
    getNestedString(event.payload, 'payload', 'delta')
  );
}

function getFunctionArgumentsPayload(event: ParsedEvent): string | undefined {
  return (
    getString(event.payload, 'arguments') ||
    getString(event.payload, 'delta') ||
    getNestedString(event.payload, 'data', 'arguments') ||
    getNestedString(event.payload, 'data', 'delta') ||
    getNestedString(event.payload, 'payload', 'arguments') ||
    getNestedString(event.payload, 'payload', 'delta')
  );
}

function getFunctionNamePayload(event: ParsedEvent): string | undefined {
  return (
    getString(event.payload, 'name') ||
    getNestedString(event.payload, 'data', 'name') ||
    getNestedString(event.payload, 'payload', 'name')
  );
}

function isAudioDeltaEvent(eventType: string): boolean {
  return (
    eventType === 'response.audio.delta' ||
    eventType === 'audio_delta'
  );
}

function isAudioDoneEvent(eventType: string): boolean {
  return (
    eventType === 'response.audio.done' ||
    eventType === 'audio_done'
  );
}

function isAudioTranscriptDeltaEvent(eventType: string): boolean {
  return (
    eventType === 'response.audio_transcript.delta' ||
    eventType === 'response_audio_transcript_delta'
  );
}

function isAudioTranscriptDoneEvent(eventType: string): boolean {
  return (
    eventType === 'response.audio_transcript.done' ||
    eventType === 'response_audio_transcript_done'
  );
}

function isTextDeltaEvent(eventType: string): boolean {
  return eventType === 'response.text.delta' || eventType === 'response_text_delta';
}

function isTextDoneEvent(eventType: string): boolean {
  return eventType === 'response.text.done' || eventType === 'response_text_done';
}

function isFunctionCallDeltaEvent(eventType: string): boolean {
  return (
    eventType === 'response.function_call_arguments.delta' ||
    eventType === 'function_call_args_delta'
  );
}

function isFunctionCallDoneEvent(eventType: string): boolean {
  return (
    eventType === 'response.function_call_arguments.done' ||
    eventType === 'function_call_args_done'
  );
}

function isResponseDoneEvent(eventType: string): boolean {
  return eventType === 'response.done' || eventType === 'response_done';
}

function isSessionEvent(eventType: string): boolean {
  return (
    eventType === 'session.created' ||
    eventType === 'session.updated' ||
    eventType === 'session_created' ||
    eventType === 'session_updated'
  );
}

function isUserAudioAppendEvent(eventType: string): boolean {
  return eventType === 'audio_append' || eventType === 'input_audio_buffer.append';
}

function isUserAudioCommitEvent(eventType: string): boolean {
  return eventType === 'audio_commit' || eventType === 'input_audio_buffer.commit';
}

function isUserTextInputEvent(eventType: string): boolean {
  return eventType === 'conversation_input_text' || eventType === 'conversation.input.text';
}

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
    requestId: payload.request_id as string | undefined,
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
    const groupId = getResponseGroupId(event);
    if (groupId) {
      const existing = groups.get(groupId) || [];
      existing.push(event);
      groups.set(groupId, existing);
    }
  }

  return groups;
}

function getResponseGroupId(event: ParsedEvent): string | undefined {
  if (event.responseId) return event.responseId;
  if (
    event.requestId &&
    (event.category === 'response' ||
      event.category === 'audio' ||
      event.category === 'function_call')
  ) {
    return event.requestId;
  }
  return undefined;
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
    if (isFunctionCallDeltaEvent(event.eventType)) {
      const delta = getFunctionArgumentsPayload(event);
      if (delta) deltas.push(delta);
    }
    if (isFunctionCallDoneEvent(event.eventType)) {
      name = getFunctionNamePayload(event);
      // If done event has full arguments, use that
      const argumentsPayload = getFunctionArgumentsPayload(event);
      if (argumentsPayload) {
        try {
          return {
            name,
            arguments: JSON.parse(argumentsPayload),
            argumentsRaw: argumentsPayload,
          };
        } catch {
          return { name, argumentsRaw: argumentsPayload };
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
    if (isAudioTranscriptDeltaEvent(event.eventType)) {
      const transcript = getTranscriptPayload(event);
      if (transcript) deltas.push(transcript);
    }
    if (isAudioTranscriptDoneEvent(event.eventType)) {
      // If done event has full transcript, prefer that
      const transcript = getTranscriptPayload(event);
      if (transcript) return transcript;
    }
  }

  return deltas.join('');
}

// ==================== AGGREGATE TEXT DELTAS ====================
export function aggregateTextDeltas(events: ParsedEvent[]): string {
  const deltas: string[] = [];

  for (const event of events) {
    if (isTextDeltaEvent(event.eventType)) {
      const text = getTextPayload(event);
      if (text) deltas.push(text);
    }
    if (isTextDoneEvent(event.eventType)) {
      const text = getTextPayload(event);
      if (text) return text;
    }
  }

  return deltas.join('');
}

// ==================== HELPER: MERGE BASE64 CHUNKS ====================
// Helper function to properly merge base64 audio chunks
// Each chunk is its own base64-encoded PCM byte range, so merge decoded bytes
// instead of concatenating encoded strings across arbitrary byte boundaries.
function mergeBase64Chunks(chunks: string[]): string {
  if (chunks.length === 0) return '';

  const decodedChunks: string[] = [];

  for (const chunk of chunks) {
    let normalized = chunk.trim();
    normalized = normalized.includes(',') ? (normalized.split(',').pop() || '') : normalized;
    normalized = normalized.replace(/\s/g, '').replace(/^"+|"+$/g, '');
    normalized = normalized.replace(/-/g, '+').replace(/_/g, '/');

    if (!normalized) continue;

    if (normalized.length % 4 === 1) return '';

    const paddingNeeded = (4 - (normalized.length % 4)) % 4;
    normalized += '='.repeat(paddingNeeded);

    try {
      decodedChunks.push(atob(normalized));
    } catch {
      return '';
    }
  }

  if (decodedChunks.length === 0) return '';

  return btoa(decodedChunks.join(''));
}

// ==================== AGGREGATE AUDIO DELTAS ====================
export function aggregateAudioDeltas(events: ParsedEvent[]): {
  audioData?: string;
  chunkCount: number;
} {
  const audioChunks: string[] = [];
  let chunkCount = 0;

  for (const event of events) {
    if (isAudioDeltaEvent(event.eventType)) {
      chunkCount++;
      const delta = getAudioPayload(event);
      if (delta) {
        audioChunks.push(delta);
      }
    }
    if (isAudioDoneEvent(event.eventType)) {
      // If done event has full audio, prefer that
      const audio = getAudioPayload(event);
      if (audio) {
        return { audioData: mergeBase64Chunks([audio]), chunkCount };
      }
    }
  }

  // Concatenate audio chunks using proper base64 merging
  if (audioChunks.length > 0) {
    return { audioData: mergeBase64Chunks(audioChunks), chunkCount };
  }

  return { chunkCount };
}

// ==================== EXTRACT TOKEN USAGE ====================
export function extractTokenUsage(events: ParsedEvent[]): TokenUsage | undefined {
  for (const event of events) {
    if (isResponseDoneEvent(event.eventType)) {
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
    e => e.category === 'function_call'
  );
  const hasAudio = sortedEvents.some(
    e => e.category === 'audio'
  );
  const hasText = sortedEvents.some(
    e => isTextDeltaEvent(e.eventType) || isTextDoneEvent(e.eventType)
  );

  let type: ResponseGroup['type'] = 'mixed';
  if (hasFunctionCall && !hasAudio && !hasText) type = 'function_call';
  else if (hasAudio && !hasFunctionCall) type = 'audio_response';
  else if (hasText && !hasFunctionCall && !hasAudio) type = 'text_response';

  // Determine status
  const doneEvent = sortedEvents.find(e => isResponseDoneEvent(e.eventType));
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
    e => isSessionEvent(e.eventType)
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
    createdAt: lastEvent.eventType === 'session.created' || lastEvent.eventType === 'session_created'
      ? lastEvent.timestamp
      : undefined,
    updatedAt: lastEvent.timestamp,
  };
}

// ==================== AGGREGATE USER AUDIO EVENTS ====================
export function aggregateUserAudioEvents(events: ParsedEvent[]): {
  audioData?: string;
  eventIds: string[];
  startTimestamp: string;
} {
  const audioChunks: string[] = [];
  const eventIds: string[] = [];
  let startTimestamp = '';

  for (const event of events) {
    if (isUserAudioAppendEvent(event.eventType)) {
      eventIds.push(event.id);
      if (!startTimestamp) startTimestamp = event.timestamp;

      const audioData = getNestedString(event.payload, 'payload', 'audio') || getString(event.payload, 'audio');
      if (audioData) {
        audioChunks.push(audioData);
      }
    }
  }

  return {
    audioData: audioChunks.length > 0 ? mergeBase64Chunks(audioChunks) : undefined,
    eventIds,
    startTimestamp,
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

  // Second pass: Group consecutive audio_append events
  const audioAppendGroups: ParsedEvent[][] = [];
  let currentAudioGroup: ParsedEvent[] = [];

  for (const event of parsedEvents) {
    if (processedEventIds.has(event.id)) continue;

    if (isUserAudioAppendEvent(event.eventType)) {
      currentAudioGroup.push(event);
    } else {
      if (currentAudioGroup.length > 0) {
        audioAppendGroups.push(currentAudioGroup);
        currentAudioGroup = [];
      }
    }
  }
  if (currentAudioGroup.length > 0) {
    audioAppendGroups.push(currentAudioGroup);
  }

  // Create user audio items from groups
  for (const audioGroup of audioAppendGroups) {
    const aggregated = aggregateUserAudioEvents(audioGroup);
    audioGroup.forEach(e => processedEventIds.add(e.id));

    items.push({
      id: `user_audio_${audioGroup[0].id}`,
      type: 'user_input',
      timestamp: aggregated.startTimestamp,
      userInput: {
        inputType: 'audio',
        hasAudio: true,
        audioData: aggregated.audioData,
      },
      events: audioGroup,
    });
  }

  // Third pass: Process remaining events
  for (const event of parsedEvents) {
    if (processedEventIds.has(event.id)) continue;

    // Session events
    if (isSessionEvent(event.eventType)) {
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
          eventType: event.eventType === 'session.created' || event.eventType === 'session_created'
            ? 'created'
            : 'updated',
        },
        events: [event],
      });
      continue;
    }

    // User input events
    if (event.source === 'USER') {
      if (isUserTextInputEvent(event.eventType)) {
        items.push({
          id: `user_${event.id}`,
          type: 'user_input',
          timestamp: event.timestamp,
          userInput: {
            inputType: 'text',
            text: getNestedString(event.payload, 'payload', 'text') || getString(event.payload, 'text'),
          },
          events: [event],
        });
      } else if (isUserAudioCommitEvent(event.eventType)) {
        // audio_append events are pre-grouped, audio_commit is a separate signal
        items.push({
          id: `system_${event.id}`,
          type: 'system_event',
          timestamp: event.timestamp,
          systemEvent: {
            eventType: event.eventType,
            description: 'Audio input committed',
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
    if (event.eventType === 'error' || event.eventType === 'permission.denied' || event.eventType === 'permission_denied') {
      const errorPayload = event.payload.error as Record<string, unknown> | undefined;
      items.push({
        id: `error_${event.id}`,
        type: 'error',
        timestamp: event.timestamp,
        error: {
          message: (errorPayload?.message || event.payload.message || 'Unknown error') as string,
          code: (errorPayload?.code || event.payload.code) as string,
          type: (errorPayload?.type || event.payload.type) as string,
        },
        events: [event],
      });
      continue;
    }

    // Conversation item created (often contains user message)
    if (event.eventType === 'conversation.item.created' || event.eventType === 'conversation_item_created') {
      const item = event.payload.item as Record<string, unknown> | undefined;
      if (item?.role === 'user') {
        const content = item.content as Array<Record<string, unknown>> | undefined;
        const textContent = content?.find(c => c.type === 'input_text');
        if (textContent) {

          // Check if we have a recent matching user input event
          // We look backwards through the items to find a user_input item with the same text
          const matchingItem = items.slice().reverse().find(item =>
            item.type === 'user_input' &&
            item.userInput?.text === textContent.text as string &&
            // Optional: check time proximity if needed, but for now content matching is safest
            // We assume the client event comes BEFORE the server event
            true
          );

          if (matchingItem) {
            // Merge this event into the existing item
            matchingItem.events.push(event);
            continue;
          }

          // If no match found, create new item (fallback)
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
    'conversation_created': 'Conversation initialized',
    'conversation.item.created': 'Conversation item added',
    'conversation_item_created': 'Conversation item added',
    'conversation.item.deleted': 'Conversation item removed',
    'conversation_item_deleted': 'Conversation item removed',
    'conversation.item.truncated': 'Conversation item truncated',
    'conversation_item_truncated': 'Conversation item truncated',
    'input_audio_buffer.committed': 'Audio buffer committed',
    'input_audio_buffer_committed': 'Audio buffer committed',
    'input_audio_buffer.cleared': 'Audio buffer cleared',
    'input_audio_buffer_cleared': 'Audio buffer cleared',
    'input_audio_buffer.speech_started': 'Speech detected',
    'input_audio_buffer.speech_stopped': 'Speech ended',
    'rate_limits.updated': 'Rate limits updated',
    'rate_limits_updated': 'Rate limits updated',
    'realtime.data': 'Realtime data received',
    'realtime_data': 'Realtime data received',
    'generation.started': 'Generation started',
    'generation_started': 'Generation started',
    'generation.completed': 'Generation completed',
    'generation_completed': 'Generation completed',
    'agent.switch.required': 'Agent switch requested',
    'agent_switch_required': 'Agent switch requested',
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

// ==================== GET SESSION START TIMES ====================
export function getSessionStartTimes(rawLines: RawLogLine[]): Record<string, string> {
  const startTimes: Record<string, string> = {};
  for (const line of rawLines) {
    if (!startTimes[line.sessionId]) {
      startTimes[line.sessionId] = line.timestamp;
    }
  }
  return startTimes;
}

// ==================== FILTER BY SESSION ====================
export function filterBySession(rawLines: RawLogLine[], sessionId: string): RawLogLine[] {
  return rawLines.filter(line => line.sessionId === sessionId);
}
