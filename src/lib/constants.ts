import { Session, LogEntry } from './ui-types';

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
