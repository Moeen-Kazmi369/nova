// resumeAudioContext.ts
let audioCtx: AudioContext | null = null;

export function resumeAudioContext(): Promise<void> {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    return audioCtx.resume();
  }
  return Promise.resolve();
}
