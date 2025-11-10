# RegattaFlow Vercel MCP Server

STDIO Model Context Protocol server that exposes Vercel deployment metadata and deploy hooks so Codex (or Claude Code) can manage RegattaFlow's hosting without leaving the IDE.

## Capabilities

Resources:
- `vercel://project` – high-level project metadata from the Vercel API.
- `vercel://deployments/latest` – recent deployments (status, urls, commit info).
- `vercel://env/production` – environment variable metadata (names, targets, last updated) without decrypting secrets.

Tools:
- `get_vercel_deployment` – fetch details for a specific deployment ID or URL.
- `get_vercel_logs` – stream structured build/runtime log events for a deployment.
- `trigger_vercel_deploy_hook` – call a pre-configured deploy hook (production or preview) to kick off a fresh build without leaving chat.

## Configuration

Create an `.env` file (copy from `.env.example` after the first build) with:

```
VERCEL_TOKEN=...
VERCEL_PROJECT_ID=...
# Optional
VERCEL_TEAM_ID=...
VERCEL_PROD_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/prj_xxx/prod
VERCEL_PREVIEW_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/prj_xxx/preview
```

- The token needs `projects.read` and `deployments.read` scopes (plus deploy hook permissions if you want to trigger builds).
- `VERCEL_PROJECT_ID` can be the UUID or slug. Team-scoped tokens should set `VERCEL_TEAM_ID`.

## Usage

```
npm install
npm run dev   # hot reload while iterating
npm run build # generate dist/
```

Wire the server into Codex/Claude via TOML:

```toml
[mcp_servers.vercel]
command = "node"
args = ["/absolute/path/regattaflow-app/mcp-vercel/dist/index.js"]
env = { VERCEL_TOKEN = "...", VERCEL_PROJECT_ID = "...", VERCEL_TEAM_ID = "..." }
```

Restart Codex CLI / IDE after saving the config. You can now ask Codex things like “list the last five Vercel deployments” or “trigger a production deploy via MCP”.
