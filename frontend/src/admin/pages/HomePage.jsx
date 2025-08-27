import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const HomePage = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [inviteLink, setInviteLink] = useState('');
    const navigate = useNavigate();

    const handleGenerateLink = () => {
      // Simulate invite link generation
      setInviteLink(
        `${import.meta.env.VITE_USER_SIDE_API_URI}?email=${encodeURIComponent(
          email
        )}`
      );
    };

    const handleCopy = () => {
      navigator.clipboard.writeText(inviteLink);
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen relative">
        <button
          className="m-4 absolute right-0 top-0 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
          onClick={() => {
            localStorage.removeItem("user");
            localStorage.removeItem("autoCreateChat");
            window.location.href = "/";
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
        <h1 className="text-4xl font-bold mb-4 text-white">Welcome, Admin!</h1>
        <p className="text-lg text-blue-200 mb-8">
          Manage your Nova 1000 settings and invite users below.
        </p>
        <div className="flex flex-col gap-4">
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
            onClick={() => setIsOpen(true)}
          >
            Generate New Invite Link
          </button>
          <button
            className="px-6 py-2 bg-gray-800 text-white rounded shadow hover:bg-gray-900"
            onClick={() => navigate("/admin/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>

        <Dialog
          open={isOpen}
          onClose={() => setIsOpen(false)}
          className="fixed z-10 inset-0 overflow-y-auto bg-transparent"
        >
          <div className="flex items-center justify-center min-h-screen px-4 bg-transparent">
            <Dialog.Panel className="bg-[#0c1643] rounded-lg shadow-xl p-6 w-full max-w-md text-white">
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
                  setIsOpen(false);
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
};

export default HomePage;