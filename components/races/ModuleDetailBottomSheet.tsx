/**
 * ModuleDetailBottomSheet - AI-Powered Module Learning Workspace
 *
 * Each module tile opens into an experiential learning environment where
 * students actively prepare for their shift/session/workout. Not a static
 * info page — a living workspace that:
 *
 * 1. YOUR PLAN — Student inputs their unique approach, ideas, clinical reasoning
 * 2. AI COACH — Contextual prompts that build on past experience + community knowledge
 * 3. FROM YOUR NETWORK — Insights from preceptors, peers, people they follow
 * 4. YOUR HISTORY — What they documented in past shifts for this module
 *
 * The AI Coach isn't generic advice — it references the student's actual
 * past performance, flags gaps, asks Socratic questions, and surfaces
 * what experienced practitioners in their network have shared.
 */

import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { X } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetScrollView,
} from '@/components/ui/actionsheet';
import type { InterestEventConfig } from '@/types/interestEventConfig';

// =============================================================================
// COLORS
// =============================================================================

const C = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  indigo: '#5856D6',
  teal: '#0D9488',
  pink: '#FF2D55',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  bg: '#FFFFFF',
  coachBg: '#FFF8E1',    // warm AI coach
  coachBorder: '#FFE082',
  networkBg: '#E8F5E9',
  networkBorder: '#A5D6A7',
  historyBg: '#E3F2FD',
  historyBorder: '#90CAF9',
  warnBg: '#FFF3E0',
  warnBorder: '#FFCC80',
};

// Module accent colors
const MODULE_COLORS: Record<string, string> = {
  patient_overview: C.blue,
  medications: C.orange,
  procedures: C.indigo,
  clinical_objectives: C.pink,
  checklist: C.teal,
  lab_values: C.green,
  care_plan: C.purple,
  unit_protocols: C.red,
  preceptor_goals: C.blue,
  drug_reference: C.orange,
  share_with_preceptor: C.indigo,
  competency_log: C.pink,
  learning_notes: C.teal,
  preceptor_feedback: C.green,
  clinical_hours: C.purple,
  time_log: C.red,
};

// Icon mapping (mirrors ConfigDrivenPhaseContent)
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  'checkbox-marked-outline': LucideIcons.ListChecks,
  'lightbulb-outline': LucideIcons.Lightbulb,
  'share-variant': LucideIcons.Share2,
  'message-text': LucideIcons.MessageSquare,
  'clock-outline': LucideIcons.Clock,
  'clipboard-text': LucideIcons.ClipboardList,
  people: LucideIcons.Users,
  medkit: LucideIcons.Heart,
  bandage: LucideIcons.Activity,
  ribbon: LucideIcons.Award,
  flask: LucideIcons.FlaskConical,
  'shield-check': LucideIcons.ShieldCheck,
  school: LucideIcons.GraduationCap,
  pill: LucideIcons.Pill,
  trophy: LucideIcons.Trophy,
  timer: LucideIcons.Timer,
  time: LucideIcons.Clock,
  images: LucideIcons.Image,
  grid: LucideIcons.Grid3x3,
  'color-wand': LucideIcons.Wand2,
  construct: LucideIcons.Hammer,
  'color-palette': LucideIcons.Palette,
  contrast: LucideIcons.Contrast,
  person: LucideIcons.User,
  stopwatch: LucideIcons.Timer,
  camera: LucideIcons.Camera,
  bookmark: LucideIcons.Bookmark,
  flash: LucideIcons.Zap,
  restaurant: LucideIcons.UtensilsCrossed,
  body: LucideIcons.User,
  calendar: LucideIcons.Calendar,
  settings: LucideIcons.Settings,
  'heart-pulse': LucideIcons.HeartPulse,
};

function resolveIcon(name: string): React.ComponentType<any> {
  return ICON_MAP[name] || LucideIcons.CircleDot;
}

// =============================================================================
// MODULE-SPECIFIC CONTENT DATA
// =============================================================================

