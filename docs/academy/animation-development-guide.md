# Animation Development Guide
## Building Interactive Learning Lessons for RegattaFlow Racing Academy

**Version**: 1.0  
**Last Updated**: 2025-01-11  
**Status**: Active Development

---

## Prerequisites

Before building interactive lessons, you should have:

### Technical Skills
- **React Native**: Component development, hooks, state management
- **React Native Reanimated**: Animation library (NOT Lottie)
- **React Native SVG**: SVG rendering and manipulation
- **TypeScript**: Type safety and interfaces
- **Expo**: Development environment (optional, but recommended)

### Domain Knowledge
- **Sailing Racing**: Understanding of racing rules, tactics, and techniques
- **Pedagogy**: Basic understanding of how people learn
- **UX Design**: Creating intuitive, engaging interfaces

### Tools
- **Code Editor**: VS Code recommended
- **Design Tool**: Figma or Illustrator for SVG design
- **Version Control**: Git
- **Testing Device**: Physical device or simulator

---

## Step-by-Step Tutorial

### Step 1: Plan Your Lesson (30 minutes)

**Define Learning Objectives**
- What should the sailor learn?
- What skills will they practice?
- How will this improve their racing?

**Outline Lesson Steps**
- Break concept into 5-15 steps
- Each step should build on previous
- Include visual demonstrations
- Plan quiz questions

**Identify Visualizations**
- What needs to be animated?
- What SVG components are needed?
- Are there existing components to reuse?

**Example Planning Document**:
```markdown
# Lesson: Line Bias Fundamentals

## Learning Objectives
- Understand what line bias means
- Learn to detect line bias
- Quantify the advantage of starting on favored end

## Steps
1. Introduction - Why line bias matters
2. Perfectly square line demonstration
3. Wind shift scenario
4. Quantifying advantage
5. How to detect bias
6. Practical application

## Visualizations Needed
- Two boats (blue, red)
- Start line (committee boat + pin)
- Wind direction indicator
- Distance measurements
- Compass tool

## Quiz Questions
1. What is line bias?
2. How much advantage does 5° bias give?
3. How do you check for bias?
```

---

### Step 2: Create Step Data File (1-2 hours)

Create `components/learn/interactives/data/yourLessonData.ts`:

```typescript
/**
 * Your Lesson Data
 * Step definitions, quiz questions, and deep dive content
 */

export interface YourLessonStep {
  time: number;              // Timeline position (seconds)
  label: string;             // Step title
  description: string;       // Main explanation
  visualState?: {            // Animation state
    wind?: { rotate: number };
    boats?: Array<{
      id: string;
      x: number;
      y: number;
      rotate: number;
    }>;
    marks?: Array<{
      id: string;
      x: number;
      y: number;
      type: string;
    }>;
  };
  details?: string[];        // Bullet points
  proTip?: string;           // Key insight
}

export interface YourLessonQuizQuestion {
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

// Step sequence
export const YOUR_LESSON_STEPS: YourLessonStep[] = [
  {
    time: 0,
    label: "Introduction",
    description: "Why this concept matters in racing",
    visualState: {
      wind: { rotate: 0 },
      boats: [
        { id: 'blue', x: 400, y: 300, rotate: -45 },
        { id: 'red', x: 300, y: 300, rotate: -45 }
      ]
    },
    details: [
      "Key point 1",
      "Key point 2",
      "Key point 3"
    ],
    proTip: "Remember this important insight"
  },
  {
    time: 10,
    label: "Next Step",
    description: "Building on previous concept",
    visualState: {
      wind: { rotate: -10 }, // Wind shifted
      boats: [
        { id: 'blue', x: 380, y: 280, rotate: -55 },
        { id: 'red', x: 280, y: 260, rotate: -55 }
      ]
    },
    details: [
      "New concept explanation"
    ]
  }
  // ... more steps
];

// Quiz questions
export const YOUR_LESSON_QUIZ: YourLessonQuizQuestion[] = [
  {
    id: 'q1',
    question: 'What is the main concept?',
    options: [
      { id: 'a', text: 'Option A', isCorrect: false },
      { id: 'b', text: 'Option B (correct)', isCorrect: true },
      { id: 'c', text: 'Option C', isCorrect: false }
    ],
    explanation: 'Why B is correct and others are wrong',
    hint: 'Think about the key concept...'
  }
  // ... more questions
];

// Deep dive content (optional)
export const YOUR_LESSON_DEEP_DIVE = {
  title: "Mastering the Concept",
  introduction: "Advanced understanding...",
  sections: [
    {
      title: "Advanced Topic",
      content: "Detailed explanation..."
    }
  ],
  proTips: [
    "Pro tip 1",
    "Pro tip 2"
  ],
  commonMistakes: [
    "Mistake 1",
    "Mistake 2"
  ]
};
```

