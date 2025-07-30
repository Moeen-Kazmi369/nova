export const forceIOSSpeechPriming = () => {
  if (typeof window === 'undefined') return;

  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance("Priming voice");

  utterance.volume = 0;
  utterance.rate = 1;
  utterance.pitch = 1;

  // Play a silent utterance to trigger permission
  synth.speak(utterance);
};
