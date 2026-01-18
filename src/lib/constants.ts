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
  'session_update': 'Session Update',

  // User input
  'conversation_input_text': 'Text Input',
  'audio_append': 'Audio Chunk',
  'audio_commit': 'Audio Committed',
  'audio_clear': 'Audio Cleared',

  // Response lifecycle
  'response.created': 'Response Started',
  'response.done': 'Response Complete',
  'response.output_item.added': 'Output Added',
  'response.output_item.done': 'Output Complete',

  // Function calls
  'response.function_call_arguments.delta': 'Function Args (streaming)',
  'response.function_call_arguments.done': 'Function Call Complete',

  // Audio
  'response.audio.delta': 'Audio Chunk',
  'response.audio.done': 'Audio Complete',
  'response.audio_transcript.delta': 'Transcript (streaming)',
  'response.audio_transcript.done': 'Transcript Complete',

  // Text
  'response.text.delta': 'Text (streaming)',
  'response.text.done': 'Text Complete',

  // Conversation
  'conversation.created': 'Conversation Created',
  'conversation.item.created': 'Item Created',

  // Input buffer
  'input_audio_buffer.speech_started': 'Speech Started',
  'input_audio_buffer.speech_stopped': 'Speech Stopped',

  // Errors
  'error': 'Error',
  'permission.denied': 'Permission Denied',
};

// ==================== STREAMABLE EVENTS ====================
export const STREAMABLE_EVENTS = [
  'response.function_call_arguments.delta',
  'response.audio_transcript.delta',
  'response.audio.delta',
  'response.text.delta',
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
