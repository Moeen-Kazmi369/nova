import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_API_URI}/api/admin`,
});

// Add an interceptor to dynamically set the Authorization header and Content-Type
apiClient.interceptors.request.use((config) => {
  const token = JSON.parse(localStorage.getItem("user"))?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Only set Content-Type to application/json if not FormData
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

/** Admin: Get list of all users */
export const getUsers = async () => {
  const { data } = await apiClient.get("/users");
  const currentUser=JSON.parse(localStorage.getItem("user"));
  return data?.filter(user=>user._id!==currentUser.userId);
};

export function useGetUsers() {
  return useQuery({
    queryKey: ["adminUsers"],
    queryFn: getUsers,
  });
}

/** Admin: Delete a user by ID */
export const deleteUser = async (userId) => {
  await apiClient.delete(`/users/${userId}`);
};

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
}

/** Admin: Create AI Model */
export const createAIModel = async (modelData) => {
  const { data } = await apiClient.post("/models", modelData, {
    headers: {
      "Content-Type":
        modelData instanceof FormData
          ? "multipart/form-data"
          : "application/json",
    },
  });
  return data;
};

export function useCreateAIModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAIModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminModels"] });
    },
  });
}

/** Admin: Get all AI Models (for admin) */
export const getAllAIModelsForAdmin = async () => {
  const { data } = await apiClient.get("/modelsForAdmin");
  return data;
};

export function useGetAllAIModelsForAdmin() {
  return useQuery({
    queryKey: ["adminModels"],
    queryFn: getAllAIModelsForAdmin,
  });
}

/** Admin: Update AI Model by ID */
export const updateAIModel = async ({ id, modelData }) => {
  const { data } = await apiClient.put(`/models/${id}`, modelData, {
    headers: {
      "Content-Type":
        modelData instanceof FormData
          ? "multipart/form-data"
          : "application/json",
    },
  });
  return data;
};

export function useUpdateAIModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAIModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminModels"] });
    },
  });
}

/** Admin: Delete AI Model */
export const deleteAIModel = async (id) => {
  await apiClient.delete(`/models/${id}`);
};

export function useDeleteAIModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAIModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminModels"] });
    },
  });
}

/** Admin: Playground Text Chat API */
export const adminPlaygroundTextChat = async ({ promptData }) => {
  const { data } = await apiClient.post("/playground/text-chat", promptData, {
    headers: {
      "Content-Type":
        promptData instanceof FormData
          ? "multipart/form-data"
          : "application/json",
    },
  });
  return data;
};

export function useAdminPlaygroundTextChat() {
  return useMutation({
    mutationFn: adminPlaygroundTextChat,
  });
}
