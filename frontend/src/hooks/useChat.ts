// Deprecated: use useChats instead
export const useChat = () => {
  if (typeof window !== 'undefined') {
    console.warn('useChat is deprecated. Use useChats instead.');
  }
  return { messages: [], isProcessing: false, addMessage: async () => {}, processMessage: async () => {} };
};