import express from "express";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const workflowScript = path.join(repoRoot, "coding-agent-workflow", "run_workflow.py");
const PORT = Number(process.env.WORKFLOW_SERVER_PORT ?? 8787);

const app = express();
app.use(express.json());

const clients = new Set();
let proc = null;
let restarting = false;
let intentionalRestart = false;
let pendingPrompts = 0;
let status = "starting";
let sessionId = null;
let lastError = null;
let shutdown = false;
let stdoutBuffer = "";
let stderrBuffer = "";
const queuedPrompts = [];

function sendSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function broadcast(event, data) {
  for (const res of clients) {
    sendSse(res, event, data);
  }
}

function updateStatus(nextStatus, extra = {}) {
  status = nextStatus;
  broadcast("status", {
    status,
    sessionId,
    pendingPrompts,
    lastError,
    ...extra,
  });
}

function parseLine(rawLine, stream) {
  const line = rawLine.replace(/\x1b\[[0-9;]*m/g, "").trimEnd();
  if (!line) return;

  broadcast("log", { stream, line });

  if (line.includes("Agent daemon ready")) {
    updateStatus("ready");
    flushQueuedPrompts();
    return;
  }

  const sessionMatch = line.match(/session:\s*(.+)$/i);
  if (sessionMatch) {
    sessionId = sessionMatch[1].trim();
    pendingPrompts = Math.max(0, pendingPrompts - 1);
    updateStatus(pendingPrompts > 0 ? "busy" : "ready");
    broadcast("session", { sessionId });
    return;
  }

  if (line.toLowerCase().includes("error:")) {
    lastError = line;
    updateStatus("error", { lastError });
  }
}

function flushQueuedPrompts() {
  if (!proc || !proc.stdin.writable) return;
  if (queuedPrompts.length === 0) return;

  while (queuedPrompts.length > 0) {
    const nextPrompt = queuedPrompts.shift();
    if (!nextPrompt) continue;
    proc.stdin.write(`${nextPrompt}\n`);
    pendingPrompts += 1;
    broadcast("prompt", { prompt: nextPrompt, queued: true });
  }
  updateStatus("busy");
}

function wireStream(streamName, chunk) {
  const incoming = chunk.toString("utf8");
  let buffer = streamName === "stdout" ? stdoutBuffer + incoming : stderrBuffer + incoming;
  const lines = buffer.split(/\r?\n/);
  buffer = lines.pop() ?? "";

  for (const line of lines) {
    parseLine(line, streamName);
  }

  if (streamName === "stdout") {
    stdoutBuffer = buffer;
  } else {
    stderrBuffer = buffer;
  }
}

function startDaemon() {
  if (proc || shutdown) return;

  lastError = null;
  updateStatus(restarting ? "restarting" : "starting");

  const child = spawn("python3", [workflowScript], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: "1",
    },
    stdio: ["pipe", "pipe", "pipe"],
  });
  proc = child;

  child.stdout.on("data", (chunk) => {
    if (proc !== child) return;
    wireStream("stdout", chunk);
  });
  child.stderr.on("data", (chunk) => {
    if (proc !== child) return;
    wireStream("stderr", chunk);
  });

  child.on("error", (err) => {
    if (proc !== child) return;
    lastError = `Failed to start workflow daemon: ${String(err)}`;
    updateStatus("error", { lastError });
  });

  child.on("exit", (code, signal) => {
    if (proc !== child) return;
    proc = null;
    const detail = `Workflow daemon exited (code=${code ?? "null"}, signal=${signal ?? "null"})`;
    broadcast("log", { stream: "system", line: detail });
    if (shutdown) {
      updateStatus("stopped");
      return;
    }

    if (intentionalRestart) {
      intentionalRestart = false;
      restarting = true;
      startDaemon();
      restarting = false;
      return;
    }

    lastError = detail;
    updateStatus("error", { lastError });
    restarting = true;
    setTimeout(() => {
      startDaemon();
      restarting = false;
    }, 1000);
  });
}

function submitPrompt(prompt) {
  const normalized = prompt.trim();
  if (!normalized) {
    throw new Error("Prompt is empty.");
  }

  if (status === "starting" || status === "restarting") {
    queuedPrompts.push(normalized);
    updateStatus(status, { queuedPrompts: queuedPrompts.length });
    return { queued: true };
  }

  if (status === "error" || status === "stopped") {
    throw new Error(
      `Workflow daemon unavailable. ${lastError ?? "Check coding-agent-workflow/.env and ensure CURSOR_API_KEY is set."}`
    );
  }

  if (!proc || !proc.stdin.writable) {
    queuedPrompts.push(normalized);
    updateStatus("starting", { queuedPrompts: queuedPrompts.length });
    startDaemon();
    return { queued: true };
  }

  proc.stdin.write(`${normalized}\n`);
  pendingPrompts += 1;
  updateStatus("busy");
  broadcast("prompt", { prompt: normalized, queued: false });
  return { queued: false };
}

app.get("/workflow/status", (_req, res) => {
  res.json({
    status,
    sessionId,
    pendingPrompts,
    queuedPrompts: queuedPrompts.length,
    alive: Boolean(proc && !proc.killed),
    lastError,
  });
});

app.get("/workflow/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.add(res);
  sendSse(res, "status", {
    status,
    sessionId,
    pendingPrompts,
    queuedPrompts: queuedPrompts.length,
    lastError,
    alive: Boolean(proc && !proc.killed),
  });

  req.on("close", () => {
    clients.delete(res);
    res.end();
  });
});

app.post("/workflow/prompt", (req, res) => {
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
    const result = submitPrompt(prompt);
    res.json({
      ok: true,
      status,
      pendingPrompts,
      queuedPrompts: queuedPrompts.length,
      queued: result.queued,
    });
  } catch (err) {
    res.status(503).json({
      ok: false,
      error: String(err),
      status,
      pendingPrompts,
      queuedPrompts: queuedPrompts.length,
      lastError,
    });
  }
});

app.post("/workflow/stop", (_req, res) => {
  shutdown = true;
  if (proc) {
    proc.kill("SIGTERM");
  }
  res.json({ ok: true, status: "stopping" });
});

app.post("/workflow/restart", (_req, res) => {
  shutdown = false;
  queuedPrompts.length = 0;
  if (proc) {
    intentionalRestart = true;
    proc.kill("SIGTERM");
  } else {
    startDaemon();
  }
  res.json({ ok: true, status });
});

const server = app.listen(PORT, () => {
  console.log(`[workflow-server] listening on http://localhost:${PORT}`);
  startDaemon();
});

process.on("SIGINT", () => {
  shutdown = true;
  if (proc) proc.kill("SIGTERM");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  shutdown = true;
  if (proc) proc.kill("SIGTERM");
  server.close(() => process.exit(0));
});
