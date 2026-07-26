import { useState, useEffect, useCallback } from 'react';
import { Message, Conversation } from './types/chat';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import ConversationSidebar from './components/ConversationSidebar';
import PdfViewerModal from './components/PdfViewerModal';
import Toast from './components/Toast';
import { chatApi } from './services/api';

export type Theme = 'light' | 'dark';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [pdfViewerState, setPdfViewerState] = useState<{
    pdfUrl: string;
    documentName: string;
    initialPage: number;
  } | null>(null);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check API connection
  const checkConnection = useCallback(async () => {
    try {
      await chatApi.getConversations();
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedConversationId = localStorage.getItem('currentConversationId');
    const savedMessages = localStorage.getItem('currentMessages');

    if (savedConversationId) {
      setConversationId(savedConversationId);
      setSelectedConversationId(savedConversationId);
    }

    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Error parsing saved messages:', e);
      }
    }

    loadConversations();
    checkConnection();
  }, [checkConnection]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('currentConversationId', conversationId);
    } else {
      localStorage.removeItem('currentConversationId');
    }
  }, [conversationId]);

  useEffect(() => {
    localStorage.setItem('currentMessages', JSON.stringify(messages));
  }, [messages]);

  const addToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  };

  const loadConversations = async () => {
    try {
      const convs = await chatApi.getConversations();
      convs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setConversations(convs);
      setIsConnected(true);
    } catch (error) {
      console.error('[FRONTEND] Error loading conversations:', error);
      setIsConnected(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    // Optimistically add user message without run_id (will be set after response)
    const tempId = `msg_${Date.now()}`;
    const userMessage: Message = {
      id: tempId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage({
        conversation_id: conversationId,
        query: content,
      });

      const { run_id, conversation_id } = response;
      setConversationId(conversation_id);
      setSelectedConversationId(conversation_id);

      // Update user message with run_id and add assistant message with same run_id
      setMessages((prev) => {
        const updated = prev.map((msg) =>
          msg.id === tempId ? { ...msg, run_id } : msg
        );
        updated.push({
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: response.answer,
          timestamp: new Date().toISOString(),
          sources: response.sources,
          run_id,
        });
        return updated;
      });
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      addToast('Failed to send message. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    await loadConversations();
    setMessages([]);
    setConversationId(undefined);
    setSelectedConversationId(undefined);
    localStorage.removeItem('currentConversationId');
    localStorage.removeItem('currentMessages');
  };

  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConversationId(conv.id);
    setConversationId(conv.id);
    setMessages(conv.messages);
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await chatApi.deleteConversation(convId);
      if (selectedConversationId === convId) {
        handleNewChat();
      }
      await loadConversations();
      addToast('Conversation deleted', 'info');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      addToast('Failed to delete conversation', 'error');
    }
  };

  const handleRenameConversation = async (convId: string, newTitle: string) => {
    try {
      await chatApi.updateConversation(convId, { title: newTitle });
      await loadConversations();
      addToast('Conversation renamed', 'success');
    } catch (error) {
      console.error('Error renaming conversation:', error);
      addToast('Failed to rename conversation', 'error');
    }
  };

  const handleArchiveConversation = async (convId: string) => {
    try {
      await chatApi.updateConversation(convId, { is_archived: true });
      if (selectedConversationId === convId) {
        handleNewChat();
      }
      await loadConversations();
      addToast('Conversation archived', 'info');
    } catch (error) {
      console.error('Error archiving conversation:', error);
      addToast('Failed to archive conversation', 'error');
    }
  };

  const handleSearch = async (query: string) => {
    if (query.trim()) {
      try {
        const results = await chatApi.searchConversations(query);
        setConversations(results);
      } catch (error) {
        console.error('Error searching conversations:', error);
      }
    } else {
      await loadConversations();
    }
  };

  const handleUploadComplete = (result: { message: string; count: number }) => {
    setDocumentCount(result.count);
    addToast(result.message, 'success');
  };

  const loadDocumentCount = async () => {
    try {
      const response = await chatApi.getDocumentCount();
      setDocumentCount(response.document_count);
    } catch {
      // ignore — count stays 0
    }
  };

  // Load document count on mount
  useEffect(() => {
    loadDocumentCount();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-gray-50'
    }`}>
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onArchiveConversation={handleArchiveConversation}
        onSearch={handleSearch}
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((p) => !p)}
        theme={theme}
        onAddToast={addToast}
      />

      {/* Main chat area */}
      <main className={`flex-1 flex flex-col min-w-0 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-white'
      }`}>
        {/* Header */}
        <header className={`flex-shrink-0 border-b px-4 md:px-6 py-3 flex items-center gap-3 transition-colors duration-300 ${
          theme === 'dark'
            ? 'border-white/8 bg-[#1a1a1a]/80 backdrop-blur-md'
            : 'border-gray-200 bg-white/80 backdrop-blur-md'
        }`}>
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-white/10 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo / Title */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className={`text-base font-semibold hidden sm:block ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              RAG Chat
            </h1>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Connection status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              isConnected === null
                ? theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                : isConnected
                  ? theme === 'dark' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                  : theme === 'dark' ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isConnected === null
                  ? 'bg-gray-400 animate-pulse'
                  : isConnected
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-red-500'
              }`} />
              <span className="hidden sm:inline">
                {isConnected === null ? 'Connecting…' : isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-white/10 hover:bg-white/20 text-yellow-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Chat window */}
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          theme={theme}
          onSendMessage={handleSendMessage}
          onAddToast={addToast}
          onViewPdf={(source) => {
            if (source.pdf_url) {
              setPdfViewerState({
                pdfUrl: source.pdf_url,
                documentName: source.document_name,
                initialPage: source.page || 1,
              });
            }
          }}
          documentCount={documentCount}
        />

        {/* Chat input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          theme={theme}
          onUploadComplete={handleUploadComplete}
        />
      </main>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>

      {/* PDF Viewer Modal */}
      {pdfViewerState && (
        <PdfViewerModal
          pdfUrl={pdfViewerState.pdfUrl}
          documentName={pdfViewerState.documentName}
          initialPage={pdfViewerState.initialPage}
          onClose={() => setPdfViewerState(null)}
        />
      )}
    </div>
  );
}

export default App;
