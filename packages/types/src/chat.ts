import type { ModelConfig } from "./model";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  thinking?: string;
  showThinking?: boolean;
}

export interface ChatRequestMessage {
  id?: string;
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  model?: string;
  prompt?: string;
  messages?: ChatRequestMessage[];
  config?: ModelConfig;
  stream?: boolean;
}

export interface ChatResponse {
  model: string;
  content: string;
  thinking?: string;
  totalDuration?: number;
  done: boolean;
}

export interface ChatStreamChunk {
  content?: string;
  thinking?: string;
  done?: boolean;
}