interface ModuleContent {
  /** Prompt that appears in the notes placeholder */
  notesPrompt: string;
  /** AI Coach insight — Socratic, builds on past experience */
  aiCoach: { title: string; body: string; question: string };
  /** From Your Network — what peers/preceptor have shared */
  network: Array<{ name: string; role: string; tip: string }>;
  /** Your History — past module entries summary */
  history: { summary: string; detail: string };
  /** Optional: structured items to display (checklists, med lists, etc.) */
  items?: Array<{ label: string; detail: string; status?: 'alert' | 'ok' | 'info' }>;
  /** Optional: alert or safety callout */
  alert?: { title: string; body: string };
}

/**
 * Demo content for each nursing module. In production, this would come from
 * the student's actual data, AI analysis of their history, and their
 * social network's shared insights.
 */
const MODULE_CONTENT: Record<string, ModuleContent> = {
  patient_overview: {
    notesPrompt: 'What do you already know about your patients? What questions will you ask during handoff? What are you watching for today?',
    aiCoach: {
      title: 'Build Your Patient Mental Model',
      body: 'Before you walk onto the floor, picture each patient. What\'s their story? A 72-year-old admitted for CHF exacerbation is different from a 72-year-old post-op hip replacement — even if they\'re in the same room. Your last shift, you identified early fluid overload signs before the RN did. That clinical eye is developing.',
      question: 'For each patient today: What\'s the ONE thing that could go wrong, and how would you catch it early?',
    },
    network: [
      { name: 'Emma R.', role: '3rd year BSN', tip: 'I review the H&P the night before so I can ask smarter questions during handoff. It changes everything — you go from passive to driving the conversation.' },
      { name: 'Preceptor Lisa', role: 'RN, 12 years', tip: 'Look at the patient before you look at the chart. Your eyes and gut tell you things the numbers don\'t. Then validate with data.' },
    ],
    history: {
      summary: '3 shifts documented \u2022 Avg 2.3 patients/shift',
      detail: 'Last shift: 3 patients on med-surg. You noted early tachycardia in Pt 2 that preceded a fever spike. Preceptor commended your assessment timing.',
    },
  },

  medications: {
    notesPrompt: 'List your patients\' key meds. Any high-alerts? Interactions you want to double-check? What\'s your administration plan and timing?',
    aiCoach: {
      title: 'Think Like a Pharmacist',
      body: 'Don\'t just memorize the med list — understand WHY each medication is ordered. If your patient is on both Metoprolol and Lisinopril, what are you monitoring? Your last shift you caught an insulin sliding scale question before administration — that\'s exactly the kind of critical thinking that prevents errors.',
      question: 'Which medication on today\'s list are you least confident about? Look it up now, before you\'re at the bedside under pressure.',
    },
    network: [
      { name: 'Preceptor Lisa', role: 'RN, 12 years', tip: 'Always check the MAR against the patient\'s allergy band. I\'ve caught near-misses this way. It takes 3 seconds and could save a life.' },
      { name: 'Marcus T.', role: 'BSN, ICU fellow', tip: 'For IV push meds, I say the 6 Rights out loud — quietly, to myself. It sounds silly but it catches the error your brain glosses over.' },
    ],
    history: {
      summary: '12 meds administered last shift \u2022 0 errors \u2022 1 near-miss caught',
      detail: 'You flagged a warfarin-aspirin interaction question and confirmed with the pharmacist. The attending adjusted the order. Strong catch.',
    },
    alert: {
      title: 'High-Alert Medications',
      body: 'If your patients are on heparin, insulin, or opioids — these require independent double-verification before administration. Build this into your timing plan.',
    },
  },

  lab_values: {
    notesPrompt: 'What labs are you expecting today? What would abnormal values mean for your patients? What trends are you tracking?',
    aiCoach: {
      title: 'Read the Story in the Numbers',
      body: 'Labs aren\'t isolated data points — they tell a clinical story. A rising BUN with stable creatinine suggests dehydration, not renal failure. A trending WBC matters more than a single value. Last shift you correctly identified that trending hemoglobin drop as significant.',
      question: 'For your CHF patient: What\'s the BNP trend over the last 3 days? What would a rising BNP tell you alongside their daily weights?',
    },
    network: [
      { name: 'Marcus T.', role: 'BSN, ICU fellow', tip: 'I chart critical values on a simple timeline in my brain sheet. Pattern recognition beats memorizing numbers every time.' },
      { name: 'Dr. Chen', role: 'Attending', tip: 'When you call me about a lab value, tell me the trend, not just the number. "Potassium dropped from 4.1 to 3.2 over 6 hours" is actionable. "Potassium is 3.2" isn\'t.' },
    ],
    history: {
      summary: 'Tracked labs for 8 patients across 3 shifts',
      detail: 'You\'re getting stronger at correlating lab values with clinical presentation. Last shift you connected the dots between low albumin and wound healing delay.',
    },
    items: [
      { label: 'BMP (Basic Metabolic Panel)', detail: 'Na, K, Cl, CO2, BUN, Cr, Glucose', status: 'info' },
      { label: 'CBC', detail: 'WBC, Hgb, Hct, Platelets', status: 'info' },
      { label: 'PT/INR', detail: 'Check if patient on anticoagulants', status: 'alert' },
      { label: 'BNP', detail: 'Heart failure marker — check trend', status: 'info' },
    ],
  },

  procedures: {
    notesPrompt: 'What procedures do you expect today? What\'s your approach for each? Where do you need help vs. where are you confident?',
    aiCoach: {
      title: 'Visualize Before You Do',
      body: 'Elite performers in every field mentally rehearse before executing. Walk through each procedure in your mind: gather supplies, verify the order, explain to the patient, position, perform, document. Your IV insertion success rate is improving — last 3 attempts were all first-stick.',
      question: 'Which procedure today pushes your comfort zone? What specific step feels uncertain? Address that gap now, not at the bedside.',
    },
    network: [
      { name: 'Preceptor Lisa', role: 'RN, 12 years', tip: 'Talk through the procedure with the patient before you start. It calms both of you. And if you\'re not sure about something, say "Let me verify that" — never guess.' },
      { name: 'Amy K.', role: '4th year BSN', tip: 'I keep a pocket card with the critical steps for procedures I\'m still learning. No shame in checking your reference mid-task.' },
    ],
    history: {
      summary: '7 procedures performed \u2022 IV insertion: 3/4 success \u2022 Wound care: confident',
      detail: 'Your IV insertion technique has improved significantly. Preceptor noted better site selection on last attempt. Foley catheter still needs supervised practice.',
    },
  },

  clinical_objectives: {
    notesPrompt: 'What are you focused on learning today? What competency are you working toward? What would make this shift a success for your development?',
    aiCoach: {
      title: 'Intentional Practice > Passive Hours',
      body: 'A shift without learning objectives is just putting in time. The students who grow fastest set one specific goal before each shift and ruthlessly pursue it. You need 5 more successful IV insertions for competency — today\'s shift has 2 patients with IV access needs.',
      question: 'What\'s your ONE stretch goal today — the thing that pushes just past your comfort zone?',
    },
    network: [
      { name: 'Preceptor Lisa', role: 'RN, 12 years', tip: 'Tell me your goals at the start of the shift. I\'ll create opportunities for you. But if you don\'t tell me, I can\'t help you get there.' },
      { name: 'Program Director', role: 'Faculty', tip: 'Link each shift goal to your course competencies. When portfolio review comes, you\'ll have documented evidence of intentional growth.' },
    ],
    history: {
      summary: '4 shifts with documented objectives \u2022 78% goals met',
      detail: 'Pattern: You consistently meet assessment and communication goals. Time management goals are where you struggle. Consider making that today\'s focus.',
    },
  },

  checklist: {
    notesPrompt: 'Anything unusual to prepare today? Special equipment? Access badges? Clinical tools you need to bring?',
    aiCoach: {
      title: 'The Boring Stuff Matters Most',
      body: 'Forgetting your stethoscope isn\'t just inconvenient — it interrupts your clinical flow and costs you 10 minutes of learning time. The best nurses have a pre-shift ritual that\'s automatic. Build yours.',
      question: 'Do you have everything you need right now, or do you need to stop somewhere on the way in?',
    },
    network: [
      { name: 'Sarah M.', role: '2nd year BSN', tip: 'I pack my bag the night before. Stethoscope, penlight, hemostats, drug guide, brain sheet template, black pens x3, and snacks. Always snacks.' },
    ],
    history: {
      summary: 'Checklist completion: 100% last 3 shifts',
      detail: 'No missed items recently. You\'ve built a solid pre-shift routine.',
    },
    items: [
      { label: 'Stethoscope', detail: 'Functioning, clean', status: 'ok' },
      { label: 'Badge & access card', detail: 'Unit access verified', status: 'ok' },
      { label: 'Drug reference', detail: 'App or pocket guide', status: 'ok' },
      { label: 'Brain sheet', detail: 'Printed template for today', status: 'info' },
      { label: 'PPE check', detail: 'Know isolation precautions for your patients', status: 'alert' },
    ],
  },

  care_plan: {
    notesPrompt: 'Draft your nursing care plan here. What are the priority nursing diagnoses? What interventions will you implement? What outcomes are you targeting?',
    aiCoach: {
      title: 'Think in Diagnoses, Not Tasks',
      body: 'A care plan isn\'t a to-do list — it\'s your clinical reasoning made visible. Start with the patient\'s primary problem, identify the nursing diagnosis, plan your interventions, and define how you\'ll measure success. For a CHF patient: "Excess Fluid Volume r/t compromised regulatory mechanism AEB peripheral edema and weight gain."',
      question: 'For your highest-acuity patient: What\'s the priority nursing diagnosis, and what\'s your first intervention?',
    },
    network: [
      { name: 'Study Group', role: 'Peer cohort', tip: 'Use NANDA-I format and link each intervention to a measurable outcome. Faculty loves seeing evidence-based rationale.' },
      { name: 'Preceptor Lisa', role: 'RN, 12 years', tip: 'The best care plans are living documents. Update them during the shift as you learn more about the patient.' },
    ],
    history: {
      summary: '3 care plans documented \u2022 Improving structure',
      detail: 'Last care plan received positive feedback on intervention specificity. Work on connecting outcomes to measurable criteria.',
    },
  },

  unit_protocols: {
    notesPrompt: 'What unit-specific protocols should you review? Any isolation patients? Code team responsibilities? Fall risk protocols for your patients?',
    aiCoach: {
      title: 'Know the Rules Before You Break Stride',
      body: 'Every unit has its own rhythm and rules. Knowing the protocol means you can act fast when it matters. You\'re on med-surg today — review the rapid response criteria, fall risk assessment schedule, and isolation precaution types for your patients.',
      question: 'If your patient\'s condition deteriorated right now, do you know the exact chain of communication on this unit?',
    },
    network: [
      { name: 'Charge Nurse', role: 'Unit staff', tip: 'Don\'t hesitate to ask about unit-specific protocols. I\'d rather explain it twice than manage the fallout of someone guessing.' },
    ],
    history: {
      summary: '2 units experienced \u2022 Med-surg, ICU observation',
      detail: 'You\'re familiar with med-surg flow. If assigned to a new unit, request a brief orientation from the charge nurse before taking patients.',
    },
  },

  preceptor_goals: {
    notesPrompt: 'What has your preceptor been emphasizing? What feedback themes keep coming up? What do they want you to focus on this shift?',
    aiCoach: {
      title: 'Your Preceptor Is Your Accelerator',
      body: 'The students who grow fastest are the ones who actively seek and act on preceptor feedback — not just hear it, but implement it the very next shift. Lisa has consistently praised your assessment skills but flagged time management. Today, show her you heard that.',
      question: 'What ONE piece of feedback from your last shift will you deliberately practice today?',
    },
    network: [
      { name: 'Preceptor Lisa', role: 'RN, 12 years', tip: 'I want to see you prioritize independently today. Before you ask me what to do next, decide what YOU think should happen next, then tell me your reasoning.' },
    ],
    history: {
      summary: 'Consistent preceptor \u2022 5 shifts together',
      detail: 'Feedback pattern: Strong on assessment, communication. Growth area: Time management, prioritization under pressure.',
    },
  },

  drug_reference: {
    notesPrompt: 'Which medications are you unfamiliar with today? Look them up now — mechanism, dose range, side effects, nursing considerations.',
    aiCoach: {
      title: 'Know It Before You Give It',
      body: 'You should never administer a medication you can\'t explain to the patient in plain language. If you don\'t know what it does, how it works, and what to watch for — that\'s your signal to stop and look it up. Not a weakness. A safety behavior.',
      question: 'Which med on today\'s list would you struggle to explain to a patient? That\'s the one to research right now.',
    },
    network: [
      { name: 'Marcus T.', role: 'BSN, ICU fellow', tip: 'I use the "teach-back to myself" method. If I can explain the med, dose, route, and 3 nursing considerations from memory, I\'m ready to give it.' },
    ],
    history: {
      summary: 'Drug classes studied: cardiac, diabetic, pain management',
      detail: 'You\'re solid on cardiac meds and insulin protocols. Flagged uncertainty with anticoagulant dosing calculations last shift.',
    },
  },

  share_with_preceptor: {
    notesPrompt: 'Summarize your pre-shift preparation here. What\'s your plan? What questions do you have? What do you want to practice today?',
    aiCoach: {
      title: 'Come Prepared, Leave Impressed',
      body: 'Sharing your prep plan with your preceptor before the shift signals competence and initiative. It transforms you from "student who needs direction" to "clinician who has a plan." Lisa will adjust her teaching to match your preparation level.',
      question: 'What\'s the most important thing you want your preceptor to know about your readiness today?',
    },
    network: [
      { name: 'Preceptor Lisa', role: 'RN, 12 years', tip: 'When a student shows up with a plan, I can teach at a higher level. I stop explaining basics and start teaching clinical judgment. That\'s where the real learning happens.' },
    ],
    history: {
      summary: 'Shared prep plan 3 of last 5 shifts',
      detail: 'When you shared your plan, preceptor feedback was more specific and advanced. The correlation is clear — preparation earns better teaching.',
    },
  },

  // ---- REVIEW PHASE modules ----

  competency_log: {
    notesPrompt: 'What skills did you perform today? How many attempts? How confident did you feel? What would you do differently?',
    aiCoach: {
      title: 'Track Your Growth, Not Just Your Hours',
      body: 'Competency isn\'t about doing a skill once — it\'s about doing it consistently, safely, and with increasing independence. Logging each attempt with honest self-assessment accelerates your growth. You\'re 3 successful IV insertions away from program competency.',
      question: 'For each skill today: Were you supervised, assisted, or independent? What level do you want to reach by next shift?',
    },
    network: [
      { name: 'Amy K.', role: '4th year BSN', tip: 'I rate myself honestly on every attempt: 1 = needed full guidance, 5 = could teach it. The jump from 3 to 4 is where real confidence lives.' },
    ],
    history: {
      summary: '23 skills logged \u2022 IV: 3/5 proficiency \u2022 Assessment: 4/5',
      detail: 'Strongest: Head-to-toe assessment, vital signs. Developing: IV insertion, foley catheter. Next milestone: Independent IV insertion.',
    },
  },

  learning_notes: {
    notesPrompt: 'What did you learn today that you didn\'t know before? What surprised you? What clinical reasoning moments stand out? What would you do differently?',
    aiCoach: {
      title: 'Reflection Is Where Learning Solidifies',
      body: 'The shift is over, but the learning isn\'t. The students who reflect within 30 minutes of a shift retain 3x more than those who wait. Write what you felt, not just what you did. The emotional texture of a clinical moment is what makes it stick.',
      question: 'What was your strongest clinical reasoning moment today? And what was the moment you felt most uncertain?',
    },
    network: [
      { name: 'Emma R.', role: '3rd year BSN', tip: 'I write one "I was wrong about..." per shift. It\'s uncomfortable but it\'s my biggest growth tool.' },
      { name: 'Preceptor Lisa', role: 'RN, 12 years', tip: 'Write your notes before you debrief with me. Your raw reflection is more honest than what you\'ll say after hearing my feedback.' },
    ],
    history: {
      summary: '4 reflections documented \u2022 Avg 200 words',
      detail: 'Your reflections are getting more specific. Early ones were "good shift, learned a lot." Recent ones connect specific moments to clinical reasoning development.',
    },
  },

  preceptor_feedback: {
    notesPrompt: 'Capture your preceptor\'s verbal feedback right now, while it\'s fresh. What did they say went well? What should you work on? Any specific advice?',
    aiCoach: {
      title: 'Feedback Is a Gift — Unwrap It Carefully',
      body: 'Verbal feedback disappears if you don\'t capture it. Write down what your preceptor said — their exact words if possible. Then, identify the pattern: What themes keep coming up across shifts? That\'s where your focused growth work should be.',
      question: 'Is there a theme in the feedback you\'ve received across your last 3 shifts? What is it telling you?',
    },
    network: [
      { name: 'Program Director', role: 'Faculty', tip: 'Document preceptor feedback after every shift. During your final evaluation, you\'ll have a portfolio of growth evidence that speaks for itself.' },
    ],
    history: {
      summary: '4 feedback entries \u2022 Consistent themes identified',
      detail: 'Recurring praise: Assessment thoroughness, patient rapport. Recurring growth area: Speed of task completion, delegation confidence.',
    },
  },

  clinical_hours: {
    notesPrompt: 'Log your clinical hours. Start time, end time, any breaks. Note the unit and preceptor for your records.',
    aiCoach: {
      title: 'Every Hour Counts — Literally',
      body: 'Your program requires documented clinical hours for licensure. Log them immediately — retroactive hour logging is the #1 source of portfolio stress at end of term. You\'re on track for your hour requirements this semester.',
      question: 'Are your hours logged in your program\'s official system as well as here?',
    },
    network: [
      { name: 'Sarah M.', role: '2nd year BSN', tip: 'I log hours the second I get to my car. If I wait until I get home, I forget the exact times and it becomes a headache.' },
    ],
    history: {
      summary: '48 clinical hours logged \u2022 On track for 120 required',
      detail: 'Consistent logging. You\'re 40% through your clinical hour requirement with 60% of the semester remaining. Ahead of schedule.',
    },
  },

  time_log: {
    notesPrompt: 'Track your time during the shift. What took longer than expected? Where did you lose time? What could you batch more efficiently?',
    aiCoach: {
      title: 'Time Awareness Builds Clinical Flow',
      body: 'Understanding where your time goes is the first step to managing it. Experienced nurses seem to "float" through their tasks because they\'ve internalized efficient patterns. You\'re building those patterns now.',
      question: 'What\'s taking you the longest right now? Is it the task itself, or finding supplies and navigating the system?',
    },
    network: [
      { name: 'Preceptor Lisa', role: 'RN, 12 years', tip: 'Cluster your care. If you\'re going into a room for vitals, what else can you do while you\'re there? Meds due? Assessment? Education? Think in bundles.' },
    ],
    history: {
      summary: 'Time logged for 2 shifts \u2022 Improving efficiency',
      detail: 'Last shift: Medication passes took 45 min (down from 60 min on first shift). Documentation still a bottleneck at 20 min per patient.',
    },
  },
};

