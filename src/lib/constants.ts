import { Session, LogEntry, EventCategory } from './ui-types';

// ==================== EVENT CATEGORY STYLING ====================
export interface EventCategoryStyle {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  label: string;
}

export const EVENT_CATEGORY_STYLES: Record<EventCategory, EventCategoryStyle> = {
  session: {
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-border',
    icon: 'Settings',
    label: 'Session',
  },
  user_input: {
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    icon: 'User',
    label: 'User',
  },
  response: {
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    icon: 'Bot',
    label: 'Response',
  },
  function_call: {
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: 'Wrench',
    label: 'Function',
  },
  audio: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: 'Mic',
    label: 'Audio',
  },
  transcript: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: 'FileText',
    label: 'Transcript',
  },
  error: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: 'AlertTriangle',
    label: 'Error',
  },
  system: {
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-border',
    icon: 'Activity',
    label: 'System',
  },
  unknown: {
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    borderColor: 'border-border',
    icon: 'HelpCircle',
    label: 'Unknown',
  },
};

// ==================== EVENT TYPE DISPLAY NAMES ====================
export const EVENT_DISPLAY_NAMES: Record<string, string> = {
  // Session
  'session.created': 'Session Created',
  'session.updated': 'Session Updated',
  'session_created': 'Session Created',
  'session_updated': 'Session Updated',
  'session.update': 'Session Update',
  'session_update': 'Session Update',

  // User input
  'conversation_input_text': 'Text Input',
  'conversation.input.text': 'Text Input',
  'audio_append': 'Audio Chunk',
  'input_audio_buffer.append': 'Audio Chunk',
  'audio_commit': 'Audio Committed',
  'input_audio_buffer.commit': 'Audio Committed',
  'audio_clear': 'Audio Cleared',
  'input_audio_buffer.clear': 'Audio Cleared',
  'conversation_item_truncate': 'Item Truncate',
  'conversation.item.truncate': 'Item Truncate',
  'response_cancel': 'Response Cancel',
  'response.cancel': 'Response Cancel',
  'conversation_item_create': 'Item Create',
  'conversation.item.create': 'Item Create',
  'conversation_item_delete': 'Item Delete',
  'conversation.item.delete': 'Item Delete',
  'response_create': 'Response Create',
  'response.create': 'Response Create',

  // Response lifecycle
  'response.created': 'Response Started',
  'response_created': 'Response Started',
  'response.done': 'Response Complete',
  'response_done': 'Response Complete',
  'response.output_item.added': 'Output Added',
  'response_output_item_added': 'Output Added',
  'response.output_item.done': 'Output Complete',
  'response_output_item_done': 'Output Complete',
  'response.content_part.added': 'Content Added',
  'response_content_part_added': 'Content Added',
  'response.content_part.done': 'Content Complete',
  'response_content_part_done': 'Content Complete',

  // Function calls
  'response.function_call_arguments.delta': 'Function Args (streaming)',
  'function_call_args_delta': 'Function Args (streaming)',
  'response.function_call_arguments.done': 'Function Call Complete',
  'function_call_args_done': 'Function Call Complete',

  // Audio
  'response.audio.delta': 'Audio Chunk',
  'response.audio.done': 'Audio Complete',
  'audio_delta': 'Audio Chunk',
  'audio_done': 'Audio Complete',
  'response.audio_transcript.delta': 'Transcript (streaming)',
  'response.audio_transcript.done': 'Transcript Complete',
  'response_audio_transcript_delta': 'Transcript (streaming)',
  'response_audio_transcript_done': 'Transcript Complete',
  'conversation.item.input_audio_transcription.delta': 'User Transcript (streaming)',
  'transcript_delta': 'User Transcript (streaming)',
  'conversation.item.input_audio_transcription.completed': 'User Transcript Complete',
  'transcript_completed': 'User Transcript Complete',

  // Text
  'response.text.delta': 'Text (streaming)',
  'response_text_delta': 'Text (streaming)',
  'response.text.done': 'Text Complete',
  'response_text_done': 'Text Complete',

  // Conversation
  'conversation.created': 'Conversation Created',
  'conversation_created': 'Conversation Created',
  'conversation.item.created': 'Item Created',
  'conversation_item_created': 'Item Created',
  'conversation.item.deleted': 'Item Deleted',
  'conversation_item_deleted': 'Item Deleted',
  'conversation.item.truncated': 'Item Truncated',
  'conversation_item_truncated': 'Item Truncated',

  // Input buffer
  'input_audio_buffer.committed': 'Audio Buffer Committed',
  'input_audio_buffer_committed': 'Audio Buffer Committed',
  'input_audio_buffer.cleared': 'Audio Buffer Cleared',
  'input_audio_buffer_cleared': 'Audio Buffer Cleared',
  'input_audio_buffer.speech_started': 'Speech Started',
  'input_audio_buffer.speech_stopped': 'Speech Stopped',
  'input_audio_buffer_speech_started': 'Speech Started',
  'input_audio_buffer_speech_stopped': 'Speech Stopped',

  // Errors
  'error': 'Error',
  'permission.denied': 'Permission Denied',
  'permission_denied': 'Permission Denied',

  // System
  'rate_limits.updated': 'Rate Limits Updated',
  'rate_limits_updated': 'Rate Limits Updated',
  'realtime.data': 'Realtime Data',
  'realtime_data': 'Realtime Data',
  'data.confirmation.required': 'Confirmation Required',
  'data_confirmation_required': 'Confirmation Required',
  'generation.started': 'Generation Started',
  'generation_started': 'Generation Started',
  'generation.completed': 'Generation Completed',
  'generation_completed': 'Generation Completed',
  'agent.switch.required': 'Agent Switch Required',
  'agent_switch_required': 'Agent Switch Required',
};

// ==================== STREAMABLE EVENTS ====================
export const STREAMABLE_EVENTS = [
  'response.function_call_arguments.delta',
  'function_call_args_delta',
  'response.audio_transcript.delta',
  'response.audio.delta',
  'response_audio_transcript_delta',
  'audio_delta',
  'response.text.delta',
  'response_text_delta',
];

// ==================== DEMO/MOCK DATA (for fallback) ====================
export const SESSIONS: Session[] = [
  { id: 'sess_9429...a1b', name: 'sess_9429...a1b', status: 'active', dateStr: 'Active', duration: '2m 30s' },
  { id: 'sess_8102...c4x', name: 'sess_8102...c4x', status: 'completed', dateStr: 'Yesterday', duration: '14m 12s' },
  { id: 'sess_3391...f9z', name: 'sess_3391...f9z', status: 'error', dateStr: 'Oct 24', duration: '0m 45s' },
  { id: 'sess_1102...b2q', name: 'sess_1102...b2q', status: 'completed', dateStr: 'Oct 23', duration: '5m 01s' },
];

export const CURRENT_LOGS: LogEntry[] = [
  {
    id: 'log_01',
    type: 'system',
    timestamp: '10:42:01 AM',
    content: 'session.created'
  },
  {
    id: 'log_02',
    type: 'user',
    timestamp: '10:42:05 AM',
    content: 'Hello, can you help me debug a connection issue with my database stream?',
    isAudio: true
  },
  {
    id: 'log_03',
    type: 'assistant',
    timestamp: '10:42:07 AM',
    content: 'Certainly. I can help with that. Could you please specify which database driver you are using and the error code you are seeing?',
    isAudio: true
  },
  {
    id: 'log_04',
    type: 'tool',
    timestamp: '',
    toolName: 'query_knowledge_base',
    toolArgs: '{"query": "PostgreSQL Node.js client connection errors common issues"}'
  }
];
