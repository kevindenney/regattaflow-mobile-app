/**
 * Demo data for the Connect tab per interest.
 *
 * Provides realistic peer suggestions, communities, and discussion posts
 * for each non-sailing interest. Sailing uses live data from the database;
 * other interests use this seed data until backend support is added.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DemoPeer {
  id: string;
  name: string;
  subtitle: string;
  avatarInitials: string;
  avatarColor: string;
  stat: string;
  isFollowing: boolean;
}

export interface DemoCommunity {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  icon: string; // Ionicons name
  iconColor: string;
  iconBgColor: string;
  postCount: number;
}

export interface DemoPost {
  id: string;
  communityName: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  title: string;
  body: string;
  postType: 'tip' | 'question' | 'discussion' | 'safety_alert';
  topicTags: { label: string; color: string }[];
  upvotes: number;
  commentCount: number;
  viewCount: number;
  timeAgo: string;
}

export interface InterestConnectData {
  peers: DemoPeer[];
  communities: DemoCommunity[];
  posts: DemoPost[];
  /** Label for the peers section header (e.g., "Nurses to Follow") */
  peersHeader: string;
  /** Placeholder for search (e.g., "Search nurses") */
  searchPlaceholder: string;
}

// ---------------------------------------------------------------------------
// Nursing
// ---------------------------------------------------------------------------

