"use client";

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Clock,
  Hash,
  Tag,
  Layers,
  Activity,
} from 'lucide-react';
import {
  ParsedEvent,
  ConversationItem,
  SessionData,
} from '@/lib/ui-types';
import { formatTimestamp } from '@/lib/log-parser';
import { EVENT_DISPLAY_NAMES, EVENT_CATEGORY_STYLES } from '@/lib/constants';
import JsonViewer from '@/components/ui/JsonViewer';
import EventBadge from '@/components/ui/EventBadge';

interface InspectorProps {
  selectedEvent: ParsedEvent | null;
  relatedEvents: ParsedEvent[];
  conversationItem: ConversationItem | null;
  sessionData: SessionData | null;
}

type TabType = 'payload' | 'headers' | 'analysis' | 'raw';

const Inspector: React.FC<InspectorProps> = ({
  selectedEvent,
  relatedEvents,
  conversationItem,
  sessionData,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('payload');
  const [copied, setCopied] = useState(false);

  const handleCopyRaw = async () => {
    if (!selectedEvent) return;
    try {
      await navigator.clipboard.writeText(selectedEvent.rawLine);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Find current event index in related events
  const currentEventIndex = relatedEvents.findIndex(e => e.id === selectedEvent?.id);
  const previousEvent = currentEventIndex > 0 ? relatedEvents[currentEventIndex - 1] : null;
  const nextEvent = currentEventIndex < relatedEvents.length - 1 ? relatedEvents[currentEventIndex + 1] : null;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'payload', label: 'Payload' },
    { id: 'headers', label: 'Identifiers' },
    { id: 'analysis', label: 'Sequence' },
    { id: 'raw', label: 'Raw' },
  ];

  // Empty state
  if (!selectedEvent) {
    return (
      <aside className="w-[440px] flex flex-col glass-inspector">
        <div className="flex border-b border-white/5 bg-white/5 p-1 mx-6 mt-6 rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className="flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-all"
              disabled
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600">
          <Activity className="size-12 opacity-30" />
          <p className="text-sm">Select an event to inspect</p>
          <p className="text-xs text-slate-700">Click on any event in the main log</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[440px] flex flex-col glass-inspector">
      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-white/5 p-1 mx-6 mt-6 rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'text-primary bg-primary/10 rounded-xl shadow-glow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Event Header */}
        <div className="flex items-center justify-between">
          <EventBadge
            category={selectedEvent.category}
            eventType={EVENT_DISPLAY_NAMES[selectedEvent.eventType] || selectedEvent.eventType}
            size="md"
          />
          <span className="text-[10px] font-mono text-slate-500">
            {formatTimestamp(selectedEvent.timestamp)}
          </span>
        </div>

        {/* Tab Content */}
        {activeTab === 'payload' && (
          <div className="space-y-6">
            {/* Event Info */}
            <div className="p-5 rounded-[20px] border border-white/5 bg-white/5 space-y-4">
              <h3 className="text-slate-500 uppercase text-[10px] tracking-widest font-sans font-bold">
                Event Info
              </h3>
              <div className="grid grid-cols-2 gap-y-3 text-xs">
                <div className="text-slate-500 flex items-center gap-2">
                  <Tag className="size-3" />
                  Source
                </div>
                <div className={`text-right font-bold ${
                  selectedEvent.source === 'OPENAI' ? 'text-primary' : 'text-secondary'
                }`}>
                  {selectedEvent.source}
                </div>

                <div className="text-slate-500 flex items-center gap-2">
                  <Layers className="size-3" />
                  Event Type
                </div>
                <div className="text-slate-300 text-right font-mono text-[10px] break-all">
                  {selectedEvent.eventType}
                </div>

                <div className="text-slate-500 flex items-center gap-2">
                  <Clock className="size-3" />
                  Timestamp
                </div>
                <div className="text-slate-300 text-right font-mono text-[10px]">
                  {formatTimestamp(selectedEvent.timestamp)}
                </div>
              </div>
            </div>

            {/* Payload Content */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-500 uppercase text-[10px] tracking-widest font-sans font-bold">
                  Payload
                </h3>
                <button
                  onClick={handleCopyRaw}
                  className="text-[10px] text-primary hover:underline uppercase tracking-widest font-bold flex items-center gap-1"
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <JsonViewer
                data={selectedEvent.payload}
                initialExpanded={true}
                maxHeight="300px"
              />
            </div>

            {/* Delta Content (if present) */}
            {selectedEvent.delta && (
              <div className="p-5 rounded-[20px] border border-yellow-500/20 bg-yellow-500/5 space-y-3">
                <h3 className="text-yellow-500 uppercase text-[10px] tracking-widest font-sans font-bold">
                  Delta Content
                </h3>
                <p className="text-yellow-300 font-mono text-sm break-all">
                  &quot;{selectedEvent.delta}&quot;
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-6">
            {/* Identifiers */}
            <div className="p-5 rounded-[20px] border border-white/5 bg-white/5 space-y-4">
              <h3 className="text-slate-500 uppercase text-[10px] tracking-widest font-sans font-bold">
                Event Identifiers
              </h3>
              <div className="space-y-3 text-xs">
                {selectedEvent.eventId && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Hash className="size-3" />
                      Event ID
                    </span>
                    <span className="text-slate-300 font-mono text-[10px] text-right max-w-[200px] break-all">
                      {selectedEvent.eventId}
                    </span>
                  </div>
                )}

                {selectedEvent.responseId && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Hash className="size-3" />
                      Response ID
                    </span>
                    <span className="text-primary font-mono text-[10px] text-right max-w-[200px] break-all">
                      {selectedEvent.responseId}
                    </span>
                  </div>
                )}

                {selectedEvent.itemId && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Hash className="size-3" />
                      Item ID
                    </span>
                    <span className="text-slate-300 font-mono text-[10px] text-right max-w-[200px] break-all">
                      {selectedEvent.itemId}
                    </span>
                  </div>
                )}

                {selectedEvent.callId && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Hash className="size-3" />
                      Call ID
                    </span>
                    <span className="text-orange-400 font-mono text-[10px] text-right max-w-[200px] break-all">
                      {selectedEvent.callId}
                    </span>
                  </div>
                )}

                {selectedEvent.outputIndex !== undefined && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Hash className="size-3" />
                      Output Index
                    </span>
                    <span className="text-slate-300 font-mono text-[10px]">
                      {selectedEvent.outputIndex}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Hash className="size-3" />
                    Session ID
                  </span>
                  <span className="text-slate-300 font-mono text-[10px] text-right max-w-[200px] break-all">
                    {selectedEvent.sessionId}
                  </span>
                </div>
              </div>
            </div>

            {/* Session Info */}
            {sessionData && (
              <div className="p-5 rounded-[20px] border border-white/5 bg-white/5 space-y-4">
                <h3 className="text-slate-500 uppercase text-[10px] tracking-widest font-sans font-bold">
                  Session Config
                </h3>
                <div className="space-y-3 text-xs">
                  {sessionData.model && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Model</span>
                      <span className="text-slate-300">{sessionData.model}</span>
                    </div>
                  )}
                  {sessionData.voice && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Voice</span>
                      <span className="text-slate-300">{sessionData.voice}</span>
                    </div>
                  )}
                  {sessionData.modalities && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Modalities</span>
                      <span className="text-slate-300">{sessionData.modalities.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Event Sequence */}
            {relatedEvents.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-slate-500 uppercase text-[10px] tracking-widest font-sans font-bold">
                  Event Sequence ({relatedEvents.length} events)
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {relatedEvents.map((event, index) => {
                    const isSelected = event.id === selectedEvent.id;
                    return (
                      <div
                        key={event.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-600 w-6">{index + 1}.</span>
                          <span className={`text-[11px] font-mono flex-1 ${
                            isSelected ? 'text-primary font-bold' : 'text-slate-400'
                          }`}>
                            {EVENT_DISPLAY_NAMES[event.eventType] || event.eventType}
                          </span>
                          <span className="text-[10px] text-slate-600">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="mt-2 flex items-center gap-1 text-[9px] text-primary">
                            <ChevronRight className="size-3" />
                            Currently viewing
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="space-y-3">
              <h3 className="text-slate-500 uppercase text-[10px] tracking-widest font-sans font-bold">
                Navigation
              </h3>
              <div className="space-y-2">
                {previousEvent && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer flex justify-between items-center transition-all">
                    <div className="flex items-center gap-2">
                      <ChevronLeft className="size-4 text-slate-500" />
                      <span className="text-primary/80 text-sm truncate font-medium">
                        {EVENT_DISPLAY_NAMES[previousEvent.eventType] || previousEvent.eventType}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Previous</span>
                  </div>
                )}
                {nextEvent && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer flex justify-between items-center transition-all">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-400/80 text-sm truncate font-medium">
                        {EVENT_DISPLAY_NAMES[nextEvent.eventType] || nextEvent.eventType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">Next</span>
                      <ChevronRight className="size-4 text-slate-500" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-500 uppercase text-[10px] tracking-widest font-sans font-bold">
                Raw Log Line
              </h3>
              <button
                onClick={handleCopyRaw}
                className="text-[10px] text-primary hover:underline uppercase tracking-widest font-bold flex items-center gap-1"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 overflow-x-auto">
              <pre className="text-[10px] font-mono text-slate-400 whitespace-pre-wrap break-all leading-relaxed">
                {selectedEvent.rawLine}
              </pre>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Inspector;
