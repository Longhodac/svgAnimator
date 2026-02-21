#!/usr/bin/env -S jq -r -f

def try_text: .message.content | if type == "array" then (.[] | select(.text?) | .text) else empty end;

if .type == "user" then
  "\n\033[36m[USER]\033[0m\n\(.message.content[0].text // "")"
elif .type == "assistant" then
  (try_text // .message.content[0].text // .message.content.text // "") | select(length > 0)
elif .type == "tool_call" and .subtype == "started" then
  (if .tool_call.shellToolCall then
    "\n\033[33m[SHELL]\033[0m \(.tool_call.shellToolCall.args.command)"
  elif .tool_call.readToolCall then
    "\n\033[33m[READ]\033[0m \(.tool_call.readToolCall.args.path)"
  elif .tool_call.editToolCall then
    "\n\033[33m[EDIT]\033[0m \(.tool_call.editToolCall.args.path)"
  elif .tool_call.grepToolCall then
    "\n\033[33m[GREP]\033[0m \(.tool_call.grepToolCall.args.pattern)"
  elif .tool_call.writeToolCall then
    "\n\033[33m[WRITE]\033[0m \(.tool_call.writeToolCall.args.path)"
  elif .tool_call.deleteToolCall then
    "\n\033[33m[DELETE]\033[0m \(.tool_call.deleteToolCall.args.path)"
  else
    "\n\033[33m[TOOL]\033[0m \(.tool_call | keys[0] // "?")"
  end)
elif .type == "tool_call" and .subtype == "completed" then
  (if .tool_call.shellToolCall then
    if .tool_call.shellToolCall.result.success then "\n\033[90m  ✓ exit \(.tool_call.shellToolCall.result.success.exitCode)\033[0m" else "\n\033[91m  ✗ failed\033[0m" end
  elif .tool_call.readToolCall then
    if .tool_call.readToolCall.result.success then "\n\033[90m  ✓ read \(.tool_call.readToolCall.result.success.totalLines // 0) lines\033[0m" else "\n\033[91m  ✗ read failed\033[0m" end
  elif .tool_call.editToolCall then
    if .tool_call.editToolCall.result.success then "\n\033[90m  ✓ edited\033[0m" else "\n\033[91m  ✗ edit failed\033[0m" end
  elif .tool_call.writeToolCall then
    if .tool_call.writeToolCall.result.success then "\n\033[90m  ✓ wrote \(.tool_call.writeToolCall.args.path)\033[0m" else "\n\033[91m  ✗ write failed\033[0m" end
  elif .tool_call.deleteToolCall then
    if .tool_call.deleteToolCall.result.success then "\n\033[90m  ✓ deleted\033[0m" else "\n\033[91m  ✗ delete failed\033[0m" end
  else
    "\n\033[90m  ✓ done\033[0m"
  end)
elif .type == "result" then
  "\n\033[35m[RESULT]\033[0m \(.subtype // "?") (\(.duration_ms // 0)ms)"
else
  empty
end
