import axios from 'axios';
import { 
  ChatRequest, 
  ChatResponse, 
  Conversation, 
  CreateConversationRequest, 
  UpdateConversationRequest,
  UploadResponse,
  DocumentCountResponse
} from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/api/chat', request);
    return response.data;
  },
  
  getConversations: async (includeArchived: boolean = false): Promise<Conversation[]> => {
    const response = await api.get<Conversation[]>('/api/conversations', {
      params: { include_archived: includeArchived }
    });
    return response.data;
  },
  
  getConversation: async (conversationId: string): Promise<Conversation> => {
    const response = await api.get<Conversation>(`/api/conversations/${conversationId}`);
    return response.data;
  },
  
  createConversation: async (request: CreateConversationRequest): Promise<Conversation> => {
    const response = await api.post<Conversation>('/api/conversations', request);
    return response.data;
  },
  
  updateConversation: async (conversationId: string, request: UpdateConversationRequest): Promise<Conversation> => {
    const response = await api.put<Conversation>(`/api/conversations/${conversationId}`, request);
    return response.data;
  },
  
  deleteConversation: async (conversationId: string): Promise<void> => {
    await api.delete(`/api/conversations/${conversationId}`);
  },
  
  searchConversations: async (query: string): Promise<Conversation[]> => {
    const response = await api.get<Conversation[]>(`/api/conversations/search/${query}`);
    return response.data;
  },

  uploadDocument: async (file: File, onProgress?: (percent: number) => void): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  getDocumentCount: async (): Promise<DocumentCountResponse> => {
    const response = await api.get<DocumentCountResponse>('/api/documents');
    return response.data;
  },
};

export default api;