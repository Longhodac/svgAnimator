# Aurelian Frontend

Frontend app for the editor, voice listener, and coding-agent workflow stream UI.

## Scripts

- `npm run dev`: start Vite only.
- `npm run workflow:server`: start the local workflow bridge server.
- `npm run dev:full`: run Vite + workflow server together.
- `npm run build`: typecheck and build production assets.

## Required env files

### Frontend env (`frontend/.env`)

```env
VITE_DEEPGRAM_KEY=your_deepgram_key
VITE_GEMINI_API_KEY=your_gemini_key
```

`VITE_DEEPGRAM_API_KEY` is also supported as a fallback key name.

### Workflow env (`coding-agent-workflow/.env`)

```env
CURSOR_API_KEY=your_cursor_api_key
```

This is required by `coding-agent-workflow/run_workflow.py` when the local workflow server starts.

## Local development

From `frontend/`:

```bash
npm install
npm run dev:full
```

The frontend connects to workflow endpoints through Vite proxy:

- `/workflow/status`
- `/workflow/stream` (SSE)
- `/workflow/prompt`

The workflow daemon is intentionally long-lived and remains active for the full server lifetime.