const NURSING_DATA: InterestConnectData = {
  peersHeader: 'Classmates & Preceptors',
  searchPlaceholder: 'Search cohort',
  peers: [
    {
      id: 'nurse-1',
      name: 'Maria Santos',
      subtitle: 'Preceptor · CCRN, MSN · Hopkins ICU',
      avatarInitials: 'MS',
      avatarColor: '#6366F1',
      stat: '12 students mentored',
      isFollowing: false,
    },
    {
      id: 'nurse-2',
      name: 'James Rodriguez',
      subtitle: 'MSN Cohort \'26 · Adult-Gero CNS track',
      avatarInitials: 'JR',
      avatarColor: '#DC2626',
      stat: '38 clinicals logged',
      isFollowing: false,
    },
    {
      id: 'nurse-3',
      name: 'Emily Watson',
      subtitle: 'MSN Cohort \'26 · Pediatric NP track',
      avatarInitials: 'EW',
      avatarColor: '#059669',
      stat: '42 clinicals logged',
      isFollowing: false,
    },
    {
      id: 'nurse-4',
      name: 'Aisha Patel',
      subtitle: 'MSN Cohort \'26 · Family NP track',
      avatarInitials: 'AP',
      avatarColor: '#D97706',
      stat: '35 clinicals logged',
      isFollowing: false,
    },
    {
      id: 'nurse-5',
      name: 'Marcus Thompson',
      subtitle: 'Preceptor · CRNA · Hopkins Bayview',
      avatarInitials: 'MT',
      avatarColor: '#7C3AED',
      stat: '8 students mentored',
      isFollowing: false,
    },
    {
      id: 'nurse-6',
      name: 'Rachel Kim',
      subtitle: 'MSN Cohort \'26 · Nurse-Midwifery track',
      avatarInitials: 'RK',
      avatarColor: '#EC4899',
      stat: '29 clinicals logged',
      isFollowing: false,
    },
    {
      id: 'nurse-7',
      name: 'Dr. Linda Rojas',
      subtitle: 'Faculty · DNP · Clinical Coordinator',
      avatarInitials: 'LR',
      avatarColor: '#0891B2',
      stat: 'JHU SON Faculty',
      isFollowing: false,
    },
  ],
  communities: [
    {
      id: 'comm-nursing-1',
      name: 'JHU MSN Cohort \'26',
      description: 'Your cohort hub — rotation swaps, study sessions, shared notes, and moral support.',
      memberCount: 86,
      icon: 'school-outline',
      iconColor: '#2563EB',
      iconBgColor: '#DBEAFE',
      postCount: 312,
    },
    {
      id: 'comm-nursing-2',
      name: 'Evidence-Based Practice',
      description: 'Discuss research appraisal, PICOT questions, and implementing evidence in clinical rotations.',
      memberCount: 420,
      icon: 'document-text-outline',
      iconColor: '#7C3AED',
      iconBgColor: '#EDE9FE',
      postCount: 178,
    },
    {
      id: 'comm-nursing-3',
      name: 'Clinical Rotation Tips',
      description: 'What to expect at each site, preceptor advice, and how to get the most out of your hours.',
      memberCount: 1640,
      icon: 'compass-outline',
      iconColor: '#059669',
      iconBgColor: '#D1FAE5',
      postCount: 534,
    },
    {
      id: 'comm-nursing-4',
      name: 'Advanced Pharm',
      description: 'Drug interactions, prescribing nuances, and pharmacology study resources for NP students.',
      memberCount: 980,
      icon: 'flask-outline',
      iconColor: '#DC2626',
      iconBgColor: '#FEE2E2',
      postCount: 245,
    },
    {
      id: 'comm-nursing-5',
      name: 'Certification & Boards Prep',
      description: 'ANCC, AANP, and specialty cert study strategies, question banks, and exam day tips.',
      memberCount: 3200,
      icon: 'ribbon-outline',
      iconColor: '#D97706',
      iconBgColor: '#FEF3C7',
      postCount: 890,
    },
    {
      id: 'comm-nursing-6',
      name: 'Patient Safety & Quality',
      description: 'Near-miss reporting, root cause analysis, and quality improvement project ideas.',
      memberCount: 740,
      icon: 'shield-checkmark-outline',
      iconColor: '#0891B2',
      iconBgColor: '#CFFAFE',
      postCount: 156,
    },
  ],
  posts: [
    {
      id: 'post-nursing-1',
      communityName: 'JHU MSN Cohort \'26',
      authorName: 'Aisha Patel',
      authorInitials: 'AP',
      authorColor: '#D97706',
      title: 'Anyone rotating at Sibley Memorial next block? Let\'s coordinate schedules',
      body: 'I just got my Spring placement at Sibley for my FNP clinical hours. Would love to connect with anyone else placed there — we can share parking tips, preceptor intel, and study together between patients.',
      postType: 'discussion',
      topicTags: [
        { label: 'Rotation Planning', color: '#2563EB' },
        { label: 'Cohort \'26', color: '#6366F1' },
      ],
      upvotes: 24,
      commentCount: 11,
      viewCount: 78,
      timeAgo: '2h ago',
    },
    {
      id: 'post-nursing-2',
      communityName: 'Evidence-Based Practice',
      authorName: 'Emily Watson',
      authorInitials: 'EW',
      authorColor: '#059669',
      title: 'PICOT framework for my capstone: feedback on my clinical question?',
      body: 'Working on my DNP capstone proposal. My PICOT: "In hospitalized pediatric patients (P), does nurse-led family education using teach-back (I) compared to standard discharge instructions (C) reduce 30-day readmission rates (O) within 6 months (T)?" Thoughts on feasibility?',
      postType: 'question',
      topicTags: [
        { label: 'Capstone', color: '#7C3AED' },
        { label: 'Research', color: '#059669' },
      ],
      upvotes: 38,
      commentCount: 16,
      viewCount: 290,
      timeAgo: '4h ago',
    },
    {
      id: 'post-nursing-3',
      communityName: 'Clinical Rotation Tips',
      authorName: 'Maria Santos',
      authorInitials: 'MS',
      authorColor: '#6366F1',
      title: 'Preceptor perspective: what makes an MSN student stand out on day one',
      body: 'After mentoring 12 grad students, here\'s what separates the ones who thrive: come with 3 learning goals written down, review your patient list the night before, and ask "Can I try that?" instead of waiting to be invited. The students who own their learning get the best experiences.',
      postType: 'tip',
      topicTags: [
        { label: 'Preceptor Advice', color: '#6366F1' },
        { label: 'Clinical Success', color: '#059669' },
      ],
      upvotes: 142,
      commentCount: 29,
      viewCount: 1840,
      timeAgo: '1d ago',
    },
    {
      id: 'post-nursing-4',
      communityName: 'Advanced Pharm',
      authorName: 'James Rodriguez',
      authorInitials: 'JR',
      authorColor: '#DC2626',
      title: 'Warfarin vs. DOACs decision tree — made a study sheet',
      body: 'Struggling with the anticoagulation prescribing decisions for our pharm final. Made a one-page decision tree covering when to use warfarin vs. apixaban vs. rivaroxaban based on indication, renal function, and drug interactions. Happy to share.',
      postType: 'tip',
      topicTags: [
        { label: 'Pharmacology', color: '#DC2626' },
        { label: 'Study Resources', color: '#2563EB' },
      ],
      upvotes: 67,
      commentCount: 21,
      viewCount: 580,
      timeAgo: '1d ago',
    },
    {
      id: 'post-nursing-5',
      communityName: 'Patient Safety & Quality',
      authorName: 'Dr. Linda Rojas',
      authorInitials: 'LR',
      authorColor: '#0891B2',
      title: 'Reminder: near-miss reporting is learning, not blame — use your BetterAt logs',
      body: 'A student flagged a near-miss during clinical this week and it led to a real process improvement at the site. This is exactly how QI works. Document what you see in your clinical debrief — your observations as students are incredibly valuable because you notice things the unit has normalized.',
      postType: 'safety_alert',
      topicTags: [
        { label: 'Patient Safety', color: '#DC2626' },
        { label: 'Quality Improvement', color: '#0891B2' },
      ],
      upvotes: 94,
      commentCount: 13,
      viewCount: 720,
      timeAgo: '2d ago',
    },
    {
      id: 'post-nursing-6',
      communityName: 'Certification & Boards Prep',
      authorName: 'Rachel Kim',
      authorInitials: 'RK',
      authorColor: '#EC4899',
      title: 'Passed ANCC FNP boards on first attempt — here\'s my 8-week study plan',
      body: 'Just got my results back — passed! Used a combo of Leik review, Fitzgerald audio, and the APEA predictor exams. The biggest game changer was doing 75 practice questions every single day for the last 4 weeks. Full breakdown of my schedule inside.',
      postType: 'tip',
      topicTags: [
        { label: 'ANCC', color: '#D97706' },
        { label: 'Study Plan', color: '#2563EB' },
      ],
      upvotes: 218,
      commentCount: 47,
      viewCount: 4100,
      timeAgo: '3d ago',
    },
  ],
};

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

