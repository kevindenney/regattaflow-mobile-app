# BetterAt — Demo Walkthrough

*For Patrick Whitney, in preparation for the JHU School of Nursing demo*

---

## Quick Summary

The demo has three acts:

1. **The Pitch** — Public web pages, not logged in. Show what BetterAt is, how the model works, and what the nursing interest looks like from the outside.
2. **The Student Experience** — Log in as a JHU nursing student. Walk the timeline, see peers, discover programs, track competency.
3. **Platform Versatility** — Show a completely different user (rural Indian artisan) using the same engine via Telegram and web.

---

## Key Concepts (for Patrick's reference)

| Concept | What it is | Examples |
|---------|-----------|----------|
| **Interest** | The domain you're working in | Nursing, Lac Craft Business, Food Processing, Sailing |
| **Blueprint** | A published step-by-step guide | MSN curriculum, MUDRA loan walkthrough, race prep checklist |
| **Timeline** | Your personal steps with status tracking | 7 clinical semesters, 5 loan application steps |
| **Organization** | Institution that publishes blueprints | Johns Hopkins, PRADAN, a yoga studio |

### The Vocabulary Engine

The same app adapts its language to each domain:

| Universal | Nursing | Indian Entrepreneur | Sailing |
|-----------|---------|-------------------|---------|
| Learning Event | Clinical | Activity | Race |
| Coach | Preceptor | Field Coordinator | Sailing Coach |
| Institution | Clinical Site | Organization | Yacht Club |
| Practice | Skills Lab | Activity | Practice Session |
| Community | Forum | Self-Help Group | Fleet Forum |
| Equipment | Clinical Gear | Tools & Materials | Boat/Sails |

### The "Aha" Moment

> The same platform serves a Johns Hopkins nursing student tracking clinical rotations AND a rural Indian woman applying for a ₹50,000 government loan via Telegram. The engine is identical — only the vocabulary, content, and community differ.

---

## Act 1: The Pitch (Public Web — Not Logged In)

*Start here. Don't log in yet. Show what a visitor or the Dean would see.*

| # | What to show | URL / Action | What to say |
|---|-------------|-------------|-------------|
| 1 | **Landing page** | `/` | "This is BetterAt. You pick an interest — nursing, crafts, sailing, fitness — and the platform gives you structure, community, and coaching to improve. Notice the breadth: Healthcare, Creative Arts, Livelihoods & Enterprise, Sports. Sixteen interests and growing." |
| 2 | **Search** | Type "nursing" in the search bar | "Users can search for interests, organizations, or people. Type 'nursing' — Johns Hopkins School of Nursing comes up immediately." |
| 3 | **How It Works** | `/how-it-works` | "The model is Plan, Do, Review — three phases that apply to every discipline. Look at the vocabulary table: the same universal concepts get different words depending on the domain. 'Clinical Shift' in nursing, 'Activity' in lac craft, 'Race' in sailing. Same engine underneath." |
| 4 | **Nursing interest page** | `/nursing` | "This is what a nursing-specific experience looks like from the outside. Johns Hopkins School of Nursing is the anchor institution. Four degree programs published as blueprints. Students Aisha and Carlos are at different stages in the MSN curriculum. Peer timelines are visible." |
| 5 | **Org page** | Click "Johns Hopkins School of Nursing" | "Four programs: MSN Entry into Nursing, DNP Family Nurse Practitioner, DNP Psychiatric Mental Health, and Healthcare Organizational Leadership. Each is a structured curriculum with real student progress visible." |

---

## Act 2: The Student Experience (Log In as Kevin)

*Now show what it's like inside the app as a JHU nursing student.*

