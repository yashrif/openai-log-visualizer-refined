"use client";

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface InspectorProps {
  selectedEvent: ParsedEvent | null;
  relatedEvents: ParsedEvent[];
  conversationItem: ConversationItem | null;
  sessionData: SessionData | null;
  onEventSelect?: (event: ParsedEvent) => void;
}

type TabType = 'payload' | 'headers' | 'analysis' | 'raw';

const Inspector: React.FC<InspectorProps> = ({
  selectedEvent,
  relatedEvents,
  conversationItem,
  sessionData,
  onEventSelect,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('payload');
  const [copied, setCopied] = useState(false);
  const [expandedSequenceItems, setExpandedSequenceItems] = useState<Record<string, boolean>>({});

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
      <aside className="w-full h-full flex flex-col glass-inspector">
        <div className="flex border-b border-border bg-muted/50 p-1 mx-6 mt-6 rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className="flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all"
              disabled
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Activity className="size-12 opacity-30" />
          <p className="text-sm">Select an event to inspect</p>
          <p className="text-xs text-muted-foreground/80">Click on any event in the main log</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full h-full flex flex-col glass-inspector">
      {/* Tabs */}
      <div className="flex border-b border-border bg-muted/50 p-1 mx-6 mt-6 rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'text-primary bg-primary/10 rounded-xl shadow-glow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-6 py-6 space-y-6">
        {/* Event Header */}
        <div className="flex items-center justify-between">
          <EventBadge
            category={selectedEvent.category}
            eventType={EVENT_DISPLAY_NAMES[selectedEvent.eventType] || selectedEvent.eventType}
            size="md"
          />
          <span className="text-[10px] font-mono text-muted-foreground">
            {formatTimestamp(selectedEvent.timestamp)}
          </span>
        </div>

        {/* Tab Content */}
        {activeTab === 'payload' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-6">
            {/* Event Info */}
            <Collapsible defaultOpen className="flex-shrink-0 p-5 rounded-[20px] border border-border bg-muted/30 group/collaps">
              <div className="flex items-center justify-between mb-0">
                <h3 className="text-muted-foreground uppercase text-[10px] tracking-widest font-sans font-bold">
                  Event Info
                </h3>
                <CollapsibleTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                    <ChevronDown className="size-4 transition-transform duration-200 group-data-[state=open]/collaps:rotate-180" />
                  </button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="grid grid-cols-2 gap-y-3 text-xs pt-4">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Tag className="size-3" />
                    Source
                  </div>
                  <div className={`text-right font-bold ${
                    selectedEvent.source === 'OPENAI' ? 'text-primary' : 'text-secondary'
                  }`}>
                    {selectedEvent.source}
                  </div>

                  <div className="text-muted-foreground flex items-center gap-2">
                    <Layers className="size-3" />
                    Event Type
                  </div>
                  <div className="text-foreground text-right font-mono text-[10px] break-all">
                    {selectedEvent.eventType}
                  </div>

                  <div className="text-muted-foreground flex items-center gap-2">
                    <Clock className="size-3" />
                    Timestamp
                  </div>
                  <div className="text-foreground text-right font-mono text-[10px]">
                    {formatTimestamp(selectedEvent.timestamp)}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Payload Content */}
            <div className="flex-1 flex flex-col min-h-0 space-y-3 pb-4">
              <div className="flex-shrink-0 flex items-center justify-between">
                <h3 className="text-muted-foreground uppercase text-[10px] tracking-widest font-sans font-bold">
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
                maxHeight="100%"
                className="flex-1 h-full"
              />
            </div>

            {/* Delta Content (if present) */}
            {selectedEvent.delta && (
              <div className="flex-shrink-0 p-5 rounded-[20px] border border-yellow-500/20 bg-yellow-500/10 dark:bg-yellow-500/5 space-y-3">
                <h3 className="text-yellow-600 dark:text-yellow-500 uppercase text-[10px] tracking-widest font-sans font-bold">
                  Delta Content
                </h3>
                <p className="text-yellow-600 dark:text-yellow-300 font-mono text-sm break-all">
                  &quot;{selectedEvent.delta}&quot;
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="h-full overflow-y-auto space-y-6 pr-2">
            {/* Identifiers */}
            <div className="p-5 rounded-[20px] border border-border bg-muted/30 space-y-4">
              <h3 className="text-muted-foreground uppercase text-[10px] tracking-widest font-sans font-bold">
                Event Identifiers
              </h3>
              <div className="space-y-3 text-xs">
                {selectedEvent.eventId && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Hash className="size-3" />
                      Event ID
                    </span>
                    <span className="text-foreground font-mono text-[10px] text-right max-w-[200px] break-all">
                      {selectedEvent.eventId}
                    </span>
                  </div>
                )}

                {selectedEvent.responseId && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground flex items-center gap-2">
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
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Hash className="size-3" />
                      Item ID
                    </span>
                    <span className="text-foreground font-mono text-[10px] text-right max-w-[200px] break-all">
                      {selectedEvent.itemId}
                    </span>
                  </div>
                )}

                {selectedEvent.callId && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Hash className="size-3" />
                      Call ID
                    </span>
                    <span className="text-orange-600 dark:text-orange-400 font-mono text-[10px] text-right max-w-[200px] break-all">
                      {selectedEvent.callId}
                    </span>
                  </div>
                )}

                {selectedEvent.outputIndex !== undefined && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Hash className="size-3" />
                      Output Index
                    </span>
                    <span className="text-foreground font-mono text-[10px]">
                      {selectedEvent.outputIndex}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Hash className="size-3" />
                    Session ID
                  </span>
                  <span className="text-foreground font-mono text-[10px] text-right max-w-[200px] break-all">
                    {selectedEvent.sessionId}
                  </span>
                </div>
              </div>
            </div>

            {/* Session Info */}
            {sessionData && (
              <div className="p-5 rounded-[20px] border border-border bg-muted/30 space-y-4">
                <h3 className="text-muted-foreground uppercase text-[10px] tracking-widest font-sans font-bold">
                  Session Config
                </h3>
                <div className="space-y-3 text-xs">
                  {sessionData.model && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model</span>
                      <span className="text-foreground">{sessionData.model}</span>
                    </div>
                  )}
                  {sessionData.voice && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Voice</span>
                      <span className="text-foreground">{sessionData.voice}</span>
                    </div>
                  )}
                  {sessionData.modalities && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modalities</span>
                      <span className="text-foreground">{sessionData.modalities.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="h-full overflow-y-auto space-y-6 pr-2">
            {/* Event Sequence */}
            {relatedEvents.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-muted-foreground uppercase text-[10px] tracking-widest font-sans font-bold">
                  Event Sequence ({relatedEvents.length} events)
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {relatedEvents.map((event, index) => {
                    const isExpanded = !!expandedSequenceItems[event.id];
                    const isSelected = event.id === selectedEvent.id;

                    return (
                      <div
                        key={event.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-muted/30 border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedSequenceItems(prev => ({
                                ...prev,
                                [event.id]: !prev[event.id]
                              }));
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-3" />
                            ) : (
                              <ChevronRight className="size-3" />
                            )}
                          </button>

                          <span className="text-[10px] text-muted-foreground w-6">{index + 1}.</span>
                          <button
                            onClick={() => onEventSelect?.(event)}
                            className={`text-[11px] font-mono flex-1 text-left ${
                            isSelected ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                          }`}>
                            {EVENT_DISPLAY_NAMES[event.eventType] || event.eventType}
                          </button>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pl-10 pr-2 border-t border-border/50 pt-3">
                            <JsonViewer
                              data={event.payload}
                              initialExpanded={true}
                              maxHeight="200px"
                              indentWidth={10}
                            />
                          </div>
                        )}

                        {isSelected && !isExpanded && (
                          <div className="mt-2 flex items-center gap-1 text-[9px] text-primary pl-10">
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
              <h3 className="text-muted-foreground uppercase text-[10px] tracking-widest font-sans font-bold">
                Navigation
              </h3>
              <div className="space-y-2">
                {previousEvent && (
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border hover:bg-muted/50 cursor-pointer flex justify-between items-center transition-all">
                    <div className="flex items-center gap-2">
                      <ChevronLeft className="size-4 text-muted-foreground" />
                      <span className="text-primary/80 text-sm truncate font-medium">
                        {EVENT_DISPLAY_NAMES[previousEvent.eventType] || previousEvent.eventType}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Previous</span>
                  </div>
                )}
                {nextEvent && (
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border hover:bg-muted/50 cursor-pointer flex justify-between items-center transition-all">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600/80 dark:text-orange-400/80 text-sm truncate font-medium">
                        {EVENT_DISPLAY_NAMES[nextEvent.eventType] || nextEvent.eventType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Next</span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="h-full overflow-y-auto space-y-4 pr-2">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground uppercase text-[10px] tracking-widest font-sans font-bold">
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
            <div className="bg-card dark:bg-black/60 p-4 rounded-2xl border border-border overflow-x-auto">
              <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed">
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
