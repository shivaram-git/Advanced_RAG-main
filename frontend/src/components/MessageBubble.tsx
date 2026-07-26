import React, { useState } from 'react';
import { Message } from '../types/chat';
import SourceList from './SourceList';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: Message;
  sources?: { document_name: string; page?: number; pdf_url?: string }[];
  theme?: 'light' | 'dark';
  onCopy?: (text: string) => void;
  onViewPdf?: (source: { document_name: string; page?: number; pdf_url?: string }) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, sources, theme = 'light', onCopy, onViewPdf }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      onCopy?.(message.content);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5 px-4 md:px-8 message-enter`}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mr-3 mt-1">
          <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
      )}

      <div className={`group relative max-w-[85%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Bubble */}
        <div
          className={`rounded-2xl px-5 py-4 shadow-sm transition-all duration-200 ${
            isUser
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm'
              : theme === 'dark'
                ? 'bg-[#1e1e1e] text-gray-100 rounded-bl-sm border border-white/8'
                : 'bg-gray-50 text-gray-900 rounded-bl-sm border border-gray-200'
          }`}
        >
          {/* Message content */}
          <div className={`text-sm md:text-base leading-relaxed break-words ${
            isUser
              ? 'text-white'
              : `prose prose-sm max-w-none ${
                  theme === 'dark'
                    ? 'prose-invert'
                    : 'prose-gray'
                }`
          }`}>
            {isUser ? (
              <p className="m-0 whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </div>

          {/* Sources */}
          {!isUser && sources && sources.length > 0 && (
            <SourceList sources={sources} theme={theme} onViewPdf={onViewPdf} />
          )}

          {/* Timestamp + copy */}
          <div className={`flex items-center justify-between mt-2 gap-3 ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          }`}>
            <span className={`text-xs ${
              isUser ? 'text-indigo-200' : theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

            {/* Copy button — assistant only */}
            {!isUser && (
              <button
                onClick={handleCopy}
                className={`opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${
                  copied
                    ? 'text-emerald-500'
                    : theme === 'dark'
                      ? 'text-gray-500 hover:text-gray-300 hover:bg-white/10'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                }`}
                title="Copy response"
                aria-label="Copy response"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0 ml-3 mt-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
