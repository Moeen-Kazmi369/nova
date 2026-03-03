import React, { useEffect, useRef, useState } from 'react';
import { CircularWaveform } from './CircularWaveform';
import { useNovaAudioLevel } from '../hooks/useNovaAudioLevel';

export const NovaVoicePlayer= ({ audioSrc }) => {
  const audioRef = useRef(null);
  const [audioElement, setAudioElement] = useState(null);
  const audioLevel = useNovaAudioLevel(audioElement);

  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current);
      audioRef.current.play().catch(console.error);
    }
  }, [audioSrc]);

  const isMobile = window.innerWidth < 768;

  return (
    <div className={`relative ${isMobile ? 'w-[250px] h-[250px]' : 'w-[220px] h-[220px]'}`}>
      <audio ref={audioRef} src={audioSrc} />
      <CircularWaveform 
        isActive={true}
        isUserInput={false}
        audioLevel={audioLevel}
        size={isMobile ? 250 : 220}
      />
    </div>
  );
};
