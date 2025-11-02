/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_API_URI: string;
  readonly VITE_ELEVEN_VOICE_ID: string;
  readonly VITE_ELEVEN_LAB_API_KEY: string;
  readonly VITE_ELEVEN_LAB_AGENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}