**Login:** `denneyke@gmail.com` (Kevin's account, nursing interest active)

| # | What to show | URL / Action | What to say |
|---|-------------|-------------|-------------|
| 6 | **Student timeline** | Log in → Activity/Clinical tab | "As a student, my timeline shows where I am in the curriculum. Notice the vocabulary — it says 'Clinical' not 'Race', 'Preceptor' not 'Coach', 'Skills Lab' not 'Practice'. The app feels built for nursing." |
| 7 | **Peer timelines** | Show peer students in timeline | "I can see my cohort — Maya is in Semester 2, Jordan in Semester 4, Priya is finishing her Capstone. Peer visibility drives accountability. Students see who's ahead, who's struggling, who to learn from." |
| 8 | **For You / Subscribe** | Show the For You section on timeline | "New students see 'For You' suggestions — JHU's published programs appear here. One tap to subscribe and the full curriculum lands on their timeline. No manual enrollment spreadsheets." |
| 9 | **Blueprint publishing** | Show a blueprint detail page | "The Dean or Program Director publishes curricula as blueprints. Students subscribe with one tap. Progress is tracked automatically. The school sees who subscribed, who's on track, who's falling behind." |
| 10 | **Competency tracking** | Show a step's Review tab | "Each step can track competency evidence. Did the student demonstrate the planned clinical skills? The preceptor and the student both log observations. Over time, this builds a clinical portfolio." |
| 11 | **Community** | Discover > People / Connect tab | "Six communities: MSN Cohort '26, Evidence-Based Practice, Clinical Rotation Tips, Advanced Pharm, Boards Prep, Patient Safety & Quality. Students share tips, research questions, and study resources." |
| 12 | **The ask** | — | "We want Johns Hopkins to be our first institutional partner for nursing. Students get structured progress tracking, peer visibility, and competency assessment. The Dean gets adoption metrics, curriculum engagement data, and a modern platform that meets students where they are." |

### Setup: Seed nursing peers (if not already done)

```bash
source .env.local && DEMO_PASSWORD=$DEMO_PASSWORD npx tsx scripts/seed-nursing-peers.ts --user-email denneyke@gmail.com
```

This creates 5 peer nursing students at different stages in the MSN curriculum so the peer timeline view is populated.

---

## Act 3: Platform Versatility (India Demo — Telegram + Web)

*Show this last. It proves BetterAt isn't a nursing-only tool — it's a universal engine.*

### Setup: Switch Telegram account

```bash
# Switch Telegram to Savitri (Indian entrepreneur)
source .env.local && node -e "
const{createClient}=require('@supabase/supabase-js');
const sb=createClient(process.env.SUPABASE_URL||process.env.EXPO_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('telegram_links').update({user_id:'f160779d-5a54-465e-a0f9-b97b94f6a475'}).eq('telegram_user_id',8266922334).then(r=>console.log(r.error?.message||'Telegram → Savitri'));
"

# Switch Telegram back to Kevin (after demo)
source .env.local && node -e "
const{createClient}=require('@supabase/supabase-js');
const sb=createClient(process.env.SUPABASE_URL||process.env.EXPO_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('telegram_links').update({user_id:'d67f765e-7fe6-4f79-b514-f1b7f9a1ba3f'}).eq('telegram_user_id',8266922334).then(r=>console.log(r.error?.message||'Telegram → Kevin'));
"
```

### Part A: Telegram (lead with this)

| # | Action | What to say |
|---|--------|-------------|
| 13 | **Set the scene** (before opening Telegram) | "Now let me show you a completely different user. Savitri is a lac bangle artisan in Khunti, Jharkhand — rural India. She makes bangles from tree resin and wants to grow her business. She needs a government micro-loan first. She doesn't have a laptop. She has an Android phone with Telegram." |
| 14 | **Send:** "What do I need to do next?" | "She asks the bot what's next. The AI knows her context — her name, her interest (Lac Craft Business), her location (Khunti, Jharkhand), her organization (PRADAN). It gives locally relevant advice, not generic responses." |
| 15 | **Send:** "I got my passport photos taken today in Khunti town" | "She reports progress via chat. The bot logs this as an observation on her 'Gather MUDRA documents' step and marks the passport photos sub-step as done. Her web timeline updates automatically." |
| 16 | **Send a photo** of any document | "She can send photos as evidence — a bank receipt, her Aadhaar card, the loan application form. The bot attaches it to the relevant step. Her field coordinator at PRADAN can see this evidence on the web." |
| 17 | **Send:** "I want to start selling mango pickle from home" | "She's branching out. The bot creates a new step on her timeline. Notice it suggests Jharkhand-specific resources — the weekly haat in Khunti, FSSAI registration at the block office — because it knows her location." |

### Part B: Web (show what Telegram creates)

| # | What to show | URL / Action | What to say |
|---|-------------|-------------|-------------|
| 18 | **Savitri's timeline** | Login as `demo-savitri@betterat.app`, Activity tab | "Everything she did in Telegram is here. Steps with mixed statuses — some completed, some in progress, the new pickle step she just created. The tab says 'Activity' not 'Clinical' — different vocabulary, different domain." |
| 19 | **Step detail** | Tap "Gather your MUDRA documents" | "Sub-steps with checkmarks. The photo she sent from Telegram is attached as evidence. Her observation note is logged. A field coordinator reviewing her progress sees all of this." |
| 20 | **Interest page** | `/lac-craft-business` | "This is the Lac Craft Business interest. PRADAN — an NGO that works with rural entrepreneurs — published 4 blueprints: MUDRA loan walkthrough, Mukhyamantri state scheme, SHG benefits, and business growth guide." |
| 21 | **Peers** | Discover > People tab | "Her self-help group peers are here. Phulmani already completed her MUDRA loan and is finding shop buyers in Ranchi. Champa is applying for a bigger ₹5 lakh scheme. Basanti just started. They learn from each other — just like the nursing students." |
| 22 | **Other interests** | Browse `/food-processing` then `/textile-weaving` | "Same platform, different interests under 'Livelihoods & Enterprise'. PRADAN also published guides for food processing — puffed rice, pickles, FSSAI — and textile weaving — tasar silk, handloom, government schemes for weavers." |

### Closing

> "One platform. A nursing student at Johns Hopkins tracking her clinical rotations. A lac bangle artisan in rural India applying for a government loan via Telegram. The vocabulary, the content, and the community are completely different. The engine underneath is identical. That's BetterAt."

---

## Pre-Demo Checklist

- [ ] Dev server running (`npm start`) or use deployed URL
- [ ] Landing page loads at `/` with interest catalog and search bar
- [ ] `/how-it-works` shows Three Phases and Vocabulary table
- [ ] `/nursing` shows JHU programs and student timelines
- [ ] Test login: `denneyke@gmail.com` — nursing interest active, peer students visible
- [ ] Test login: `demo-savitri@betterat.app` — lac craft timeline with mixed-status steps
- [ ] Telegram linked to Savitri (run switch command above)
- [ ] Nursing peers seeded for Kevin's account (run seed script if needed)
- [ ] `DEMO_PASSWORD` env var is set
- [ ] Telegram bot is responsive (send a test message)
- [ ] Both `/nursing` and `/lac-craft-business` interest pages load with orgs and blueprints

## Quick Reference: Demo Accounts

| Account | Email | Interest | Role |
|---------|-------|----------|------|
| Kevin | `denneyke@gmail.com` | Nursing | Student (JHU demo) |
| Savitri | `demo-savitri@betterat.app` | Lac Craft Business | Entrepreneur (India demo) |

## Quick Reference: Telegram Switch

```bash
# → Savitri
source .env.local && node -e "const{createClient:c}=require('@supabase/supabase-js');c(process.env.SUPABASE_URL||process.env.EXPO_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY).from('telegram_links').update({user_id:'f160779d-5a54-465e-a0f9-b97b94f6a475'}).eq('telegram_user_id',8266922334).then(r=>console.log(r.error?.message||'→ Savitri'))"

# → Kevin
source .env.local && node -e "const{createClient:c}=require('@supabase/supabase-js');c(process.env.SUPABASE_URL||process.env.EXPO_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY).from('telegram_links').update({user_id:'d67f765e-7fe6-4f79-b514-f1b7f9a1ba3f'}).eq('telegram_user_id',8266922334).then(r=>console.log(r.error?.message||'→ Kevin'))"
```
