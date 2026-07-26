import React, { useEffect, useRef } from 'react';
import { Message } from '../types/chat';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';

interface Source {
  document_name: string;
  page?: number;
  pdf_url?: string;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  theme?: 'light' | 'dark';
  onSendMessage?: (content: string) => void;
  onAddToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  onViewPdf?: (source: Source) => void;
  documentCount?: number;
}

const EXAMPLE_QUESTIONS = [
  'What documents are available?',
  'Summarize the key topics',
  'Find information about important concepts',
  'What are the main findings?',
];

const SUGGESTED_TOPICS = [
  { icon: '📄', label: 'Document summary' },
  { icon: '🔍', label: 'Search topics' },
  { icon: '📊', label: 'Key findings' },
  { icon: '❓', label: 'Ask anything' },
];

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  theme = 'light',
  onSendMessage,
  onAddToast,
  onViewPdf,
  documentCount = 0,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopy = (_text: string) => {
    onAddToast?.('Copied to clipboard', 'success');
  };

  // Show welcome screen if no messages
  if (messages.length === 0) {
    return (
      <div className={`flex-1 overflow-y-auto scrollbar-thin relative transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30'
      }`}>
        <div className="flex items-center justify-center min-h-full px-4 py-8">
          <div className="text-center max-w-lg mx-auto">
            {/* Animated gradient icon */}
            <div className="mb-6 inline-flex">
              <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center shadow-2xl animate-pulse-slow">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className={`text-3xl md:text-4xl font-bold mb-3 tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome to{' '}
              <span className="gradient-text">RAG Chat</span>
            </h1>

            {/* Subtitle */}
            <p className={`text-base md:text-lg mb-6 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Ask questions about your documents and get intelligent answers powered by AI.
            </p>

            {/* Document status indicator */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8 transition-colors ${
              theme === 'dark'
                ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-800/30'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">{documentCount} documents loaded</span>
              <svg className="w-4 h-4 ml-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            {/* Example questions as chips */}
            <div className="mb-6">
              <p className={`text-xs font-medium uppercase tracking-wider mb-3 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Try asking
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAMPLE_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => onSendMessage?.(question)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover-lift ${
                      theme === 'dark'
                        ? 'bg-[#1a1a1a] border border-white/10 text-gray-300 hover:border-indigo-500/50 hover:text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md'
                    }`}
                    aria-label={`Ask: ${question}`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested topics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md mx-auto">
              {SUGGESTED_TOPICS.map((topic, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs transition-all duration-200 cursor-default ${
                    theme === 'dark'
                      ? 'bg-[#1a1a1a] border border-white/8 text-gray-400'
                      : 'bg-white/60 border border-gray-100 text-gray-500 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <span className="text-xl">{topic.icon}</span>
                  <span className="font-medium">{topic.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto scrollbar-thin transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-gradient-to-b from-white to-gray-50/50'
    }`}>
      <div className="py-4 md:py-6 max-w-4xl mx-auto">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            sources={message.role === 'assistant' ? message.sources : undefined}
            theme={theme}
            onCopy={handleCopy}
            onViewPdf={onViewPdf}
          />
        ))}

        {isLoading && <LoadingIndicator theme={theme} />}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;