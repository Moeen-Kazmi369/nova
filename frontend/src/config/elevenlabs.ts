// src/config/elevenlabs.ts

export function getElevenLabsApiKey(): string {
  const key = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error("Missing ElevenLabs API key. Add VITE_ELEVENLABS_API_KEY to your .env.local");
  }
  return key;
}

export function elevenLabsHeaders(): HeadersInit {
  return {
    'xi-api-key': getElevenLabsApiKey(),
    'Content-Type': 'application/json',
    'Accept': 'audio/mpeg'
  };
}

export function elevenLabsTTSURL(voiceId: string): string {
  return `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
}
