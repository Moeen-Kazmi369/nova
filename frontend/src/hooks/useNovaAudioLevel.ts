import { useEffect, useRef, useState } from 'react';

export function useNovaAudioLevel(audioElement: HTMLAudioElement | null) {
  const [audioLevel, setAudioLevel] = useState(0);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const dataArrayRef = useRef<Uint8Array>();

  useEffect(() => {
    if (!audioElement) return;

    const context = new AudioContext();
    const analyser = context.createAnalyser();
    const source = context.createMediaElementSource(audioElement);

    source.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 2048;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    const update = () => {
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      setAudioLevel(rms);

      animationRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      analyser.disconnect();
      source.disconnect();
      context.close();
    };
  }, [audioElement]);

  return audioLevel;
}
