import React, { useState, useEffect, useRef } from 'react';
import { CircularWaveform } from '../components/CircularWaveform';
import { VoiceControls } from '../components/VoiceControls';
import { useAudioLevel } from '../hooks/useAudioLevel';
import { resumeAudioContext } from '../hooks/resumeAudioContext';
import { forceIOSSpeechPriming } from '../hooks/iosSpeechPriming';
import { Volume2, Menu, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MenuOverlay } from '../components/MenuOverlay';

export const VoiceModePage: React.FC = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const { isSpeaking, stopSpeaking, speakWithAnalysis, audioLevel, isUserSpeaking } = useAudioLevel(isListening);
  
  const [isIOS, setIsIOS] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setIsDesktop(window.innerWidth >= 768);
    };

    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDesktop) return;
      if (e.key === 'Escape' && isSpeaking) {
        stopSpeaking();
      }
      if (e.key === ' ' && e.ctrlKey) {
        e.preventDefault();
        setIsListening(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop, isSpeaking, isListening, stopSpeaking]);

  useEffect(() => {
    const primeAudio = () => {
      resumeAudioContext();
      forceIOSSpeechPriming();
      window.removeEventListener('click', primeAudio);
    };
    window.addEventListener('click', primeAudio);
    return () => window.removeEventListener('click', primeAudio);
  }, []);

  const handleVoiceInput = (text: string) => {
    setIsProcessing(true);
    
    // Simulate AI processing and response
    setTimeout(() => {
      const responses = [
        "I understand your voice command. Processing your request now.",
        "Voice input received. Let me help you with that immediately.",
        "Your voice is clear and understood. Here's my response.",
        "Processing your spoken request through the Dimensional Integrity Engine.",
        "Voice command acknowledged. Executing your request now."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setLastResponse(randomResponse);
      setIsProcessing(false);
      
      // Auto-speak the response
      setTimeout(() => {
        resumeAudioContext().then(() => speakWithAnalysis(randomResponse));
      }, 800);
    }, 1500);
  };

  const handleSpeechStart = () => setIsProcessing(true);
  const handleSpeechEnd = () => setIsProcessing(false);

  const speakLastResponse = async () => {
    await resumeAudioContext();
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (lastResponse) {
      speakWithAnalysis(lastResponse);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden" style={{ height: `${viewportHeight}px` }}>
        {/* Header with navigation */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 mobile-safe-top">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-light tracking-wider text-white">
              Voice Mode
            </h2>
          </div>
          
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Main content - Centered waveform and logo */}
        <div className="flex-1 py-6 flex flex-col items-center justify-center px-4">
          {/* Large Circular Waveform - Now with dynamic audio level for both user and AI */}
          <div className="mb-4">
            <CircularWaveform 
              isActive={isListening || isSpeaking || isProcessing} 
              isUserInput={isListening && !isSpeaking}
              audioLevel={isListening ? audioLevel : (isSpeaking ? Math.random() * 0.8 + 0.2 : 0)}
              size={isDesktop ? 180 : 150}
              className="mx-auto"
            />
          </div>
          
          {/* NOVA 1000 Logo */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-wider text-white mb-4">
            NOVA 1000<span className="text-sm sm:text-base align-top ml-1 text-gray-400">™</span>
          </h1>

          {/* Status Text */}
          <div className="text-center mb-6 min-h-[50px] flex flex-col items-center justify-center">
            {isProcessing ? (
              <div className="text-yellow-400 animate-pulse">
                <p className="text-lg mb-2">Processing...</p>
                <div className="flex justify-center space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : isSpeaking ? (
              <div className="text-cyan-400 animate-pulse">
                <p className="text-lg mb-2">NOVA 1000™ is speaking...</p>
                <div className="flex justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-cyan-400 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : isListening ? (
              <div className="text-emerald-400 animate-pulse">
                <p className="text-lg mb-2">{isUserSpeaking ? 'Voice detected...' : 'Listening...'}</p>
                <div className="flex justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-emerald-400 rounded-full animate-pulse"
                      style={{ 
                        animationDelay: `${i * 0.1}s`,
                        height: `${12 + audioLevel * 16}px`
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-gray-400">
                <p className="text-lg">Ready for voice interaction</p>
                <p className="text-sm mt-1">Tap the microphone to begin</p>
              </div>
            )}
          </div>

          {/* Voice Controls - INCREASED SPACING */}
          <div className="flex items-center justify-center space-x-16 relative mb-8">
            {/* Microphone permission status for iOS */}
            {!isDesktop && isIOS && permissionStatus === 'denied' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 text-center text-red-400 text-xs bg-slate-800/90 px-3 py-2 rounded-lg whitespace-nowrap">
                🎤 Microphone blocked.{' '}
                <a href="/mic-access" className="underline text-blue-300 hover:text-blue-400">
                  Tap here to enable
                </a>
              </div>
            )}

            {/* Voice Controls */}
            <VoiceControls
              onVoiceInput={handleVoiceInput}
              onSpeechStart={handleSpeechStart}
              onSpeechEnd={handleSpeechEnd}
              isListening={isListening}
              setIsListening={setIsListening}
              permissionStatusCallback={setPermissionStatus}
            />

            {/* Speaker Control */}
            <button
              type="button"
              onClick={speakLastResponse}
              disabled={!lastResponse}
              className={`p-3 rounded-full transition-all duration-300 ${
                isSpeaking
                  ? 'text-blue-400 bg-blue-500/20'
                  : lastResponse
                  ? 'text-gray-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60'
                  : 'text-gray-600 bg-slate-800/20 cursor-not-allowed'
              }`}
              title={isSpeaking ? 'Stop speaking' : 'Repeat last response'}
            >
              <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
            </button>
          </div>

          {/* Keyboard shortcuts hint for desktop */}
          {isDesktop && (
            <div className="text-center text-gray-500 text-xs">
              <p>Ctrl + Space to toggle voice • Escape to stop speaking</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 text-center py-2 text-gray-500 text-xs mobile-safe-bottom">
          <p>Pure Voice • Dimensional Integrity Engine</p>
        </div>
      </div>

      {/* Menu Overlay */}
      <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};