// Fallback for any module not explicitly defined above
const DEFAULT_CONTENT: ModuleContent = {
  notesPrompt: 'What\'s your approach for this area? What are you planning, and what questions do you have?',
  aiCoach: {
    title: 'Prepare With Intention',
    body: 'Every module is an opportunity to practice clinical reasoning before you\'re under pressure. Write your plan, identify your gaps, and address them now.',
    question: 'What\'s the one thing about this topic that, if you mastered it today, would make the biggest difference?',
  },
  network: [
    { name: 'Your peers', role: 'Community', tip: 'Follow experienced practitioners to see how they approach this area. Their shared insights appear here.' },
  ],
  history: {
    summary: 'No previous entries yet',
    detail: 'After your first shift, your history and patterns will appear here to help you prepare smarter.',
  },
};

// =============================================================================
// SECTION COMPONENTS
// =============================================================================

/** Your Plan — student input area */
function YourPlanSection({
  prompt,
  value,
  onChange,
  accent,
}: {
  prompt: string;
  value: string;
  onChange: (text: string) => void;
  accent: string;
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <LucideIcons.PenLine size={15} color={accent} />
        <Text style={[s.sectionTitle, { color: accent }]}>Your Plan</Text>
      </View>
      <TextInput
        style={s.notesInput}
        placeholder={prompt}
        placeholderTextColor={C.gray}
        value={value}
        onChangeText={onChange}
        multiline
        textAlignVertical="top"
        scrollEnabled={false}
      />
    </View>
  );
}

