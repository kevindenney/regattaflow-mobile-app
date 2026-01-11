/**
 * Layline Calculator Interactive
 * Learn to calculate laylines accounting for wind, current, and boat performance
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Svg, { Path, Circle, Line, Polygon, Text as SvgText, G, Defs, Marker } from 'react-native-svg';

interface LaylineCalculatorInteractiveProps {
  onComplete?: () => void;
}

export function LaylineCalculatorInteractive({ onComplete }: LaylineCalculatorInteractiveProps) {
  const [windDirection, setWindDirection] = useState(0); // Degrees from north
  const [tackingAngle, setTackingAngle] = useState(45); // Each tack is 45° from wind
  const [currentDirection, setCurrentDirection] = useState(90); // Degrees
  const [currentSpeed, setCurrentSpeed] = useState(0); // 0-2 knots
  const [step, setStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showExplanations, setShowExplanations] = useState<boolean[]>([]);

  const totalSteps = 4;

  // Calculate layline angles with current adjustment
  const currentEffect = currentSpeed * 5; // degrees shift per knot
  const portLayline = windDirection - tackingAngle - (currentDirection === 270 ? currentEffect : currentDirection === 90 ? -currentEffect : 0);
  const starboardLayline = windDirection + tackingAngle + (currentDirection === 90 ? currentEffect : currentDirection === 270 ? -currentEffect : 0);

  const questions = [
    {
      question: 'Why is it bad to hit the layline too early?',
      options: [
        'You can\'t tack anymore',
        'You lose ability to benefit from wind shifts',
        'Other boats will cover you',
        'All of the above',
      ],
      correctAnswer: 3,
      explanation: 'Hitting the layline early commits you to that side. You can\'t benefit from favorable shifts (you\'ll overstand), other boats can easily cover you, and you have no tactical flexibility.',
    },
    {
      question: 'With current pushing you TOWARD the mark, how should you adjust your layline approach?',
      options: [
        'Hit the layline later than normal',
        'Hit the layline earlier than normal',
        'No adjustment needed',
        'Avoid tacking at all',
      ],
      correctAnswer: 0,
      explanation: 'Favorable current (toward mark) lets you tack short of the normal layline. The current will carry you the extra distance. Wait longer before committing to the layline.',
    },
    {
      question: 'Your tacking angle is 45° in flat water but waves are up. What happens to your laylines?',
      options: [
        'They get shorter',
        'They stay the same',
        'They get longer (need to foot more)',
        'Only the port layline changes',
      ],
      correctAnswer: 2,
      explanation: 'In waves, you typically can\'t point as high - you need to foot more for power. This means your tacking angle increases (say to 50°), making laylines longer. You\'ll need to sail further to reach them.',
    },
    {
      question: 'You\'re approaching on starboard and think you can just fetch the mark. What\'s the risk?',
      options: [
        'No risk - you\'re in great shape',
        'You might be pinching and will come in slow',
        'Wind might head you and you\'ll be short',
        'Both B and C are risks',
      ],
      correctAnswer: 3,
      explanation: 'Approaching "just able to fetch" is risky. If you\'re pinching, you\'ll arrive slow with poor options. If you get headed, you\'ll be short and need extra tacks. Better to have a small margin.',
    },
  ];

  const handleAnswer = useCallback((questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answerIndex;
    setQuizAnswers(newAnswers);

    const newExplanations = [...showExplanations];
    newExplanations[questionIndex] = true;
    setShowExplanations(newExplanations);
  }, [quizAnswers, showExplanations]);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  // Render course diagram
  const renderDiagram = () => (
    <View style={styles.diagramContainer}>
      <Svg width="300" height="300" viewBox="0 0 300 300">
        {/* Water background */}
        <Circle cx="150" cy="150" r="140" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1" />

        {/* Compass */}
        <SvgText x="150" y="20" textAnchor="middle" fontSize="10" fill="#64748B">N</SvgText>

        {/* Wind arrow */}
        <G transform={`rotate(${windDirection}, 150, 150)`}>
          <Line x1="150" y1="40" x2="150" y2="100" stroke="#3B82F6" strokeWidth="3" />
          <Polygon points="150,30 143,45 157,45" fill="#3B82F6" />
          <SvgText x="150" y="80" textAnchor="middle" fontSize="8" fill="#3B82F6">WIND</SvgText>
        </G>

        {/* Windward mark */}
        <G transform={`rotate(${windDirection}, 150, 150)`}>
          <Circle cx="150" cy="60" r="8" fill="#F97316" stroke="#FFFFFF" strokeWidth="2" />
        </G>

        {/* Port layline (red) */}
        <G transform={`rotate(${portLayline}, 150, 150)`}>
          <Line x1="150" y1="150" x2="150" y2="40" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5" />
        </G>

        {/* Starboard layline (green) */}
        <G transform={`rotate(${starboardLayline}, 150, 150)`}>
          <Line x1="150" y1="150" x2="150" y2="40" stroke="#22C55E" strokeWidth="2" strokeDasharray="5,5" />
        </G>

        {/* Current arrow (if active) */}
        {currentSpeed > 0 && (
          <G transform={`rotate(${currentDirection}, 150, 260)`}>
            <Line x1="150" y1="260" x2="150" y2={260 - currentSpeed * 20} stroke="#14B8A6" strokeWidth="3" />
            <Polygon points={`150,${250 - currentSpeed * 20} 145,${260 - currentSpeed * 20} 155,${260 - currentSpeed * 20}`} fill="#14B8A6" />
          </G>
        )}

        {/* Boat position */}
        <Circle cx="150" cy="220" r="6" fill="#1E293B" />

        {/* Labels */}
        <SvgText x="100" y="100" textAnchor="end" fontSize="9" fill="#EF4444">Port Layline</SvgText>
        <SvgText x="200" y="100" textAnchor="start" fontSize="9" fill="#22C55E">Starboard Layline</SvgText>
      </Svg>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Understanding Laylines</Text>
            <Text style={styles.stepDescription}>
              The layline is the sailing angle that allows you to just fetch the windward mark.
              Adjust the wind direction to see how laylines change.
            </Text>

            {renderDiagram()}

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Wind Direction: {windDirection}°</Text>
              <Slider
                style={styles.slider}
                minimumValue={-45}
                maximumValue={45}
                step={5}
                value={windDirection}
                onValueChange={setWindDirection}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#3B82F6"
              />
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.legendText}>Starboard layline</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Port layline</Text>
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Tacking Angle Effects</Text>
            <Text style={styles.stepDescription}>
              Your tacking angle depends on conditions. Waves, chop, and light air typically
              require footing more, increasing your tacking angle.
            </Text>

            {renderDiagram()}

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Tacking Angle: {tackingAngle}° per tack</Text>
              <Slider
                style={styles.slider}
                minimumValue={40}
                maximumValue={55}
                step={1}
                value={tackingAngle}
                onValueChange={setTackingAngle}
                minimumTrackTintColor="#8B5CF6"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#8B5CF6"
              />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Notice how wider tacking angles push the laylines further apart.
                In flat water you might tack at 40°, but in waves it could be 50°+.
              </Text>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Current Effects on Laylines</Text>
            <Text style={styles.stepDescription}>
              Current shifts your effective laylines. Current from the side pushes one
              layline in and the other out.
            </Text>

            {renderDiagram()}

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Current Speed: {currentSpeed.toFixed(1)} kts</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={2}
                step={0.5}
                value={currentSpeed}
                onValueChange={setCurrentSpeed}
                minimumTrackTintColor="#14B8A6"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#14B8A6"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.dirButton, currentDirection === 90 && styles.dirButtonActive]}
                onPress={() => setCurrentDirection(90)}
              >
                <Text style={[styles.dirButtonText, currentDirection === 90 && styles.dirButtonTextActive]}>
                  Current from Left
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dirButton, currentDirection === 270 && styles.dirButtonActive]}
                onPress={() => setCurrentDirection(270)}
              >
                <Text style={[styles.dirButtonText, currentDirection === 270 && styles.dirButtonTextActive]}>
                  Current from Right
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Layline Quiz</Text>
            <Text style={styles.stepDescription}>
              Test your understanding of layline strategy.
            </Text>

            {questions.map((q, qIndex) => (
              <View key={qIndex} style={styles.quizQuestion}>
                <Text style={styles.questionText}>{qIndex + 1}. {q.question}</Text>

                {q.options.map((option, oIndex) => (
                  <TouchableOpacity
                    key={oIndex}
                    style={[
                      styles.optionButton,
                      quizAnswers[qIndex] === oIndex && (
                        oIndex === q.correctAnswer ? styles.correctOption : styles.incorrectOption
                      ),
                      showExplanations[qIndex] && oIndex === q.correctAnswer && styles.correctOption,
                    ]}
                    onPress={() => handleAnswer(qIndex, oIndex)}
                    disabled={showExplanations[qIndex]}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}

                {showExplanations[qIndex] && (
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationText}>{q.explanation}</Text>
                  </View>
                )}
              </View>
            ))}

            {quizAnswers.length === questions.length && showExplanations.every(Boolean) && (
              <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
                <Text style={styles.completeButtonText}>Complete Lesson</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {step + 1} of {totalSteps}</Text>
      </View>

      {/* Step Content */}
      {renderStep()}

      {/* Navigation */}
      {step < 3 && (
        <View style={styles.navigation}>
          {step > 0 && (
            <TouchableOpacity style={styles.navButton} onPress={() => setStep(s => s - 1)}>
              <Ionicons name="arrow-back" size={20} color="#3B82F6" />
              <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={() => setStep(s => s + 1)}
          >
            <Text style={styles.navButtonTextPrimary}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  stepContent: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    gap: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' }
      : { elevation: 2 }),
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  diagramContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  sliderContainer: {
    gap: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dirButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  dirButtonActive: {
    backgroundColor: '#14B8A6',
  },
  dirButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  dirButtonTextActive: {
    color: '#FFFFFF',
  },
  quizQuestion: {
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 22,
  },
  optionButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  correctOption: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  incorrectOption: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  optionText: {
    fontSize: 14,
    color: '#475569',
  },
  explanationBox: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
  },
  explanationText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 20,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navButtonPrimary: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    flex: 1,
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  navButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default LaylineCalculatorInteractive;
