# RegattaFlow Production Deployment Guide

This guide covers deploying RegattaFlow across all three platforms: Web (Vercel), iOS (App Store), and Android (Play Store).

## Prerequisites

Before deploying, ensure you have:

1. **Accounts Created:**
   - Vercel account (https://vercel.com)
   - Apple Developer account ($99/year) (https://developer.apple.com)
   - Google Play Console account ($25 one-time) (https://play.google.com/console)
   - Expo account (free) (https://expo.dev)

2. **API Keys & Credentials:**
   - Supabase project configured
   - Google Maps API keys (iOS and Android)
   - Apple Team ID and App Store Connect credentials
   - Google Play Service Account JSON

3. **Tools Installed:**
   ```bash
   npm install -g eas-cli
   npm install -g vercel
   ```

## Web Deployment (Vercel)

### Initial Setup

1. **Login to Vercel:**
   ```bash
   npx vercel login
   ```

2. **Deploy to Production:**
   ```bash
   npx vercel --prod
   ```

   Follow the prompts to:
   - Link to existing project or create new
   - Set project name: `regattaflow-app`
   - Set build settings (already configured in vercel.json)

### Configuration

The app is configured via `vercel.json`:
- Build command: `npm run build:web`
- Output directory: `dist`
- Node memory: 12GB (for large builds)

### Environment Variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key
```

### Custom Domain (Optional)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain (e.g., app.regattaflow.com)
3. Configure DNS records as instructed

### Updates

To deploy updates:
```bash
npm run build:web  # Test locally first
npx vercel --prod  # Deploy to production
```

---

## iOS Deployment (App Store)

### Initial Setup

1. **Create App in App Store Connect:**
   - Go to https://appstoreconnect.apple.com
   - Create new app with bundle ID: `com.regattaflow.app`
   - Fill in app information, screenshots, descriptions

2. **Configure API Keys:**
   - Update `app.json` with your Google Maps iOS API key
   - Ensure all required permissions are properly described

3. **Login to EAS:**
   ```bash
   eas login
   ```

### Build Configuration

The app is configured in `app.json` and `eas.json` with:
- Bundle ID: `com.regattaflow.app`
- Build number: `1.0.0`
- Required permissions: Location, Camera, Microphone, Photos

### Create Production Build

1. **Configure EAS (First Time Only):**
   ```bash
   eas build:configure
   ```

2. **Build for iOS:**
   ```bash
   eas build --platform ios --profile production
   ```

   You'll need to:
   - Provide Apple credentials
   - Generate/upload certificates
   - Wait 15-30 minutes for build

3. **Download and Submit:**
   ```bash
   eas submit --platform ios --latest
   ```

   Or download the IPA and upload manually via Transporter app.

### TestFlight (Beta Testing)

Before production, test with TestFlight:

```bash
eas build --platform ios --profile preview
eas submit --platform ios --latest
```

Add beta testers in App Store Connect → TestFlight.

### App Review

1. Fill out all app information in App Store Connect
2. Add screenshots (required sizes: 6.7", 6.5", 5.5")
3. Add description, keywords, support URL
4. Submit for review (typically 1-3 days)

---

## Android Deployment (Play Store)

### Initial Setup

1. **Create App in Play Console:**
   - Go to https://play.google.com/console
   - Create new app with package name: `com.regattaflow.app`
   - Complete store listing

2. **Configure API Keys:**
   - Update `app.json` with your Google Maps Android API key
   - Configure required permissions

3. **Create Service Account:**
   - In Google Cloud Console, create service account
   - Download JSON key file
   - Grant "Service Account User" role
   - Save as `google-play-service-account.json` (do NOT commit!)

### Create Production Build

1. **Build for Android:**
   ```bash
   eas build --platform android --profile production
   ```

   This creates an AAB (Android App Bundle) file.

2. **Submit to Play Store:**
   ```bash
   eas submit --platform android --latest
   ```

   Or upload manually in Play Console → Production → Create Release.

### Internal Testing (Recommended First)

1. Create internal test track:
   ```bash
   eas build --platform android --profile preview
   ```

2. Upload to internal testing track in Play Console
3. Add test users
4. Verify everything works

### Production Release

1. Complete all Play Console requirements:
   - Privacy policy
   - App content rating
   - Target audience
   - Data safety form
   - Screenshots (phone, tablet, optional: TV, Wear)

2. Create production release
3. Roll out to 100% or staged rollout (recommended: 10% → 50% → 100%)

---

## Update Process

### Web Updates
```bash
# Make changes, test locally
npm run build:web

# Deploy to production
npx vercel --prod
```

Updates are instant!

### iOS Updates

1. Update version in `app.json`:
   ```json
   "version": "1.1.0",
   "ios": {
     "buildNumber": "1.1.0"
   }
   ```

2. Build and submit:
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios --latest
   ```

3. Wait for App Store review (1-3 days)

### Android Updates

1. Update version in `app.json`:
   ```json
   "version": "1.1.0",
   "android": {
     "versionCode": 2  // Increment by 1 each release
   }
   ```

2. Build and submit:
   ```bash
   eas build --platform android --profile production
   eas submit --platform android --latest
   ```

3. Review typically faster than iOS (hours to 1 day)

---

## Over-the-Air (OTA) Updates

For JavaScript-only changes (no native code), use Expo Updates for instant deployment:

```bash
# Install updates if not already
eas update:configure

# Push update to production
eas update --branch production --message "Bug fixes and improvements"
```

Users get updates automatically without app store approval!

**Note:** OTA updates work for:
- JavaScript code changes
- React components
- Business logic
- Assets

**Cannot update via OTA:**
- Native dependencies
- Permissions
- app.json configuration changes

---

## Environment Management

### Production Secrets

1. **Vercel:** Set via dashboard or:
   ```bash
   vercel env add EXPO_PUBLIC_SUPABASE_URL production
   ```

2. **EAS (Mobile):** Set via:
   ```bash
   eas secret:create --scope project --name SUPABASE_URL --value "your_value"
   ```

### API Keys Required

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (separate for iOS/Android/Web)
- `EXPO_PUBLIC_ANTHROPIC_API_KEY`
- `EXPO_PUBLIC_GEMINI_API_KEY`

---

## Monitoring & Analytics

### Web (Vercel)

- Built-in analytics in Vercel dashboard
- Real-time logs
- Performance metrics

### Mobile (Expo)

- Crash reporting via Expo dashboard
- Analytics via Expo Insights
- Or integrate Firebase Analytics/Crashlytics

### Supabase

- Monitor database performance
- Track API usage
- Set up alerts for errors

---

## Troubleshooting

### Build Failures

**Memory Issues:**
```bash
# Already configured with 12GB in package.json
NODE_OPTIONS='--max-old-space-size=12288'
```

**iOS Certificate Issues:**
```bash
eas credentials
# Select "iOS" → "Build Credentials" → Manage manually
```

**Android Signing:**
```bash
eas credentials
# Select "Android" → "Build Credentials" → Manage manually
```

### Deployment Issues

**Vercel 404s:**
- Check `vercel.json` rewrites configuration
- Verify `dist` folder is created
- Check build logs

**App Store Rejection:**
- Common issues: Privacy policy, permissions descriptions
- Check App Store Review Guidelines
- Respond quickly to reviewer questions

**Play Store Rejection:**
- Complete data safety form thoroughly
- Ensure privacy policy URL is accessible
- Check target audience settings

---

## Costs Summary

### One-Time
- Apple Developer: $99/year
- Google Play: $25 one-time

### Monthly (Estimated)
- Vercel: Free tier sufficient (upgrade to Pro $20/mo for more)
- Expo: Free tier sufficient (upgrade to Production $29/mo for more)
- Supabase: Free tier good for start (Pro $25/mo when scaling)
- Google Maps API: Pay per usage (budget $50-200/mo depending on users)

### Total Estimated Monthly:
- **Starter:** ~$50-100/month
- **Growing:** ~$150-300/month
- **Scaled:** $500+/month

---

## Launch Checklist

### Before First Deploy

- [ ] All environment variables set
- [ ] Privacy policy created and hosted
- [ ] Terms of service created
- [ ] Support email configured
- [ ] App store screenshots prepared
- [ ] App descriptions written
- [ ] Test on real devices
- [ ] Beta test with 5-10 users

### Web Launch
- [ ] Vercel account created
- [ ] Domain configured (optional)
- [ ] Environment variables set
- [ ] Build succeeds
- [ ] Deploy to production
- [ ] Verify all routes work
- [ ] Test on mobile browsers

### iOS Launch
- [ ] Apple Developer account active
- [ ] App created in App Store Connect
- [ ] TestFlight beta completed
- [ ] Screenshots uploaded (all sizes)
- [ ] App information complete
- [ ] Build submitted
- [ ] Review approved
- [ ] Released to App Store

### Android Launch
- [ ] Play Console account created
- [ ] App created in Play Console
- [ ] Internal testing completed
- [ ] Screenshots uploaded
- [ ] Store listing complete
- [ ] Data safety form filled
- [ ] Content rating completed
- [ ] Build submitted
- [ ] Review approved
- [ ] Released to Play Store

---

## Support Resources

- **Expo Docs:** https://docs.expo.dev
- **Vercel Docs:** https://vercel.com/docs
- **Apple Developer:** https://developer.apple.com/support
- **Google Play:** https://support.google.com/googleplay/android-developer
- **Supabase Docs:** https://supabase.com/docs

---

## Quick Reference Commands

```bash
# Web Development
npm start                      # Start dev server
npm run build:web              # Build for production
npx vercel --prod              # Deploy to Vercel

# iOS Development
eas build --platform ios --profile production     # Production build
eas submit --platform ios --latest                # Submit to App Store
eas build --platform ios --profile preview        # TestFlight build

# Android Development
eas build --platform android --profile production   # Production build
eas submit --platform android --latest              # Submit to Play Store
eas build --platform android --profile preview      # Internal test build

# OTA Updates
eas update --branch production --message "Update message"

# Environment
eas secret:create --scope project --name KEY --value "value"
vercel env add KEY_NAME production
```

---

**Last Updated:** 2025-10-31
**Version:** 1.0.0
