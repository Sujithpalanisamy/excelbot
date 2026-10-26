import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import type { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => Promise<void>;
  onClearHistory: () => void;
  isLoading: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  onClearHistory,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
    }
  }, [messages, isExpanded]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    await onSendMessage(text);
  };

  const samplePrompts = [
    'Sync all new bugs',
    'Fetch bug 101',
    'Update the tracker now',
    'How many bugs are open?',
    'Show bugs whose status changed',
    'When was the last successful sync?',
  ];

  return (
    <section id="chat-assistant-section" aria-labelledby="chat-heading" className="w-full enterprise-card overflow-hidden mb-6">
      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200/90 cursor-pointer select-none transition-colors hover:bg-slate-100/70"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-sky-600 flex items-center justify-center text-white shadow-2xs" aria-hidden="true">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="chat-heading" className="text-sm font-bold font-display text-slate-900">
                Azure Bug Intelligence Assistant
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                <ShieldCheck className="w-3 h-3 text-sky-600" aria-hidden="true" />
                Grounded QA Assistant
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Natural language queries strictly grounded in your active Azure DevOps work item repository
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              id="btn-clear-chat"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearHistory();
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
              title="Clear chat history"
              aria-label="Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
          <button
            id="btn-toggle-chat"
            type="button"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse Chatbot' : 'Expand Chatbot'}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 flex flex-col h-[380px] bg-white">
          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 border-b border-slate-100 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Try asking:</span>
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSendMessage(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-0.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors text-xs font-medium disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs sm:text-sm">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-6">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 mb-2 border border-slate-200">
                  <Bot className="w-5 h-5" />
                </div>
                <p className="font-semibold text-xs text-slate-700 font-display">
                  Ask to sync work items, fetch IDs, inspect severity status, or summarize defects.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Type questions in natural language or click one of the suggested query chips above.
                </p>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-3.5 py-2 leading-relaxed ${
                      m.role === 'user'
                        ? 'btn-sky text-white rounded-br-none shadow-2xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px]">{m.content}</div>
                    {m.timestamp && (
                      <div className={`text-[10px] mt-1 ${m.role === 'user' ? 'text-sky-100 text-right' : 'text-slate-400 text-left'}`}>
                        {m.timestamp}
                      </div>
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-6 h-6 rounded-md bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-100 rounded-xl rounded-bl-none px-3.5 py-2 flex items-center gap-2 text-xs text-slate-700 border border-slate-200">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                  <span className="font-medium">Processing query with Azure DevOps context...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="mt-3 flex gap-2">
            <label htmlFor="chat-query-input" className="sr-only">
              Ask a question about your Azure bugs
            </label>
            <input
              id="chat-query-input"
              name="chat_query"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question (e.g. 'Show critical bugs in Payroll', 'Sync all new bugs')..."
              className="h-10 flex-1 px-3.5 text-xs rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-none transition-all shadow-2xs"
            />
            <button
              id="btn-send-chat"
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="h-10 btn-sky inline-flex items-center gap-1.5 px-4 text-xs font-semibold rounded-lg disabled:opacity-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none shrink-0"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Send className="w-3.5 h-3.5" aria-hidden="true" />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      )}
    </section>
  );
};
