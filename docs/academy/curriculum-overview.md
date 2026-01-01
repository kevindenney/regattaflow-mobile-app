# RegattaFlow Racing Academy - Complete Curriculum

**Version**: 1.0  
**Last Updated**: 2025-01-11  
**Status**: Active Development

---

## Mission Statement

RegattaFlow Racing Academy transforms competitive sailing education through interactive, mobile-first learning experiences. We combine championship-level tactical knowledge with cutting-edge React Native animations to create lessons that sailors can practice anywhere, anytime—on their phone, tablet, or computer.

Our mission is to make world-class racing instruction accessible to sailors at every level, from club racers to Olympic hopefuls, through engaging interactive lessons that bridge the gap between theory and on-water execution.

---

## Technical Architecture

### Core Technology Stack

**Animation Engine**: React Native Reanimated (NOT Lottie)
- **Why Reanimated**: Full programmatic control, better performance, native feel
- **Why NOT Lottie**: Lottie files are large, harder to customize, and don't integrate well with React Native state management
- **Performance**: 60 FPS animations, smooth on mobile devices
- **Customization**: Easy to modify animations based on user interactions and lesson state

**Graphics**: React Native SVG
- **Why SVG**: Scalable, lightweight, programmatically controllable
- **Components**: Custom SVG components for boats, marks, wind indicators, course layouts
- **Interactivity**: SVG elements respond to user input and animation state
- **Reusability**: Shared SVG components across lessons (TopDownSailboatSVG, PowerboatSVG, etc.)

**Audio**: Expo AV (optional)
- Horn sounds for starting sequences
- Sound effects for feedback
- Background music (optional, user-controlled)

**State Management**: React Hooks + Reanimated Shared Values
- Step-based progression through lessons
- Animated values for smooth transitions
- Timeline scrubbing with custom sliders

### Component Structure

```
components/learn/interactives/
├── [LessonName]Interactive.tsx      # Main interactive component
├── data/
│   └── [lessonName]Data.ts         # Step definitions, quiz questions, deep dive content
└── shared/                          # Reusable components
    ├── TopDownSailboatSVG.tsx      # Boat graphics
    ├── PowerboatSVG.tsx            # Committee boat
    ├── CustomTimelineSlider.tsx    # Timeline controls
    └── StartProcedurePanel.tsx     # UI panels
```

### Registration System

All interactive components are registered in `InteractivePlayer.tsx`:

```typescript
const INTERACTIVE_COMPONENTS = {
  'StartingSequenceInteractive': StartingSequenceInteractive,
  'LineBiasInteractive': LineBiasInteractive,
  // ... more components
};
```

Lessons reference components by name in the database:
```json
{
  "lesson_type": "interactive",
  "interactive_component": "StartingSequenceInteractive"
}
```

---

## Market Segments

### 1. Individual Sailors (B2C)

**Target**: Competitive sailors seeking to improve race performance

**Pricing**:
- Free tier: 1 course (Racing Basics)
- Sailor tier: $30/year - Access to Level 1 & 2 courses
- Academy tier: $75/year - All courses + certificates
- Championship tier: $49/month or $450/year - Everything + AI coaching integration

**Value Proposition**: 
- Learn at your own pace
- Practice tactics before race day
- Earn certificates to showcase skills
- Integrate with RegattaFlow race planning tools

### 2. Sailing Clubs (B2B)

**Target**: Clubs wanting to improve member racing skills

**Packages**:
- **Junior Program**: $2,000/year - 50 user licenses, Level 1-2 courses, progress tracking
- **Club Racing**: $3,000/year - Unlimited users, all courses, custom branding
- **Championship Club**: $5,000/year - Everything + custom content, coach access

**Value Proposition**:
- Improve club racing quality
- Standardized training across members
- Track member progress
- Reduce need for expensive in-person coaching

### 3. Universities & Colleges (B2B)

**Target**: Collegiate sailing teams

**Package**: University Team - $3,000/year
- 20 user licenses
- All courses
- Team progress dashboard
- Integration with race planning tools

**Value Proposition**:
- Supplement limited practice time
- Consistent training across team
- Data-driven skill development
- Competitive advantage

### 4. Professional Coaches (B2B)

**Target**: Coaches wanting to enhance their programs

**Features**:
- Assign courses to students
- Track student progress
- Use lessons in coaching sessions
- White-label options

**Revenue Share**: Coaches can resell courses with revenue share model

---

## Learning Philosophy

### Interactive Over Passive

**Problem**: Traditional sailing education relies on:
- Static diagrams in books
- YouTube videos (passive watching)
- Expensive on-water coaching (limited availability)

**Solution**: Interactive lessons where sailors:
- **Control** the animation timeline
- **See** cause and effect in real-time
- **Practice** decision-making through quizzes
- **Understand** through step-by-step explanations

### Mobile-First Design

