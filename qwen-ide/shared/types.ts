// Shared types between frontend and backend

export interface QwenMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface QwenConversation {
  id: string;
  title: string;
  messages: QwenMessage[];
  createdAt: Date;
  updatedAt: Date;
  config: QwenModelConfig;
}

export interface QwenModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  repeatPenalty: number;
  systemPrompt?: string;
  modelPath?: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: Date;
  isDirectory: boolean;
  children?: ProjectFile[];
}

export interface FileSystemItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: Date;
  children?: FileSystemItem[];
}

export interface Project {
  id: string;
  name: string;
  path: string;
  type?: string;
  description?: string;
  files: FileSystemItem[];
  createdAt: Date;
  lastOpened: Date;
  settings: ProjectSettings;
}

export interface ProjectSettings {
  aiAssistance: boolean;
  autoComplete: boolean;
  syntaxHighlighting: boolean;
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
}

export interface CodeAnalysis {
  file: string;
  line: number;
  column: number;
  type: 'error' | 'warning' | 'info' | 'suggestion';
  message: string;
  severity: number;
  code?: string;
}

export interface AISuggestion {
  id: string;
  type: 'completion' | 'explanation' | 'refactor' | 'fix' | 'optimize';
  original: string;
  suggestion: string;
  confidence: number;
  reasoning?: string;
  context: {
    file: string;
    line: number;
    column: number;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WebSocketMessage {
  type: 'model_response' | 'model_loading' | 'model_error' | 'chat_update' | 'file_change';
  data: any;
  timestamp: Date;
}