import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { spawn, execSync, type ChildProcess } from 'child_process'
import os from 'os'

// ─── Workflow daemon state ────────────────────────────────
interface WorkflowState {
  status: 'ready' | 'busy' | 'error'
  sessionId: string | null
  pendingPrompts: number
  lastError: string | null
  process: ChildProcess | null
  sseClients: Set<import('http').ServerResponse>
  logs: string[]
}

const wf: WorkflowState = {
  status: 'ready',
  sessionId: null,
  pendingPrompts: 0,
  lastError: null,
  process: null,
  sseClients: new Set(),
  logs: [],
}

const ROOT = path.resolve(__dirname, '..')
const CODING_PROMPT = path.resolve(ROOT, 'coding-agent-workflow/coding_prompt.txt')
const AGENT_ENV_FILE = path.resolve(ROOT, 'coding-agent-workflow/.env')

function loadAgentEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  try {
    const content = fs.readFileSync(AGENT_ENV_FILE, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...rest] = trimmed.split('=')
        env[k.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '')
      }
    }
  } catch { /* no env file */ }
  return env
}

function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of wf.sseClients) {
    try { client.write(payload) } catch { wf.sseClients.delete(client) }
  }
}

function broadcastStatus() {
  broadcast('status', {
    status: wf.status,
    sessionId: wf.sessionId,
    pendingPrompts: wf.pendingPrompts,
    lastError: wf.lastError,
  })
}

