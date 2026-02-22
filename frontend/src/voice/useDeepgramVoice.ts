import { useCallback, useRef } from "react";
import { DG_URL } from "./constants";

export interface UseDeepgramVoiceCallbacks {
  onOpen: () => void;
  onClose: () => void;
  onError: (message: string) => void;
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onMetadata?: (requestId: string | undefined) => void;
  onRawMessage?: (raw: string) => void;
}

export interface UseDeepgramVoiceResult {
  connect: (apiKey: string) => void;
  disconnect: () => void;
  sendChunk: (buf: ArrayBuffer) => void;
}

const CLOSESTREAM_DELAY_MS = 150;

export function useDeepgramVoice(
  callbacks: UseDeepgramVoiceCallbacks
): UseDeepgramVoiceResult {
  const wsRef = useRef<WebSocket | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ★ Store callbacks in a ref so connect/disconnect never change identity
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const disconnect = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    const ws = wsRef.current;
    if (!ws) return;
    wsRef.current = null;
    ws.onopen = null;
    ws.onmessage = null;
    ws.onerror = null;
    ws.onclose = null;
    try {
      ws.close();
    } catch {
      /* ok */
    }
    cbRef.current.onClose();
  }, []);

  const connect = useCallback(
    (apiKey: string) => {
      if (wsRef.current) return;

      const ws = new WebSocket(DG_URL, ["token", apiKey]);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        if (!wsRef.current) return;
        cbRef.current.onOpen();
      };

      ws.onmessage = (e: MessageEvent) => {
        const raw = typeof e.data === "string" ? e.data : "(binary)";
        cbRef.current.onRawMessage?.(raw);

        try {
          const msg = JSON.parse(raw) as {
            type?: string;
            request_id?: string;
            metadata?: { request_id?: string };
            error?: string;
            channel?: { alternatives?: Array<{ transcript?: string; confidence?: number }> };
            is_final?: boolean;
          };

          if (msg.type === "Metadata") {
            const requestId = msg.request_id ?? msg.metadata?.request_id;
            cbRef.current.onMetadata?.(requestId);
            return;
          }
          if (msg.error) {
            cbRef.current.onError(`Deepgram: ${msg.error}`);
            return;
          }

          const alt = msg?.channel?.alternatives?.[0];
          const text = (alt?.transcript ?? "").trim();
          if (!text) return;

          if (msg.is_final) {
            cbRef.current.onFinal(text);
          } else {
            cbRef.current.onInterim(text);
          }
        } catch {
          // non-JSON or parse error; ignore for transport layer
        }
      };

      ws.onerror = () => {
        cbRef.current.onError("WebSocket error — check API key and network.");
      };

      ws.onclose = (ev: CloseEvent) => {
        if (wsRef.current !== null) {
          wsRef.current = null;
          if (ev.code !== 1000 && ev.code !== 1005) {
            cbRef.current.onError(`WebSocket closed: ${ev.code} ${ev.reason}`);
          }
          cbRef.current.onClose();
        }
      };
    },
    []
  );

  const sendChunk = useCallback((buf: ArrayBuffer) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(buf);
    }
  }, []);

  const gracefulDisconnect = useCallback(() => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "CloseStream" }));
      } catch {
        /* ok */
      }
      closeTimeoutRef.current = setTimeout(() => {
        closeTimeoutRef.current = null;
        disconnect();
      }, CLOSESTREAM_DELAY_MS);
    } else {
      disconnect();
    }
  }, [disconnect]);

  return {
    connect,
    disconnect: gracefulDisconnect,
    sendChunk,
  };
}
