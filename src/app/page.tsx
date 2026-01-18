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
import { SettingsDialog } from '@/components/SettingsDialog';

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
  const [allConversationItems, setAllConversationItems] = useState<ConversationItem[]>([]);
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
    const items = data.conversationItems || [];
    setAllConversationItems(items);

    // Initial filter if needed
    if (data.currentSession) {
       setConversationItems(items.filter(item =>
         item.events.some(e => e.sessionId === data.currentSession)
       ));
    } else {
       setConversationItems(items);
    }

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
    // Filter from ALL items, not the currently displayed ones
    const filteredItems = allConversationItems.filter(item =>
      item.events.some(e => e.sessionId === sessionId)
    );

    setConversationItems(filteredItems);
    setIsLoading(false);
  }, [rawEvents, allConversationItems]);

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

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Derived metrics
  // Derived metrics
  const calculateMetrics = () => {
    const activeEvents = activeSessionId
      ? rawEvents.filter(e => e.sessionId === activeSessionId)
      : rawEvents;

    if (!activeEvents.length) return { duration: null, avgLatency: null };

    // Calculate Duration
    const startTimeSource = activeEvents[0]?.timestamp;
    const endTimeSource = activeEvents[activeEvents.length - 1]?.timestamp;

    let duration = null;
    if (startTimeSource && endTimeSource) {
      const start = new Date(startTimeSource).getTime();
      const end = new Date(endTimeSource).getTime();
      const diff = end - start;
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Calculate Latency (Response Creation -> First Delta)
    let totalLatency = 0;
    let count = 0;

    // Group events by response_id to analyze response lifecycle
    const responses = new Map<string, { created?: number; firstDelta?: number }>();

    activeEvents.forEach(e => {
      if (!e.responseId) return;

      const ts = new Date(e.timestamp).getTime();

      if (e.eventType === 'response.created') {
        const current = responses.get(e.responseId) || {};
        responses.set(e.responseId, { ...current, created: ts });
      } else if (
        (e.eventType === 'response.text.delta' || e.eventType === 'response.audio.delta') &&
        !responses.get(e.responseId)?.firstDelta
      ) {
        // Only capture the FIRST delta for a response
        const current = responses.get(e.responseId) || {};
        responses.set(e.responseId, { ...current, firstDelta: ts });
      }
    });

    responses.forEach((times) => {
      if (times.created && times.firstDelta) {
        const lat = times.firstDelta - times.created;
        if (lat > 0 && lat < 10000) { // Filter outliers
          totalLatency += lat;
          count++;
        }
      }
    });

    return {
      duration,
      avgLatency: count > 0 ? totalLatency / count : null
    };
  };

  const { duration, avgLatency } = calculateMetrics();

  // Reset to log loader
  const handleReset = () => {
    setIsLogLoaded(false);
    setLoadedFileName(null);
    setSessions([]);
    setActiveSessionId(null);
    setAllConversationItems([]);
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

      <Header
        fileName={loadedFileName}
        onReset={handleReset}
        duration={duration}
        avgLatency={avgLatency}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />

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
