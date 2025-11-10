# Vercel Migration - Manual Steps Required

This document outlines the manual steps needed to complete the migration from the dual-repo setup (Next.js website + Expo mobile app) to a single Expo codebase with Vercel web deployment.

## Status: Configuration Files Updated ✅

The following local changes have been completed:
- ✅ Added `.vercel/` to `.gitignore`
- ✅ Updated `vercel.json` with Expo web build configuration
- ✅ Removed obsolete `website` git remote

## Manual Steps Required

### Step 1: Login to Vercel CLI (Local)

Before you can link the project locally, you need to authenticate:

```bash
vercel login
```

Then link the project:

```bash
vercel link --project regattaflow-app
```

Select:
- Team: `kevindenney's projects`
- Project: `regattaflow-app`

### Step 2: Update Vercel Project Settings (Dashboard)

🚨 **Critical**: The Vercel project is currently connected to the wrong GitHub repository.

1. Go to [Vercel Dashboard](https://vercel.com/kevindenneys-projects/regattaflow-app)
2. Navigate to **Settings** → **Git**
3. Current: Connected to `kevindenney/regattaflowwebsite` (❌ wrong repo)
4. Click **Disconnect** to remove the old repository
5. Click **Connect Git Repository**
6. Select: `kevindenney/regattaflow-mobile-app` (✅ correct repo)
7. Configure branch settings:
   - **Production Branch**: `main`
   - **Preview Branches**: Enable for all branches (optional)

### Step 3: Update Build & Development Settings

In **Settings** → **General**:

```
Framework Preset: Other
Build Command: npm run build:web
Output Directory: dist
Install Command: npm install
Development Command: npm run web
Node.js Version: 22.x (already set)
```

### Step 4: Migrate Environment Variables

Go to **Settings** → **Environment Variables** and add all required variables from `.env.example`:

**Supabase**:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Authentication**:
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_APPLE_CLIENT_ID`

**AI Services**:
- `ANTHROPIC_API_KEY`
- `EXPO_PUBLIC_ANTHROPIC_API_KEY`
- `GOOGLE_AI_API_KEY`
- `EXPO_PUBLIC_GEMINI_API_KEY`

**Weather & Maps**:
- `EXPO_PUBLIC_STORMGLASS_API_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- `EXPO_PUBLIC_MAP_STYLE_URL`

**Payment**:
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`

**Feature Flags**:
- `EXPO_PUBLIC_FEATURE_BIOMETRIC_AUTH=true`
- `EXPO_PUBLIC_FEATURE_OAUTH_LOGIN=true`
- `EXPO_PUBLIC_FEATURE_OFFLINE_MODE=true`
- `EXPO_PUBLIC_FEATURE_AI_STRATEGY=true`
- `EXPO_PUBLIC_FEATURE_COACH_MARKETPLACE=true`

For each variable, set the target environments:
- ☑ Production
- ☑ Preview
- ☐ Development (optional)

### Step 5: Trigger Test Deployment

After updating the GitHub connection:

1. Push a commit to the `main` branch (or trigger manual deploy)
2. Monitor the build in Vercel dashboard
3. Check build logs for any errors
4. Verify the web app loads at the deployment URL

### Step 6: Archive Old Repository (Optional)

Once everything is working:

1. Go to the old [regattaflowwebsite](https://github.com/kevindenney/regattaflowwebsite) repository
2. **Settings** → Scroll down to **Danger Zone**
3. Click **Archive this repository**
4. Add archive reason: "Migrated to unified Expo codebase in regattaflow-mobile-app"

## Deployment Strategy

After migration is complete:

**Web (Vercel)**:
- Automatic deployment on push to `main` branch
- Preview deployments for pull requests
- Access at: `regattaflow-app.vercel.app`

**iOS (EAS Build)**:
```bash
eas build --platform ios
eas submit --platform ios
```

**Android (EAS Build)**:
```bash
eas build --platform android
eas submit --platform android
```

## Verification Checklist

- [ ] Vercel CLI authenticated (`vercel login`)
- [ ] Local project linked (`vercel link`)
- [ ] GitHub repository updated in Vercel dashboard
- [ ] Build settings configured for Expo web
- [ ] All environment variables migrated
- [ ] Test deployment successful
- [ ] Web app accessible and functional
- [ ] Old repository archived (optional)

## Troubleshooting

**Build fails with "Module not found"**:
- Check that all dependencies in `package.json` are compatible with web
- Verify `package.json` scripts include `build:web`

**Environment variables not working**:
- Ensure variables are prefixed with `EXPO_PUBLIC_` for client-side access
- Redeploy after adding environment variables

**OAuth not working on Vercel domain**:
- Update OAuth redirect URIs in Google/Apple/Supabase consoles
- Add Vercel deployment URL to allowed origins

## Next Steps

Once web deployment is working, you can:
1. Set up the MCP Vercel server for deployment monitoring
2. Configure custom domain (if needed)
3. Set up deployment notifications
4. Configure Vercel Analytics (optional)

---

**Generated**: 2025-01-10
**Status**: Awaiting manual Vercel dashboard updates
