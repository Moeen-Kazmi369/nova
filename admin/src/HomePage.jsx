import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [inviteLink, setInviteLink] = useState('');
    const navigate = useNavigate();

    const handleGenerateLink = () => {
        // Simulate invite link generation
        setInviteLink(`https://nova.app/invite?email=${encodeURIComponent(email)}`);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen"
            style={{
                background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 50%, #00c6ff 100%)'
            }}>
            <h1 className="text-4xl font-bold mb-4 text-white">Welcome, Admin!</h1>
            <p className="text-lg text-blue-200 mb-8">Manage your Nova 1000 settings and invite users below.</p>
            <div className="flex flex-col gap-4">
                <button
                    className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                    onClick={() => setIsOpen(true)}
                >
                    Generate New Invite Link
                </button>
                <button
                    className="px-6 py-2 bg-gray-800 text-white rounded shadow hover:bg-gray-900"
                    onClick={() => navigate('/model-configs')}
                >
                    Nova 1000 Settings
                </button>
            </div>

            <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed z-10 inset-0 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4">
                    <Dialog.Panel className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <Dialog.Title className="text-lg font-bold mb-2">Generate Invite Link</Dialog.Title>
                        <input
                            type="email"
                            placeholder="Enter user email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full border rounded px-3 py-2 mb-4"
                        />
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-2"
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
                                    className="flex-1 border rounded px-2 py-1"
                                />
                                <button
                                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                    onClick={handleCopy}
                                >
                                    Copy
                                </button>
                            </div>
                        )}
                        <button
                            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            onClick={() => {
                                setIsOpen(false);
                                setEmail('');
                                setInviteLink('');
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