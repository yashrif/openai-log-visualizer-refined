"use client";

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MainLog from '@/components/MainLog';
import Inspector from '@/components/Inspector';
import { SESSIONS } from '@/lib/constants';
import {
  ConversationItem,
  ParsedEvent,
  SessionData,
  Session,
} from '@/lib/ui-types';

interface LogApiResponse {
  success: boolean;
  fileName?: string;
  totalEvents?: number;
  sessions?: string[];
  currentSession?: string;
  sessionData?: SessionData;
  conversationItems?: ConversationItem[];
  rawEvents?: ParsedEvent[];
  error?: string;
}

export default function Home() {
  // Session state
  const [sessions, setSessions] = useState<Session[]>(SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Log data state
  const [conversationItems, setConversationItems] = useState<ConversationItem[]>([]);
  const [rawEvents, setRawEvents] = useState<ParsedEvent[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  // UI state
  const [selectedEvent, setSelectedEvent] = useState<ParsedEvent | null>(null);
  const [selectedConversationItem, setSelectedConversationItem] = useState<ConversationItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load log file
  const loadLogFile = useCallback(async (fileName: string, sessionId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ file: fileName });
      if (sessionId) {
        params.append('session', sessionId);
      }

      const response = await fetch(`/api/logs?${params}`);
      const data: LogApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load logs');
      }

      // Update sessions from log file
      if (data.sessions && data.sessions.length > 0) {
        const logSessions: Session[] = data.sessions.map((id, index) => ({
          id,
          name: id.length > 20 ? `${id.substring(0, 8)}...${id.substring(id.length - 4)}` : id,
          status: index === 0 ? 'active' : 'completed',
          dateStr: index === 0 ? 'Current' : 'Previous',
          eventCount: data.rawEvents?.filter(e => e.sessionId === id).length,
        }));
        setSessions(logSessions);

        if (!activeSessionId && data.currentSession) {
          setActiveSessionId(data.currentSession);
        }
      }

      // Update conversation data
      setConversationItems(data.conversationItems || []);
      setRawEvents(data.rawEvents || []);
      setSessionData(data.sessionData || null);

    } catch (err) {
      console.error('Error loading logs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId]);

  // Load default log file on mount
  useEffect(() => {
    loadLogFile('realtime_payloads.log');
  }, [loadLogFile]);

  // Handle session change
  const handleSessionChange = (sessionId: string) => {
    setActiveSessionId(sessionId);
    loadLogFile('realtime_payloads.log', sessionId);
  };

  // Handle event selection (for Inspector)
  const handleEventSelect = (event: ParsedEvent, conversationItem?: ConversationItem) => {
    setSelectedEvent(event);
    setSelectedConversationItem(conversationItem || null);
  };

  // Handle conversation item selection
  const handleConversationItemSelect = (item: ConversationItem) => {
    setSelectedConversationItem(item);
    // Select the first event in the item
    if (item.events.length > 0) {
      setSelectedEvent(item.events[0]);
    }
  };

  // Get related events for Inspector (same response_id)
  const getRelatedEvents = (): ParsedEvent[] => {
    if (!selectedEvent?.responseId) return [];
    return rawEvents.filter(e => e.responseId === selectedEvent.responseId);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden text-slate-300 font-sans">
      {/* Background Depth Effect */}
      <div className="fixed inset-0 bg-depth-overlay pointer-events-none z-0"></div>

      <Header />

      <div className="flex flex-1 overflow-hidden z-20">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId || ''}
          onSessionSelect={handleSessionChange}
        />
        <MainLog
          conversationItems={conversationItems}
          sessionData={sessionData}
          isLoading={isLoading}
          error={error}
          onEventSelect={handleEventSelect}
          onConversationItemSelect={handleConversationItemSelect}
          selectedEventId={selectedEvent?.id}
        />
        <Inspector
          selectedEvent={selectedEvent}
          relatedEvents={getRelatedEvents()}
          conversationItem={selectedConversationItem}
          sessionData={sessionData}
        />
      </div>
    </div>
  );
}
