import React, { useEffect, useState } from "react";
import { Trash2, Plus, User, Layers, LogOut } from "lucide-react";
import { Dialog } from "@headlessui/react";
import Icon from "../../assets/Icon.png";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetUsers,
  useDeleteUser,
  useGetAllAIModelsForAdmin,
  useDeleteAIModel,
} from "../hooks/backendAPIService";
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
  const location = useLocation();

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
  useEffect(() => {
    const navOption =
      new URLSearchParams(location.search).get("navOption") || "users";
    setSelectedNav(navOption);
  }, [location.pathname]);
  // Generate invite link
  const handleGenerateLink = () => {
    // Simulate invite link generation
    setInviteLink(
      `${window.location.origin}/login?email=${encodeURIComponent(email)}`
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

  // Responsive states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // Close sidebar on desktop view
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="flex flex-col md:flex-row h-screen font-sans text-white"
      style={{ backgroundColor: "#020617" }}
    >
      {/* Mobile header */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-gray-700 md:hidden">
          <div className="flex items-center space-x-2">
            <img src={Icon} alt="logo" className="w-8" />
            <h1 className="text-xl font-bold">NOVA 1000</h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-800"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              } transition-transform duration-300 ease-in-out md:hidden`
            : "w-64 flex flex-col bg-gray-900 md:flex"
        }`}
      >
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <img src={Icon} alt="logo" className="w-8" />
              <h1 className="text-xl font-bold">NOVA 1000</h1>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg bg-gray-800"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        {!isMobile && (
          <div className="flex items-center p-6 mb-6 space-x-2">
            <img src={Icon} alt="logo" className="w-8" />
            <h1 className="text-2xl font-bold">NOVA 1000</h1>
          </div>
        )}
        <nav className="flex-1 flex flex-col space-y-4 p-6">
          <button
            onClick={() => {
              setSelectedNav("users");
              setIsSidebarOpen(false);
            }}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
              selectedNav === "users" ? "bg-blue-600" : "hover:bg-blue-700"
            }`}
          >
            <User className="w-5 h-5" />
            <span>Users</span>
          </button>
          <button
            onClick={() => {
              setSelectedNav("models");
              setIsSidebarOpen(false);
            }}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
              selectedNav === "models" ? "bg-blue-600" : "hover:bg-blue-700"
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>NOVA 1000 Models</span>
          </button>
        </nav>
        <button
          className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm m-6"
          onClick={() => {
            localStorage.removeItem("user");
            localStorage.removeItem("autoCreateChat");
            window.location.href = "/login";
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg md:text-xl font-semibold uppercase tracking-wide">
            {selectedNav === "users" ? "Users" : "ACE™ Agents"}
          </h2>
          {selectedNav === "models" ? (
            <button
              onClick={() => navigate("/admin/ai-model-config/new")}
              className="flex items-center space-x-1 md:space-x-2 rounded bg-blue-600 px-3 py-2 text-sm md:px-4 md:py-2 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Create New Model</span>
              <span className="sm:hidden">Create</span>
            </button>
          ) : (
            <button
              className="px-3 py-2 text-sm md:px-6 md:py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
              onClick={() => setIsInviteModal(true)}
            >
              <span className="hidden sm:inline">Generate Invite Link</span>
              <span className="sm:hidden">Invite</span>
            </button>
          )}
        </header>

        {/* Page content - Fixed height with scrollable content */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
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
                      className="flex flex-col md:flex-row md:justify-between md:items-center bg-gray-800 rounded px-4 py-3 shadow gap-2"
                    >
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                      <button
                        onClick={() => confirmDeleteUser(user)}
                        className="self-start md:self-auto text-red-500 hover:text-red-700"
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
                      className="bg-gray-800 rounded shadow p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3 cursor-pointer hover:bg-gray-700"
                    >
                      <div
                        onClick={() =>
                          navigate(`/admin/ai-model-config/${model._id}`)
                        }
                        className="flex-1"
                      >
                        <h3 className="text-lg font-semibold">{model.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {model.description}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDeleteModel(model);
                        }}
                        className="self-start md:self-auto text-red-500 hover:text-red-700"
                        aria-label={`Delete model ${model.name}`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
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
          <Dialog.Panel className="bg-gray-900 rounded max-w-sm mx-auto p-6 z-50 text-white w-full md:w-auto">
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
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-sm md:text-base"
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
          <Dialog.Panel className="bg-gray-900 rounded max-w-sm mx-auto p-6 z-50 text-white w-full md:w-auto">
            <Dialog.Title className="text-lg font-bold mb-4">
              Generate Invite Link
            </Dialog.Title>

            <input
              type="email"
              placeholder="Enter user email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-700 bg-gray-900 text-white placeholder-gray-400 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm md:text-base"
            />

            <button
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              onClick={handleGenerateLink}
              disabled={!email}
            >
              Generate Link
            </button>

            {inviteLink && (
              <div className="flex flex-col md:flex-row items-center gap-2 mt-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 border border-gray-700 bg-gray-900 text-white rounded px-2 py-1 text-sm"
                />
                <button
                  className="w-full md:w-auto px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                  onClick={handleCopy}
                >
                  Copy
                </button>
              </div>
            )}

            <button
              className={`mt-4 w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm md:text-base`}
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