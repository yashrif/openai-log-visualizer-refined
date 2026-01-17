export type SessionStatus = 'active' | 'completed' | 'error';

export interface Session {
  id: string;
  name: string;
  status: SessionStatus;
  dateStr: string;
  duration?: string;
  timeStr?: string;
}

export type LogType = 'user' | 'assistant' | 'tool' | 'system';

export interface LogEntry {
  id: string;
  type: LogType;
  timestamp: string;
  content?: string;
  metadata?: Record<string, unknown>;
  // For assistant
  isAudio?: boolean;
  // For tools
  toolName?: string;
  toolArgs?: string; // JSON string
}