function runPrompt(prompt: string) {
  if (wf.process) return // already running

  wf.status = 'busy'
  wf.lastError = null
  wf.logs = []
  broadcastStatus()

  // Read system prompt
  let systemPrompt = ''
  try { systemPrompt = fs.readFileSync(CODING_PROMPT, 'utf-8').trim() } catch { /* */ }

  const fullPrompt = wf.sessionId
    ? prompt
    : (systemPrompt ? systemPrompt + '\n\nUser request: ' + prompt : prompt)

  const args = [
    '-p', '--force',
    '--output-format', 'stream-json',
    '--stream-partial-output',
  ]
  if (wf.sessionId) args.push(`--resume=${wf.sessionId}`)
  args.push(fullPrompt)

  const agentEnv = loadAgentEnv()

  // Resolve the agent binary — it may be in ~/.local/bin which Node doesn't inherit
  const homeDir = os.homedir()
  const extraPaths = [
    path.join(homeDir, '.local', 'bin'),
    '/usr/local/bin',
    '/opt/homebrew/bin',
  ].join(':')
  const fullPath = `${extraPaths}:${process.env.PATH || ''}`

  // Find agent absolute path
  let agentBin = 'agent'
  try {
    agentBin = execSync('which agent', {
      env: { ...process.env, PATH: fullPath },
    }).toString().trim()
  } catch {
    // Fallback to known location
    const fallback = path.join(homeDir, '.local', 'bin', 'agent')
    if (fs.existsSync(fallback)) agentBin = fallback
  }

  console.log(`[workflow] spawning: ${agentBin}`)
  console.log(`[workflow] prompt: ${prompt.slice(0, 80)}...`)

  const proc = spawn(agentBin, args, {
    cwd: ROOT,
    env: { ...process.env, ...agentEnv, PATH: fullPath },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  wf.process = proc

  let assistantBuffer = ''

  const processLine = (line: string) => {
    if (!line.trim()) return
    try {
      const obj = JSON.parse(line) as Record<string, unknown>

      // Capture session ID
      if (!wf.sessionId && obj.session_id) {
        wf.sessionId = obj.session_id as string
      }

      const msgType = obj.type as string | undefined

      if (msgType === 'assistant' || msgType === 'thinking') {
        let deltaText = ''
        if (msgType === 'thinking') {
          deltaText = (obj.text as string) || ''
        } else if (msgType === 'assistant') {
          const content = (obj.message as Record<string, unknown>)?.content
          if (Array.isArray(content)) {
            for (const c of content) {
              const text = (c as Record<string, unknown>).text as string | undefined
              if (text) deltaText += text
            }
          }
        }
        if (deltaText) {
          if (msgType === 'assistant') assistantBuffer += deltaText
          broadcast('content_delta', { type: msgType, text: deltaText })
        }
      } else if (msgType === 'tool_call') {
        const tc = obj.tool_call as Record<string, unknown> || {}
        const sub = obj.subtype as string
        const keys = Object.keys(tc)
        const toolName = keys[0] || 'unknown'
        if (sub === 'started') {
          broadcast('log', { stream: 'system', line: `[TOOL] ${toolName}` })
        } else if (sub === 'completed') {
          broadcast('log', { stream: 'system', line: `  ✓ ${toolName} done` })
        }
      } else if (msgType === 'result') {
        // Agent finished
      }
    } catch {
      // Non-JSON line
      broadcast('log', { stream: 'stdout', line })
    }
  }

  let stdoutBuf = ''
  proc.stdout?.on('data', (chunk: Buffer) => {
    const raw = chunk.toString()
    console.log(`[workflow:stdout] ${raw.slice(0, 200)}`)
    stdoutBuf += raw
    const lines = stdoutBuf.split('\n')
    stdoutBuf = lines.pop() || ''
    for (const line of lines) processLine(line)
  })

  proc.stderr?.on('data', (chunk: Buffer) => {
    const text = chunk.toString().trim()
    console.log(`[workflow:stderr] ${text.slice(0, 200)}`)
    if (text) broadcast('log', { stream: 'stderr', line: text })
  })

  proc.on('close', (code) => {
    if (stdoutBuf.trim()) processLine(stdoutBuf)
    wf.process = null
    wf.status = code === 0 ? 'ready' : 'error'
    if (code !== 0) wf.lastError = `Agent exited with code ${code}`

    // Send the assistant's accumulated response
    if (assistantBuffer.trim()) {
      broadcast('log', { stream: 'system', line: `[ASSISTANT] ${assistantBuffer.trim()}` })
    }

    broadcastStatus()

    // Process next queued prompt
    if (wf.pendingPrompts > 0) {
      wf.pendingPrompts--
    }
  })

  proc.on('error', (err) => {
    wf.process = null
    wf.status = 'error'
    wf.lastError = err.message
    broadcastStatus()
  })
}

// ─── Helpers ──────────────────────────────────────────────
function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
  })
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'animation-and-workflow-server',
      configureServer(server) {
        const animDir = path.resolve(__dirname, '../animation')

        // ─── Workflow endpoints ─────────────────────────
        server.middlewares.use('/workflow/status', (_req, res) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            status: wf.status,
            sessionId: wf.sessionId,
            pendingPrompts: wf.pendingPrompts,
            lastError: wf.lastError,
          }))
        })

        server.middlewares.use('/workflow/prompt', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end(JSON.stringify({ ok: false, error: 'POST only' }))
            return
          }
          const body = await readBody(req)
          try {
            const { prompt } = JSON.parse(body) as { prompt: string }
            if (!prompt?.trim()) {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: 'Empty prompt' }))
              return
            }
            if (wf.status === 'busy') {
              wf.pendingPrompts++
              res.end(JSON.stringify({
                ok: true, status: wf.status,
                pendingPrompts: wf.pendingPrompts, queued: true,
              }))
              return
            }
            runPrompt(prompt.trim())
            res.end(JSON.stringify({
              ok: true, status: wf.status,
              pendingPrompts: wf.pendingPrompts,
            }))
          } catch (err) {
            res.statusCode = 400
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
        })

        server.middlewares.use('/workflow/stream', (_req, res) => {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          })
          res.write('\n')
          wf.sseClients.add(res)

          // Send current status immediately
          const payload = `event: status\ndata: ${JSON.stringify({
            status: wf.status,
            sessionId: wf.sessionId,
            pendingPrompts: wf.pendingPrompts,
            lastError: wf.lastError,
          })}\n\n`
          res.write(payload)

          res.on('close', () => { wf.sseClients.delete(res) })
        })

        server.middlewares.use('/workflow/restart', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end(JSON.stringify({ error: 'POST only' }))
            return
          }
          if (wf.process) {
            wf.process.kill()
            wf.process = null
          }
          wf.sessionId = null
          wf.status = 'ready'
          wf.lastError = null
          wf.pendingPrompts = 0
          broadcastStatus()
          res.end(JSON.stringify({ ok: true }))
        })

        // ─── Animation file endpoints ───────────────────
        server.middlewares.use('/api/animation-files', (_req, res) => {
          try {
            const files = fs.readdirSync(animDir).filter(f => !f.startsWith('.'))
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ files }))
          } catch {
            res.statusCode = 500
            res.end(JSON.stringify({ files: [], error: 'Cannot read animation directory' }))
          }
        })

        server.middlewares.use('/api/upload-svg', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end(JSON.stringify({ error: 'POST only' }))
            return
          }
          const chunks: Buffer[] = []
          req.on('data', (chunk: Buffer) => chunks.push(chunk))
          req.on('end', () => {
            try {
              const body = Buffer.concat(chunks).toString('utf-8')
              const { filename, content } = JSON.parse(body) as { filename: string; content: string }
              if (!filename || !content) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Missing filename or content' }))
                return
              }
              const safeName = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
              fs.writeFileSync(path.join(animDir, safeName), content, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, filename: safeName }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
        })

        server.middlewares.use('/animation', (req, res, next) => {
          const urlPath = req.url?.split('?')[0] || '/'
          const filePath = path.join(animDir, urlPath === '/' ? 'index.html' : urlPath)
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const stat = fs.statSync(filePath)
            const ext = path.extname(filePath)
            const mimeTypes: Record<string, string> = {
              '.html': 'text/html',
              '.js': 'application/javascript',
              '.css': 'text/css',
              '.svg': 'image/svg+xml',
              '.json': 'application/json',
            }
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
            res.setHeader('Cache-Control', 'no-store')
            res.setHeader('Last-Modified', stat.mtime.toUTCString())
            res.end(fs.readFileSync(filePath))
          } else {
            next()
          }
        })
      },
    },
  ],
  server: {
    // No proxy needed — workflow endpoints are now served directly by Vite middleware
  },
})
