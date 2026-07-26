export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Source[];
  run_id?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  messages: Message[];
}

export interface Source {
  document_name: string;
  page?: number;
  pdf_url?: string;
}

export interface ChatRequest {
  conversation_id?: string;
  query: string;
}

export interface ChatResponse {
  conversation_id: string;
  run_id: string;
  answer: string;
  sources: Source[];
}

export interface CreateConversationRequest {
  title: string;
}

export interface UpdateConversationRequest {
  title?: string;
  is_archived?: boolean;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  document_count: number;
  files_processed: string[];
}

export interface DocumentCountResponse {
  document_count: number;
}