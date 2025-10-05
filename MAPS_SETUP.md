# Google Maps Setup Guide

RegattaFlow uses **React Native Maps** for displaying venue locations. This provides a familiar, lightweight map experience across all platforms:

- **iOS**: Apple Maps (native)
- **Android**: Google Maps (requires API key)
- **Web**: Google Maps (requires API key)

## Why React Native Maps?

We switched from MapLibre GL 3D to React Native Maps for venue display because:

1. **Simpler for Location Display** - The 3D nautical map is overkill for just showing venue markers
2. **Better Performance** - Lighter bundle size and faster rendering
3. **Native Feel** - Uses platform-native maps (Apple Maps on iOS)
4. **Easier Clustering** - Built-in marker clustering for many venues
5. **Universal Support** - Works seamlessly across iOS, Android, and web

We still use **MapLibre GL 3D** for detailed race strategy planning (where 3D terrain adds value).

## Setup Instructions

### 1. Get Google Maps API Keys

#### For Web (Google Cloud Console)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Maps JavaScript API**
4. Create credentials → API Key
5. Restrict key to your domain(s):
   - `localhost:*` (development)
   - `regattaflow.vercel.app` (production)
   - Your custom domain

#### For Android
1. In the same Google Cloud project
2. Enable **Maps SDK for Android**
3. Create a new API key (or use existing)
4. Restrict to Android apps
5. Add package name: `com.regattaflow.app` (or your package)
6. Add SHA-1 signing certificate fingerprints

#### For iOS (Optional - Uses Apple Maps by default)
1. In the same Google Cloud project
2. Enable **Maps SDK for iOS**
3. Create a new API key (or use existing)
4. Restrict to iOS apps
5. Add bundle identifier: `com.regattaflow.app` (or your bundle ID)

### 2. Configure API Keys

#### Option A: Environment Variables (Recommended for Security)
Add to `.env.local`:
```bash
# Google Maps API Keys
EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY=your_web_api_key_here
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=your_android_api_key_here
EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=your_ios_api_key_here
```

Then update `app.json` to use env vars:
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

#### Option B: Direct Configuration (Quick Testing)
Update `app.json` directly:
```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "AIzaSy..."
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSy..."
        }
      }
    }
  }
}
```

### 3. Web Configuration

For web, you need to load the Google Maps JavaScript API. Create or update `app.json`:

```json
{
  "expo": {
    "web": {
      "bundler": "metro"
    }
  }
}
```

Then create a custom `index.html` in your `web` directory if you need to add the Google Maps script tag:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RegattaFlow</title>
  <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_WEB_API_KEY&libraries=places"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

**Note:** For security, consider loading the API key from environment variables in production.

### 4. Test Your Setup

#### Test on iOS (Uses Apple Maps - No key needed)
```bash
expo start --ios
```

#### Test on Android (Requires Google Maps key)
```bash
expo start --android
```

#### Test on Web (Requires Google Maps key)
```bash
expo start --web
```

## Troubleshooting

### iOS: Blank Map
- iOS uses Apple Maps by default (no API key needed)
- If using Google Maps on iOS, ensure API key is configured
- Check console for errors

### Android: Blank Map with Google Logo
- Your Google Maps Android API key is invalid or restricted
- Ensure Maps SDK for Android is enabled
- Check SHA-1 certificate fingerprints match

### Web: "This page can't load Google Maps correctly"
- API key is missing or invalid
- Maps JavaScript API is not enabled
- Domain restrictions are too strict
- Check browser console for specific error codes

### Maps Not Loading
- Check network connectivity
- Verify API keys are correct
- Ensure required APIs are enabled in Google Cloud Console
- Check for billing issues (Google requires billing enabled even for free tier)

## Cost Considerations

### Apple Maps (iOS)
- **FREE** - No API key or billing required
- Native performance

### Google Maps (Android/Web)
- **FREE** for most use cases
- $200/month free credit from Google Cloud
- Maps SDK: $7 per 1,000 requests (after free tier)
- Maps JavaScript API: $7 per 1,000 requests (after free tier)

**Typical usage for RegattaFlow:**
- Venue browsing: ~50-100 map loads/user/month
- Under free tier for small-medium user base

## Alternative: OpenStreetMap

If you want to avoid Google Maps entirely, you can use:
- **Mapbox** - Similar pricing, more styling options
- **OpenStreetMap** - Completely free, but requires self-hosting or using a tile provider

Let me know if you want to explore these alternatives!

## Questions?

- Check [React Native Maps Docs](https://github.com/react-native-maps/react-native-maps)
- See [Google Maps Platform Docs](https://developers.google.com/maps/documentation)
- Ask in #engineering Slack channel
