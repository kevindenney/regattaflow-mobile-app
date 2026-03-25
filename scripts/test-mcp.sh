#!/bin/bash
# Test the BetterAt MCP endpoint
#
# Usage:
#   ./scripts/test-mcp.sh --local             # test locally (uses dev token)
#   ./scripts/test-mcp.sh --local --token-only # print token for Claude Code

set -euo pipefail

MCP_URL="https://regattaflow-app.vercel.app/api/mcp"
TOKEN="mcp-local-dev-token"

# Parse flags
TOKEN_ONLY=""
for arg in "$@"; do
  case "$arg" in
    --token-only) TOKEN_ONLY=1 ;;
    --local) MCP_URL="http://localhost:3001/api/mcp" ;;
  esac
done

echo "MCP endpoint: $MCP_URL" >&2

if [ -n "$TOKEN_ONLY" ]; then
  echo "$TOKEN"
  exit 0
fi

# Helper to make MCP calls
mcp_call() {
  curl -s -X POST "$MCP_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d "$1"
}

# 1. Initialize MCP session
echo "" >&2
echo "=== MCP Initialize ===" >&2
INIT=$(mcp_call '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-03-26",
    "capabilities": {},
    "clientInfo": { "name": "test-script", "version": "1.0.0" }
  }
}')
echo "$INIT" | jq . 2>/dev/null || echo "$INIT"

# 2. List available tools
echo "" >&2
echo "=== List Tools ===" >&2
TOOLS=$(mcp_call '{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}')
echo "$TOOLS" | jq '.result.tools[].name' 2>/dev/null || echo "$TOOLS"

# 3. Test list_interests
echo "" >&2
echo "=== list_interests ===" >&2
INTERESTS=$(mcp_call '{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "list_interests",
    "arguments": {}
  }
}')
echo "$INTERESTS" | jq '.result.content[0].text | fromjson | { count, interests: [.interests[] | .name] }' 2>/dev/null || echo "$INTERESTS"

# 4. Test create_step
echo "" >&2
echo "=== create_step ===" >&2
CREATE=$(mcp_call '{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "create_step",
    "arguments": {
      "title": "[MCP Test] Practice IV insertion technique",
      "interest": "nursing",
      "category": "clinical",
      "plan_notes": "Focus on proper vein selection and catheter angle"
    }
  }
}')
echo "$CREATE" | jq '.result.content[0].text | fromjson' 2>/dev/null || echo "$CREATE"

echo "" >&2
echo "Done!" >&2
