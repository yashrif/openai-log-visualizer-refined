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
  | 'conversation_item_truncate'
  | 'response_cancel'
  | 'conversation_input_text'
  | 'conversation_item_create'
  | 'conversation_item_delete'
  | 'response_create'
  | 'session_update'
  | 'unknown';

// ==================== OPENAI EVENT TYPES (dot.notation) ====================
export type OpenAIEventType =
  // Session
  | 'session.created'
  | 'session.updated'
  // Audio Output
  | 'response.audio.delta'
  | 'response.audio.done'
  // User Transcript
  | 'conversation.item.input_audio_transcription.delta'
  | 'conversation.item.input_audio_transcription.completed'
  // Response Lifecycle
  | 'response.created'
  | 'response.done'
  | 'response.output_item.added'
  | 'response.output_item.done'
  | 'response.content_part.added'
  | 'response.content_part.done'
  // Text Output
  | 'response.text.delta'
  | 'response.text.done'
  // Audio Transcript
  | 'response.audio_transcript.delta'
  | 'response.audio_transcript.done'
  // Function Call
  | 'response.function_call_arguments.delta'
  | 'response.function_call_arguments.done'
  // Conversation
  | 'conversation.created'
  | 'conversation.item.created'
  | 'conversation.item.deleted'
  | 'conversation.item.truncated'
  // Input Audio Buffer
  | 'input_audio_buffer.committed'
  | 'input_audio_buffer.cleared'
  | 'input_audio_buffer.speech_started'
  | 'input_audio_buffer.speech_stopped'
  // Error & Rate Limits
  | 'error'
  | 'rate_limits.updated'
  // Custom Backend
  | 'realtime.data'
  | 'data.confirmation.required'
  | 'generation.started'
  | 'permission.denied'
  | 'agent.switch.required'
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
    eventType: 'created' | 'updated';
  };
  // For user input
  userInput?: {
    inputType: 'text' | 'audio';
    text?: string;
    hasAudio?: boolean;
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
