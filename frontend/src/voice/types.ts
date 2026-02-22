export type Status =
  | "Idle"
  | "Connecting"
  | "Listening"
  | "Stopping"
  | "Stopped"
  | "Error";

export type VoiceStage =
  | "idle"
  | "checking_key"
  | "requesting_mic"
  | "connecting_ws"
  | "listening"
  | "stopping"
  | "stopped"
  | "error";

export type VoiceErrorCode =
  | "none"
  | "missing_key"
  | "mic_denied"
  | "ws_error"
  | "unknown";

export interface Counters {
  chunksRecorded: number;
  bytesRecorded: number;
  chunksSent: number;
  bytesSent: number;
  dgMessages: number;
  interimCount: number;
  finalCount: number;
}

export interface VoiceDiagnostics {
  stage: VoiceStage;
  errorCode: VoiceErrorCode;
  keyConfigured: boolean;
  keySource: "VITE_DEEPGRAM_KEY" | "VITE_DEEPGRAM_API_KEY" | "none";
}

export const ZERO_COUNTERS: Counters = {
  chunksRecorded: 0,
  bytesRecorded: 0,
  chunksSent: 0,
  bytesSent: 0,
  dgMessages: 0,
  interimCount: 0,
  finalCount: 0,
};