- **Accessibility**: Learn on phone, tablet, or computer
- **Offline Support**: Download lessons for use without internet
- **Practice Anywhere**: Review tactics before races, during travel, at home

### Progressive Skill Building

**Level 1: Fundamentals** (Beginner)
- Racing rules basics
- Boat handling fundamentals
- Basic tactics

**Level 2: Intermediate** (Club Racer)
- Starting line strategy
- Wind shift tactics
- Downwind speed
- Race management

**Level 3: Advanced** (Championship Level)
- Advanced starting techniques
- Tidal strategy
- Boat tuning
- Fleet management

**Specializations** (Expert)
- Team racing
- Match racing
- Distance racing
- Olympic classes

### Integration with RegattaFlow Platform

Lessons connect to:
- **AI Skills**: Claude skills provide personalized coaching based on lesson concepts
- **Race Planning**: Apply learned tactics in race strategy generation
- **Post-Race Analysis**: AI coaching references lesson concepts
- **Venue Intelligence**: Lessons contextualized for specific venues

---

## Content Format Standards

### Lesson Structure

Each interactive lesson follows this structure:

1. **Introduction** (30-60 seconds)
   - What you'll learn
   - Why it matters
   - Real-world application

2. **Step-by-Step Animation** (5-15 minutes)
   - Progressive revelation of concepts
   - User controls timeline (play/pause/scrub)
   - Visual highlights and annotations
   - Pro tips at key moments

3. **Interactive Quiz** (2-5 minutes)
   - 3-5 questions testing understanding
   - Immediate feedback
   - Explanations for each answer
   - Hints available

4. **Deep Dive** (Optional, 5-10 minutes)
   - Advanced concepts
   - Common mistakes
   - Pro tips compilation
   - Further reading/resources

### Step Data Format

```typescript
interface LessonStep {
  time: number;              // Timeline position (seconds)
  label: string;             // Step title
  description: string;       // Main explanation
  visualState?: {            // Animation state
    wind?: { rotate: number };
    boats?: Array<{ x: number; y: number; rotate: number }>;
    marks?: Array<{ x: number; y: number; type: string }>;
  };
  details?: string[];        // Bullet points
  proTip?: string;           // Key insight
}
```

### Quiz Format

```typescript
interface QuizQuestion {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  hint?: string;
}
```

---

## Example Interactive Lessons

### 1. Starting Sequence (5-4-1-0)

**Component**: `StartingSequenceInteractive`

**What It Teaches**:
- Understanding the 5-4-1-0 minute sequence
- Flag signals and their meanings
- Horn timing
- Boat positioning during sequence

**Interactive Features**:
- Animated timeline showing sequence progression
- Visual flag changes
- Boat movements during sequence
- Audio horn sounds
- Quiz on sequence timing

**Technical Implementation**:
- Reanimated timeline with scrubbing
- SVG flags that change state
- Animated boat positions
- Expo AV for horn sounds

### 2. Line Bias Fundamentals

**Component**: `LineBiasInteractive`

**What It Teaches**:
- What line bias means
- How to detect line bias
- Why it matters (quantified advantage)
- How to check bias before starts

**Interactive Features**:
- Animated wind shifts
- Boat position comparisons
- Visual demonstration of advantage
- Compass method demonstration
- Head-to-wind sight method

**Technical Implementation**:
- Animated wind direction changes
- Boat path calculations
- Distance advantage visualization
- Interactive compass tool

### 3. Timed Run Approach

**Component**: `TimedRunInteractive`

**What It Teaches**:
- How to time your approach to the line
- Calculating boat speed
- Executing the perfect start
- Common mistakes to avoid

**Interactive Features**:
- Boat speed calculation
- Countdown timer
- Line approach visualization
- Success/failure scenarios

---

## Production Workflow

### 1. Content Planning (1-2 weeks)

- Define learning objectives
- Outline lesson steps
- Identify key visualizations needed
- Plan quiz questions
- Write deep dive content

### 2. Data File Creation (1-2 days)

- Create step data file (`data/[lessonName]Data.ts`)
- Define all steps with descriptions
- Add visual state definitions
- Write quiz questions
- Add deep dive content

### 3. Component Development (1-2 weeks)

- Build interactive component
- Implement animations with Reanimated
- Create SVG graphics
- Add timeline controls
- Integrate quiz
- Test on mobile/tablet/desktop

### 4. Registration & Integration (1 day)

- Register component in `InteractivePlayer.tsx`
- Add to course database
- Test in lesson player
- Add to landing page demo (optional)

### 5. Quality Assurance (3-5 days)

- Test on multiple devices
- Verify animations are smooth
- Check quiz logic
- Review content accuracy
- Get sailor feedback

### 6. Launch (1 day)

- Publish course
- Update marketing materials
- Announce to users

---

## Asset Requirements

### SVG Components

