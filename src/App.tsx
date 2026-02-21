import { useCallback, useEffect, useRef, useState } from "react";

type Status = "Idle" | "Connecting" | "Listening" | "Stopping" | "Stopped" | "Error";

const DG_URL =
  "wss://api.deepgram.com/v1/listen?model=nova-2&interim_results=true&smart_format=true&endpointing=150";
const API_KEY = import.meta.env.VITE_DEEPGRAM_KEY as string | undefined;
const TIMESLICE_MS = 500;
const MAX_LOGS = 20;
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const LLM_SYSTEM_PROMPT =
  "You are a concise, friendly voice assistant. Keep replies under 20 words unless the user explicitly asks for more.";
const LLM_FALLBACK_REPLY = "Got it. What would you like next?";
const MAX_CHAT_MSGS = 6;
const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
];

function pickMime(): string | undefined {
  for (const m of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

function buildReply(template: string, finalText: string): string {
  return template.replace("{text}", finalText);
}

function wsStateLabel(ws: WebSocket | null): string {
  if (!ws) return "null";
  return (
    { [WebSocket.CONNECTING]: "CONNECTING", [WebSocket.OPEN]: "OPEN",
      [WebSocket.CLOSING]: "CLOSING", [WebSocket.CLOSED]: "CLOSED" }[ws.readyState] ?? String(ws.readyState)
  );
}

interface Counters {
  chunksRecorded: number;
  bytesRecorded: number;
  chunksSent: number;
  bytesSent: number;
  dgMessages: number;
  interimCount: number;
  finalCount: number;
}

const ZERO_COUNTERS: Counters = {
  chunksRecorded: 0, bytesRecorded: 0,
  chunksSent: 0, bytesSent: 0,
  dgMessages: 0, interimCount: 0, finalCount: 0,
};

type LlmStatus = "Off" | "Calling" | "Success" | "Failed";

interface ChatMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

export default function App() {
  const [status, setStatus] = useState<Status>("Idle");
  const [error, setError] = useState("");
  const [interim, setInterim] = useState("");
  const [final_, setFinal] = useState("");
  const [sent, setSent] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [counters, setCounters] = useState<Counters>(ZERO_COUNTERS);
  const [chosenMime, setChosenMime] = useState<string>("(not started)");
  const [recentDgMsgs, setRecentDgMsgs] = useState<string[]>([]);

  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [voiceMode, setVoiceMode] = useState<"deepgram" | "browser">("deepgram");
  const [replyTemplate, setReplyTemplate] = useState("Got it — {text}");
  const [lastReplySpoken, setLastReplySpoken] = useState("");

  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [llmStatus, setLlmStatus] = useState<LlmStatus>("Off");
  const [llmCooldown, setLlmCooldown] = useState(1200);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(false);
  const countersRef = useRef<Counters>({ ...ZERO_COUNTERS });

  const ttsEnabledRef = useRef(false);
  const voiceModeRef = useRef<"deepgram" | "browser">("deepgram");
  const replyTemplateRef = useRef("Got it — {text}");
  const ttsAbortRef = useRef<AbortController | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsQueueRef = useRef<string | null>(null);

  const chatHistoryRef = useRef<ChatMsg[]>([]);
  const llmAbortRef = useRef<AbortController | null>(null);
  const convEndRef = useRef<HTMLDivElement | null>(null);
  const llmCooldownRef = useRef(1200);
  const lastFinalTextSentRef = useRef("");
  const lastLLMCallAtRef = useRef(0);
  const llmInFlightRef = useRef(false);

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

  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { replyTemplateRef.current = replyTemplate; }, [replyTemplate]);
  useEffect(() => { llmCooldownRef.current = llmCooldown; }, [llmCooldown]);

  useEffect(() => {
    convEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // voice:final listener
  useEffect(() => {
    const handler = (e: Event) =>
      console.log("TEAM_EVENT_RECEIVED:", (e as CustomEvent).detail);
    window.addEventListener("voice:final", handler);
    return () => window.removeEventListener("voice:final", handler);
  }, []);

  const sendToTeammate = useCallback(
    (text: string) => {
      console.log("FINAL_TO_TEAM:", text);
      setSent(text);
      window.dispatchEvent(new CustomEvent("voice:final", { detail: text }));
      log(`>>> Sent to teammate: "${text}"`);
    },
    [log],
  );

  // --- TTS ---

  const cancelTts = useCallback(() => {
    if (ttsAbortRef.current) {
      ttsAbortRef.current.abort();
      ttsAbortRef.current = null;
    }
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
      ttsAudioRef.current = null;
    }
    window.speechSynthesis.cancel();
  }, []);

  const speakBrowserTts = useCallback((text: string) => {
    log("TTS: speaking (mode=browser)");
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utt);
    setLastReplySpoken(text);
  }, [log]);

  const speakDeepgramTts = useCallback(async (text: string) => {
    if (!API_KEY) {
      log("TTS: no API key, falling back to Browser TTS");
      speakBrowserTts(text);
      return;
    }
    log("TTS: attempting Deepgram");
    const abort = new AbortController();
    ttsAbortRef.current = abort;

    try {
      const resp = await fetch(
        "https://api.deepgram.com/v1/speak?model=aura-2-thalia-en",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
          signal: abort.signal,
        },
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const buf = await resp.arrayBuffer();
      log(`TTS: Deepgram success (bytes=${buf.byteLength})`);

      const blob = new Blob([buf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      ttsAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (ttsAudioRef.current === audio) ttsAudioRef.current = null;
      };

      await audio.play();
      setLastReplySpoken(text);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        log("TTS: Deepgram fetch aborted");
        return;
      }
      log(`TTS: Deepgram failed, falling back to Browser TTS: ${err}`);
      speakBrowserTts(text);
    }
  }, [log, speakBrowserTts]);

  const speakReply = useCallback((text: string) => {
    cancelTts();
    if (voiceModeRef.current === "browser") {
      speakBrowserTts(text);
    } else {
      speakDeepgramTts(text);
    }
  }, [cancelTts, speakBrowserTts, speakDeepgramTts]);

  const handleFinalForTts = useCallback((finalText: string) => {
    if (!ttsEnabledRef.current) return;
    const reply = buildReply(replyTemplateRef.current, finalText);
    if (!reply.trim()) return;

    cancelTts();

    if (activeRef.current) {
      log(`TTS: queued (mic active): "${reply}"`);
      ttsQueueRef.current = reply;
    } else {
      speakReply(reply);
    }
  }, [cancelTts, log, speakReply]);

  const flushTtsQueue = useCallback(() => {
    const queued = ttsQueueRef.current;
    ttsQueueRef.current = null;
    if (queued && ttsEnabledRef.current) {
      log(`TTS: playing queued reply: "${queued}"`);
      speakReply(queued);
    }
  }, [log, speakReply]);

  // --- LLM ---

  const appendChatMsg = useCallback((role: "user" | "assistant", content: string) => {
    const updated = [...chatHistoryRef.current, { role, content } as ChatMsg].slice(-MAX_CHAT_MSGS);
    chatHistoryRef.current = updated;
    setChatHistory(updated);
  }, []);

  const handleFinalForLlm = useCallback(async (finalText: string) => {
    appendChatMsg("user", finalText);

    if (!GEMINI_KEY) return;

    const trimmed = finalText.trim();
    if (!trimmed) { log("LLM: skipped (empty)"); return; }
    if (trimmed === lastFinalTextSentRef.current) { log("LLM: skipped (duplicate)"); return; }
    if (Date.now() - lastLLMCallAtRef.current < llmCooldownRef.current) {
      log(`LLM: skipped (cooldown ${llmCooldownRef.current}ms)`);
      return;
    }
    if (llmInFlightRef.current) { log("LLM: skipped (inFlight)"); return; }

    lastFinalTextSentRef.current = trimmed;
    lastLLMCallAtRef.current = Date.now();
    llmInFlightRef.current = true;

    if (llmAbortRef.current) llmAbortRef.current.abort();
    const abort = new AbortController();
    llmAbortRef.current = abort;

    setLlmStatus("Calling");
    log("LLM: calling Gemini (gemini-2.5-flash)…");

    let reply: string;
    try {
      const contents = chatHistoryRef.current.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: LLM_SYSTEM_PROMPT }] },
            contents,
          }),
          signal: abort.signal,
        },
      );

      if (!resp.ok) {
        const errBody = await resp.text().catch(() => "");
        throw new Error(`HTTP ${resp.status}: ${errBody.slice(0, 300)}`);
      }

      const data = await resp.json();
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!reply.trim()) {
        log(`LLM: unexpected response shape: ${JSON.stringify(data).slice(0, 200)}`);
        reply = LLM_FALLBACK_REPLY;
      }

      setLlmStatus("Success");
      log(`LLM: success: "${reply}"`);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        log("LLM: aborted (newer request)");
        llmInFlightRef.current = false;
        return;
      }
      log(`LLM: failed: ${err}`);
      reply = LLM_FALLBACK_REPLY;
      setLlmStatus("Failed");
    }

    llmInFlightRef.current = false;

    appendChatMsg("assistant", reply);

    if (ttsEnabledRef.current) {
      cancelTts();
      if (activeRef.current) {
        log(`TTS: queued LLM reply (mic active): "${reply}"`);
        ttsQueueRef.current = reply;
      } else {
        speakReply(reply);
      }
    }
  }, [appendChatMsg, cancelTts, log, speakReply]);

  // --- cleanup / stop / start ---

  const cleanup = useCallback(() => {
    activeRef.current = false;

    if (recorderRef.current) {
      log(`Stopping MediaRecorder (state=${recorderRef.current.state})`);
      try { recorderRef.current.stop(); } catch { /* ok */ }
      recorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        log(`Stopping track ${t.kind} ${t.label}`);
        t.stop();
      });
      streamRef.current = null;
    }

    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      log(`Closing WebSocket (state=${wsStateLabel(ws)})`);
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      try { ws.close(); } catch { /* ok */ }
    }
  }, [log]);

  const gracefulStop = useCallback(() => {
    if (!activeRef.current && !wsRef.current) return;

    setStatus("Stopping");
    log("Stop requested");

    // Stop recorder first
    if (recorderRef.current?.state === "recording") {
      try { recorderRef.current.stop(); } catch { /* ok */ }
    }
    recorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      log("Sending CloseStream to Deepgram");
      try { ws.send(JSON.stringify({ type: "CloseStream" })); } catch { /* ok */ }
      // Give Deepgram a moment to send final results before closing
      setTimeout(() => {
        log("Closing WebSocket after CloseStream delay");
        wsRef.current = null;
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        try { ws.close(); } catch { /* ok */ }
        activeRef.current = false;
        setStatus((s) => (s === "Error" ? s : "Stopped"));
        flushTtsQueue();
      }, 150);
    } else {
      cleanup();
      setStatus((s) => (s === "Error" ? s : "Stopped"));
      flushTtsQueue();
    }
  }, [cleanup, log, flushTtsQueue]);

  const start = useCallback(async () => {
    if (activeRef.current) {
      log("Start ignored — already active");
      return;
    }
    cleanup();
    cancelTts();
    ttsQueueRef.current = null;
    activeRef.current = true;
    resetCounters();
    setRecentDgMsgs([]);

    setError("");
    setInterim("");
    log("--- Starting new session ---");

    if (!API_KEY) {
      log("ERROR: No API key found in VITE_DEEPGRAM_KEY");
      setError("Set VITE_DEEPGRAM_KEY in your .env file and restart the dev server.");
      setStatus("Error");
      activeRef.current = false;
      return;
    }
    log(`API key present (${API_KEY.length} chars, ends …${API_KEY.slice(-4)})`);

    setStatus("Connecting");

    // Acquire mic
    log("Requesting mic permission…");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      log(`Mic denied: ${err}`);
      setError("Mic permission denied: " + String(err));
      setStatus("Error");
      activeRef.current = false;
      return;
    }

    if (!activeRef.current) {
      log("Released during mic prompt — aborting");
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];
    log(`Mic granted: ${audioTrack.label} (${audioTrack.getSettings().sampleRate ?? "?"}Hz)`);
    streamRef.current = stream;

    // Pick mime
    const mime = pickMime();
    setChosenMime(mime ?? "(browser default)");
    log(`MediaRecorder mime: ${mime ?? "(default)"}`);

    // Open WebSocket
    log("Opening WebSocket to Deepgram…");
    const ws = new WebSocket(DG_URL, ["token", API_KEY]);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      if (!activeRef.current) {
        log("WS opened but session cancelled — closing");
        ws.close();
        return;
      }
      log("WebSocket OPEN");
      setStatus("Listening");

      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      recorderRef.current = recorder;
      log(`MediaRecorder created (mimeType=${recorder.mimeType}, timeslice=${TIMESLICE_MS}ms)`);

      recorder.ondataavailable = async (e) => {
        if (e.data.size === 0) return;
        incCounter("chunksRecorded");
        incCounter("bytesRecorded", e.data.size);

        const buf = await e.data.arrayBuffer();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(buf);
          incCounter("chunksSent");
          incCounter("bytesSent", buf.byteLength);
        } else {
          log(`Chunk dropped — WS state=${wsStateLabel(ws)}`);
        }
      };

      recorder.onerror = (ev) => log(`MediaRecorder error: ${ev}`);
      recorder.start(TIMESLICE_MS);
      log("MediaRecorder started");
    };

    ws.onmessage = (e) => {
      incCounter("dgMessages");
      const raw = typeof e.data === "string" ? e.data : "(binary)";
      pushDgMsg(raw);

      try {
        const msg = JSON.parse(raw);

        if (msg.type === "Metadata") {
          log(`DG Metadata: request_id=${msg.request_id ?? msg.metadata?.request_id}`);
          return;
        }
        if (msg.error) {
          log(`DG error: ${msg.error}`);
          setError(`Deepgram: ${msg.error}`);
          return;
        }

        const alt = msg?.channel?.alternatives?.[0];
        const text = (alt?.transcript || "").trim();
        const confidence = alt?.confidence ?? "?";

        if (!text) return;

        if (msg.is_final) {
          incCounter("finalCount");
          log(`FINAL (conf=${confidence}): "${text}"`);
          setFinal((prev) => (prev ? prev + " " + text : text));
          sendToTeammate(text);
          if (GEMINI_KEY) {
            handleFinalForLlm(text);
          } else {
            handleFinalForTts(text);
          }
        } else {
          incCounter("interimCount");
          setInterim(text);
        }
      } catch {
        log(`DG non-JSON: ${raw.slice(0, 80)}`);
      }
    };

    ws.onerror = (ev) => {
      log(`WebSocket error: ${ev}`);
      setError("WebSocket error — check API key and network.");
      setStatus("Error");
      cleanup();
    };

    ws.onclose = (ev) => {
      log(`WebSocket closed: code=${ev.code} reason="${ev.reason}"`);
      if (ev.code !== 1000 && ev.code !== 1005) {
        setError(`WebSocket closed: ${ev.code} ${ev.reason}`);
        setStatus("Error");
      }
      cleanup();
    };
  }, [cleanup, cancelTts, resetCounters, log, incCounter, pushDgMsg, sendToTeammate, handleFinalForTts, handleFinalForLlm]);

  // --- Diagnostic helpers ---

  const checkMic = useCallback(async () => {
    log("Checking mic permission…");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      const t = s.getAudioTracks()[0];
      log(`Mic OK: ${t.label}, sampleRate=${t.getSettings().sampleRate ?? "?"}`);
      s.getTracks().forEach((tr) => tr.stop());
    } catch (err) {
      log(`Mic FAILED: ${err}`);
    }
  }, [log]);

  const checkWs = useCallback(async () => {
    if (!API_KEY) {
      log("No API key — cannot test WS");
      return;
    }
    log("Testing WS auth (no audio)…");
    const ws = new WebSocket(DG_URL, ["token", API_KEY]);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => {
      log("Test WS OPEN — auth works! Closing…");
      ws.send(JSON.stringify({ type: "CloseStream" }));
      setTimeout(() => ws.close(), 150);
    };
    ws.onmessage = (e) => {
      const raw = typeof e.data === "string" ? e.data : "(binary)";
      log(`Test WS msg: ${raw.slice(0, 120)}`);
    };
    ws.onerror = () => log("Test WS ERROR — bad key or network");
    ws.onclose = (ev) => log(`Test WS closed: code=${ev.code}`);
  }, [log]);

  // --- Pointer handlers ---

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      start();
    },
    [start],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      gracefulStop();
    },
    [gracefulStop],
  );

  const busy = status === "Connecting" || status === "Stopping";

  return (
    <div style={S.root}>
      <h1 style={S.title}>Deepgram Mic Test</h1>

      {/* --- Action buttons --- */}
      <div style={S.row}>
        <button onClick={checkMic} style={S.smallBtn}>Check Mic</button>
        <button onClick={checkWs} style={S.smallBtn}>Connect WS Only</button>
      </div>

      <button
        onPointerDown={busy ? undefined : onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        disabled={busy}
        style={{
          ...S.btn,
          background: busy ? "#95a5a6" : status === "Listening" ? "#e74c3c" : "#2ecc71",
          touchAction: "none",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? status + "…" : "Hold to Talk"}
      </button>

      <p style={S.status}>Status: <strong>{status}</strong></p>
      {error && <p style={S.error}>{error}</p>}

      {/* --- Transcript panels --- */}
      <Panel title="Interim" text={interim} color="#555" />
      <Panel title="Final" text={final_} color="#2c3e50" />
      <Panel title="Sent to teammate" text={sent} color="#8e44ad" />

      {/* --- Voice Reply (TTS) --- */}
      <div style={S.voiceReply}>
        <strong style={{ color: "#16a085" }}>Voice Reply</strong>
        <div style={S.vRow}>
          <label style={S.checkLabel}>
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={(e) => setTtsEnabled(e.target.checked)}
            />
            Enable Talk Back
          </label>
          <select
            value={voiceMode}
            onChange={(e) => setVoiceMode(e.target.value as "deepgram" | "browser")}
            style={S.select}
            disabled={!ttsEnabled}
          >
            <option value="deepgram">Deepgram TTS (REST)</option>
            <option value="browser">Browser TTS fallback</option>
          </select>
        </div>
        <div style={S.vRow}>
          <label style={S.tplLabel}>Reply template:</label>
          <input
            type="text"
            value={replyTemplate}
            onChange={(e) => setReplyTemplate(e.target.value)}
            style={S.tplInput}
            disabled={!ttsEnabled}
          />
        </div>
        {lastReplySpoken && (
          <div style={{ marginTop: 6, fontSize: 12, color: "#888" }}>
            Last reply spoken: &ldquo;{lastReplySpoken}&rdquo;
          </div>
        )}
      </div>

      {/* --- Conversation (LLM) --- */}
      <div style={S.conversation}>
        <div style={S.convHeader}>
          <strong style={{ color: "#2980b9" }}>Conversation</strong>
          <span style={{
            ...S.llmBadge,
            background: !GEMINI_KEY ? "#95a5a6"
              : llmStatus === "Calling" ? "#f39c12"
              : llmStatus === "Success" ? "#27ae60"
              : llmStatus === "Failed" ? "#e74c3c"
              : "#bdc3c7",
          }}>
            {!GEMINI_KEY ? "LLM Disabled (No API Key)" : `LLM: ${llmStatus}`}
          </span>
        </div>
        <div style={S.vRow}>
          <label style={S.tplLabel}>LLM Cooldown (ms):</label>
          <input
            type="number"
            value={llmCooldown}
            onChange={(e) => setLlmCooldown(Math.max(0, Number(e.target.value) || 0))}
            style={{ ...S.tplInput, maxWidth: 80 }}
            min={0}
            step={100}
          />
        </div>
        <div style={S.convBody}>
          {chatHistory.length === 0 && (
            <div style={{ color: "#aaa", fontSize: 12 }}>No messages yet</div>
          )}
          {chatHistory.map((m, i) => (
            <div key={i} style={{
              ...S.chatBubble,
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#d5f5e3" : "#d6eaf8",
            }}>
              <span style={S.chatRole}>{m.role === "user" ? "You" : "Assistant"}</span>
              <span>{m.content}</span>
            </div>
          ))}
          <div ref={convEndRef} />
        </div>
      </div>

      {/* --- Diagnostics --- */}
      <details open style={S.details}>
        <summary style={S.summary}>Diagnostics</summary>

        <div style={S.diagGrid}>
          <span style={S.diagLabel}>Platform</span>
          <span style={S.diagVal}>{navigator.platform}</span>
          <span style={S.diagLabel}>UserAgent</span>
          <span style={S.diagVal}>{navigator.userAgent.slice(0, 80)}…</span>
          <span style={S.diagLabel}>Mime</span>
          <span style={S.diagVal}>{chosenMime}</span>
          <span style={S.diagLabel}>Timeslice</span>
          <span style={S.diagVal}>{TIMESLICE_MS}ms</span>
          <span style={S.diagLabel}>LLM Model</span>
          <span style={S.diagVal}>gemini-2.5-flash</span>
          <span style={S.diagLabel}>LLM Cooldown</span>
          <span style={S.diagVal}>{llmCooldown}ms</span>
        </div>

        <div style={S.diagGrid}>
          <span style={S.diagLabel}>Chunks rec'd</span>
          <span style={S.diagVal}>{counters.chunksRecorded}</span>
          <span style={S.diagLabel}>Bytes rec'd</span>
          <span style={S.diagVal}>{counters.bytesRecorded.toLocaleString()}</span>
          <span style={S.diagLabel}>Chunks sent</span>
          <span style={S.diagVal}>{counters.chunksSent}</span>
          <span style={S.diagLabel}>Bytes sent</span>
          <span style={S.diagVal}>{counters.bytesSent.toLocaleString()}</span>
          <span style={S.diagLabel}>DG msgs</span>
          <span style={S.diagVal}>{counters.dgMessages}</span>
          <span style={S.diagLabel}>Interims</span>
          <span style={S.diagVal}>{counters.interimCount}</span>
          <span style={S.diagLabel}>Finals</span>
          <span style={S.diagVal}>{counters.finalCount}</span>
        </div>

        {recentDgMsgs.length > 0 && (
          <div style={S.msgBox}>
            <strong>Last {recentDgMsgs.length} DG message(s):</strong>
            {recentDgMsgs.map((m, i) => (
              <pre key={i} style={S.pre}>{m}</pre>
            ))}
          </div>
        )}

        <div style={S.logBox}>
          <strong>Debug log (last {MAX_LOGS}):</strong>
          {logs.map((l, i) => (
            <div key={i} style={S.logLine}>{l}</div>
          ))}
          {logs.length === 0 && <div style={S.logLine}>(empty — press a button)</div>}
        </div>
      </details>
    </div>
  );
}

function Panel({ title, text, color }: { title: string; text: string; color: string }) {
  return (
    <div style={{ ...S.panel, borderColor: color }}>
      <strong style={{ color }}>{title}</strong>
      <div style={S.panelText}>{text || "—"}</div>
    </div>
  );
}

// ---------- styles ----------

const S: Record<string, React.CSSProperties> = {
  root: {
    maxWidth: 600,
    margin: "1.5rem auto",
    fontFamily: "system-ui, sans-serif",
    padding: "0 1rem",
    fontSize: 14,
  },
  title: { textAlign: "center", marginBottom: "1rem" },
  row: { display: "flex", gap: 8, marginBottom: 8 },
  smallBtn: {
    flex: 1,
    padding: "8px 0",
    fontSize: 13,
    borderRadius: 6,
    border: "1px solid #bbb",
    background: "#f5f5f5",
    cursor: "pointer",
  },
  btn: {
    display: "block",
    width: "100%",
    padding: "14px 0",
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  status: { textAlign: "center", marginTop: 8, marginBottom: 0 },
  error: { color: "#e74c3c", textAlign: "center", fontWeight: 600, marginTop: 4 },
  panel: {
    border: "2px solid",
    borderRadius: 8,
    padding: "8px 12px",
    marginTop: 10,
  },
  panelText: { marginTop: 4, minHeight: 20, whiteSpace: "pre-wrap" },
  details: { marginTop: 16, border: "1px solid #ddd", borderRadius: 8, padding: 10 },
  summary: { cursor: "pointer", fontWeight: 700, fontSize: 15 },
  diagGrid: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: "2px 12px",
    marginTop: 8,
    fontSize: 12,
  },
  diagLabel: { fontWeight: 600, color: "#666" },
  diagVal: { fontFamily: "monospace", wordBreak: "break-all" as const },
  msgBox: { marginTop: 10, fontSize: 11 },
  pre: {
    background: "#f0f0f0",
    padding: "4px 6px",
    borderRadius: 4,
    fontSize: 10,
    whiteSpace: "pre-wrap",
    wordBreak: "break-all" as const,
    margin: "3px 0",
    maxHeight: 80,
    overflow: "auto",
  },
  logBox: {
    marginTop: 10,
    background: "#1e1e1e",
    color: "#d4d4d4",
    borderRadius: 6,
    padding: "8px 10px",
    fontFamily: "monospace",
    fontSize: 11,
    maxHeight: 260,
    overflow: "auto",
  },
  logLine: { lineHeight: 1.5 },
  voiceReply: {
    border: "2px solid #16a085",
    borderRadius: 8,
    padding: "8px 12px",
    marginTop: 10,
  },
  vRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginTop: 6,
    flexWrap: "wrap" as const,
  },
  checkLabel: {
    display: "flex",
    gap: 4,
    alignItems: "center",
    fontSize: 13,
    cursor: "pointer",
  },
  select: {
    fontSize: 12,
    padding: "3px 6px",
    borderRadius: 4,
    border: "1px solid #bbb",
  },
  tplLabel: {
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  tplInput: {
    flex: 1,
    fontSize: 12,
    padding: "3px 6px",
    borderRadius: 4,
    border: "1px solid #bbb",
    fontFamily: "monospace",
  },
  conversation: {
    border: "2px solid #2980b9",
    borderRadius: 8,
    padding: "8px 12px",
    marginTop: 10,
  },
  convHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: 6,
  },
  llmBadge: {
    fontSize: 11,
    color: "#fff",
    padding: "2px 8px",
    borderRadius: 10,
    fontWeight: 600,
  },
  convBody: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    marginTop: 8,
    maxHeight: 200,
    overflowY: "auto" as const,
    padding: "2px 0",
  },
  chatBubble: {
    maxWidth: "85%",
    padding: "5px 10px",
    borderRadius: 8,
    fontSize: 13,
    lineHeight: 1.4,
    wordBreak: "break-word" as const,
  },
  chatRole: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: "#555",
    marginBottom: 1,
  },
};
