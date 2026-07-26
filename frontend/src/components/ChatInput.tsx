import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { chatApi } from '../services/api';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  theme?: 'light' | 'dark';
  onUploadComplete?: (result: { message: string; count: number }) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, theme = 'light', onUploadComplete }) => {
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedExtensions = ['.pdf', '.txt', '.csv', '.docx', '.xlsx', '.xls', '.json'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      alert(`Unsupported file type: ${ext}\nAllowed: PDF, TXT, CSV, DOCX, XLSX, JSON`);
      return;
    }

    setIsUploading(true);
    try {
      const response = await chatApi.uploadDocument(file, (percent) => {
        console.log(`Upload progress: ${percent}%`);
      });
      onUploadComplete?.({ message: response.message, count: response.document_count });
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || 'Upload failed';
      alert(`Upload failed: ${msg}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`flex-shrink-0 border-t px-4 md:px-6 py-4 transition-colors duration-300 ${
      theme === 'dark'
        ? 'border-white/8 bg-[#1a1a1a]/80 backdrop-blur-md'
        : 'border-gray-200 bg-white/80 backdrop-blur-md'
    }`}>
      <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto items-end">
        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
            isUploading
              ? theme === 'dark'
                ? 'bg-blue-900/30 text-blue-400 cursor-wait'
                : 'bg-blue-100 text-blue-500 cursor-wait'
              : disabled
                ? theme === 'dark'
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : theme === 'dark'
                  ? 'bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'
          }`}
          aria-label="Upload document"
          title="Upload PDF, TXT, CSV, DOCX, or XLSX"
        >
          {isUploading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.csv,.docx,.xlsx,.xls,.json"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="File upload input"
        />

        <div className={`flex-1 relative rounded-2xl border transition-all duration-200 ${
          theme === 'dark'
            ? 'border-white/10 bg-[#0f0f0f] focus-within:border-indigo-500/50'
            : 'border-gray-200 bg-gray-50 focus-within:border-indigo-400'
        } focus-within:shadow-sm`}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your documents…"
            disabled={disabled}
            rows={1}
            className={`w-full px-5 py-3.5 bg-transparent rounded-2xl resize-none focus:outline-none text-sm leading-relaxed transition-colors ${
              theme === 'dark'
                ? 'text-gray-100 placeholder-gray-500'
                : 'text-gray-900 placeholder-gray-400'
            } disabled:cursor-not-allowed disabled:opacity-50`}
            aria-label="Message input"
          />
          {input.length > 200 && (
            <span className={`absolute right-3 bottom-2 text-[10px] ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {input.length}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
            disabled || !input.trim()
              ? theme === 'dark'
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 hover-lift'
          }`}
          aria-label="Send message"
          title="Send message (Enter)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>

      <p className={`text-[11px] text-center mt-2 ${
        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
      }`}>
        Press <kbd className={`px-1.5 py-0.5 rounded text-xs font-medium ${
          theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
        }`}>Enter</kbd> to send,{' '}
        <kbd className={`px-1.5 py-0.5 rounded text-xs font-medium ${
          theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
        }`}>Shift+Enter</kbd> for new line
      </p>
    </div>
  );
};

export default ChatInput;