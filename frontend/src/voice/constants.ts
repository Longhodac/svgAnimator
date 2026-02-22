export const DG_URL =
  "wss://api.deepgram.com/v1/listen?model=nova-2&interim_results=true&smart_format=true&endpointing=150";

const env = import.meta.env as Record<string, string | undefined>;
const keyFromPrimary = env.VITE_DEEPGRAM_KEY;
const keyFromFallback = env.VITE_DEEPGRAM_API_KEY;
const rawApiKey = keyFromPrimary ?? keyFromFallback;

export const API_KEY =
  typeof rawApiKey === "string"
    ? rawApiKey.trim().replace(/^['"]|['"]$/g, "")
    : undefined;

export const API_KEY_SOURCE = keyFromPrimary
  ? "VITE_DEEPGRAM_KEY"
  : keyFromFallback
    ? "VITE_DEEPGRAM_API_KEY"
    : "none";

export const TIMESLICE_MS = 500;
export const MAX_LOGS = 20;

export const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
];

export function pickMime(): string | undefined {
  for (const m of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}
