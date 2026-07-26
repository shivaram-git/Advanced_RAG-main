import React from 'react';

interface LoadingIndicatorProps {
  theme?: 'light' | 'dark';
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ theme = 'light' }) => {
  return (
    <div className="flex justify-start mb-6 px-4 md:px-8 message-enter">
      <div className={`flex items-center gap-3 rounded-2xl rounded-bl-sm px-5 py-4 border ${
        theme === 'dark'
          ? 'bg-[#1a1a1a] border-white/10'
          : 'bg-gray-50 border-gray-200'
      }`}>
        {/* Avatar */}
        <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        {/* Typing dots */}
        <div className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          Thinking…
        </span>
      </div>
    </div>
  );
};

export default LoadingIndicator;