const DRAWING_DATA: InterestConnectData = {
  peersHeader: 'Artists to Follow',
  searchPlaceholder: 'Search artists',
  peers: [
    {
      id: 'artist-1',
      name: 'Maya Patel',
      subtitle: 'Digital Illustration · Concept Art',
      avatarInitials: 'MP',
      avatarColor: '#7C3AED',
      stat: '180 sessions logged',
      isFollowing: false,
    },
    {
      id: 'artist-2',
      name: 'Lucas Rivera',
      subtitle: 'Charcoal & Graphite · Portraits',
      avatarInitials: 'LR',
      avatarColor: '#374151',
      stat: '240 sessions logged',
      isFollowing: false,
    },
    {
      id: 'artist-3',
      name: 'Sophie Turner',
      subtitle: 'Watercolor · Landscapes',
      avatarInitials: 'ST',
      avatarColor: '#2563EB',
      stat: '310 sessions logged',
      isFollowing: false,
    },
    {
      id: 'artist-4',
      name: 'Kenji Tanaka',
      subtitle: 'Ink & Pen · Urban Sketching',
      avatarInitials: 'KT',
      avatarColor: '#059669',
      stat: '420 sessions logged',
      isFollowing: false,
    },
    {
      id: 'artist-5',
      name: 'Olivia Chen',
      subtitle: 'Oil Painting · Still Life',
      avatarInitials: 'OC',
      avatarColor: '#D97706',
      stat: '150 sessions logged',
      isFollowing: false,
    },
  ],
  communities: [
    {
      id: 'comm-drawing-1',
      name: 'Portrait Fundamentals',
      description: 'Anatomy, proportion, and likeness. Share studies, get feedback on portraits.',
      memberCount: 2800,
      icon: 'person-outline',
      iconColor: '#7C3AED',
      iconBgColor: '#EDE9FE',
      postCount: 198,
    },
    {
      id: 'comm-drawing-2',
      name: 'Daily Sketch Challenge',
      description: 'A new prompt every day. Post your sketch, see what others created.',
      memberCount: 4500,
      icon: 'brush-outline',
      iconColor: '#D97706',
      iconBgColor: '#FEF3C7',
      postCount: 1240,
    },
    {
      id: 'comm-drawing-3',
      name: 'Digital Art Tools',
      description: 'Procreate, Clip Studio, Photoshop — tips, brushes, and workflow discussions.',
      memberCount: 3200,
      icon: 'tablet-portrait-outline',
      iconColor: '#2563EB',
      iconBgColor: '#DBEAFE',
      postCount: 340,
    },
    {
      id: 'comm-drawing-4',
      name: 'Critique Circle',
      description: 'Constructive feedback on your work. Post a piece, receive thoughtful critique.',
      memberCount: 1600,
      icon: 'chatbubble-ellipses-outline',
      iconColor: '#DC2626',
      iconBgColor: '#FEE2E2',
      postCount: 890,
    },
    {
      id: 'comm-drawing-5',
      name: 'Reference & Inspiration',
      description: 'Share reference photos, inspiring artwork, and creative prompts.',
      memberCount: 5200,
      icon: 'image-outline',
      iconColor: '#059669',
      iconBgColor: '#D1FAE5',
      postCount: 670,
    },
  ],
  posts: [
    {
      id: 'post-drawing-1',
      communityName: 'Portrait Fundamentals',
      authorName: 'Lucas Rivera',
      authorInitials: 'LR',
      authorColor: '#374151',
      title: 'The Loomis method vs. Reilly abstraction — which do you prefer for head construction?',
      body: 'I\'ve been using Loomis for years but recently tried the Reilly method and found it helps me capture gesture better. Curious what others prefer and why.',
      postType: 'discussion',
      topicTags: [
        { label: 'Anatomy', color: '#7C3AED' },
        { label: 'Technique', color: '#2563EB' },
      ],
      upvotes: 62,
      commentCount: 28,
      viewCount: 940,
      timeAgo: '3h ago',
    },
    {
      id: 'post-drawing-2',
      communityName: 'Daily Sketch Challenge',
      authorName: 'Maya Patel',
      authorInitials: 'MP',
      authorColor: '#7C3AED',
      title: 'Day 47: "Morning Light" — 30 minute study',
      body: 'Tried to capture the warm light through my kitchen window hitting the fruit bowl. Focused on keeping values simple — only 3 value groups.',
      postType: 'discussion',
      topicTags: [
        { label: 'Daily Sketch', color: '#D97706' },
        { label: 'Values', color: '#059669' },
      ],
      upvotes: 34,
      commentCount: 8,
      viewCount: 420,
      timeAgo: '6h ago',
    },
    {
      id: 'post-drawing-3',
      communityName: 'Digital Art Tools',
      authorName: 'Kenji Tanaka',
      authorInitials: 'KT',
      authorColor: '#059669',
      title: 'Custom brush set for architectural sketching in Procreate',
      body: 'I made a set of 6 brushes that simulate technical pens and felt tips. They\'re great for urban sketching with clean line weights. Free download link inside.',
      postType: 'tip',
      topicTags: [
        { label: 'Procreate', color: '#2563EB' },
        { label: 'Brushes', color: '#374151' },
      ],
      upvotes: 108,
      commentCount: 19,
      viewCount: 2100,
      timeAgo: '1d ago',
    },
    {
      id: 'post-drawing-4',
      communityName: 'Critique Circle',
      authorName: 'Sophie Turner',
      authorInitials: 'ST',
      authorColor: '#2563EB',
      title: 'Feedback request: watercolor landscape — struggling with atmospheric perspective',
      body: 'The foreground feels right but my background mountains keep looking too saturated and don\'t recede. I\'ve tried diluting more but lose detail. Any suggestions?',
      postType: 'question',
      topicTags: [
        { label: 'Watercolor', color: '#2563EB' },
        { label: 'Critique', color: '#DC2626' },
      ],
      upvotes: 22,
      commentCount: 14,
      viewCount: 380,
      timeAgo: '1d ago',
    },
  ],
};

