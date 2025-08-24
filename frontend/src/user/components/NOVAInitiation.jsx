// NOVAInitiation.tsx
import React, { useEffect, useState } from 'react';
import { resumeAudioContext } from '../hooks/resumeAudioContext';
import { forceIOSSpeechPriming } from '../hooks/iosSpeechPriming';

const NOVAInitiation= ({ onComplete }) => {
  const [initiated, setInitiated] = useState(false);

  const handleInitiate = async () => {
    await resumeAudioContext();
    forceIOSSpeechPriming();
    setInitiated(true);
    setTimeout(() => {
      onComplete();
    }, 1200);
  };

  useEffect(() => {
    const alreadyInitiated = localStorage.getItem('nova-init');
    if (alreadyInitiated) onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (initiated) {
      localStorage.setItem('nova-init', 'true');
    }
  }, [initiated]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-center">
      {!initiated ? (
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-6xl font-light text-white tracking-wider">
            NOVA 1000<span className="text-sm align-top ml-1 text-gray-400">™</span>
          </h1>
          <p className="text-gray-400 text-sm tracking-wide">Tap to initiate dimensional resonance</p>
          <button
            onClick={handleInitiate}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 transition rounded-full text-white font-medium text-lg tracking-wide shadow-xl shadow-blue-500/30"
          >
            Initiate
          </button>
        </div>
      ) : (
        <div className="animate-pulse text-cyan-400 text-sm tracking-widest">
          Calibrating neural resonance...
        </div>
      )}
    </div>
  );
};

export default NOVAInitiation;
