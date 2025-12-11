# Demo Users - Quick Reference Card

## 🔑 Login Credentials

| User | Email | Password | Type |
|------|-------|----------|------|
| **Demo Sailor** | demo-sailor@regattaflow.app | Demo123! | Sailor |
| **Sarah Chen** | sarah.chen@sailing.com | sailing123 | Sailor/Fleet Captain |
| **Demo Club** | demo-club@regattaflow.io | Demo123! | Club (Race Committee) |
| **Coach Anderson** | coach.anderson@sailing.com | sailing123 | Coach |
| **Mike Thompson** | mike.thompson@racing.com | sailing123 | Sailor |
| **Emma Wilson** | emma.wilson@yacht.club | sailing123 | Sailor |
| **James Rodriguez** | james.rodriguez@fleet.com | sailing123 | Sailor |

---

## 🐉 Dragon World Championship 2027 Demo

### Featured Event
**2027 Hong Kong Dragon World Championship**
- **Dates**: November 21-29, 2026
- **Host**: Royal Hong Kong Yacht Club
- **Venue**: Clearwater Bay Golf & Country Club
- **Website**: https://www.dragonworld2027.com

### Demo User Roles for Dragon Worlds 2027

#### 1. Demo Sailor (Competitor) ⛵
- **Email**: demo-sailor@regattaflow.app
- **Password**: Demo123!
- **Boat**: HKG 88 "Doubloon" (2022 Petticrows)
- **Registration**: Confirmed for Dragon Worlds 2027
- **Crew**: Tommy Chan (Tactician), Lisa Wong (Trimmer)
- **Test Features**:
  - Race calendar with Dragon Worlds entry
  - Crew management
  - Race preparation & strategy
  - Weather & venue intelligence for Hong Kong

#### 2. Sarah Chen (Fleet Captain) 👑
- **Email**: sarah.chen@sailing.com
- **Password**: sailing123
- **Boat**: HKG 188 "Golden Dragon" (2021 Petticrows)
- **Role**: RHKYC Dragon Fleet Captain
- **Registration**: Confirmed for Dragon Worlds 2027
- **Crew**: David Hui (Tactician), Jenny Lau (Trimmer)
- **Test Features**:
  - Fleet management
  - Fleet communications and posts
  - Document sharing to fleet
  - Race suggestions (8+ historical races)
  - Multi-role (competitor + officer)

#### 3. Demo Club (Race Committee) 🏁
- **Email**: demo-club@regattaflow.io
- **Password**: Demo123!
- **Role**: RHKYC Race Committee / Race Officer
- **Access**: Admin for Dragon Worlds 2027
- **Responsibilities**:
  - Race management and scoring
  - Results publication
  - Protest coordination
  - Start line management
- **Test Features**:
  - Club admin dashboard
  - Event management
  - Competitor registration review
  - Race results entry

#### 4. Coach Anderson (Dragon Coach) 🎯
- **Email**: coach.anderson@sailing.com
- **Password**: sailing123
- **Role**: Dragon class coach
- **Specialties**: Race tactics, Boat speed, Starts
- **Location**: Hong Kong
- **Test Features**:
  - Coach profile
  - Client management
  - Strategy sharing with sailors
  - Session booking

---

## 🧪 Best Test Users by Feature

### Race Suggestions Feature
| User | Expected Suggestions | Why |
|------|---------------------|-----|
| Sarah Chen | 8-10 | 8 historical races + club events + fleet races |
| Mike Thompson | 6-8 | 6 historical races + SFYC admin |
| Emma Wilson | 5-7 | 6 Laser races + strong class preference |

### Club Features
| User | Club | Role |
|------|------|------|
| Demo Club | RHKYC | Admin / Race Committee |
| Sarah Chen | RHKYC | Officer / Dragon Fleet Captain |
| Mike Thompson | SFYC | Admin |

### Fleet Features
| User | Fleet | Role |
|------|-------|------|
| Demo Sailor | HK Dragon Association | Member |
| Sarah Chen | HK Dragon Association | Captain |
| Coach Anderson | HK Dragon Association | Coach |

---

## 🏆 Hong Kong Dragon Fleet

The Hong Kong Dragon Association is the host fleet for the 2027 World Championship.

**Fleet Details:**
- **Size**: 28 boats
- **Practice**: Wednesday evenings from RHKYC
- **History**: Third oldest Dragon fleet in the world
- **Recent Results**: 2024 Asia Pacific Champions

**Fleet Boats in Demo:**
| Sail Number | Boat Name | Owner | Year |
|-------------|-----------|-------|------|
| HKG 88 | Doubloon | Demo Sailor | 2022 |
| HKG 188 | Golden Dragon | Sarah Chen | 2021 |
| HKG 68 | Lucky Star | James Wong | 2020 |
| HKG 128 | Phoenix Rising | Michael Kwok | 2023 |
| HKG 168 | Jade Empress | William Lee | 2019 |

---

## ⚡ Quick Tests

### Test Dragon Worlds 2027 Entry
1. Login: `demo-sailor@regattaflow.app` / `Demo123!`
2. Navigate to: **Races** tab
3. See: Dragon World Championship 2027
4. Check: Registration status, crew, boat info

### Test Race Committee
1. Login: `demo-club@regattaflow.io` / `Demo123!`
2. Navigate to: **Clubs** tab
3. Select: Royal Hong Kong Yacht Club
4. Manage: Dragon Worlds 2027 event

### Test Fleet Captain Features
1. Login: `sarah.chen@sailing.com` / `sailing123`
2. Navigate to: **Fleets** tab
3. Select: Hong Kong Dragon Association
4. Post: Announcements, share documents

### Test Race Suggestions
1. Login: `sarah.chen@sailing.com` / `sailing123`
2. Navigate to: **Add Race** screen
3. See: Suggestion drawer with personalized races
4. Click: Any suggestion's "Add to Calendar" button

---

## 🔄 Seed Mock Data

### Seed Dragon Worlds 2027 Data
```bash
node scripts/seed-dragon-worlds-2027.mjs
```

### Seed Complete Demo Data (All Users)
```bash
node scripts/seed-complete-demo-data.mjs
```

### Seed RHKYC Club Data
```bash
node scripts/seed-rhkyc-demo.mjs
```

### Refresh Race Suggestions
```bash
npx supabase functions invoke refresh-race-suggestions
```

---

## 🌐 Event Links

| Event | URL |
|-------|-----|
| Dragon Worlds 2027 | https://www.dragonworld2027.com |
| International Dragon Association | https://internationaldragonsailing.net |
| RHKYC Sailing | https://www.rhkyc.org.hk/sailing |

---

**All passwords for test users**: `Demo123!` or `sailing123`
