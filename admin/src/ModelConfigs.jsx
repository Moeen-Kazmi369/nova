import React, { useState } from 'react';
import toast from "react-hot-toast";
import axios from "axios";
const initialConfig = {
    modelName: '',
    temperature: 0.7,
    maxTokens: 512,
    systemPrompt: '',
    playgroundInput: '',
    playgroundOutput: '',
};

const ModelConfigs = () => {
    const [config, setConfig] = useState(initialConfig);

    const handleChange = e => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: name === 'temperature' || name === 'maxTokens' ? Number(value) : value
        }));
    };

    const handlePlaygroundRun = () => {
        // Simulate model response
        setConfig(prev => ({
            ...prev,
            playgroundOutput: `Echo: ${prev.playgroundInput}`
        }));
    };

     const handleSave = async () => {
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_API_URI}/api/model-configs/save`, config, {
        withCredentials: true,
      });
      toast.success(data.message);
      setConfig(data.config);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save ModelConfig");
    }
  };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Left: Configure Section */}
            <div className="w-1/3 bg-white p-8 border-r flex flex-col gap-6">
                <h2 className="text-2xl font-bold mb-4">Configure Nova 1000</h2>
                <div className="flex flex-col gap-4">
                    <label>
                        <span className="block mb-1 font-medium">Model Name</span>
                        <input
                            type="text"
                            name="modelName"
                            value={config.modelName}
                            onChange={handleChange}
                            className="w-full border rounded px-3 py-2"
                            placeholder="e.g. NovaGPT"
                        />
                    </label>
                    <label>
                        <span className="block mb-1 font-medium">Temperature</span>
                        <input
                            type="number"
                            name="temperature"
                            min={0}
                            max={1}
                            step={0.01}
                            value={config.temperature}
                            onChange={handleChange}
                            className="w-full border rounded px-3 py-2"
                        />
                    </label>
                    <label>
                        <span className="block mb-1 font-medium">Max Tokens</span>
                        <input
                            type="number"
                            name="maxTokens"
                            min={1}
                            max={4096}
                            value={config.maxTokens}
                            onChange={handleChange}
                            className="w-full border rounded px-3 py-2"
                        />
                    </label>
                    <label>
                        <span className="block mb-1 font-medium">System Prompt</span>
                        <textarea
                            name="systemPrompt"
                            value={config.systemPrompt}
                            onChange={handleChange}
                            className="w-full border rounded px-3 py-2"
                            rows={3}
                            placeholder="You are Nova 1000, a helpful assistant..."
                        />
                    </label>
                    <button
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => handleSave()}
                    >
                        Save Settings
                    </button>
                </div>
            </div>
            {/* Right: Playground Section */}
            <div className="w-2/3 p-8 flex flex-col gap-6">
                <h2 className="text-xl font-bold mb-4">Playground</h2>
                <div className="flex flex-col gap-4">
                    <textarea
                        name="playgroundInput"
                        value={config.playgroundInput}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        rows={4}
                        placeholder="Type your prompt here..."
                    />
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-fit"
                        onClick={handlePlaygroundRun}
                    >
                        Run
                    </button>
                    <div className="bg-gray-100 border rounded px-3 py-2 min-h-[80px]">
                        <span className="font-semibold">Output:</span>
                        <div className="mt-2 text-gray-800">{config.playgroundOutput}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelConfigs;