// ==================== SESSION TYPES ====================
export type SessionStatus = 'active' | 'completed' | 'error';

export interface Session {
  id: string;
  name: string;
  status: SessionStatus;
  dateStr: string;
  duration?: string;
  timeStr?: string;
  eventCount?: number;
}

// ==================== LEGACY LOG TYPES (for backward compatibility) ====================
export type LogType = 'user' | 'assistant' | 'tool' | 'system';

export interface LogEntry {
  id: string;
  type: LogType;
  timestamp: string;
  content?: string;
  metadata?: Record<string, unknown>;
  isAudio?: boolean;
  toolName?: string;
  toolArgs?: string;
}

// ==================== EVENT SOURCE ====================
export type EventSource = 'OPENAI' | 'USER';

// ==================== CLIENT EVENT TYPES (snake_case) ====================
export type ClientEventType =
  | 'audio_append'
  | 'audio_commit'
  | 'audio_clear'
  | 'input_audio_buffer.append'
  | 'input_audio_buffer.commit'
  | 'input_audio_buffer.clear'
  | 'conversation_item_truncate'
  | 'conversation.item.truncate'
  | 'response_cancel'
  | 'response.cancel'
  | 'conversation_input_text'
  | 'conversation.input.text'
  | 'conversation_item_create'
  | 'conversation.item.create'
  | 'conversation_item_delete'
  | 'conversation.item.delete'
  | 'response_create'
  | 'response.create'
  | 'session_update'
  | 'session.update'
  | 'unknown';

// ==================== OPENAI EVENT TYPES (dot.notation) ====================
export type OpenAIEventType =
  // Session
  | 'session.created'
  | 'session.updated'
  | 'session_created'
  | 'session_updated'
  // Audio Output
  | 'response.audio.delta'
  | 'response.audio.done'
  | 'audio_delta'
  | 'audio_done'
  // User Transcript
  | 'conversation.item.input_audio_transcription.delta'
  | 'conversation.item.input_audio_transcription.completed'
  | 'transcript_delta'
  | 'transcript_completed'
  // Response Lifecycle
  | 'response.created'
  | 'response.done'
  | 'response_created'
  | 'response_done'
  | 'response.output_item.added'
  | 'response.output_item.done'
  | 'response_output_item_added'
  | 'response_output_item_done'
  | 'response.content_part.added'
  | 'response.content_part.done'
  | 'response_content_part_added'
  | 'response_content_part_done'
  // Text Output
  | 'response.text.delta'
  | 'response.text.done'
  | 'response_text_delta'
  | 'response_text_done'
  // Audio Transcript
  | 'response.audio_transcript.delta'
  | 'response.audio_transcript.done'
  | 'response_audio_transcript_delta'
  | 'response_audio_transcript_done'
  // Function Call
  | 'response.function_call_arguments.delta'
  | 'response.function_call_arguments.done'
  | 'function_call_args_delta'
  | 'function_call_args_done'
  // Conversation
  | 'conversation.created'
  | 'conversation.item.created'
  | 'conversation.item.deleted'
  | 'conversation.item.truncated'
  | 'conversation_created'
  | 'conversation_item_created'
  | 'conversation_item_deleted'
  | 'conversation_item_truncated'
  // Input Audio Buffer
  | 'input_audio_buffer.committed'
  | 'input_audio_buffer.cleared'
  | 'input_audio_buffer.speech_started'
  | 'input_audio_buffer.speech_stopped'
  | 'input_audio_buffer_committed'
  | 'input_audio_buffer_cleared'
  | 'input_audio_buffer_speech_started'
  | 'input_audio_buffer_speech_stopped'
  // Error & Rate Limits
  | 'error'
  | 'rate_limits.updated'
  | 'rate_limits_updated'
  // Custom Backend
  | 'realtime.data'
  | 'realtime_data'
  | 'data.confirmation.required'
  | 'data_confirmation_required'
  | 'generation.started'
  | 'generation_started'
  | 'generation.completed'
  | 'generation_completed'
  | 'permission.denied'
  | 'permission_denied'
  | 'agent.switch.required'
  | 'agent_switch_required'
  | 'unknown';

export type RealtimeEventType = ClientEventType | OpenAIEventType;

// ==================== EVENT CATEGORIES ====================
export type EventCategory =
  | 'session'
  | 'user_input'
  | 'response'
  | 'function_call'
  | 'audio'
  | 'transcript'
  | 'error'
  | 'system'
  | 'unknown';

// ==================== RAW LOG STRUCTURES ====================
export interface RawLogLine {
  id: string;
  timestamp: string;
  sessionId: string;
  source: EventSource;
  eventType: string;
  payload: Record<string, unknown>;
  rawLine: string;
}

// ==================== PARSED EVENT ====================
export interface ParsedEvent extends RawLogLine {
  category: EventCategory;
  // Common OpenAI fields
  eventId?: string;
  responseId?: string;
  requestId?: string;
  itemId?: string;
  callId?: string;
  outputIndex?: number;
  // Delta content
  delta?: string;
  // Obfuscation (for audio)
  obfuscation?: string;
}

// ==================== GROUPED STRUCTURES ====================
export interface ResponseGroup {
  responseId: string;
  events: ParsedEvent[];
  startTime: string;
  endTime?: string;
  status: 'in_progress' | 'completed' | 'error';
  // Summary data
  type: 'function_call' | 'audio_response' | 'text_response' | 'mixed';
  functionName?: string;
  functionArguments?: Record<string, unknown>;
  transcript?: string;
  textContent?: string;
  audioData?: string; // Aggregated base64 audio data
  audioChunkCount?: number; // Number of audio delta events
  usage?: TokenUsage;
}

export interface TokenUsage {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  inputTokenDetails?: {
    textTokens: number;
    audioTokens: number;
    cachedTokens: number;
  };
  outputTokenDetails?: {
    textTokens: number;
    audioTokens: number;
  };
}

// ==================== CONVERSATION ITEM ====================
export type ConversationItemType =
  | 'session_event'
  | 'user_input'
  | 'response_group'
  | 'error'
  | 'system_event';

export interface ConversationItem {
  id: string;
  type: ConversationItemType;
  timestamp: string;
  // For session events
  sessionData?: {
    model?: string;
    voice?: string;
    instructions?: string;
    tools?: Array<{ name: string; description?: string }>;
    modalities?: string[];
    eventType: 'created' | 'updated';
  };
  // For user input
  userInput?: {
    inputType: 'text' | 'audio';
    text?: string;
    hasAudio?: boolean;
    audioData?: string; // Base64 audio data
  };
  // For response groups
  responseGroup?: ResponseGroup;
  // For errors
  error?: {
    message: string;
    code?: string;
    type?: string;
  };
  // For system events
  systemEvent?: {
    eventType: string;
    description: string;
  };
  // Raw events for this item
  events: ParsedEvent[];
}

// ==================== SESSION DATA ====================
export interface SessionData {
  id: string;
  model?: string;
  voice?: string;
  instructions?: string;
  tools?: Array<{ type: string; name: string; description?: string }>;
  modalities?: string[];
  turnDetection?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== INSPECTOR STATE ====================
export interface InspectorState {
  selectedEvent: ParsedEvent | null;
  relatedEvents: ParsedEvent[];
  conversationItem: ConversationItem | null;
}
