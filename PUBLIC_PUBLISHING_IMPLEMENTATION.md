# Public Publishing Implementation

This document describes the public publishing features that allow yacht clubs to share race content with non-RegattaFlow users.

## Overview

The public publishing system enables clubs to:
1. Share public links to regatta information, results, and schedules
2. Embed widgets on external websites (club sites, social media)
3. Create microsites for major events
4. Track engagement analytics

## Features Implemented

### 1. Public API Endpoints (No Auth Required)

| Endpoint | Description |
|----------|-------------|
| `GET /api/public/regattas/[regattaId]` | Regatta overview, documents, links |
| `GET /api/public/regattas/[regattaId]/results` | Race results and standings |
| `GET /api/public/regattas/[regattaId]/schedule` | Daily race schedule |
| `GET /api/public/regattas/[regattaId]/notices` | Official race committee notices |
| `GET /api/public/clubs/[clubId]/events` | Upcoming club events |
| `GET /api/public/widgets/[token]` | Widget configuration |
| `POST /api/public/widgets/impression` | Analytics tracking |

All endpoints support:
- CORS for cross-origin access
- Public caching headers
- CSV export for results (`?format=csv`)

### 2. Public Pages

Located at `/p/` routes - accessible without authentication:

| Route | Description |
|-------|-------------|
| `/p/[regattaId]` | Regatta landing page with event overview |
| `/p/results/[regattaId]` | Full results with standings and race-by-race |
| `/p/schedule/[regattaId]` | Interactive schedule with day selector |
| `/p/notices/[regattaId]` | Official notices feed |

Features:
- Share buttons for social media
- Download CSV results
- Pull-to-refresh
- Mobile-optimized design
- "Powered by RegattaFlow" branding

### 3. Embeddable Widgets

Widgets for embedding on external websites:

| Widget Type | Description |
|-------------|-------------|
| `results` | Live standings table |
| `schedule` | Today's race schedule |
| `notices` | Urgent/important notices |
| `calendar` | Upcoming events calendar |
| `standings` | Series standings |
| `countdown` | Time until event starts |
| `weather` | Forecast conditions |
| `entry_list` | Registered competitors |

**Usage:**
```html
<div 
  class="regattaflow-widget"
  data-type="results"
  data-regatta-id="your-regatta-id"
  data-theme="light"
  data-accent="#0EA5E9">
</div>
<script src="https://regattaflow.com/widgets/embed.js" async></script>
```

**Data Attributes:**
- `data-type` - Widget type (required)
- `data-club-id` or `data-regatta-id` - Identifier (required)
- `data-theme` - `light` | `dark` | `auto`
- `data-accent` - Accent color (hex)
- `data-branding` - `false` to hide branding
- `data-filter-*` - Custom filters (e.g., `data-filter-division="A"`)

### 4. Database Schema

New tables created in `migrations/20251202_add_public_publishing_tables.sql`:

#### `club_microsites`
Configuration for auto-generated public sites:
- Subdomain/custom domain support
- Theme customization
- Section enablement
- View analytics

#### `club_widgets`
Embeddable widget configurations:
- Widget type and settings
- Theme/branding options
- Domain whitelisting
- Impression tracking

#### `public_access_log`
Analytics tracking:
- Page views and impressions
- Geographic data
- Referrer tracking
- Embedding domains

#### `race_notices`
Official race committee notices:
- Priority levels (urgent/important/normal)
- Visibility controls
- Attachments support
- Expiration dates

### 5. Service Layer

`services/PublicPublishingService.ts` provides:

```typescript
// Microsite Management
PublicPublishingService.createMicrosite(input)
PublicPublishingService.getMicrosite(id)
PublicPublishingService.updateMicrosite(id, updates)
PublicPublishingService.getClubMicrosites(clubId)

// Widget Management
PublicPublishingService.createWidget(input)
PublicPublishingService.getWidgetByToken(token)
PublicPublishingService.updateWidget(id, updates)
PublicPublishingService.deleteWidget(id)
PublicPublishingService.generateEmbedCode(widget)

// Analytics
PublicPublishingService.getAccessAnalytics(clubId, options)
```

## URL Structure

### Public Pages
```
https://regattaflow.com/p/{regattaId}           # Landing page
https://regattaflow.com/p/results/{regattaId}   # Results
https://regattaflow.com/p/schedule/{regattaId}  # Schedule
https://regattaflow.com/p/notices/{regattaId}   # Notices
```

### Embeddable Widgets
```
https://regattaflow.com/embed/results?regatta={id}&theme=light
https://regattaflow.com/embed/schedule?regatta={id}&theme=dark
```

### API Endpoints
```
https://regattaflow.com/api/public/regattas/{id}
https://regattaflow.com/api/public/regattas/{id}/results
https://regattaflow.com/api/public/clubs/{id}/events
```

## Security Considerations

1. **No Authentication Required** - Public endpoints by design
2. **Rate Limiting** - Consider adding rate limits for API abuse
3. **Domain Whitelisting** - Widgets can restrict embedding domains
4. **Cache Headers** - Results cached 60s, info cached 300s
5. **RLS Policies** - Database-level access control

## Future Enhancements

1. **QR Code Generator** - Add `/api/public/qr` endpoint
2. **Social Cards** - OpenGraph meta tags for sharing
3. **RSS/iCal Feeds** - Calendar subscription support
4. **Custom Subdomains** - `{event}.regattaflow.com`
5. **White-Label Options** - Remove RegattaFlow branding for premium
6. **Real-Time Updates** - WebSocket for live results

## Testing

To test public pages locally:
1. Start the development server
2. Navigate to `/p/[regattaId]` with a valid regatta ID
3. Verify no authentication is required

To test widgets:
1. Create a test HTML file:
```html
<!DOCTYPE html>
<html>
<body>
  <div data-regattaflow data-type="results" data-regatta-id="test-id"></div>
  <script src="http://localhost:3000/widgets/embed.js"></script>
</body>
</html>
```
2. Open in browser and verify widget loads

## Files Created

```
api/
  public/
    clubs/
      [clubId]/
        events.ts
    regattas/
      [regattaId]/
        index.ts
        results.ts
        schedule.ts
        notices.ts
    widgets/
      [token].ts
      impression.ts

app/
  p/
    _layout.tsx
    [regattaId].tsx
    results/
      [regattaId].tsx
    schedule/
      [regattaId].tsx
    notices/
      [regattaId].tsx
  embed/
    _layout.tsx
    results.tsx
    schedule.tsx

public/
  widgets/
    embed.js

services/
  PublicPublishingService.ts

migrations/
  20251202_add_public_publishing_tables.sql
```