// ---------------------------------------------------------------------------
// Fitness
// ---------------------------------------------------------------------------

const FITNESS_DATA: InterestConnectData = {
  peersHeader: 'Athletes to Follow',
  searchPlaceholder: 'Search athletes',
  peers: [
    {
      id: 'athlete-1',
      name: 'Alex Turner',
      subtitle: 'Strength Training · Powerlifting',
      avatarInitials: 'AT',
      avatarColor: '#DC2626',
      stat: '520 workouts logged',
      isFollowing: false,
    },
    {
      id: 'athlete-2',
      name: 'Jordan Kim',
      subtitle: 'Distance Running · Marathon',
      avatarInitials: 'JK',
      avatarColor: '#2563EB',
      stat: '380 workouts logged',
      isFollowing: false,
    },
    {
      id: 'athlete-3',
      name: 'Sofia Martinez',
      subtitle: 'CrossFit · HIIT',
      avatarInitials: 'SM',
      avatarColor: '#D97706',
      stat: '290 workouts logged',
      isFollowing: false,
    },
    {
      id: 'athlete-4',
      name: 'Ryan Okafor',
      subtitle: 'Calisthenics · Bodyweight',
      avatarInitials: 'RO',
      avatarColor: '#059669',
      stat: '440 workouts logged',
      isFollowing: false,
    },
    {
      id: 'athlete-5',
      name: 'Mia Chang',
      subtitle: 'Yoga · Mobility',
      avatarInitials: 'MC',
      avatarColor: '#7C3AED',
      stat: '610 workouts logged',
      isFollowing: false,
    },
    {
      id: 'athlete-6',
      name: 'Chris Hensley',
      subtitle: 'Olympic Lifting · Strength',
      avatarInitials: 'CH',
      avatarColor: '#374151',
      stat: '350 workouts logged',
      isFollowing: false,
    },
  ],
  communities: [
    {
      id: 'comm-fitness-1',
      name: 'Strength & Power',
      description: 'Programming, form checks, and PR celebrations for lifters of all levels.',
      memberCount: 4200,
      icon: 'barbell-outline',
      iconColor: '#DC2626',
      iconBgColor: '#FEE2E2',
      postCount: 890,
    },
    {
      id: 'comm-fitness-2',
      name: 'Running Community',
      description: 'Training plans, race reports, and gear reviews for runners.',
      memberCount: 6100,
      icon: 'walk-outline',
      iconColor: '#2563EB',
      iconBgColor: '#DBEAFE',
      postCount: 1340,
    },
    {
      id: 'comm-fitness-3',
      name: 'Nutrition & Recovery',
      description: 'Meal prep ideas, supplement discussions, and recovery protocols.',
      memberCount: 3800,
      icon: 'nutrition-outline',
      iconColor: '#059669',
      iconBgColor: '#D1FAE5',
      postCount: 420,
    },
    {
      id: 'comm-fitness-4',
      name: 'Form Check',
      description: 'Post videos for form feedback. Prevent injuries, lift better.',
      memberCount: 2900,
      icon: 'videocam-outline',
      iconColor: '#D97706',
      iconBgColor: '#FEF3C7',
      postCount: 780,
    },
    {
      id: 'comm-fitness-5',
      name: 'Injury Prevention',
      description: 'Mobility work, prehab exercises, and coming back from injuries.',
      memberCount: 1800,
      icon: 'bandage-outline',
      iconColor: '#7C3AED',
      iconBgColor: '#EDE9FE',
      postCount: 210,
    },
  ],
  posts: [
    {
      id: 'post-fitness-1',
      communityName: 'Strength & Power',
      authorName: 'Alex Turner',
      authorInitials: 'AT',
      authorColor: '#DC2626',
      title: 'Hit a 200kg deadlift PR after switching to sumo — here\'s what changed',
      body: 'After 2 years stuck at 185kg conventional, I switched to sumo 6 months ago. The key wasn\'t just the stance — it was the hip mobility work I had to do first.',
      postType: 'discussion',
      topicTags: [
        { label: 'Deadlift', color: '#DC2626' },
        { label: 'PR', color: '#D97706' },
      ],
      upvotes: 124,
      commentCount: 38,
      viewCount: 2800,
      timeAgo: '4h ago',
    },
    {
      id: 'post-fitness-2',
      communityName: 'Running Community',
      authorName: 'Jordan Kim',
      authorInitials: 'JK',
      authorColor: '#2563EB',
      title: 'Sub-3:30 marathon training plan — 16 weeks, 5 days/week',
      body: 'Sharing the plan that got me from 3:45 to 3:28. Key insight: the 80/20 easy/hard split is real. I was running too fast on easy days for years.',
      postType: 'tip',
      topicTags: [
        { label: 'Marathon', color: '#2563EB' },
        { label: 'Training Plan', color: '#059669' },
      ],
      upvotes: 89,
      commentCount: 22,
      viewCount: 1900,
      timeAgo: '8h ago',
    },
    {
      id: 'post-fitness-3',
      communityName: 'Form Check',
      authorName: 'Sofia Martinez',
      authorInitials: 'SM',
      authorColor: '#D97706',
      title: 'Squat form check — is my butt wink a problem at this depth?',
      body: 'I\'ve been told I have butt wink at the bottom of my squat but I\'m not sure if it\'s actually causing issues. Currently squatting 100kg pain-free.',
      postType: 'question',
      topicTags: [
        { label: 'Squat', color: '#DC2626' },
        { label: 'Form Check', color: '#D97706' },
      ],
      upvotes: 45,
      commentCount: 31,
      viewCount: 1200,
      timeAgo: '1d ago',
    },
    {
      id: 'post-fitness-4',
      communityName: 'Injury Prevention',
      authorName: 'Mia Chang',
      authorInitials: 'MC',
      authorColor: '#7C3AED',
      title: 'Shoulder impingement: the 3 exercises that fixed mine',
      body: 'After 4 months of shoulder pain during overhead pressing, these 3 exercises from my physio completely resolved it. Face pulls, band pull-aparts, and...',
      postType: 'tip',
      topicTags: [
        { label: 'Rehab', color: '#7C3AED' },
        { label: 'Shoulders', color: '#2563EB' },
      ],
      upvotes: 201,
      commentCount: 44,
      viewCount: 4200,
      timeAgo: '2d ago',
    },
    {
      id: 'post-fitness-5',
      communityName: 'Nutrition & Recovery',
      authorName: 'Ryan Okafor',
      authorInitials: 'RO',
      authorColor: '#059669',
      title: 'Creatine timing: does it actually matter?',
      body: 'I\'ve been taking creatine post-workout for years but just read a study saying timing doesn\'t matter. Anyone notice a difference?',
      postType: 'question',
      topicTags: [
        { label: 'Supplements', color: '#059669' },
        { label: 'Recovery', color: '#7C3AED' },
      ],
      upvotes: 56,
      commentCount: 29,
      viewCount: 1600,
      timeAgo: '2d ago',
    },
  ],
};

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

const CONNECT_DATA_BY_INTEREST: Record<string, InterestConnectData> = {
  nursing: NURSING_DATA,
  drawing: DRAWING_DATA,
  fitness: FITNESS_DATA,
};

/**
 * Get demo Connect tab data for a given interest slug.
 * Returns null for sail-racing (which uses live data).
 */
export function getConnectDemoData(interestSlug: string): InterestConnectData | null {
  return CONNECT_DATA_BY_INTEREST[interestSlug] ?? null;
}
