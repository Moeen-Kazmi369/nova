import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_API_URI}/api/user`,
});

// Set Authorization header dynamically and JSON content type except FormData
apiClient.interceptors.request.use((config) => {
  const token = JSON.parse(localStorage.getItem("user"))?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

/** Get all active AI Models for user sidebar */
export const getAllAIModels = async () => {
  const { data } = await apiClient.get("/models");
  return data;
};

export function useGetAllAIModels() {
  return useQuery({
    queryKey: ["userModels"],
    queryFn: getAllAIModels,
  });
}

/** Get all conversations for logged-in user */
export const getUserConversations = async () => {
  const { data } = await apiClient.get("/conversations");
  return data;
};

export function useGetUserConversations() {
  return useQuery({
    queryKey: ["userConversations"],
    queryFn: getUserConversations,
  });
}

/** Get all messages for a conversation by ID */
export const getConversationMessagesById = async (conversationId) => {
  const { data } = await apiClient.get(
    `/conversations/${conversationId}/messages`
  );
  return data;
};

export function useGetConversationMessages(conversationId) {
  return useQuery({
    queryKey: ["conversationMessages", conversationId],
    queryFn: () => getConversationMessagesById(conversationId),
    enabled: !!conversationId, // only run if conversationId exists
  });
}

/** Delete a conversation by ID */
export const deleteConversationById = async (conversationId) => {
  await apiClient.delete(`/conversations/${conversationId}`);
};

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConversationById,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userConversations"] });
    },
  });
}

/** User text prompt with optional files and conversation handling */
export const userTextPrompt = async (promptData) => {
  // promptData can be FormData (with files) or JSON
  const { data } = await apiClient.post("/chat/prompt", promptData, {
    headers: {
      "Content-Type":
        promptData instanceof FormData
          ? "multipart/form-data"
          : "application/json",
    },
  });
  return data;
};

export function useUserTextPrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userTextPrompt,
    onSuccess: ({ conversationId }) => {
      queryClient.invalidateQueries(["userConversations"]);
      queryClient.invalidateQueries(["conversationMessages", conversationId]);
    },
  });
}
