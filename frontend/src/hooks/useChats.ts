import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAudioLevel } from './useAudioLevel';
//hello
export interface Chat {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id?: string;
  text: string;
  isUser: boolean;
  timestamp: string | Date;
}

export const useChats = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { speakWithAnalysis } = useAudioLevel();

  const getToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.token;
  };

  // Fetch all chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API_URI}/api/chat/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChats(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0 && !selectedChatId) {
          setSelectedChatId(data[0]._id);
        }
      } catch {
        setChats([]); // fallback to empty array on error
      }
    };
    fetchChats();
    // eslint-disable-next-line
  }, []);



  const fetchMessages = async (chatId: string) => {
    const token = JSON.parse(localStorage.getItem('user') || '{}').token;
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URI}/api/chat/${chatId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessages(res.data);
  };
  
  // Fetch messages when selected chat changes
  useEffect(() => {
    const fetchMessages = async () => {
      const token = getToken();
      if (!token || !selectedChatId) return;
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_API_URI}/api/chat/${selectedChatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(data);
      } catch {}
    };
    if (selectedChatId) fetchMessages();
  }, [selectedChatId]);

  // Create a new chat
  const createChat = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_API_URI}/api/chat/new`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats((prev) => [data, ...prev]);
      setSelectedChatId(data._id);
      setMessages([]);
    } catch {}
  }, []);

  // Delete a chat
  const deleteChat = useCallback(async (chatId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_API_URI}/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats((prev) => prev.filter((c) => c._id !== chatId));
      if (selectedChatId === chatId) {
        setSelectedChatId(chats.length > 1 ? chats.find((c) => c._id !== chatId)?._id || null : null);
        setMessages([]);
      }
    } catch {}
  }, [selectedChatId, chats]);

  // Rename a chat
  const renameChat = useCallback(async (chatId: string, title: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const { data } = await axios.patch(`${import.meta.env.VITE_BACKEND_API_URI}/api/chat/${chatId}/rename`, { title }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats((prev) => prev.map((c) => (c._id === chatId ? { ...c, title: data.title } : c)));
    } catch {}
  }, []);

  // Add a message to the selected chat
  const addMessage = useCallback(async (text: string, isUser: boolean) => {
    const token = getToken();
    if (!token || !selectedChatId) return;
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_API_URI}/api/chat/${selectedChatId}/message`,
        { text, isUser },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, data]);
    } catch {}
  }, [selectedChatId]);

  // Helper: Call OpenAI API with chat history
  async function getGPTResponse(
    messages: { role: string; content: string }[]
  ): Promise<string> {
    const modelConfigs = await axios.post(
      `${import.meta.env.VITE_BACKEND_API_URI}/api/model-configs/admin-get`
    );
    const modelConfig = modelConfigs?.configs[0];
    const systemPrompt =
      modelConfig?.systemPrompt || "You are a helpful assistant.";
    const updatedMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];
    console.log(updatedMessages);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: updatedMessages,
        temperature: modelConfig?.temperature || 0.7,
        max_tokens: modelConfig?.maxTokens || 512,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No response generated.";
  }

  // Process a user message and get real AI response
  const processMessage = useCallback(
    async (userMessage: string) => {
      setIsProcessing(true);
      // 1. Add user message to backend
      await addMessage(userMessage, true);

      // --- Auto-generate chat title if needed ---
      // Only do this if the chat exists, has the default title, and this is the first user message
      const currentChat = chats.find((c) => c._id === selectedChatId);
      if (
        currentChat &&
        currentChat.title === "New Chat" &&
        messages.length === 0
      ) {
        try {
          // Use OpenAI to generate a short title from the first user message
          const prompt = `Generate a short, descriptive title (max 6 words, no quotes) for this conversation based on the following message.\nMessage: ${userMessage}`;
          const res = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a helpful assistant that creates short, descriptive chat titles.",
                  },
                  { role: "user", content: prompt },
                ],
                max_tokens: 16,
                temperature: 0.5,
              }),
            }
          );
          const data = await res.json();
          let title = data.choices?.[0]?.message?.content?.trim() || "New Chat";
          // Remove quotes if present
          if (title.startsWith('"') && title.endsWith('"')) {
            title = title.slice(1, -1);
          }
          if (title && title !== "New Chat") {
            await renameChat(currentChat._id, title);
          }
        } catch (err) {
          // Fail silently, keep default title
        }
      }
      // --- End auto-title logic ---
      // 2. Prepare chat history for OpenAI
      const openAIMessages = [
        ...messages.map((m) => ({
          role: m.isUser ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: userMessage },
      ];
      // 3. Get AI response from OpenAI
      let aiResponse = "";
      try {
        console.log("Processing message:", openAIMessages);
        aiResponse = await getGPTResponse(openAIMessages);
        console.log(aiResponse);
      } catch (err) {
        aiResponse = "I'm having trouble processing your request right now.";
      }
      // 4. Add AI response to backend
      await addMessage(aiResponse, false);
      // 5. Optionally, speak the AI response
      // try {
      //   await speakWithAnalysis(aiResponse);
      // } catch {}
      setIsProcessing(false);
    },
    [addMessage, messages, chats, selectedChatId, renameChat, speakWithAnalysis]
  );
//comment
  return {
    chats,
    selectedChatId,
    setSelectedChatId,
    messages,
    isProcessing,
    createChat,
    deleteChat,
    renameChat,
    addMessage,
    processMessage,
    fetchMessages,
  };
}; 