/** AI Coach — contextual, Socratic, builds on past experience */
function AICoachSection({
  title,
  body,
  question,
}: {
  title: string;
  body: string;
  question: string;
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <LucideIcons.Sparkles size={15} color="#F59E0B" />
        <Text style={[s.sectionTitle, { color: '#D97706' }]}>AI Coach</Text>
      </View>
      <View style={s.coachCard}>
        <Text style={s.coachTitle}>{title}</Text>
        <Text style={s.coachBody}>{body}</Text>
        <View style={s.coachQuestionBox}>
          <LucideIcons.HelpCircle size={14} color="#D97706" />
          <Text style={s.coachQuestion}>{question}</Text>
        </View>
      </View>
    </View>
  );
}

/** Alert / Safety callout */
function AlertSection({ title, body }: { title: string; body: string }) {
  return (
    <View style={s.alertCard}>
      <View style={s.alertHeader}>
        <LucideIcons.AlertTriangle size={15} color={C.orange} />
        <Text style={s.alertTitle}>{title}</Text>
      </View>
      <Text style={s.alertBody}>{body}</Text>
    </View>
  );
}

/** Structured items (checklist, lab list, etc.) */
function ItemsSection({
  items,
  accent,
}: {
  items: NonNullable<ModuleContent['items']>;
  accent: string;
}) {
  return (
    <View style={s.itemsList}>
      {items.map((item, i) => (
        <View key={i} style={s.itemRow}>
          <View style={[
            s.itemDot,
            {
              backgroundColor:
                item.status === 'alert' ? C.orange :
                item.status === 'ok' ? C.green : accent,
            },
          ]} />
          <View style={s.itemContent}>
            <Text style={s.itemLabel}>{item.label}</Text>
            <Text style={s.itemDetail}>{item.detail}</Text>
          </View>
          {item.status === 'alert' && (
            <LucideIcons.AlertCircle size={16} color={C.orange} />
          )}
          {item.status === 'ok' && (
            <LucideIcons.CheckCircle size={16} color={C.green} />
          )}
        </View>
      ))}
    </View>
  );
}

