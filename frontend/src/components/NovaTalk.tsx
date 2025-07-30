import React from 'react';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { CircularWaveform } from '@/components/CircularWaveform';
import { useNovaAudioLevel } from '@/hooks/useNovaAudioLevel';

interface NovaTalkProps {
  text: string;
  voiceId: string;
  apiKey: string;
  size?: number;
  onEnd?: () => void;
}

export const NovaTalk: React.FC<NovaTalkProps> = ({
  text,
  voiceId,
  apiKey,
  size = 220,
  onEnd
}) => {
  const { audioSrc, audioRef, isLoading } = useElevenLabsVoice({
    text,
    voiceId,
    autoPlay: true,
    onEnd
  });

  const audioLevel = useNovaAudioLevel(audioRef.current);

  return (
    <div className="relative w-fit">
      <audio ref={audioRef} />
      <CircularWaveform
        isActive={!!audioSrc}
        isUserInput={false}
        audioLevel={audioLevel}
        size={size}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-blue-300 animate-pulse">
          Generating...
        </div>
      )}
    </div>
  );
};
