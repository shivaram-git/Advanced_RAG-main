import React, { useState } from 'react';
import { Conversation } from '../types/chat';

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedConversationId: string | undefined;
  onNewChat: () => void;
  onSelectConversation: (conv: Conversation) => void;
  onDeleteConversation: (convId: string) => void;
  onRenameConversation: (convId: string, newTitle: string) => void;
  onArchiveConversation: (convId: string) => void;
  onSearch: (query: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  theme?: 'light' | 'dark';
  onAddToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

type DateGroup = 'Today' | 'Yesterday' | 'This Week' | 'Older';

function getDateGroup(date: Date): DateGroup {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekStart = new Date(today.getTime() - today.getDay() * 86400000);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= weekStart) return 'This Week';
  return 'Older';
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  selectedConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onArchiveConversation,
  onSearch,
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  theme = 'light',
  onAddToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState<string | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const startEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const saveEdit = (convId: string) => {
    if (editTitle.trim()) {
      onRenameConversation(convId, editTitle.trim());
      onAddToast?.('Conversation renamed', 'success');
    }
    cancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent, convId: string) => {
    if (e.key === 'Enter') {
      saveEdit(convId);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getPreview = (conv: Conversation): string => {
    const userMsgs = conv.messages.filter(m => m.role === 'user');
    if (userMsgs.length > 0) {
      const text = userMsgs[0].content;
      return text.length > 60 ? text.slice(0, 60) + '…' : text;
    }
    return '';
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by date
  const grouped = filteredConversations.reduce<Record<DateGroup, Conversation[]>>((acc, conv) => {
    const group = getDateGroup(new Date(conv.updated_at));
    if (!acc[group]) acc[group] = [];
    acc[group].push(conv);
    return acc;
  }, {} as Record<DateGroup, Conversation[]>);

  const groupOrder: DateGroup[] = ['Today', 'Yesterday', 'This Week', 'Older'];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-50 md:z-auto
          flex flex-col h-screen
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-16' : 'w-72'}
          ${
            theme === 'dark'
              ? 'bg-[#1a1a1a] border-r border-white/8'
              : 'bg-[#FAFAF9] border-r border-gray-200'
          }
        `}
      >
        {/* Sidebar header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b transition-colors ${
          theme === 'dark' ? 'border-white/8' : 'border-gray-200'
        }`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className={`text-base font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                RAG Chat
              </h1>
            </div>
          )}

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={onToggleCollapse}
            className={`hidden md:flex p-1.5 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-white/10 text-gray-500'
                : 'hover:bg-gray-200 text-gray-400'
            }`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          {/* Mobile close */}
          <button
            onClick={onCloseMobile}
            className={`md:hidden p-1.5 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-white/10 text-gray-400'
                : 'hover:bg-gray-200 text-gray-500'
            }`}
            aria-label="Close sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* New Chat Button */}
            <div className="p-3">
              <button
                onClick={() => {
                  onNewChat();
                  onCloseMobile();
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl hover-lift'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover-lift'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </button>
            </div>

            {/* Search */}
            <div className="px-3 pb-3">
              <div className="relative">
                <svg
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm transition-colors focus:outline-none ${
                    theme === 'dark'
                      ? 'bg-[#0f0f0f] border border-white/10 text-gray-100 placeholder-gray-500 focus:border-indigo-500/50'
                      : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-400'
                  }`}
                  aria-label="Search conversations"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className={`w-10 h-10 mx-auto mb-3 ${
                      theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                  </p>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {searchQuery ? 'Try a different search term' : 'Start a new chat to begin'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupOrder.map((group) => {
                    const convs = grouped[group];
                    if (!convs || convs.length === 0) return null;
                    return (
                      <div key={group}>
                        <p className={`text-[11px] font-semibold uppercase tracking-wider px-2 mb-1.5 ${
                          theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {group}
                        </p>
                        <div className="space-y-0.5">
                          {convs.map((conv) => (
                            <div
                              key={conv.id}
                              className={`group relative px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                                selectedConversationId === conv.id
                                  ? theme === 'dark'
                                    ? 'bg-indigo-950/50 border border-indigo-800/30'
                                    : 'bg-indigo-50 border border-indigo-200'
                                  : theme === 'dark'
                                    ? 'hover:bg-white/5 border border-transparent'
                                    : 'hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm'
                              }`}
                              onClick={() => {
                                onSelectConversation(conv);
                                onCloseMobile();
                              }}
                            >
                              {editingId === conv.id ? (
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onBlur={() => saveEdit(conv.id)}
                                  onKeyDown={(e) => handleKeyDown(e, conv.id)}
                                  className={`w-full px-2 py-1 text-sm rounded-lg border focus:outline-none ${
                                    theme === 'dark'
                                      ? 'bg-[#0f0f0f] border-indigo-500/50 text-gray-100'
                                      : 'bg-white border-indigo-300 text-gray-900'
                                  }`}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium truncate ${
                                        selectedConversationId === conv.id
                                          ? theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'
                                          : theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                                      }`}>
                                        {conv.title}
                                      </p>
                                      {/* Preview */}
                                      {(() => {
                                        const preview = getPreview(conv);
                                        if (preview) {
                                          return (
                                            <p className={`text-xs truncate mt-0.5 ${
                                              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                            }`}>
                                              {preview}
                                            </p>
                                          );
                                        }
                                        return null;
                                      })()}
                                      <p className={`text-[10px] mt-0.5 ${
                                        theme === 'dark' ? 'text-gray-700' : 'text-gray-400'
                                      }`}>
                                        {formatDate(conv.updated_at)}
                                      </p>
                                    </div>
                                    <div
                                      className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() => startEdit(conv)}
                                        className={`p-1 rounded transition-colors ${
                                          theme === 'dark'
                                            ? 'hover:bg-white/10 text-gray-500 hover:text-gray-300'
                                            : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                                        }`}
                                        title="Rename"
                                        aria-label="Rename conversation"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => setShowArchiveConfirm(conv.id)}
                                        className={`p-1 rounded transition-colors ${
                                          theme === 'dark'
                                            ? 'hover:bg-white/10 text-gray-500 hover:text-gray-300'
                                            : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                                        }`}
                                        title="Archive"
                                        aria-label="Archive conversation"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => setShowDeleteConfirm(conv.id)}
                                        className={`p-1 rounded transition-colors ${
                                          theme === 'dark'
                                            ? 'hover:bg-red-900/50 text-gray-500 hover:text-red-400'
                                            : 'hover:bg-red-100 text-gray-400 hover:text-red-500'
                                        }`}
                                        title="Delete"
                                        aria-label="Delete conversation"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Collapsed state — just icons */}
        {isCollapsed && (
          <div className="flex-1 flex flex-col items-center gap-4 pt-4">
            <button
              onClick={() => {
                onNewChat();
                onCloseMobile();
              }}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg'
              }`}
              title="New Chat"
              aria-label="New Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <div className="flex flex-col items-center gap-2">
              {conversations.slice(0, 5).map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv);
                    onCloseMobile();
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    selectedConversationId === conv.id
                      ? theme === 'dark'
                        ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-800/30'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : theme === 'dark'
                        ? 'text-gray-500 hover:bg-white/10 hover:text-gray-300'
                        : 'text-gray-400 hover:bg-white hover:text-gray-600 hover:shadow-sm'
                  }`}
                  title={conv.title}
                  aria-label={conv.title}
                >
                  {conv.title.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className={`rounded-lg p-6 max-w-sm w-full shadow-2xl ${
              theme === 'dark' ? 'bg-[#1a1a1a] border border-white/10' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Delete Conversation?
              </h3>
              <p className={`text-sm mb-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                This action cannot be undone. The conversation and all its messages will be permanently deleted.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:bg-white/10'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteConversation(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Archive Confirmation Dialog */}
        {showArchiveConfirm && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className={`rounded-lg p-6 max-w-sm w-full shadow-2xl ${
              theme === 'dark' ? 'bg-[#1a1a1a] border border-white/10' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Archive Conversation?
              </h3>
              <p className={`text-sm mb-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                This conversation will be moved to archives. You can unarchive it later.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowArchiveConfirm(null)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:bg-white/10'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onArchiveConversation(showArchiveConfirm);
                    setShowArchiveConfirm(null);
                  }}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-indigo-600 hover:bg-indigo-500'
                      : 'bg-gray-800 hover:bg-gray-900'
                  }`}
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default ConversationSidebar;