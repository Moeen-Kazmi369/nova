// src/hooks/useElevenLabsVoice.ts

import { useEffect, useRef, useState } from 'react';
import {
  elevenLabsHeaders,
  elevenLabsTTSURL
} from '@/config/elevenlabs';

interface UseElevenLabsVoiceOptions {
  text: string;
  voiceId: string;
  autoPlay?: boolean;
  onEnd?: () => void;
}

export function useElevenLabsVoice({
  text,
  voiceId,
  autoPlay = true,
  onEnd
}: UseElevenLabsVoiceOptions) {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchVoice = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(elevenLabsTTSURL(voiceId), {
          method: 'POST',
          headers: elevenLabsHeaders(),
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.7,
              similarity_boost: 0.8
            }
          })
        });

        if (!response.ok) {
          throw new Error(`TTS request failed: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setAudioSrc(url);
        setIsLoading(false);

        if (autoPlay && audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play().catch(console.error);

          audioRef.current.onended = () => {
            if (onEnd) onEnd();
          };
        }
      } catch (error) {
        console.error("ElevenLabs TTS Error:", error);
        setIsLoading(false);
      }
    };

    fetchVoice();
  }, [text, voiceId]);

  return {
    audioSrc,
    audioRef,
    isLoading
  };
}
