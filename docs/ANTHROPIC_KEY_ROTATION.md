## Anthropic Key Rotation (Nov 10 2025)

- **New key**: Stored locally in `.env` and `.env.development` (untracked). Loaded via `ANTHROPIC_API_KEY` and `EXPO_PUBLIC_ANTHROPIC_API_KEY`.
- **Scope**: Used by Claude skill upload scripts, Expo web/mobile builds, GitHub Actions, Supabase Edge Functions, and Vercel.
- **Reference**: 1Password entry `Claude API – Nov 2025` (create/update as needed).

### Local setup

```bash
# populate local envs (already done in this workspace)
echo "ANTHROPIC_API_KEY=<new-key>" >> .env.development
```

To use in shells/scripts:

```bash
set -o allexport
source .env.development
source .env              # if you also want Expo vars
set +o allexport
```

### Deployment / CI targets to update

| Surface                | Secret name                          | Action |
|------------------------|--------------------------------------|--------|
| GitHub Actions         | `ANTHROPIC_API_KEY`, `EXPO_PUBLIC_ANTHROPIC_API_KEY` | Update repository secrets to the new value. |
| Supabase Edge Functions| `ANTHROPIC_API_KEY` (Project settings → API → Secrets) | Rotate via `npx supabase secrets set`. |
| Vercel / Expo EAS      | `ANTHROPIC_API_KEY`, `EXPO_PUBLIC_ANTHROPIC_API_KEY` | Update Environment Variables for all environments. |
| Local scripts          | `.env`, `.env.development`           | Already refreshed in this workspace; ensure other machines do the same. |

### Verifications

1. `git secrets --scan` → should return no matches (hook installed locally).
2. Run `node upload-skills-zip.mjs` with `ANTHROPIC_API_KEY` set; expect 401 if unset.
3. Trigger CI smoke workflow to confirm secrets propagate.

### Team checklist

- Pull latest `master`.
- Install guardrail once: `brew install git-secrets && git secrets --install && git secrets --register-aws`.
- Copy `.env.example` → `.env` / `.env.development` and inject the key from 1Password.
- Never paste Claude keys into tracked files—`git-secrets` blocks them now.
