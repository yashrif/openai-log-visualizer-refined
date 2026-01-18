"use client";

import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MainLog from '@/components/MainLog';
import Inspector from '@/components/Inspector';
import LogLoader from '@/components/LogLoader';
import { CollapsiblePanel } from '@/components/ui/ResizablePanel';
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
  // App state
  const [isLogLoaded, setIsLogLoaded] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);

  // Session state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Log data state
  const [conversationItems, setConversationItems] = useState<ConversationItem[]>([]);
  const [rawEvents, setRawEvents] = useState<ParsedEvent[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  // UI state
  const [selectedEvent, setSelectedEvent] = useState<ParsedEvent | null>(null);
  const [selectedConversationItem, setSelectedConversationItem] = useState<ConversationItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Process API response
  const processApiResponse = useCallback((data: LogApiResponse, fileName?: string) => {
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

      if (data.currentSession) {
        setActiveSessionId(data.currentSession);
      }
    }

    // Update conversation data
    setConversationItems(data.conversationItems || []);
    setRawEvents(data.rawEvents || []);
    setSessionData(data.sessionData || null);
    setLoadedFileName(fileName || data.fileName || null);
    setIsLogLoaded(true);
  }, []);

  // Load logs from content (pasted or file)
  const handleLogLoaded = useCallback(async (content: string, fileName?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data: LogApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to parse logs');
      }

      processApiResponse(data, fileName);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [processApiResponse]);

  // Handle session change
  const handleSessionChange = useCallback(async (sessionId: string) => {
    if (!rawEvents.length) return;

    setActiveSessionId(sessionId);
    setIsLoading(true);

    // Re-filter the current data for the selected session
    const filteredEvents = rawEvents.filter(e => e.sessionId === sessionId);

    // We need to rebuild conversation items for this session
    // For now, just filter existing items
    const filteredItems = conversationItems.filter(item =>
      item.events.some(e => e.sessionId === sessionId)
    );

    setConversationItems(filteredItems);
    setIsLoading(false);
  }, [rawEvents, conversationItems]);

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

  // Reset to log loader
  const handleReset = () => {
    setIsLogLoaded(false);
    setLoadedFileName(null);
    setSessions([]);
    setActiveSessionId(null);
    setConversationItems([]);
    setRawEvents([]);
    setSessionData(null);
    setSelectedEvent(null);
    setSelectedConversationItem(null);
    setError(null);
  };

  // Show log loader if no logs loaded
  if (!isLogLoaded) {
    return (
      <LogLoader
        onLogLoaded={handleLogLoaded}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden text-slate-300 font-sans">
      {/* Background Depth Effect */}
      <div className="fixed inset-0 bg-depth-overlay pointer-events-none z-0"></div>

      <Header fileName={loadedFileName} onReset={handleReset} />

      <div className="flex flex-1 overflow-hidden z-20">
        <CollapsiblePanel
          side="left"
          defaultWidth={320}
          minWidth={240}
          maxWidth={500}
          title="Sessions"
          className="glass-sidebar"
        >
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSessionId || ''}
            onSessionSelect={handleSessionChange}
          />
        </CollapsiblePanel>
        <MainLog
          conversationItems={conversationItems}
          sessionData={sessionData}
          isLoading={isLoading}
          error={error}
          onEventSelect={handleEventSelect}
          onConversationItemSelect={handleConversationItemSelect}
          selectedEventId={selectedEvent?.id}
        />
        <CollapsiblePanel
          side="right"
          defaultWidth={440}
          minWidth={320}
          maxWidth={700}
          title="Inspector"
          className="glass-inspector"
        >
          <Inspector
            selectedEvent={selectedEvent}
            relatedEvents={getRelatedEvents()}
            conversationItem={selectedConversationItem}
            sessionData={sessionData}
          />
        </CollapsiblePanel>
      </div>
    </div>
  );
}
