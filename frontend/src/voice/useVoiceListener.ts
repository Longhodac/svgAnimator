import { useCallback, useRef, useState } from "react";
import type { Counters, Status, VoiceDiagnostics, VoiceErrorCode } from "./types";
import { ZERO_COUNTERS } from "./types";
import {
  API_KEY,
  API_KEY_SOURCE,
  pickMime,
  TIMESLICE_MS,
  MAX_LOGS,
} from "./constants";
import { emitVoiceFinal } from "./events";
import { useDeepgramVoice } from "./useDeepgramVoice";

export interface UseVoiceListenerResult {
  startListening: () => Promise<void>;
  stopListening: () => void;
  status: Status;
  error: string;
  errorCode: VoiceErrorCode;
  interim: string;
  finalText: string;
  sent: string;
  logs: string[];
  counters: Counters;
  chosenMime: string;
  recentDgMsgs: string[];
  diagnostics: VoiceDiagnostics;
  resetCounters: () => void;
  log: (msg: string) => void;
  onStopped?: () => void;
}

export function useVoiceListener(options?: {
  onStopped?: () => void;
}): UseVoiceListenerResult {
  const [status, setStatus] = useState<Status>("Idle");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<VoiceErrorCode>("none");
  const [stage, setStage] = useState<VoiceDiagnostics["stage"]>("idle");
  const [interim, setInterim] = useState("");
  const [finalText, setFinal] = useState("");
  const [sent, setSent] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [counters, setCounters] = useState<Counters>({ ...ZERO_COUNTERS });
  const [chosenMime, setChosenMime] = useState<string>("(not started)");
  const [recentDgMsgs, setRecentDgMsgs] = useState<string[]>([]);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const activeRef = useRef(false);
  const countersRef = useRef<Counters>({ ...ZERO_COUNTERS });
  // ★ Store options in a ref so callbacks are stable
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const log = useCallback((msg: string) => {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log("[DG-DEBUG]", msg);
    setLogs((prev) => [...prev.slice(-(MAX_LOGS - 1)), line]);
  }, []);

  const incCounter = useCallback((key: keyof Counters, amount = 1) => {
    countersRef.current = { ...countersRef.current, [key]: countersRef.current[key] + amount };
    setCounters({ ...countersRef.current });
  }, []);

  const resetCounters = useCallback(() => {
    countersRef.current = { ...ZERO_COUNTERS };
    setCounters({ ...ZERO_COUNTERS });
  }, []);

  const pushDgMsg = useCallback((raw: string) => {
    const truncated = raw.length > 200 ? raw.slice(0, 200) + "…" : raw;
    setRecentDgMsgs((prev) => [...prev.slice(-2), truncated]);
  }, []);

  const cleanup = useCallback(() => {
    activeRef.current = false;

    if (recorderRef.current) {
      try {
        recorderRef.current.stop();
      } catch {
        /* ok */
      }
      recorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        t.stop();
      });
      streamRef.current = null;
    }
  }, []);

  const { connect, disconnect: disconnectWs, sendChunk } = useDeepgramVoice({
    onOpen: () => {
      if (!activeRef.current || !streamRef.current) return;

      const stream = streamRef.current;
      const mime = pickMime();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      recorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data.size === 0) return;
        incCounter("chunksRecorded");
        incCounter("bytesRecorded", e.data.size);
        const buf = await e.data.arrayBuffer();
        sendChunk(buf);
        incCounter("chunksSent");
        incCounter("bytesSent", buf.byteLength);
      };

      recorder.onerror = () => { };
      recorder.start(TIMESLICE_MS);
      setStatus("Listening");
      setStage("listening");
    },
    onClose: () => {
      cleanup();
      setStatus((s) => (s === "Error" ? s : "Stopped"));
      setStage("stopped");
      optionsRef.current?.onStopped?.();
    },
    onError: (message) => {
      setError(message);
      setErrorCode("ws_error");
      setStatus("Error");
      setStage("error");
      cleanup();
    },
    onInterim: (text) => {
      incCounter("interimCount");
      setInterim(text);
    },
    onFinal: (text) => {
      incCounter("finalCount");
      setFinal((prev) => (prev ? prev + " " + text : text));
      setSent(text);
      emitVoiceFinal(text);
    },
    onMetadata: (requestId) => {
      void requestId; // logged via raw message
    },
    onRawMessage: (raw) => {
      pushDgMsg(raw);
      incCounter("dgMessages");
    },
  });

  const startListening = useCallback(async () => {
    if (activeRef.current) {
      return;
    }

    cleanup();
    activeRef.current = true;
    resetCounters();
    setRecentDgMsgs([]);
    setError("");
    setErrorCode("none");
    setInterim("");
    setFinal("");
    setStage("checking_key");

    if (!API_KEY) {
      setErrorCode("missing_key");
      setStage("error");
      setError(
        "Missing Deepgram key. Set VITE_DEEPGRAM_KEY in frontend/.env and restart the dev server."
      );
      setStatus("Error");
      activeRef.current = false;
      return;
    }
    setStatus("Connecting");
    setStage("requesting_mic");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!activeRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      const mime = pickMime();
      setChosenMime(mime ?? "(browser default)");

      setStage("connecting_ws");
      connect(API_KEY);
    } catch (err) {
      setErrorCode("mic_denied");
      setStage("error");
      setError("Mic permission denied: " + String(err));
      setStatus("Error");
      activeRef.current = false;
    }
  }, [cleanup, connect, resetCounters]);

  const stopListening = useCallback(() => {
    // Always attempt full cleanup, even if activeRef was already cleared
    activeRef.current = false;

    setStatus("Stopping");
    setStage("stopping");

    if (recorderRef.current) {
      try {
        if (recorderRef.current.state === "recording") {
          recorderRef.current.stop();
        }
      } catch {
        /* ok */
      }
      recorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    disconnectWs();
  }, [disconnectWs]);

  return {
    startListening,
    stopListening,
    status,
    error,
    errorCode,
    interim,
    finalText,
    sent,
    logs,
    counters,
    chosenMime,
    recentDgMsgs,
    diagnostics: {
      stage,
      errorCode,
      keyConfigured: Boolean(API_KEY),
      keySource: API_KEY_SOURCE,
    },
    resetCounters,
    log,
  };
}
