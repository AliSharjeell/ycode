/**
 * Stub for the deleted AI chat store. No-op.
 */
import { create } from 'zustand';

interface AiChatState {
  sessions: any[];
  currentSessionId: string | null;
  isStreaming: boolean;
  sendMessage: (...args: any[]) => Promise<void>;
  clear: () => void;
  startNewChat: () => void;
  loadChat: (id: string) => Promise<void>;
  renameChat: (id: string, name: string) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
}

export const useAiChatStore = create<AiChatState>((set) => ({
  sessions: [],
  currentSessionId: null,
  isStreaming: false,
  sendMessage: async () => {},
  clear: () => set({ sessions: [], currentSessionId: null }),
  startNewChat: () => set({ currentSessionId: null }),
  loadChat: async () => {},
  renameChat: async () => {},
  deleteChat: async () => {},
}));
