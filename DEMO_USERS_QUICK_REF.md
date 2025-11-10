# Demo Users - Quick Reference Card

## 🔑 Login Credentials

| User | Email | Password |
|------|-------|----------|
| **Sarah Chen** | sarah.chen@sailing.com | sailing123 |
| **Mike Thompson** | mike.thompson@racing.com | sailing123 |
| **Emma Wilson** | emma.wilson@yacht.club | sailing123 |
| **James Rodriguez** | james.rodriguez@fleet.com | sailing123 |
| **Coach Anderson** | coach.anderson@sailing.com | sailing123 |

## 🧪 Best Test Users

### 1. Sarah Chen (Most Features) ⭐
- ✅ Club: RHKYC (member)
- ✅ Fleets: Dragon, J/70
- ✅ **8 historical races** (best for pattern detection)
- ✅ Annual pattern: Spring Championship (April)
- ✅ Venue preference: Hong Kong Waters
- ✅ Upcoming club events: 2
- **Expected Suggestions**: 8-10

### 2. Mike Thompson (Club Admin) 👑
- ✅ Club: SFYC (admin)
- ✅ Fleets: Dragon, 420
- ✅ **6 historical races**
- ✅ Annual pattern: Bay Challenge (June)
- ✅ Upcoming club events: 1
- **Expected Suggestions**: 6-8

### 3. Emma Wilson (Laser Specialist) 🎯
- ✅ Club: RSYS (member)
- ✅ Fleets: Laser, Optimist
- ✅ **6 historical races** (all Laser)
- ✅ Strong class preference
- ✅ Upcoming club events: 1
- **Expected Suggestions**: 5-7

### 4. James Rodriguez (Multi-Club) 🌍
- ✅ Clubs: MYC + RHKYC (member)
- ✅ Fleet: J/70
- ✅ Limited history (newer user)
- ✅ Upcoming club events: 3 (from both clubs)
- **Expected Suggestions**: 4-6

### 5. Coach Anderson (Multi-Club) 🏆
- ✅ Clubs: SFYC + RHKYC (member)
- ✅ Fleets: None (coaching role)
- ✅ Upcoming club events: 3 (from both clubs)
- **Expected Suggestions**: 3-5

## ⚡ Quick Test

1. Login: `sarah.chen@sailing.com` / `sailing123`
2. Navigate to: **Add Race** screen
3. See: Suggestion drawer at top
4. Click: Any suggestion's "Add to Calendar" button
5. Verify: Form auto-fills with race details

## 🔄 Regenerate Suggestions

```bash
npx supabase functions invoke refresh-race-suggestions
```

---
**All passwords**: `sailing123`
