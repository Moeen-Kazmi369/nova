
import React, { useState } from "react";
import { Trash2, Plus, User, Layers } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetUsers, useDeleteUser, useGetAllAIModelsForAdmin, useDeleteAIModel } from "../hooks/backendAPIService";
import axios from "axios";

export default function Dashboard() {
  const [selectedNav, setSelectedNav] = useState("users");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModal, setIsInviteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [modelToDelete, setModelToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const navigate = useNavigate();

  // Fetch users and models
  const {
    data: users,
    isLoading: isUsersLoading,
    error: usersError,
  } = useGetUsers();
  const {
    data: models,
    isLoading: isModelsLoading,
    error: modelsError,
  } = useGetAllAIModelsForAdmin();
  const deleteUser = useDeleteUser();
  const deleteAIModel = useDeleteAIModel();

  // Generate invite link
    const handleGenerateLink = () => {
      // Simulate invite link generation
      setInviteLink(
        `${window.location.origin}?email=${encodeURIComponent(
          email
        )}`
      );
    };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied to clipboard");
  };

  // Modal open handler for user deletion
  function confirmDeleteUser(user) {
    setUserToDelete(user);
    setModelToDelete(null);
    setIsModalOpen(true);
  }

  // Modal open handler for model deletion
  function confirmDeleteModel(model) {
    setModelToDelete(model);
    setUserToDelete(null);
    setIsModalOpen(true);
  }

  // Modal confirm delete handler
  function handleDelete() {
    setIsDeleting(true);
    if (userToDelete) {
      deleteUser.mutate(userToDelete._id, {
        onSuccess: () => {
          toast.success("User deleted successfully");
          setIsModalOpen(false);
          setUserToDelete(null);
          setIsDeleting(false);
        },
        onError: (err) => {
          setIsDeleting(false);
          toast.error(err.message || "Failed to delete user");
        },
      });
    } else if (modelToDelete) {
      deleteAIModel.mutate(modelToDelete._id, {
        onSuccess: () => {
          toast.success("Model deleted successfully");
          setIsModalOpen(false);
          setModelToDelete(null);
          setIsDeleting(false);
        },
        onError: (err) => {
          setIsDeleting(false);
          toast.error(err.message || "Failed to delete model");
        },
      });
    }
  }

  return (
    <div
      className="flex h-screen font-sans text-white"
      style={{ backgroundColor: "#020617" }}
    >
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-gray-900 p-6">
        <div className="flex items-center mb-12 space-x-2">
          <Layers className="h-8 w-8 text-blue-400" />
          <h1 className="text-2xl font-bold">NOVA 1000</h1>
        </div>
        <nav className="flex flex-col space-y-4">
          <button
            onClick={() => setSelectedNav("users")}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
              selectedNav === "users" ? "bg-blue-600" : "hover:bg-blue-700"
            }`}
          >
            <User className="w-5 h-5" />
            <span>Users</span>
          </button>
          <button
            onClick={() => setSelectedNav("models")}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
              selectedNav === "models" ? "bg-blue-600" : "hover:bg-blue-700"
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>NOVA 1000 Models</span>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold uppercase tracking-wide">
            {selectedNav === "users" ? "Users" : "AI Models"}
          </h2>
          {selectedNav === "models" ? (
            <button
              onClick={() => navigate("/admin/dashboard/ai-model-config/new")}
              className="flex items-center space-x-2 rounded bg-blue-600 px-4 py-2 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Model</span>
            </button>
          ) : (
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
              onClick={() => setIsInviteModal(true)}
            >
              Generate New Invite Link
            </button>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-8">
          {selectedNav === "users" ? (
            <div className="space-y-4">
              {isUsersLoading ? (
                <p className="text-gray-400">Loading users...</p>
              ) : usersError ? (
                <p className="text-red-400">
                  Error loading users: {usersError.message}
                </p>
              ) : !users || users.length === 0 ? (
                <p className="text-gray-400">No users found</p>
              ) : (
                users.map((user) => (
                  <div
                    key={user._id}
                    className="flex justify-between items-center bg-gray-800 rounded px-4 py-3 shadow"
                  >
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                    <button
                      onClick={() => confirmDeleteUser(user)}
                      className="text-red-500 hover:text-red-700"
                      aria-label={`Delete user ${user.name}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {isModelsLoading ? (
                <p className="text-gray-400">Loading models...</p>
              ) : modelsError ? (
                <p className="text-red-400">
                  Error loading models: {modelsError.message}
                </p>
              ) : !models || models.length === 0 ? (
                <p className="text-gray-400">No models found</p>
              ) : (
                models.map((model) => (
                  <div
                    key={model._id}
                    className="bg-gray-800 rounded shadow p-4 flex justify-between items-center cursor-pointer hover:bg-gray-700"
                  >
                    <div
                      onClick={() =>
                        navigate(
                          `/admin/dashboard/ai-model-config/${model._id}`
                        )
                      }
                    >
                      <h3 className="text-lg font-semibold">{model.name}</h3>
                      <p className="text-gray-400">{model.description}</p>
                    </div>
                    <button
                      onClick={() => confirmDeleteModel(model)}
                      className="text-red-500 hover:text-red-700"
                      aria-label={`Delete model ${model.name}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black opacity-50" />
          <Dialog.Panel className="bg-gray-900 rounded max-w-sm mx-auto p-6 z-50 text-white">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Confirm Delete
            </Dialog.Title>
            <Dialog.Description>
              {userToDelete ? (
                <p>
                  Are you sure you want to delete{" "}
                  <span className="font-bold">{userToDelete.name}</span>?
                </p>
              ) : modelToDelete ? (
                <p>
                  Are you sure you want to delete{" "}
                  <span className="font-bold">{modelToDelete.name}</span>?
                </p>
              ) : null}
            </Dialog.Description>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
                autoFocus
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Invite Link Modal */}
      <Dialog
        open={isInviteModal}
        onClose={() => setIsInviteModal(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black opacity-50" />
          <Dialog.Panel className="bg-gray-900 rounded max-w-sm mx-auto p-6 z-50 text-white">
            <Dialog.Title className="text-lg font-bold mb-4">
              Generate Invite Link
            </Dialog.Title>

            <input
              type="email"
              placeholder="Enter user email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-700 bg-gray-900 text-white placeholder-gray-400 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleGenerateLink}
              disabled={!email}
            >
              Generate Link
            </button>

            {inviteLink && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 border border-gray-700 bg-gray-900 text-white rounded px-2 py-1"
                />
                <button
                  className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                  onClick={handleCopy}
                >
                  Copy
                </button>
              </div>
            )}

            <button
              className={`mt-4 px-4 ${
                inviteLink ? "ml-0" : "ml-4"
              } py-2 bg-gray-700 text-white rounded hover:bg-gray-600`}
              onClick={() => {
                setIsInviteModal(false);
                setEmail("");
                setInviteLink("");
              }}
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}