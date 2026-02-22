export type WorkflowStatus =
  | "starting"
  | "ready"
  | "busy"
  | "restarting"
  | "error"
  | "stopped"
  | "offline";

export interface WorkflowStatusPayload {
  status: WorkflowStatus;
  sessionId: string | null;
  pendingPrompts: number;
  queuedPrompts?: number;
  alive?: boolean;
  lastError: string | null;
}

export interface WorkflowLogPayload {
  stream: "stdout" | "stderr" | "system";
  line: string;
}

export interface WorkflowDeltaPayload {
  type: "thinking" | "assistant";
  text: string;
}

export interface WorkflowPromptResponse {
  ok: boolean;
  status: WorkflowStatus;
  pendingPrompts: number;
  queuedPrompts?: number;
  queued?: boolean;
  error?: string;
  lastError?: string | null;
}

export interface WorkflowStreamHandlers {
  onStatus?: (payload: WorkflowStatusPayload) => void;
  onLog?: (payload: WorkflowLogPayload) => void;
  onDelta?: (payload: WorkflowDeltaPayload) => void;
  onSession?: (payload: { sessionId: string | null }) => void;
  onPrompt?: (payload: { prompt: string }) => void;
  onError?: (error: Event) => void;
}

function parseEventData<T>(event: MessageEvent): T | null {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}

export async function getWorkflowStatus(): Promise<WorkflowStatusPayload> {
  try {
    const response = await fetch("/workflow/status");
    if (!response.ok) throw new Error(`${response.status}`);
    return response.json() as Promise<WorkflowStatusPayload>;
  } catch {
    return {
      status: "ready",
      sessionId: null,
      pendingPrompts: 0,
      lastError: null,
    };
  }
}

export async function submitWorkflowPrompt(prompt: string): Promise<WorkflowPromptResponse> {
  const response = await fetch("/workflow/prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const body = (await response.json()) as WorkflowPromptResponse;
  if (!response.ok || !body.ok) {
    throw new Error(body.error ?? `Failed to submit prompt (${response.status})`);
  }
  return body;
}

export async function restartWorkflowDaemon(): Promise<void> {
  await fetch("/workflow/restart", { method: "POST" });
}

export function subscribeWorkflowStream(
  handlers: WorkflowStreamHandlers
): () => void {
  const source = new EventSource("/workflow/stream");

  source.addEventListener("status", (event) => {
    const payload = parseEventData<WorkflowStatusPayload>(event as MessageEvent);
    if (payload) handlers.onStatus?.(payload);
  });

  source.addEventListener("log", (event) => {
    const payload = parseEventData<WorkflowLogPayload>(event as MessageEvent);
    if (payload) handlers.onLog?.(payload);
  });

  source.addEventListener("content_delta", (event) => {
    const payload = parseEventData<WorkflowDeltaPayload>(event as MessageEvent);
    if (payload) handlers.onDelta?.(payload);
  });

  source.addEventListener("session", (event) => {
    const payload = parseEventData<{ sessionId: string | null }>(event as MessageEvent);
    if (payload) handlers.onSession?.(payload);
  });

  source.addEventListener("prompt", (event) => {
    const payload = parseEventData<{ prompt: string }>(event as MessageEvent);
    if (payload) handlers.onPrompt?.(payload);
  });

  source.onerror = (event) => {
    handlers.onError?.(event);
  };

  return () => source.close();
}
