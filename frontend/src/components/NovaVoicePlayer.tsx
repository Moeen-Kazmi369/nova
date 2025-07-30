import React, { useEffect, useRef, useState } from 'react';
import { CircularWaveform } from './CircularWaveform';
import { useNovaAudioLevel } from '../hooks/useNovaAudioLevel';

interface NovaVoicePlayerProps {
  audioSrc: string; // URL or Blob URL of the ElevenLabs-generated voice
}

export const NovaVoicePlayer: React.FC<NovaVoicePlayerProps> = ({ audioSrc }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const audioLevel = useNovaAudioLevel(audioElement);

  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current);
      audioRef.current.play().catch(console.error);
    }
  }, [audioSrc]);

  return (
    <div className="relative w-[220px] h-[220px]">
      <audio ref={audioRef} src={audioSrc} />
      <CircularWaveform 
        isActive={true}
        isUserInput={false}
        audioLevel={audioLevel}
        size={220}
      />
    </div>
  );
};
