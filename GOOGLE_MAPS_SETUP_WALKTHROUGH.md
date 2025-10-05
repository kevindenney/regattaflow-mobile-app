# Google Maps API Setup - Step-by-Step Walkthrough

## Prerequisites
- Google account (Gmail)
- Credit card (Google requires it even for free tier, but you won't be charged unless you exceed free credits)

---

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Open: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click the project dropdown (top left, next to "Google Cloud")
   - Click "NEW PROJECT"
   - Enter project details:
     - **Project name**: `RegattaFlow` or `RegattaFlow Maps`
     - **Organization**: Leave as "No organization" (unless you have one)
   - Click **CREATE**
   - Wait for project creation (takes ~30 seconds)

3. **Select Your Project**
   - Click the project dropdown again
   - Select your newly created project
   - You should see the project name in the top bar

---

## Step 2: Enable Billing (Required but Free Tier Available)

1. **Open Billing**
   - In the left sidebar, click **Billing**
   - Or go to: https://console.cloud.google.com/billing

2. **Link Billing Account**
   - Click "LINK A BILLING ACCOUNT"
   - Click "CREATE BILLING ACCOUNT"
   - Follow the prompts:
     - Enter your business/personal info
     - Add credit card details
     - Accept terms
   - **Note**: Google provides **$200/month free credits** and won't charge without explicit consent

3. **Enable Billing for Your Project**
   - Return to your project
   - Billing should now show as "Active"

---

## Step 3: Enable Required APIs

### 3.1 Enable Maps JavaScript API (For Web)

1. **Open APIs & Services**
   - In the left sidebar, click **APIs & Services** > **Library**
   - Or go to: https://console.cloud.google.com/apis/library

2. **Search for Maps JavaScript API**
   - In the search bar, type: `Maps JavaScript API`
   - Click on **Maps JavaScript API** from results

3. **Enable the API**
   - Click **ENABLE** button
   - Wait for activation (~10 seconds)
   - You should see "API enabled" message

### 3.2 Enable Maps SDK for Android

1. **Back to API Library**
   - Click **APIs & Services** > **Library**

2. **Search for Maps SDK for Android**
   - Type: `Maps SDK for Android`
   - Click on **Maps SDK for Android**

3. **Enable the API**
   - Click **ENABLE**
   - Wait for activation

### 3.3 Enable Maps SDK for iOS (Optional - only if you want Google Maps on iOS)

1. **Back to API Library**
   - Click **APIs & Services** > **Library**

2. **Search for Maps SDK for iOS**
   - Type: `Maps SDK for iOS`
   - Click on **Maps SDK for iOS**

3. **Enable the API**
   - Click **ENABLE**
   - Wait for activation

**Note**: iOS uses Apple Maps by default (which is free), so this is optional unless you specifically want Google Maps on iOS.

---

## Step 4: Create API Keys

### 4.1 Create Web API Key

1. **Go to Credentials**
   - Click **APIs & Services** > **Credentials**
   - Or go to: https://console.cloud.google.com/apis/credentials

2. **Create API Key**
   - Click **+ CREATE CREDENTIALS** (top)
   - Select **API key**
   - A new API key is generated automatically
   - **Copy this key immediately** - you'll need it!

3. **Restrict the Key (Important for Security)**
   - Click **EDIT API KEY** (or the pencil icon)
   - **Name**: `RegattaFlow Web`
   - **Application restrictions**:
     - Select **HTTP referrers (web sites)**
     - Click **ADD AN ITEM**
     - Add these referrers:
       - `http://localhost:*`
       - `https://localhost:*`
       - `https://regattaflow.vercel.app/*`
       - `https://*.vercel.app/*` (for preview deployments)
       - Your custom domain (if any): `https://regattaflow.app/*`
   - **API restrictions**:
     - Select **Restrict key**
     - Select **Maps JavaScript API**
     - Select **Places API** (if you want venue search autocomplete later)
   - Click **SAVE**

4. **Save Your Web API Key**
   ```
   Web API Key: AIzaSy...
   ```

### 4.2 Create Android API Key

1. **Create Another API Key**
   - Click **+ CREATE CREDENTIALS** > **API key**
   - Copy the key

2. **Get Your Android SHA-1 Certificate Fingerprint**

   **For Development (Debug keystore):**
   ```bash
   # Run this in your terminal:
   cd ~/Developer/RegattaFlow/regattaflow-app

   # For macOS/Linux:
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

   # For Windows:
   keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
   ```

   Look for:
   ```
   SHA1: A1:B2:C3:D4:E5:F6:...
   ```
   Copy this SHA-1 fingerprint.

3. **Restrict the Android Key**
   - Click **EDIT API KEY**
   - **Name**: `RegattaFlow Android`
   - **Application restrictions**:
     - Select **Android apps**
     - Click **ADD AN ITEM**
     - **Package name**: `com.regattaflow.app` (or check your `app.json`)
     - **SHA-1 certificate fingerprint**: Paste the SHA-1 you copied
     - Click **DONE**
   - **API restrictions**:
     - Select **Restrict key**
     - Select **Maps SDK for Android**
   - Click **SAVE**

4. **Save Your Android API Key**
   ```
   Android API Key: AIzaSy...
   ```

### 4.3 Create iOS API Key (Optional)

1. **Create Another API Key**
   - Click **+ CREATE CREDENTIALS** > **API key**
   - Copy the key

2. **Restrict the iOS Key**
   - Click **EDIT API KEY**
   - **Name**: `RegattaFlow iOS`
   - **Application restrictions**:
     - Select **iOS apps**
     - Click **ADD AN ITEM**
     - **Bundle ID**: `com.regattaflow.app` (or check your `app.json`)
     - Click **DONE**
   - **API restrictions**:
     - Select **Restrict key**
     - Select **Maps SDK for iOS**
   - Click **SAVE**

3. **Save Your iOS API Key**
   ```
   iOS API Key: AIzaSy...
   ```

---

## Step 5: Configure Your Expo App

### 5.1 Update Environment Variables

Open or create `.env.local`:

```bash
# Google Maps API Keys
EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY=AIzaSy_YOUR_WEB_KEY_HERE
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=AIzaSy_YOUR_ANDROID_KEY_HERE
EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=AIzaSy_YOUR_IOS_KEY_HERE
```

**Important**: Replace `AIzaSy_YOUR_*_KEY_HERE` with your actual API keys!

### 5.2 Update app.json

I'll help you update this file with your environment variables:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "config": {
        "googleMapsApiKey": "AIzaSy_YOUR_IOS_KEY_HERE"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSy_YOUR_ANDROID_KEY_HERE"
        }
      }
    }
  }
}
```

Or use environment variables in `app.json` (requires eas-cli):
```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "${EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY}"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "${EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY}"
        }
      }
    }
  }
}
```

---

## Step 6: Test Your Setup

### Test on Web
```bash
expo start --web
```

Navigate to the Venue tab. You should see:
- ✅ Map loads with venue markers
- ✅ No "For development purposes only" watermark
- ✅ Can click/drag the map
- ✅ Can tap venue markers

### Test on iOS (No API key needed)
```bash
expo start --ios
```

Should work automatically with Apple Maps.

### Test on Android
```bash
expo start --android
```

Should show Google Maps with venue markers.

---

## Troubleshooting

### Error: "This page can't load Google Maps correctly"

**Cause**: API key is invalid or not properly restricted.

**Fix**:
1. Check that you copied the correct API key
2. Verify Maps JavaScript API is enabled
3. Check HTTP referrer restrictions include your domain
4. Wait 5 minutes (API restrictions take time to propagate)

### Error: "ApiNotActivatedMapError"

**Cause**: Required API is not enabled.

**Fix**:
1. Go to APIs & Services > Library
2. Enable all Maps APIs mentioned in Step 3
3. Wait 2-3 minutes for activation

### Android: Blank Map with Google Logo

**Cause**: SHA-1 certificate fingerprint doesn't match.

**Fix**:
1. Re-run the keytool command to get SHA-1
2. Update API key restrictions with correct SHA-1
3. Rebuild app: `expo start --android --clear`

### iOS: Blank Map

**Cause**: Apple Maps doesn't need Google API (it should work by default).

**Fix**:
1. Check that you have location permissions enabled
2. Try on a real device (simulator sometimes has issues)

### "Daily Limit Exceeded"

**Cause**: You exceeded free tier (unlikely for development).

**Fix**:
1. Check Google Cloud Console > Billing
2. Review quota usage
3. For RegattaFlow's usage, free tier should be sufficient

---

## Cost Monitoring

### Set Up Budget Alerts (Recommended)

1. Go to **Billing** > **Budgets & alerts**
2. Click **CREATE BUDGET**
3. Set budget:
   - **Budget name**: RegattaFlow Maps
   - **Amount**: $10/month
   - **Alert thresholds**: 50%, 90%, 100%
4. Add your email for alerts
5. Click **FINISH**

This way you'll be notified if you accidentally exceed free tier.

---

## Summary Checklist

- [ ] Created Google Cloud project
- [ ] Enabled billing (won't be charged within free tier)
- [ ] Enabled Maps JavaScript API (Web)
- [ ] Enabled Maps SDK for Android
- [ ] Enabled Maps SDK for iOS (optional)
- [ ] Created and restricted Web API key
- [ ] Created and restricted Android API key
- [ ] Created and restricted iOS API key (optional)
- [ ] Added API keys to `.env.local`
- [ ] Updated `app.json` with API keys
- [ ] Tested on web (map loads correctly)
- [ ] Tested on iOS (Apple Maps works)
- [ ] Tested on Android (Google Maps works)
- [ ] Set up budget alerts

---

## Next Steps

Once you have your API keys:

1. **I can help you add them to your `.env.local` file**
2. **I can update your `app.json` with the keys**
3. **We can test the maps on web/iOS/Android**

Let me know when you have your API keys and I'll help you configure them!

## Questions?

If you get stuck on any step:
1. Take a screenshot of the error
2. Share it with me
3. I'll help debug!
