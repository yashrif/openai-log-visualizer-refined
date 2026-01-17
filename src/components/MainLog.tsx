"use client";

import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Lock,
  Play,
  User,
  Bot,
  Wrench,
  Settings,
  Mic,
  AlertTriangle,
  Activity,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  Clock,
} from 'lucide-react';
import {
  ConversationItem,
  ParsedEvent,
  SessionData,
} from '@/lib/ui-types';
import { formatTimestamp, formatDuration } from '@/lib/log-parser';
import { EVENT_DISPLAY_NAMES, STREAMABLE_EVENTS } from '@/lib/constants';
import Waveform from '@/components/ui/Waveform';
import JsonViewer from '@/components/ui/JsonViewer';

interface MainLogProps {
  conversationItems: ConversationItem[];
  sessionData: SessionData | null;
  isLoading: boolean;
  error: string | null;
  onEventSelect: (event: ParsedEvent, conversationItem?: ConversationItem) => void;
  onConversationItemSelect: (item: ConversationItem) => void;
  selectedEventId?: string;
}

// ==================== SESSION EVENT COMPONENT ====================
const SessionEvent: React.FC<{
  item: ConversationItem;
  onClick: () => void;
  isSelected: boolean;
}> = ({ item, onClick, isSelected }) => {
  const { sessionData } = item;
  if (!sessionData) return null;

  const isCreated = sessionData.eventType === 'created';

  return (
    <div
      className={`flex flex-col items-center gap-3 cursor-pointer transition-all ${
        isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-100'
      }`}
      onClick={onClick}
    >
      <div className="h-px w-64 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      <div className="flex items-center gap-3">
        <Settings className="size-4 text-slate-500" />
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          {isCreated ? 'Session Created' : 'Session Updated'}
        </span>
        <span className="text-[10px] font-mono text-slate-600">
          {formatTimestamp(item.timestamp)}
        </span>
      </div>
      {sessionData.model && (
        <div className="flex items-center gap-4 text-[10px] text-slate-600">
          <span>Model: <span className="text-slate-400">{sessionData.model}</span></span>
          {sessionData.voice && (
            <span>Voice: <span className="text-slate-400">{sessionData.voice}</span></span>
          )}
          {sessionData.tools && sessionData.tools.length > 0 && (
            <span>Tools: <span className="text-slate-400">{sessionData.tools.length}</span></span>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== USER INPUT COMPONENT ====================
const UserInputEvent: React.FC<{
  item: ConversationItem;
  onClick: () => void;
  isSelected: boolean;
}> = ({ item, onClick, isSelected }) => {
  const { userInput } = item;
  if (!userInput) return null;

  return (
    <div
      className={`flex justify-end gap-5 group cursor-pointer ${
        isSelected ? 'ring-2 ring-secondary/30 rounded-3xl' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col items-end max-w-xl">
        <div className="flex items-center gap-3 mb-2 opacity-60">
          <span className="text-[10px] font-mono text-slate-400">
            {formatTimestamp(item.timestamp)}
          </span>
          <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">
            User Input
          </span>
        </div>
        <div className="p-6 rounded-[32px] rounded-tr-none bg-secondary/10 border border-secondary/20 text-white shadow-neon-purple ethereal-card">
          {userInput.inputType === 'audio' && (
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
              <button className="size-8 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg shadow-secondary/20 hover:scale-105 transition-transform">
                <Play className="size-5" />
              </button>
              <Waveform color="secondary" size="sm" />
            </div>
          )}
          {userInput.text ? (
            <p className="text-[15px] leading-relaxed text-slate-100">{userInput.text}</p>
          ) : (
            <p className="text-[15px] leading-relaxed text-slate-400 italic">
              {userInput.inputType === 'audio' ? 'Audio input' : 'No content'}
            </p>
          )}
        </div>
      </div>
      <div className="size-12 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center shrink-0 shadow-neon-purple mt-6">
        <User className="size-6 text-secondary" />
      </div>
    </div>
  );
};

// ==================== RESPONSE GROUP COMPONENT ====================
const ResponseGroupEvent: React.FC<{
  item: ConversationItem;
  onClick: () => void;
  onEventClick: (event: ParsedEvent) => void;
  isSelected: boolean;
  selectedEventId?: string;
}> = ({ item, onClick, onEventClick, isSelected, selectedEventId }) => {
  const [expanded, setExpanded] = useState(false);
  const { responseGroup } = item;
  if (!responseGroup) return null;

  const isFunctionCall = responseGroup.type === 'function_call';
  const hasAudio = responseGroup.type === 'audio_response' || responseGroup.transcript;
  const hasText = responseGroup.type === 'text_response' || responseGroup.textContent;

  // Count delta events
  const deltaEvents = responseGroup.events.filter(e =>
    STREAMABLE_EVENTS.includes(e.eventType)
  );

  return (
    <div
      className={`flex justify-start gap-5 group ${
        isSelected ? 'ring-2 ring-primary/30 rounded-3xl' : ''
      }`}
    >
      <div className="size-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 shadow-neon-cyan mt-6">
        {isFunctionCall ? (
          <Wrench className="size-6 text-orange-400" />
        ) : hasAudio ? (
          <Mic className="size-6 text-green-400" />
        ) : (
          <Bot className="size-6 text-primary" />
        )}
      </div>
      <div className="flex flex-col items-start max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-2 opacity-60">
          <span className="text-[10px] font-bold text-primary tracking-widest uppercase">
            {isFunctionCall ? 'Function Call' : hasAudio ? 'Audio Response' : 'Response'}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {formatTimestamp(responseGroup.startTime)}
          </span>
          {responseGroup.status === 'completed' ? (
            <Check className="size-3 text-green-400" />
          ) : (
            <Loader2 className="size-3 text-yellow-400 animate-spin" />
          )}
        </div>

        <div
          className="w-full p-6 rounded-[32px] rounded-tl-none bg-primary/10 border border-primary/20 text-white shadow-neon-cyan ethereal-card relative overflow-hidden cursor-pointer"
          onClick={onClick}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>

          {/* Function Call Content */}
          {isFunctionCall && responseGroup.functionName && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench className="size-4 text-orange-400" />
                  <span className="text-white font-bold">{responseGroup.functionName}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  responseGroup.status === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {responseGroup.status}
                </span>
              </div>

              {responseGroup.functionArguments && (
                <div className="mt-4">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">Arguments</span>
                  <JsonViewer
                    data={responseGroup.functionArguments}
                    initialExpanded={true}
                    maxHeight="200px"
                    showCopyButton={false}
                  />
                </div>
              )}
            </div>
          )}

          {/* Audio Response Content */}
          {hasAudio && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button className="size-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                  <Play className="size-5" />
                </button>
                <Waveform color="green" size="md" />
              </div>
              {responseGroup.transcript && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2">
                    Transcript
                  </span>
                  <p className="text-[15px] leading-relaxed text-slate-100">
                    {responseGroup.transcript}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Text Response Content */}
          {hasText && !hasAudio && responseGroup.textContent && (
            <p className="text-[15px] leading-relaxed text-slate-100">
              {responseGroup.textContent}
            </p>
          )}

          {/* Token Usage */}
          {responseGroup.usage && (
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4 text-[10px] text-slate-500">
              <span>Tokens: <span className="text-slate-400">{responseGroup.usage.inputTokens}</span> in</span>
              <span>→</span>
              <span><span className="text-slate-400">{responseGroup.usage.outputTokens}</span> out</span>
              <span className="text-slate-600">({responseGroup.usage.totalTokens} total)</span>
              {responseGroup.endTime && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {formatDuration(responseGroup.startTime, responseGroup.endTime)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Events */}
        {responseGroup.events.length > 1 && (
          <div className="mt-2 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              {expanded ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              <span>{responseGroup.events.length} events</span>
              {deltaEvents.length > 0 && (
                <span className="text-slate-600">
                  ({deltaEvents.length} streaming)
                </span>
              )}
            </button>

            {expanded && (
              <div className="mt-2 ml-4 space-y-1 max-h-60 overflow-y-auto">
                {responseGroup.events.map((event, index) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`flex items-center gap-3 p-2 rounded-lg text-[10px] font-mono cursor-pointer transition-colors ${
                      selectedEventId === event.id
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-white/5 text-slate-500'
                    }`}
                  >
                    <span className="text-slate-600 w-6">{index + 1}.</span>
                    <span className={
                      STREAMABLE_EVENTS.includes(event.eventType)
                        ? 'text-yellow-500'
                        : ''
                    }>
                      {EVENT_DISPLAY_NAMES[event.eventType] || event.eventType}
                    </span>
                    <span className="text-slate-600 ml-auto">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== ERROR EVENT COMPONENT ====================
const ErrorEvent: React.FC<{
  item: ConversationItem;
  onClick: () => void;
  isSelected: boolean;
}> = ({ item, onClick, isSelected }) => {
  const { error } = item;
  if (!error) return null;

  return (
    <div
      className={`flex justify-center my-6 cursor-pointer ${
        isSelected ? 'ring-2 ring-red-500/30 rounded-3xl' : ''
      }`}
      onClick={onClick}
    >
      <div className="ethereal-card rounded-[28px] p-0 max-w-2xl w-full border-l-[6px] border-l-red-500/50 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 bg-red-500/5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-[18px] text-red-400" />
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Error</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {formatTimestamp(item.timestamp)}
          </span>
        </div>
        <div className="p-6 space-y-2">
          <p className="text-red-400 text-sm">{error.message}</p>
          {error.code && (
            <p className="text-[10px] text-slate-500">
              Code: <span className="text-slate-400">{error.code}</span>
            </p>
          )}
          {error.type && (
            <p className="text-[10px] text-slate-500">
              Type: <span className="text-slate-400">{error.type}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== SYSTEM EVENT COMPONENT ====================
const SystemEvent: React.FC<{
  item: ConversationItem;
  onClick: () => void;
  isSelected: boolean;
}> = ({ item, onClick, isSelected }) => {
  const { systemEvent } = item;
  if (!systemEvent) return null;

  return (
    <div
      className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${
        isSelected ? 'opacity-100' : 'opacity-40 hover:opacity-70'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <Activity className="size-3 text-slate-600" />
        <span className="text-[10px] font-mono text-slate-600">
          {systemEvent.description}
        </span>
        <span className="text-[10px] font-mono text-slate-700">
          {formatTimestamp(item.timestamp)}
        </span>
      </div>
    </div>
  );
};

// ==================== MAIN LOG COMPONENT ====================
const MainLog: React.FC<MainLogProps> = ({
  conversationItems,
  sessionData,
  isLoading,
  error,
  onEventSelect,
  onConversationItemSelect,
  selectedEventId,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleItemClick = (item: ConversationItem) => {
    setSelectedItemId(item.id);
    onConversationItemSelect(item);
  };

  const handleEventClick = (event: ParsedEvent, item: ConversationItem) => {
    onEventSelect(event, item);
  };

  // Get display session ID
  const displaySessionId = sessionData?.id
    ? sessionData.id.length > 30
      ? `${sessionData.id.substring(0, 15)}...${sessionData.id.substring(sessionData.id.length - 8)}`
      : sessionData.id
    : 'No session loaded';

  return (
    <main className="flex-1 flex flex-col relative bg-transparent min-w-0">
      {/* Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-8 bg-bg-deep/40 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-slate-500 text-[11px] uppercase tracking-widest font-bold">Session ID</span>
          <span className="text-white font-mono bg-white/5 border border-white/5 px-3 py-1 rounded-full text-xs select-all shadow-inner">
            {displaySessionId}
          </span>
          {conversationItems.length > 0 && (
            <span className="text-[10px] text-slate-600">
              {conversationItems.length} items
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button className="size-8 flex items-center justify-center hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
            <Download className="size-5" />
          </button>
          <button className="size-8 flex items-center justify-center hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
            <Trash2 className="size-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="size-8 text-primary animate-spin" />
            <span className="text-slate-500 text-sm">Loading logs...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <AlertTriangle className="size-8 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && conversationItems.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Activity className="size-8 text-slate-600" />
            <span className="text-slate-500 text-sm">No events to display</span>
          </div>
        )}

        {/* Conversation Items */}
        {!isLoading && !error && conversationItems.map((item) => {
          const isSelected = selectedItemId === item.id;

          switch (item.type) {
            case 'session_event':
              return (
                <SessionEvent
                  key={item.id}
                  item={item}
                  onClick={() => handleItemClick(item)}
                  isSelected={isSelected}
                />
              );

            case 'user_input':
              return (
                <UserInputEvent
                  key={item.id}
                  item={item}
                  onClick={() => handleItemClick(item)}
                  isSelected={isSelected}
                />
              );

            case 'response_group':
              return (
                <ResponseGroupEvent
                  key={item.id}
                  item={item}
                  onClick={() => handleItemClick(item)}
                  onEventClick={(event) => handleEventClick(event, item)}
                  isSelected={isSelected}
                  selectedEventId={selectedEventId}
                />
              );

            case 'error':
              return (
                <ErrorEvent
                  key={item.id}
                  item={item}
                  onClick={() => handleItemClick(item)}
                  isSelected={isSelected}
                />
              );

            case 'system_event':
              return (
                <SystemEvent
                  key={item.id}
                  item={item}
                  onClick={() => handleItemClick(item)}
                  isSelected={isSelected}
                />
              );

            default:
              return null;
          }
        })}

        <div className="h-20"></div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/5 bg-bg-deep/40 backdrop-blur-md z-10">
        <div className="relative">
          <input
            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm text-slate-500 cursor-not-allowed font-mono focus:outline-none"
            disabled
            placeholder="Visualizer Mode - Read Only"
            type="text"
          />
          <Lock className="absolute right-6 top-4 size-5 text-slate-600" />
        </div>
      </div>
    </main>
  );
};

export default MainLog;
