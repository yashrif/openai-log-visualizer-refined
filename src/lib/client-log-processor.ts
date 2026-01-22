import {
  parseLogFile,
  buildConversationItems,
  getUniqueSessions,
  filterBySession,
  extractSessionData,
  toParsedEvent,
} from './log-parser';
import {
  Session,
  ParsedEvent,
  SessionData,
  ConversationItem
} from './ui-types';

export interface ProcessedLogResult {
  sessions: string[];
  currentSession: string | null;
  sessionData: SessionData | undefined;
  conversationItems: ConversationItem[];
  rawEvents: ParsedEvent[];
  totalEvents: number;
}

// Helper function to process log content
export function processLogContent(content: string, sessionId?: string | null): ProcessedLogResult {
  // Parse log file
  let rawLines = parseLogFile(content);

  // Get unique sessions
  const sessions = getUniqueSessions(rawLines);

  // Filter by session if specified
  if (sessionId) {
    rawLines = filterBySession(rawLines, sessionId);
  }

  // Build conversation items
  const conversationItems = buildConversationItems(rawLines);

  // Extract session data
  const parsedEvents = rawLines.map(toParsedEvent);
  const sessionData = extractSessionData(parsedEvents);

  return {
    sessions,
    currentSession: sessionId || sessions[sessions.length - 1] || null,
    sessionData,
    conversationItems,
    rawEvents: parsedEvents,
    totalEvents: rawLines.length,
  };
}