/** From Your Network — social learning */
function NetworkSection({
  tips,
}: {
  tips: ModuleContent['network'];
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <LucideIcons.Users size={15} color="#16A34A" />
        <Text style={[s.sectionTitle, { color: '#16A34A' }]}>From Your Network</Text>
      </View>
      <View style={s.networkList}>
        {tips.map((tip, i) => (
          <View key={i} style={s.networkCard}>
            <View style={s.networkAvatar}>
              <Text style={s.networkAvatarText}>
                {tip.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={s.networkContent}>
              <View style={s.networkNameRow}>
                <Text style={s.networkName}>{tip.name}</Text>
                <Text style={s.networkRole}>{tip.role}</Text>
              </View>
              <Text style={s.networkTip}>{tip.tip}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Your History — past experience summary */
function HistorySection({
  summary,
  detail,
}: {
  summary: string;
  detail: string;
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <LucideIcons.History size={15} color={C.blue} />
        <Text style={[s.sectionTitle, { color: C.blue }]}>Your History</Text>
      </View>
      <View style={s.historyCard}>
        <Text style={s.historySummary}>{summary}</Text>
        <Text style={s.historyDetail}>{detail}</Text>
      </View>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export interface ModuleDetailBottomSheetProps {
  moduleId: string | null;
  isOpen: boolean;
  onClose: () => void;
  config: InterestEventConfig;
}

export function ModuleDetailBottomSheet({
  moduleId,
  isOpen,
  onClose,
  config,
}: ModuleDetailBottomSheetProps) {
  const [notes, setNotes] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [onClose]);

  if (!moduleId) return null;

  const moduleInfo = config.moduleInfo[moduleId];
  if (!moduleInfo) return null;

  const IconComponent = resolveIcon(moduleInfo.icon);
  const accent = MODULE_COLORS[moduleId] || C.blue;
  const content = MODULE_CONTENT[moduleId] || DEFAULT_CONTENT;
  const currentNotes = notes[moduleId] || '';

  return (
    <Actionsheet isOpen={isOpen} onClose={handleClose}>
      <ActionsheetBackdrop style={{ backgroundColor: 'rgba(0,0,0,0.15)' }} />
      <ActionsheetContent className="max-h-[90%] bg-background-0">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        {/* Compact Header */}
        <View style={s.header}>
          <View style={[s.headerIcon, { backgroundColor: `${accent}15` }]}>
            <IconComponent size={18} color={accent} />
          </View>
          <Text style={s.headerTitle}>{moduleInfo.label}</Text>
          <Pressable
            style={s.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={C.gray} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ActionsheetScrollView
            className="w-full"
            contentContainerClassName="pb-12"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.body}>
              {/* Alert (if any) */}
              {content.alert && (
                <AlertSection title={content.alert.title} body={content.alert.body} />
              )}

              {/* Structured items (if any) */}
              {content.items && (
                <ItemsSection items={content.items} accent={accent} />
              )}

              {/* Your Plan */}
              <YourPlanSection
                prompt={content.notesPrompt}
                value={currentNotes}
                onChange={(text) => setNotes((prev) => ({ ...prev, [moduleId]: text }))}
                accent={accent}
              />

              {/* AI Coach */}
              <AICoachSection
                title={content.aiCoach.title}
                body={content.aiCoach.body}
                question={content.aiCoach.question}
              />

              {/* From Your Network */}
              <NetworkSection tips={content.network} />

              {/* Your History */}
              <HistorySection
                summary={content.history.summary}
                detail={content.history.detail}
              />
            </View>
          </ActionsheetScrollView>
        </KeyboardAvoidingView>
      </ActionsheetContent>
    </Actionsheet>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.gray5,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: C.label,
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.gray5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Body
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },

  // Sections
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // Notes input
  notesInput: {
    backgroundColor: C.gray6,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    color: C.label,
    minHeight: 100,
    borderWidth: 1,
    borderColor: C.gray5,
  },

  // AI Coach
  coachCard: {
    backgroundColor: C.coachBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.coachBorder,
    gap: 10,
  },
  coachTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
  },
  coachBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#78350F',
  },
  coachQuestionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginTop: 2,
  },
  coachQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#92400E',
    lineHeight: 20,
  },

  // Alert
  alertCard: {
    backgroundColor: C.warnBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.warnBorder,
    gap: 6,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C2410C',
  },
  alertBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#9A3412',
  },

  // Items list
  itemsList: {
    gap: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: C.gray6,
    borderRadius: 10,
    marginBottom: 4,
    gap: 10,
  },
  itemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.label,
  },
  itemDetail: {
    fontSize: 12,
    color: C.secondaryLabel,
    marginTop: 1,
  },

  // Network
  networkList: {
    gap: 10,
  },
  networkCard: {
    flexDirection: 'row',
    backgroundColor: C.networkBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.networkBorder,
    gap: 10,
  },
  networkAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#A5D6A7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B5E20',
  },
  networkContent: {
    flex: 1,
  },
  networkNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  networkName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
  },
  networkRole: {
    fontSize: 12,
    color: '#4CAF50',
  },
  networkTip: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2E7D32',
    fontStyle: 'italic',
  },

  // History
  historyCard: {
    backgroundColor: C.historyBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.historyBorder,
    gap: 8,
  },
  historySummary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565C0',
  },
  historyDetail: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1976D2',
  },
});

export default ModuleDetailBottomSheet;
