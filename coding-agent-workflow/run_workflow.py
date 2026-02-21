import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
ENV_FILE = SCRIPT_DIR / ".env"
CODING_PROMPT_FILE = SCRIPT_DIR / "coding_prompt.txt"

CYAN = "\033[36m"
YELLOW = "\033[33m"
GRAY = "\033[90m"
RED = "\033[91m"
MAGENTA = "\033[35m"
RESET = "\033[0m"


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ[k.strip()] = v.strip().strip('"').strip("'")


def format_stream_line(obj: dict) -> str | None:
    try:
        msg_type = obj.get("type")
        if msg_type == "user":
            content = obj.get("message", {}).get("content") or []
            text = content[0].get("text", "") if isinstance(content, list) and content else ""
            return f"\n{CYAN}[USER]{RESET}\n{text}"
        if msg_type == "assistant":
            content = obj.get("message", {}).get("content")
            if isinstance(content, list):
                parts = [c.get("text", "") for c in content if c.get("text")]
                text = "".join(parts) or (content[0].get("text") if content else "")
            else:
                text = (content or {}).get("text", "")
            return text if text else None
        if msg_type == "tool_call":
            tc = obj.get("tool_call") or {}
            sub = obj.get("subtype", "")
            if sub == "started":
                if "shellToolCall" in tc:
                    return f"\n{YELLOW}[SHELL]{RESET} {tc['shellToolCall'].get('args', {}).get('command', '')}"
                if "readToolCall" in tc:
                    return f"\n{YELLOW}[READ]{RESET} {tc['readToolCall'].get('args', {}).get('path', '')}"
                if "editToolCall" in tc:
                    return f"\n{YELLOW}[EDIT]{RESET} {tc['editToolCall'].get('args', {}).get('path', '')}"
                if "grepToolCall" in tc:
                    return f"\n{YELLOW}[GREP]{RESET} {tc['grepToolCall'].get('args', {}).get('pattern', '')}"
                if "writeToolCall" in tc:
                    return f"\n{YELLOW}[WRITE]{RESET} {tc['writeToolCall'].get('args', {}).get('path', '')}"
                if "deleteToolCall" in tc:
                    return f"\n{YELLOW}[DELETE]{RESET} {tc['deleteToolCall'].get('args', {}).get('path', '')}"
                keys = list(tc.keys())
                return f"\n{YELLOW}[TOOL]{RESET} {keys[0] if keys else '?'}"
            if sub == "completed":
                if "shellToolCall" in tc:
                    r = tc["shellToolCall"].get("result", {})
                    if r.get("success"):
                        return f"\n{GRAY}  ✓ exit {r['success'].get('exitCode', '')}{RESET}"
                    return f"\n{RED}  ✗ failed{RESET}"
                if "readToolCall" in tc:
                    r = tc["readToolCall"].get("result", {})
                    if r.get("success"):
                        return f"\n{GRAY}  ✓ read {r['success'].get('totalLines', 0)} lines{RESET}"
                    return f"\n{RED}  ✗ read failed{RESET}"
                if "editToolCall" in tc:
                    r = tc["editToolCall"].get("result", {})
                    return f"\n{GRAY}  ✓ edited{RESET}" if r.get("success") else f"\n{RED}  ✗ edit failed{RESET}"
                if "writeToolCall" in tc:
                    r = tc["writeToolCall"].get("result", {})
                    args = tc["writeToolCall"].get("args", {})
                    if r.get("success"):
                        return f"\n{GRAY}  ✓ wrote {args.get('path', '')}{RESET}"
                    return f"\n{RED}  ✗ write failed{RESET}"
                if "deleteToolCall" in tc:
                    r = tc["deleteToolCall"].get("result", {})
                    if r.get("success"):
                        return f"\n{GRAY}  ✓ deleted{RESET}"
                    return f"\n{RED}  ✗ delete failed{RESET}"
                return f"\n{GRAY}  ✓ done{RESET}"
        if msg_type == "thinking":
            text = obj.get("text", "")
            return f"{GRAY}{text}{RESET}" if text else None
        if msg_type == "result":
            return f"\n{MAGENTA}[RESULT]{RESET} {obj.get('subtype', '?')} ({obj.get('duration_ms', 0)}ms)"
    except (KeyError, IndexError, TypeError):
        pass
    return None


