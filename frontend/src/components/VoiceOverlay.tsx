import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { VoiceControls } from './VoiceControls';
import { CircularWaveform } from './CircularWaveform';
import WaveIcon from '../assets/WaveIcon.png'; // 👈 New icon import

interface VoiceOverlayProps {
  open: boolean;
  onClose: () => void;
  onVoiceInput: (text: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  audioLevel?: number;
  isSpeaking?: boolean;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  permissionStatusCallback?: (status: 'unknown' | 'granted' | 'denied') => void;
}

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({
  open,
  onClose,
  onVoiceInput,
  isListening,
  setIsListening,
  audioLevel = 0,
  isSpeaking = false,
  onSpeechStart,
  onSpeechEnd,
  permissionStatusCallback
}) => {
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    if (open) {
      setShowLogo(true);
      const timer = setTimeout(() => setShowLogo(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowLogo(false);
    }
  }, [open]);

  if (!open) return null;

  // Tap outside to close overlay (mobile-friendly)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  // Separate handler for touch events
  const handleBackdropTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isActive = isListening || isSpeaking;
  const isUserInput = isListening && !isSpeaking;
  const waveformAudioLevel = isListening ? audioLevel : (isSpeaking ? Math.random() * 0.8 + 0.2 : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 animate-fadeIn"
      onClick={handleBackdropClick}
      onTouchStart={handleBackdropTouch}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Close (X) button bottom left - larger on mobile */}
      <button
        className="absolute left-4 bottom-8 sm:left-12 sm:bottom-12 p-5 sm:p-3 rounded-full bg-slate-800/80 hover:bg-slate-700/90 text-gray-300 hover:text-white shadow-lg transition"
        style={{ fontSize: 32, zIndex: 10 }}
        onClick={onClose}
        onTouchStart={onClose}
        aria-label="Close voice overlay"
      >
        <X className="w-10 h-10 sm:w-8 sm:h-8" />
      </button>

      {/* Centered logo or waveform */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {showLogo ? (
          <img
            src={WaveIcon}
            alt="Logo"
            className="mx-auto"
            style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: '50%' }}
          />
        ) : (
          <CircularWaveform
            isActive={isActive}
            isUserInput={isUserInput}
            audioLevel={waveformAudioLevel}
            size={220}
            className="mx-auto"
          />
        )}
      </div>

      {/* Mic button bottom right */}
      <div className="absolute right-6 bottom-8 sm:right-12 sm:bottom-12">
        <VoiceControls
          onVoiceInput={onVoiceInput}
          onSpeechStart={onSpeechStart || (() => {})}
          onSpeechEnd={onSpeechEnd || (() => {})}
          isListening={isListening}
          setIsListening={setIsListening}
          permissionStatusCallback={permissionStatusCallback}
        />
      </div>

      {/* Fallback message for unsupported or blocked mic */}
      {!navigator.mediaDevices?.getUserMedia && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-700/90 text-white px-4 py-2 rounded-xl text-center z-20 text-sm max-w-xs">
          Your browser does not support microphone access. Please use a modern browser.
        </div>
      )}
    </div>
  );
}; 