**Boat Graphics**:
- Top-down sailboat view (various angles)
- Side-view sailboat (for certain lessons)
- Powerboat (committee boat)
- Different boat classes (optional)

**Course Elements**:
- Start line (committee boat + pin)
- Windward mark
- Leeward gate (two marks)
- Finish line
- Course boundaries

**Environmental Elements**:
- Wind arrows (animated)
- Current indicators
- Depth contours (for tidal lessons)
- Wave patterns (optional)

**UI Elements**:
- Timeline slider
- Progress indicators
- Quiz answer buttons
- Navigation controls

### Audio Assets

- Horn sounds (short, long, multiple blasts)
- Success sounds (quiz correct)
- Error sounds (quiz incorrect)
- Background music (optional, user-controlled)

### Image Assets

- Course thumbnails (800x600px)
- Instructor photos (400x400px)
- Certificate templates
- Marketing images

---

## Success Metrics

### Engagement Metrics

- **Completion Rate**: Target 60%+ (industry average: 40-50%)
- **Time per Lesson**: Average 15-20 minutes
- **Quiz Pass Rate**: 80%+ on first attempt
- **Repeat Views**: 30%+ watch lessons multiple times

### Learning Outcomes

- **Skill Improvement**: Pre/post lesson assessments
- **Application**: Usage of concepts in race planning
- **Retention**: Follow-up quizzes 1 week after completion

### Business Metrics

- **Course Enrollment**: Track by tier
- **Certificate Completion**: Number earned
- **Upgrade Conversion**: Free → Paid after completing free course
- **Institutional Sales**: Number of club/university packages sold

### Platform Integration

- **AI Skill Usage**: Correlation between lesson completion and AI coaching usage
- **Race Planning**: Application of lesson concepts in strategy generation
- **Venue Intelligence**: Cross-referencing lesson concepts with venue data

---

## Certification System

### Certificate Types

**Course Completion Certificates**:
- Issued upon completing all lessons in a course
- Includes course name, completion date
- Shareable on social media
- Downloadable PDF

**Level Certificates**:
- Issued upon completing all courses in a level
- Example: "Level 2: Intermediate Racing" certificate
- Higher prestige, more detailed

**Specialization Certificates**:
- For specialized courses (Team Racing, Match Racing, etc.)
- Advanced credentials
- Required for certain coaching programs

### Certificate Features

- **Verification**: Unique certificate ID, verifiable online
- **Design**: Professional, printable
- **Sharing**: Social media integration
- **Portfolio**: User profile shows all certificates
- **Progress Tracking**: Visual progress toward next certificate

### Integration with Coaching

- Coaches can see student certificates
- Certificates unlock advanced coaching content
- Required for certain RegattaFlow features (e.g., AI coaching tiers)

---

## AI Skill Integration

### Connected Skills

Lessons integrate with RegattaFlow's Claude AI skills:

**Starting Line Lessons** → `start-line-tactician` skill
- Lesson concepts inform AI strategy generation
- AI coaching references lesson techniques

**Wind Shift Lessons** → `wind-shift-predictor` skill
- AI uses lesson concepts to explain shifts
- Lesson practice improves AI recommendations

**Mark Rounding Lessons** → `mark-rounding-coach` skill
- AI coaching applies lesson techniques
- Lesson visualization helps understand AI advice

**Tidal Strategy Lessons** → `tidal-opportunism-analyst` skill
- AI strategy incorporates lesson concepts
- Lesson examples contextualize AI analysis

### Learning Loop

1. **Learn** in interactive lesson
2. **Practice** with AI coaching in race planning
3. **Apply** in actual races
4. **Review** with post-race AI analysis
5. **Improve** by revisiting lessons

---

## Future Enhancements

### Phase 2 Features

- **Multiplayer Practice**: Race against other learners
- **AR Integration**: Overlay lessons on real-world views
- **Video Integration**: Combine interactive lessons with video content
- **Community Features**: Discussion forums, study groups
- **Adaptive Learning**: AI adjusts lesson difficulty based on performance

### Phase 3 Features

- **Live Coaching Integration**: Coaches can assign and track lessons
- **Custom Content**: Clubs can create custom lessons
- **Advanced Analytics**: Detailed learning analytics dashboard
- **Mobile App**: Dedicated Racing Academy app
- **Offline Mode**: Full offline lesson access

---

## Conclusion

RegattaFlow Racing Academy represents a new paradigm in sailing education: interactive, mobile-first, and deeply integrated with race planning tools. By combining championship-level knowledge with cutting-edge React Native animations, we're making world-class racing instruction accessible to sailors everywhere.

The technical architecture (Reanimated + SVG) provides the flexibility and performance needed for engaging lessons, while the integration with RegattaFlow's AI coaching creates a complete learning ecosystem.

**Next Steps**: See `implementation-roadmap.md` for development timeline and `animation-development-guide.md` for technical implementation details.

