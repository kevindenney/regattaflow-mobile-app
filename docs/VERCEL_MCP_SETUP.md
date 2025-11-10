# Vercel MCP Setup for Codex

This guide walks through wiring the new **RegattaFlow Vercel MCP server** into Codex CLI / IDE so you can inspect deployments or trigger builds straight from chat.

## 1. What the server exposes

The STDIO server that lives in `mcp-vercel/` provides:

- **Resources**
  - `vercel://project` – project metadata (framework, git repo, regions).
  - `vercel://deployments/latest` – the last 5 deployments with status + urls.
  - `vercel://env/production` – environment variable metadata (names, targets, authors) without decrypting secret values.
- **Tools**
  - `get_vercel_deployment` – fetch a deployment by ID or URL id.
  - `get_vercel_logs` – stream structured log events for a deployment.
  - `trigger_vercel_deploy_hook` – fire a production or preview deploy hook (uses your Vercel deploy hook URLs).

Codex can mix these with regular prompts: “List recent Vercel deployments” or “Kick off a production redeploy via MCP”.

## 2. Prerequisites

1. Node 18+
2. Vercel account with:
   - Personal/team access token that has `projects.read` and `deployments.read` scopes.
   - Optional deploy hooks if you want MCP-triggered builds.
3. Codex CLI or the IDE extension (both read the same `~/.codex/config.toml`).

## 3. Install + configure the server

```bash
cd mcp-vercel
cp .env.example .env
npm install
```

Update `.env` with your values:

| Variable | Description |
| --- | --- |
| `VERCEL_TOKEN` | Personal/team token from https://vercel.com/account/tokens |
| `VERCEL_PROJECT_ID` | Project UUID or slug (Dashboard → Project → Settings → General) |
| `VERCEL_TEAM_ID` | Optional. Required when the token belongs to a team. |
| `VERCEL_PROD_DEPLOY_HOOK_URL` | Optional. Deploy Hook URL that targets Production. |
| `VERCEL_PREVIEW_DEPLOY_HOOK_URL` | Optional. Deploy Hook URL that targets Preview (falls back to production hook if omitted). |

> 📝 Tip: Create deploy hooks in Vercel → Project → Settings → Deploy Hooks.

Build once to generate `dist/index.js`:

```bash
npm run build
```

## 4. Add the server to Codex

Codex reads its config from `$CODEX_HOME/config.toml` (defaults to `~/.codex/config.toml`). Define STDIO servers under the `[mcp_servers]` table just like the [official docs](https://github.com/openai/codex/blob/main/docs/config.md#mcp-integration) describe.

### Option A: edit `config.toml`

```toml
[mcp_servers.vercel]
command = "node"
args = ["/absolute/path/to/regattaflow-app/mcp-vercel/dist/index.js"]
env = {
  "VERCEL_TOKEN" = "sk_vercel_token",
  "VERCEL_PROJECT_ID" = "prj_123abc",
  "VERCEL_TEAM_ID" = "team_456def",           # optional
  "VERCEL_PROD_DEPLOY_HOOK_URL" = "https://api.vercel.com/v1/integrations/deploy/prj_xxx/prod",
  "VERCEL_PREVIEW_DEPLOY_HOOK_URL" = "https://api.vercel.com/v1/integrations/deploy/prj_xxx/preview" # optional
}
# Alternative env syntax that mirrors the upstream guide
[mcp_servers.vercel.env]
VERCEL_TOKEN = "sk_vercel_token"
VERCEL_PROJECT_ID = "prj_123abc"

# Optional tuning knobs mentioned in the Codex docs
startup_timeout_sec = 20            # default is 10
tool_timeout_sec = 45               # default is 60
enabled_tools = ["get_vercel_deployment", "trigger_vercel_deploy_hook"]
disabled_tools = ["get_vercel_logs"] # remove any tools you do not want to expose
# Allow extra variables from your shell through to the MCP server if needed
env_vars = ["PATH", "HOME"]
```

Notes:
- TOML arrays/strings mirror the Reddit post format (order: command, args, env keys).
- Use an absolute path so both Codex CLI and the IDE extension can spawn the process.
- Restart Codex after saving so it re-parses the config.

### Option B: `codex mcp add`

Codex also ships helper commands that keep `config.toml` in sync:

```bash
codex mcp add vercel \
  --env VERCEL_TOKEN=$VERCEL_TOKEN \
  --env VERCEL_PROJECT_ID=$VERCEL_PROJECT_ID \
  -- node /absolute/path/to/regattaflow-app/mcp-vercel/dist/index.js
```

Add additional `--env` flags for `VERCEL_TEAM_ID`, `VERCEL_PROD_DEPLOY_HOOK_URL`, etc. You can inspect or tweak the resulting entry with:

```bash
codex mcp list     # pretty table
codex mcp get vercel --json
codex mcp remove vercel
```

## 5. Sanity checks inside Codex

1. Ask: “What MCP servers are available?” → `vercel` should be listed.
2. Ask: “Call get_vercel_logs on the latest deployment” → Codex will call the tool with the ID it finds via `vercel://deployments/latest`.
3. Trigger a deploy: “Use trigger_vercel_deploy_hook with target=production and payload={"source":"codex"}”.

If Codex reports auth failures, confirm the token scopes and (for team projects) that `VERCEL_TEAM_ID` matches the value under **Team Settings → General → Team ID**.

## 6. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `VERCEL_TOKEN is required` on startup | Check `.env` or the `env = {}` block in TOML for typos. |
| 401 / 403 from Vercel API | Token missing scopes or belongs to another team—set `VERCEL_TEAM_ID`. |
| Deploy hook tool error | Provide the hook URLs or disable the tool by omitting `payload` requests. |
| Codex can’t find `node` | Use an absolute path for `command` (e.g., `/usr/local/bin/node`). |

Once the server is registered you can keep iterating on RegattaFlow, deploy via chat, and see exactly what Vercel is doing without leaving Codex. 🎯