**Key Points**:
- Use TypeScript interfaces for type safety
- Keep step descriptions concise but clear
- Visual state should be complete for each step
- Quiz questions should test understanding, not memorization

---

### Step 3: Build Interactive Component (4-8 hours)

Create `components/learn/interactives/YourLessonInteractive.tsx`:

```typescript
/**
 * Your Lesson Interactive Component
 * React Native + Reanimated + SVG implementation
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import Svg, { G, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import type { YourLessonStep } from './data/yourLessonData';
import { YOUR_LESSON_STEPS, YOUR_LESSON_QUIZ } from './data/yourLessonData';
import { TopDownSailboatSVG } from './shared';

// Create animated SVG components
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface YourLessonInteractiveProps {
  currentStep?: YourLessonStep;
  onStepChange?: (step: YourLessonStep) => void;
  onComplete?: () => void;
}

export function YourLessonInteractive({
  currentStep: externalStep,
  onStepChange,
  onComplete,
}: YourLessonInteractiveProps) {
  // State management
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | null>>({});

  // Animation values
  const timelineProgress = useSharedValue(0);
  const windRotation = useSharedValue(0);
  const blueBoatX = useSharedValue(400);
  const blueBoatY = useSharedValue(300);
  const blueBoatRotate = useSharedValue(-45);

  // Get current step
  const currentStep = useMemo(() => {
    return externalStep || YOUR_LESSON_STEPS[currentStepIndex];
  }, [externalStep, currentStepIndex]);

  // Update animations based on current step
  React.useEffect(() => {
    if (currentStep.visualState) {
      // Animate wind
      if (currentStep.visualState.wind) {
        windRotation.value = withTiming(
          currentStep.visualState.wind.rotate,
          { duration: 1000 }
        );
      }

      // Animate boats
      if (currentStep.visualState.boats) {
        const blueBoat = currentStep.visualState.boats.find(b => b.id === 'blue');
        if (blueBoat) {
          blueBoatX.value = withTiming(blueBoat.x, { duration: 1000 });
          blueBoatY.value = withTiming(blueBoat.y, { duration: 1000 });
          blueBoatRotate.value = withTiming(blueBoat.rotate, { duration: 1000 });
        }
      }
    }
  }, [currentStep]);

  // Navigation
  const handleNext = useCallback(() => {
    if (currentStepIndex < YOUR_LESSON_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      const nextStep = YOUR_LESSON_STEPS[nextIndex];
      onStepChange?.(nextStep);
    } else {
      // Show quiz or complete
      setShowQuiz(true);
    }
  }, [currentStepIndex, onStepChange]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      const prevStep = YOUR_LESSON_STEPS[prevIndex];
      onStepChange?.(prevStep);
    }
  }, [currentStepIndex, onStepChange]);

  // Animated props for SVG elements
  const windArrowProps = useAnimatedProps(() => {
    return {
      transform: [{ rotate: `${windRotation.value}deg` }],
    };
  });

  const blueBoatProps = useAnimatedProps(() => {
    return {
      transform: [
        { translateX: blueBoatX.value },
        { translateY: blueBoatY.value },
        { rotate: `${blueBoatRotate.value}deg` },
      ],
    };
  });

  // Render SVG visualization
  const renderVisualization = () => {
    return (
      <Svg width={800} height={450} style={styles.svg}>
        <Defs>
          {/* Define patterns, gradients, markers */}
        </Defs>

        {/* Background elements */}
        <Rect x={0} y={0} width={800} height={450} fill="#E0F2FE" />

        {/* Wind indicator */}
        <AnimatedG animatedProps={windArrowProps}>
          <Line
            x1={400}
            y1={225}
            x2={400}
            y2={100}
            stroke="#3B82F6"
            strokeWidth={4}
            markerEnd="url(#arrowhead)"
          />
        </AnimatedG>

        {/* Start line */}
        <Line
          x1={200}
          y1={400}
          x2={600}
          y2={400}
          stroke="#000"
          strokeWidth={2}
        />

        {/* Boats */}
        <AnimatedG animatedProps={blueBoatProps}>
          <TopDownSailboatSVG
            x={0}
            y={0}
            color="#3B82F6"
            scale={0.5}
          />
        </AnimatedG>

        {/* Marks, labels, etc. */}
      </Svg>
    );
  };

  // Render quiz
  const renderQuiz = () => {
    if (!showQuiz) return null;

    return (
      <View style={styles.quizContainer}>
        <Text style={styles.quizTitle}>Test Your Understanding</Text>
        {YOUR_LESSON_QUIZ.map((question) => (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionText}>{question.question}</Text>
            {question.options.map((option) => {
              const isSelected = quizAnswers[question.id] === option.id;
              const isCorrect = option.isCorrect;
              const showResult = quizAnswers[question.id] !== null;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionSelected,
                    showResult && isCorrect && styles.optionCorrect,
                    showResult && isSelected && !isCorrect && styles.optionIncorrect,
                  ]}
                  onPress={() => {
                    if (!showResult) {
                      setQuizAnswers({ ...quizAnswers, [question.id]: option.id });
                    }
                  }}
                  disabled={showResult}
                >
                  <Text style={styles.optionText}>{option.text}</Text>
                  {showResult && isCorrect && (
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  )}
                </TouchableOpacity>
              );
            })}
            {quizAnswers[question.id] && (
              <Text style={styles.explanation}>
                {question.explanation}
              </Text>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => {
            onComplete?.();
          }}
        >
          <Text style={styles.completeButtonText}>Complete Lesson</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Step information */}
        <View style={styles.stepInfo}>
          <Text style={styles.stepLabel}>{currentStep.label}</Text>
          <Text style={styles.stepDescription}>{currentStep.description}</Text>
          
          {currentStep.details && (
            <View style={styles.detailsContainer}>
              {currentStep.details.map((detail, index) => (
                <Text key={index} style={styles.detailText}>• {detail}</Text>
              ))}
            </View>
          )}

          {currentStep.proTip && (
            <View style={styles.proTipContainer}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.proTipText}>{currentStep.proTip}</Text>
            </View>
          )}
        </View>

        {/* Visualization */}
        <View style={styles.visualizationContainer}>
          {renderVisualization()}
        </View>

        {/* Navigation */}
        {!showQuiz && (
          <View style={styles.navigation}>
            <TouchableOpacity
              style={[styles.navButton, currentStepIndex === 0 && styles.navButtonDisabled]}
              onPress={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <Ionicons name="chevron-back" size={20} color="#3B82F6" />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>

            <Text style={styles.stepCounter}>
              {currentStepIndex + 1} / {YOUR_LESSON_STEPS.length}
            </Text>

            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNext}
            >
              <Text style={styles.navButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quiz */}
        {renderQuiz()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  stepInfo: {
    padding: 20,
  },
  stepLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  detailsContainer: {
    marginTop: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  proTipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  proTipText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    fontStyle: 'italic',
  },
  visualizationContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  svg: {
    backgroundColor: '#F9FAFB',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    gap: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  stepCounter: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  quizContainer: {
    padding: 20,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  optionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  optionIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  explanation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  completeButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

**Key Implementation Points**:
- Use Reanimated shared values for smooth animations
- Animate SVG elements through animated props
- Keep component modular and reusable
- Handle state transitions smoothly
- Provide clear navigation

---

### Step 4: Register Component (5 minutes)

Add to `components/learn/InteractivePlayer.tsx`:

```typescript
import { YourLessonInteractive } from './interactives/YourLessonInteractive';