def run_cursor(
    cursor_cmd: list[str],
    prompt: str,
    format_output: bool,
    resume_id: str | None = None,
) -> tuple[int, str | None]:
    full_cmd = cursor_cmd + [
        "-p", "--force",
        "--output-format", "stream-json",
        "--stream-partial-output",
    ]
    if resume_id:
        full_cmd += [f"--resume={resume_id}"]
    full_cmd.append(prompt)

    proc = subprocess.Popen(
        full_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        cwd=ROOT,
    )
    assert proc.stdout
    session_id: str | None = None
    for line in proc.stdout:
        line = line.rstrip("\n")
        if not line:
            continue
        if format_output:
            try:
                obj = json.loads(line)
                if session_id is None:
                    session_id = obj.get("session_id")
                out = format_stream_line(obj)
                if out:
                    msg_type = obj.get("type")
                    if msg_type in ("assistant", "thinking"):
                        print(out, end="", flush=True)
                    else:
                        print(out, flush=True)
            except json.JSONDecodeError:
                print(line, flush=True)
        else:
            try:
                obj = json.loads(line)
                if session_id is None:
                    session_id = obj.get("session_id")
            except json.JSONDecodeError:
                pass
            print(line, flush=True)
    proc.wait()
    return proc.returncode or 0, session_id


def daemon_loop(cursor_cmd: list[str], system_prompt: str, format_output: bool,
                 resume_id: str | None = None) -> int:
    session_id = resume_id
    turn = 0
    print(f"\n{CYAN}Agent daemon ready. Type a prompt and press Enter.{RESET}")
    print(f"{GRAY}Commands:  /quit  /session  /reset{RESET}\n", flush=True)

    while True:
        try:
            user_input = input(f"{CYAN}> {RESET}").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\n{GRAY}Shutting down.{RESET}")
            break

        if not user_input:
            continue
        if user_input == "/quit":
            print(f"{GRAY}Bye.{RESET}")
            break
        if user_input == "/session":
            print(f"{GRAY}session: {session_id or '(none)'}{RESET}", flush=True)
            continue
        if user_input == "/reset":
            session_id = None
            turn = 0
            print(f"{YELLOW}Session reset. Next prompt starts a fresh agent.{RESET}", flush=True)
            continue

        if turn == 0 and not session_id:
            prompt = system_prompt + "\n\nUser request: " + user_input
        else:
            prompt = user_input

        turn += 1
        code, new_id = run_cursor(cursor_cmd, prompt, format_output, resume_id=session_id)
        if new_id:
            session_id = new_id
        if code != 0:
            print(f"\n{RED}Agent exited with code {code}{RESET}", file=sys.stderr)
        print(f"\n{GRAY}session: {session_id or '?'}{RESET}\n", flush=True)

    return 0


def main() -> int:
    load_env(ENV_FILE)
    if not os.environ.get("CURSOR_API_KEY"):
        print("Error: CURSOR_API_KEY not set. Add it to coding-agent-workflow/.env", file=sys.stderr)
        return 1

    parser = argparse.ArgumentParser(
        description="Run coding agent on animation sources. "
        "Pass prompts as args for batch mode, or omit for interactive daemon mode.",
    )
    parser.add_argument(
        "prompts",
        nargs="*",
        help="Prompts to run in batch. If omitted, starts interactive daemon loop.",
    )
    parser.add_argument("--resume", default=None, metavar="SESSION_ID",
                        help="Resume a previous agent session by ID")
    parser.add_argument("--no-format", action="store_true", help="Disable stream formatting (raw JSON)")
    args = parser.parse_args()

    if not CODING_PROMPT_FILE.exists():
        print(f"Error: {CODING_PROMPT_FILE} not found", file=sys.stderr)
        return 1

    if not shutil.which("agent"):
        print("Error: agent CLI not found. Install with: curl https://cursor.com/install -fsS | bash", file=sys.stderr)
        return 1
    cursor_cmd = ["agent"]
    format_output = not args.no_format
    system_prompt = CODING_PROMPT_FILE.read_text().strip()

    if not args.prompts:
        return daemon_loop(cursor_cmd, system_prompt, format_output, resume_id=args.resume)

    session_id: str | None = args.resume
    for i, user_prompt in enumerate(args.prompts):
        step_label = f"[step {i + 1}/{len(args.prompts)}]" if len(args.prompts) > 1 else ""
        if step_label:
            print(f"\n{CYAN}{'=' * 60}\n  {step_label} {user_prompt[:80]}\n{'=' * 60}{RESET}", flush=True)

        if i == 0 and not session_id:
            prompt = system_prompt + "\n\nUser request: " + user_prompt
        else:
            prompt = user_prompt

        code, session_id = run_cursor(cursor_cmd, prompt, format_output, resume_id=session_id)
        if code != 0:
            print(f"\n{RED}Step {i + 1} failed (exit {code}){RESET}", file=sys.stderr)
            return code
        if session_id:
            print(f"\n{GRAY}session: {session_id}{RESET}", flush=True)

    print("\nDone.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
