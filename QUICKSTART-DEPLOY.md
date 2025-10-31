# RegattaFlow Quick Start - Deploy Now

Get RegattaFlow live in under 1 hour! This guide walks you through deploying the web app to Vercel and sharing your mobile app for testing.

## 🚀 Deploy Web to Vercel (15 minutes)

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub (recommended)

### Step 2: Deploy

```bash
# Login to Vercel
npx vercel login

# Deploy to production
npx vercel --prod
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Scope** → Your username
- **Link to existing project?** → No
- **Project name?** → regattaflow-app
- **Directory?** → ./

That's it! You'll get a live URL like: `regattaflow-app-xxx.vercel.app`

### Step 3: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

Then redeploy:
```bash
npx vercel --prod
```

**Done!** Share your web app link with anyone.

---

## 📱 Share Mobile App via Expo Go (5 minutes)

### Option A: Development Build (Fastest)

1. **Start the dev server:**
   ```bash
   npm start
   ```

2. **Share with friends:**
   - Press `s` to switch to Expo Go
   - Share the QR code or link
   - Friends install "Expo Go" app (free)
   - They scan QR code → app loads!

**Pros:** Instant, no app store needed
**Cons:** Requires your dev server running, limited features

### Option B: EAS Update (Hosted, Better)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configure and build:**
   ```bash
   eas build:configure
   eas build --platform ios --profile preview
   eas build --platform android --profile preview
   ```

3. **Share the build:**
   - Wait ~20 minutes for builds
   - Get shareable link from EAS dashboard
   - Friends install directly (iOS: via TestFlight link, Android: direct APK)

**Pros:** Works without dev server, better testing
**Cons:** Takes longer, requires Apple Developer account for iOS

---

## 🎯 Demo Your Friend (Right Now!)

**Best approach for TODAY:**

1. **Web:** Deploy to Vercel (see above) - 15 mins
2. **Mobile:** Use Expo Go (Option A) - 5 mins

Your friend can:
- Browse to your Vercel URL for web version
- Scan QR code in Expo Go for mobile version

**Total time: 20 minutes!**

---

## 🏗️ Production-Ready (For Later)

When you're ready to go live properly:

1. **Web:** Already done! Just add custom domain in Vercel
2. **iOS:** Submit to App Store (see DEPLOYMENT.md)
3. **Android:** Submit to Play Store (see DEPLOYMENT.md)

Full guide: See `DEPLOYMENT.md`

---

## ❓ Quick Troubleshooting

### Build fails with memory error:
Already configured! The build uses 12GB RAM via `NODE_OPTIONS`.

### "Vercel not found":
```bash
npx vercel --version  # Uses npx, no install needed
```

### QR code not working:
```bash
npm start -- --tunnel  # Creates public URL
```

### Can't access on phone:
Make sure phone and computer are on same WiFi network.

---

## 📞 Need Help?

- **Vercel Issues:** https://vercel.com/support
- **Expo Issues:** https://docs.expo.dev
- **App Issues:** Check logs in terminal

---

## ✅ Success Checklist

After deploying, verify:

- [ ] Web app loads at Vercel URL
- [ ] Can navigate between pages
- [ ] Mobile app opens in Expo Go
- [ ] Authentication works (if enabled)
- [ ] Maps load properly

---

**Ready to deploy?** Start with Web on Vercel - it's the fastest way to show your friend a working app!

```bash
npx vercel login
npx vercel --prod
```

🎉 **You'll have a live app in minutes!**
