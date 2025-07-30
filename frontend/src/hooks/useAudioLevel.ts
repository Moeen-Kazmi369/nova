import { useEffect, useState, useRef, useCallback } from 'react';

export function useAudioLevel(isListeningFromApp: boolean = false) {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Speech synthesis audio analysis
  const speechAnalyserRef = useRef<AnalyserNode | null>(null);
  const speechDataArrayRef = useRef<Uint8Array | null>(null);
  const speechRafRef = useRef<number | null>(null);
  const speechAudioContextRef = useRef<AudioContext | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (speechRafRef.current) {
      cancelAnimationFrame(speechRafRef.current);
      speechRafRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (speechAnalyserRef.current) {
      speechAnalyserRef.current.disconnect();
      speechAnalyserRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (speechAudioContextRef.current && speechAudioContextRef.current.state !== 'closed') {
      speechAudioContextRef.current.close();
      speechAudioContextRef.current = null;
    }
    setAudioLevel(0);
    setIsUserSpeaking(false);
  }, []);

  // Effect to handle microphone access based on isListeningFromApp
  useEffect(() => {
    if (!isListeningFromApp) {
      cleanup();
      return;
    }

    const initMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);
        
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
        sourceRef.current = source;
        streamRef.current = stream;
        audioContextRef.current = audioContext;

        const update = () => {
          if (!analyserRef.current || !dataArrayRef.current) return;
          
          analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            const val = (dataArrayRef.current[i] - 128) / 128;
            sum += val * val;
          }
          const rms = Math.sqrt(sum / dataArrayRef.current.length);
          setAudioLevel(rms);
          setIsUserSpeaking(rms > 0.01); // Threshold for detecting user speech
          
          if (isListeningFromApp) {
            rafRef.current = requestAnimationFrame(update);
          }
        };

        update();
      } catch (error) {
        console.error('Mic access error', error);
      }
    };

    initMic();

    return cleanup;
  }, [isListeningFromApp, cleanup]);

  const speakWithAnalysis = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);

      // Set up real-time audio analysis for speech synthesis
      const setupSpeechAnalysis = async () => {
        try {
          // Create dedicated audio context for speech analysis
          const speechContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          speechAudioContextRef.current = speechContext;
          
          // Try to capture system audio for real speech analysis
          try {
            // Request screen capture with audio to get system audio
            const stream = await navigator.mediaDevices.getDisplayMedia({ 
              audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
              },
              video: false 
            });
            
            const source = speechContext.createMediaStreamSource(stream);
            const analyser = speechContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.3;
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            source.connect(analyser);
            speechAnalyserRef.current = analyser;
            speechDataArrayRef.current = dataArray;
            
            const analyzeSpeech = () => {
              if (!speechAnalyserRef.current || !speechDataArrayRef.current || !isSpeaking) return;
              
              speechAnalyserRef.current.getByteTimeDomainData(speechDataArrayRef.current);
              let sum = 0;
              for (let i = 0; i < speechDataArrayRef.current.length; i++) {
                const val = (speechDataArrayRef.current[i] - 128) / 128;
                sum += val * val;
              }
              const rms = Math.sqrt(sum / speechDataArrayRef.current.length);
              
              // Scale and smooth the audio level for better visualization
              const scaledLevel = Math.min(1, rms * 3);
              setAudioLevel(scaledLevel);
              
              speechRafRef.current = requestAnimationFrame(analyzeSpeech);
            };
            
            analyzeSpeech();
            
            // Clean up when speech ends
            utterance.onend = () => {
              stream.getTracks().forEach(track => track.stop());
              if (speechRafRef.current) {
                cancelAnimationFrame(speechRafRef.current);
                speechRafRef.current = null;
              }
              if (speechAudioContextRef.current) {
                speechAudioContextRef.current.close();
                speechAudioContextRef.current = null;
              }
              setIsSpeaking(false);
              setAudioLevel(0);
              resolve();
            };
            
          } catch (captureError) {
            console.log('System audio capture not available, using enhanced simulation');
            enhancedSpeechSimulation();
          }
          
        } catch (error) {
          console.log('Audio context creation failed, using enhanced simulation');
          enhancedSpeechSimulation();
        }
      };

      // Enhanced realistic speech simulation
      const enhancedSpeechSimulation = () => {
        const words = text.split(' ');
        const speechDuration = text.length * 80; // Approximate speech duration
        const startTime = Date.now();
        
        const simulateAudio = () => {
          if (!isSpeaking) return;
          
          const elapsed = Date.now() - startTime;
          const progress = elapsed / speechDuration;
          
          // Create realistic speech patterns with multiple layers
          const baseLevel = 0.4 + Math.random() * 0.2; // Base speech level
          const wordRhythm = Math.sin(progress * Math.PI * words.length * 2) * 0.25; // Word rhythm
          const sentenceFlow = Math.sin(progress * Math.PI * 3) * 0.15; // Sentence flow
          const breathPattern = Math.sin(progress * Math.PI * 1.5) * 0.1; // Breathing
          const microVariation = (Math.random() - 0.5) * 0.1; // Natural variation
          
          // Add emphasis patterns for natural speech
          const emphasisPattern = Math.sin(progress * Math.PI * 8) * 0.1;
          
          // Simulate pauses and emphasis
          let pauseMultiplier = 1;
          if (text.includes('.') || text.includes(',') || text.includes('!') || text.includes('?')) {
            const punctuationPattern = Math.sin(progress * Math.PI * 6) * 0.2;
            pauseMultiplier = 0.8 + punctuationPattern;
          }
          
          const finalLevel = Math.max(0.05, 
            (baseLevel + wordRhythm + sentenceFlow + breathPattern + microVariation + emphasisPattern) * pauseMultiplier
          );
          
          setAudioLevel(Math.min(1, finalLevel));
          
          speechRafRef.current = requestAnimationFrame(simulateAudio);
        };
        
        simulateAudio();
      };

      utterance.onstart = () => {
        setIsSpeaking(true);
        setupSpeechAnalysis();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        if (speechRafRef.current) {
          cancelAnimationFrame(speechRafRef.current);
          speechRafRef.current = null;
        }
        if (speechAudioContextRef.current) {
          speechAudioContextRef.current.close();
          speechAudioContextRef.current = null;
        }
        setAudioLevel(0);
        resolve();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        if (speechRafRef.current) {
          cancelAnimationFrame(speechRafRef.current);
          speechRafRef.current = null;
        }
        if (speechAudioContextRef.current) {
          speechAudioContextRef.current.close();
          speechAudioContextRef.current = null;
        }
        setAudioLevel(0);
        resolve();
      };

      synth.speak(utterance);
    });
  }, [isSpeaking]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (speechRafRef.current) {
      cancelAnimationFrame(speechRafRef.current);
      speechRafRef.current = null;
    }
    if (speechAudioContextRef.current) {
      speechAudioContextRef.current.close();
      speechAudioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  return {
    audioLevel,
    isSpeaking,
    isUserSpeaking,
    speakWithAnalysis,
    stopSpeaking
  };
}