const INTERACTIVE_COMPONENTS: Record<string, React.ComponentType<any>> = {
  // ... existing components
  'YourLessonInteractive': YourLessonInteractive,
};
```

---

### Step 5: Add to Course Database (5 minutes)

Update course seed script or database:

```typescript
{
  title: 'Your Lesson Title',
  description: 'What the lesson teaches',
  lesson_type: 'interactive',
  interactive_component: 'YourLessonInteractive',
  order_index: 1,
  is_free_preview: false,
  duration_seconds: 900,
}
```

---

### Step 6: Demo on Landing Page (Optional)

Add to `components/landing/EmbeddedInteractiveDemo.tsx`:

```typescript
case 'YourLesson':
  return (
    <YourLessonInteractive
      key={key}
      onComplete={handleComplete}
    />
  );
```

---

## Best Practices

### Performance

1. **Optimize Animations**
   - Use `useSharedValue` for animated values
   - Avoid creating new objects in render
   - Use `useMemo` for expensive calculations
   - Limit number of simultaneous animations

2. **SVG Optimization**
   - Keep SVG paths simple
   - Reuse components where possible
   - Avoid complex gradients/patterns
   - Test on low-end devices

3. **State Management**
   - Minimize re-renders
   - Use callbacks for event handlers
   - Memoize expensive computations

### SVG Best Practices

1. **Component Reusability**
   - Create shared SVG components
   - Use props for customization
   - Keep components focused

2. **Coordinate System**
   - Use consistent coordinate system
   - Document origin point
   - Make positions relative to container

3. **Styling**
   - Use consistent colors
   - Define styles in StyleSheet
   - Support dark mode (optional)

### Data Structure

1. **Step Definitions**
   - Keep steps focused (one concept per step)
   - Provide complete visual state
   - Include helpful descriptions
   - Add pro tips for key insights

2. **Quiz Questions**
   - Test understanding, not memorization
   - Provide clear explanations
   - Include helpful hints
   - Avoid trick questions

---

## Troubleshooting

### Common Issues

**Issue**: Animations not smooth
- **Solution**: Check Reanimated version, ensure using `withTiming`, test on device not simulator

**Issue**: SVG not rendering
- **Solution**: Check SVG syntax, ensure all imports correct, verify viewBox settings

**Issue**: Component not found
- **Solution**: Verify registration in InteractivePlayer, check component name spelling

**Issue**: State not updating
- **Solution**: Check React hooks dependencies, verify state updates trigger re-renders

**Issue**: Performance problems
- **Solution**: Profile with React DevTools, optimize animations, reduce SVG complexity

---

## Examples to Study

### Simple Example
**StartingSequenceInteractive**: Basic timeline animation, flag state changes, audio integration

### Medium Complexity
**LineBiasInteractive**: Multiple animated elements, interactive calculations, quiz integration

### Advanced Example
**TimedRunInteractive**: Complex timing calculations, user input, multiple animation states

---

## Resources

### Documentation
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [React Native SVG](https://github.com/react-native-svg/react-native-svg)
- [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)

### Code Examples
- `components/learn/interactives/StartingSequenceInteractive.tsx`
- `components/learn/interactives/LineBiasInteractive.tsx`
- `components/learn/interactives/data/lineBiasData.ts`

### Design Resources
- Shared SVG components in `components/learn/interactives/shared/`
- Color palette in `constants/RacingDesignSystem.ts`

---

## Conclusion

Building interactive lessons requires combining technical skills (React Native, Reanimated, SVG) with domain knowledge (sailing racing) and pedagogical understanding. Follow this guide, study existing examples, and iterate based on user feedback.

**Remember**: 
- Start simple, add complexity gradually
- Test on real devices
- Get sailor feedback early
- Iterate based on usage data

Happy building! 🚢⛵

