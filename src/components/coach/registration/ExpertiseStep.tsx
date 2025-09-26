import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { CoachRegistrationForm, SkillLevel } from '../../../types/coach';
import { CoachMarketplaceService } from '../../../services/CoachService';

interface ExpertiseStepProps {
  data: CoachRegistrationForm;
  updateData: (section: keyof CoachRegistrationForm, data: any) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  isLastStep: boolean;
}

const BOAT_CLASSES = [
  // One-Design Keelboats
  { id: 'dragon', name: 'Dragon Class', category: 'Keelboat' },
  { id: 'j70', name: 'J/70', category: 'Keelboat' },
  { id: 'j80', name: 'J/80', category: 'Keelboat' },
  { id: 'melges-24', name: 'Melges 24', category: 'Sportboat' },
  { id: 'melges-32', name: 'Melges 32', category: 'Sportboat' },
  { id: 'rc44', name: 'RC44', category: 'Sportboat' },

  // Olympic Classes
  { id: 'laser', name: 'Laser/ILCA', category: 'Dinghy' },
  { id: '470', name: '470', category: 'Dinghy' },
  { id: '49er', name: '49er', category: 'Skiff' },
  { id: '49erfx', name: '49erFX', category: 'Skiff' },
  { id: 'nacra17', name: 'Nacra 17', category: 'Catamaran' },
  { id: 'iq-foil', name: 'IQ Foil', category: 'Windsurfing' },

  // Youth Classes
  { id: 'optimist', name: 'Optimist', category: 'Youth' },
  { id: '420', name: '420', category: 'Youth' },
  { id: 'rs-feva', name: 'RS Feva', category: 'Youth' },
  { id: 'topper', name: 'Topper', category: 'Youth' },

  // Big Boat Racing
  { id: 'tp52', name: 'TP52', category: 'Grand Prix' },
  { id: 'irc', name: 'IRC Racing', category: 'Grand Prix' },
  { id: 'orc', name: 'ORC Racing', category: 'Grand Prix' },
  { id: 'maxi', name: 'Maxi Racing', category: 'Grand Prix' },
];

const SPECIALTIES = [
  // Technical Skills
  { id: 'tactics', name: 'Tactical Racing', category: 'Strategy' },
  { id: 'boat-handling', name: 'Boat Handling', category: 'Technical' },
  { id: 'spinnaker', name: 'Spinnaker Work', category: 'Technical' },
  { id: 'boat-tuning', name: 'Boat Tuning & Setup', category: 'Technical' },
  { id: 'sail-trim', name: 'Sail Trim', category: 'Technical' },

  // Conditions
  { id: 'heavy-weather', name: 'Heavy Weather', category: 'Conditions' },
  { id: 'light-air', name: 'Light Air', category: 'Conditions' },
  { id: 'coastal', name: 'Coastal Racing', category: 'Conditions' },
  { id: 'offshore', name: 'Offshore Racing', category: 'Conditions' },

  // Racing Formats
  { id: 'match-racing', name: 'Match Racing', category: 'Format' },
  { id: 'team-racing', name: 'Team Racing', category: 'Format' },
  { id: 'fleet-racing', name: 'Fleet Racing', category: 'Format' },
  { id: 'short-course', name: 'Short Course Racing', category: 'Format' },

  // Roles
  { id: 'skipper', name: 'Skipper Development', category: 'Role' },
  { id: 'crew', name: 'Crew Training', category: 'Role' },
  { id: 'tactician', name: 'Tactician Training', category: 'Role' },
  { id: 'trimmer', name: 'Trimmer Training', category: 'Role' },
];

const SKILL_LEVELS: { id: SkillLevel; name: string; description: string }[] = [
  { id: 'Beginner', name: 'Beginner', description: 'New to sailing or racing' },
  { id: 'Intermediate', name: 'Intermediate', description: 'Some racing experience' },
  { id: 'Advanced', name: 'Advanced', description: 'Competitive club/regional level' },
  { id: 'Professional', name: 'Professional', description: 'National/international level' },
];

export default function ExpertiseStep({
  data,
  updateData,
  onNext,
  onBack,
  isLoading,
  isLastStep,
}: ExpertiseStepProps) {
  const [expertise, setExpertise] = useState(data.expertise);
  const [activeCategory, setActiveCategory] = useState('Keelboat');

  useEffect(() => {
    updateData('expertise', expertise);
  }, [expertise, updateData]);

  const toggleBoatClass = (boatClassId: string) => {
    const newClasses = expertise.boat_classes.includes(boatClassId)
      ? expertise.boat_classes.filter(id => id !== boatClassId)
      : [...expertise.boat_classes, boatClassId];

    setExpertise(prev => ({
      ...prev,
      boat_classes: newClasses,
    }));
  };

  const toggleSpecialty = (specialtyId: string) => {
    const newSpecialties = expertise.specialties.includes(specialtyId)
      ? expertise.specialties.filter(id => id !== specialtyId)
      : [...expertise.specialties, specialtyId];

    setExpertise(prev => ({
      ...prev,
      specialties: newSpecialties,
    }));
  };

  const toggleSkillLevel = (level: SkillLevel) => {
    const newLevels = expertise.skill_levels.includes(level)
      ? expertise.skill_levels.filter(l => l !== level)
      : [...expertise.skill_levels, level];

    setExpertise(prev => ({
      ...prev,
      skill_levels: newLevels,
    }));
  };

  const isFormValid = () => {
    return expertise.boat_classes.length > 0 && expertise.skill_levels.length > 0;
  };

  const getBoatClassesByCategory = (category: string) => {
    return BOAT_CLASSES.filter(boat => boat.category === category);
  };

  const getSpecialtiesByCategory = (category: string) => {
    return SPECIALTIES.filter(spec => spec.category === category);
  };

  const categories = [...new Set(BOAT_CLASSES.map(boat => boat.category))];
  const specialtyCategories = [...new Set(SPECIALTIES.map(spec => spec.category))];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Sailing Expertise</Text>
        <Text style={styles.subtitle}>
          Help sailors find you by selecting the boat classes and skills you coach
        </Text>
      </View>

      {/* Boat Classes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Boat Classes * ({expertise.boat_classes.length} selected)</Text>
        <Text style={styles.sectionDescription}>
          Select all boat classes you have coaching experience with
        </Text>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                activeCategory === category && styles.categoryTabActive
              ]}
              onPress={() => setActiveCategory(category)}
            >
              <Text style={[
                styles.categoryTabText,
                activeCategory === category && styles.categoryTabTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Boat Classes Grid */}
        <View style={styles.chipContainer}>
          {getBoatClassesByCategory(activeCategory).map(boat => (
            <TouchableOpacity
              key={boat.id}
              style={[
                styles.chip,
                expertise.boat_classes.includes(boat.id) && styles.chipSelected
              ]}
              onPress={() => toggleBoatClass(boat.id)}
            >
              <Text style={[
                styles.chipText,
                expertise.boat_classes.includes(boat.id) && styles.chipTextSelected
              ]}>
                {boat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Specialties */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coaching Specialties ({expertise.specialties.length} selected)</Text>
        <Text style={styles.sectionDescription}>
          Select your areas of expertise (optional but recommended)
        </Text>

        {specialtyCategories.map(category => (
          <View key={category} style={styles.specialtyCategory}>
            <Text style={styles.specialtyCategoryTitle}>{category}</Text>
            <View style={styles.chipContainer}>
              {getSpecialtiesByCategory(category).map(specialty => (
                <TouchableOpacity
                  key={specialty.id}
                  style={[
                    styles.chip,
                    expertise.specialties.includes(specialty.id) && styles.chipSelected
                  ]}
                  onPress={() => toggleSpecialty(specialty.id)}
                >
                  <Text style={[
                    styles.chipText,
                    expertise.specialties.includes(specialty.id) && styles.chipTextSelected
                  ]}>
                    {specialty.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Skill Levels */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Skill Levels * ({expertise.skill_levels.length} selected)</Text>
        <Text style={styles.sectionDescription}>
          Select the skill levels you're comfortable coaching
        </Text>

        <View style={styles.skillLevelContainer}>
          {SKILL_LEVELS.map(level => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.skillLevelCard,
                expertise.skill_levels.includes(level.id) && styles.skillLevelCardSelected
              ]}
              onPress={() => toggleSkillLevel(level.id)}
            >
              <View style={styles.skillLevelHeader}>
                <Text style={[
                  styles.skillLevelName,
                  expertise.skill_levels.includes(level.id) && styles.skillLevelNameSelected
                ]}>
                  {level.name}
                </Text>
                <View style={[
                  styles.checkbox,
                  expertise.skill_levels.includes(level.id) && styles.checkboxSelected
                ]}>
                  {expertise.skill_levels.includes(level.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </View>
              <Text style={[
                styles.skillLevelDescription,
                expertise.skill_levels.includes(level.id) && styles.skillLevelDescriptionSelected
              ]}>
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Validation Message */}
      {!isFormValid() && (
        <View style={styles.validationMessage}>
          <Text style={styles.validationText}>
            Please select at least one boat class and skill level
          </Text>
        </View>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  categoryTabs: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  categoryTabActive: {
    borderColor: '#0066CC',
    backgroundColor: '#0066CC',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  chipSelected: {
    borderColor: '#0066CC',
    backgroundColor: '#0066CC',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  specialtyCategory: {
    marginBottom: 24,
  },
  specialtyCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  skillLevelContainer: {
    gap: 12,
  },
  skillLevelCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  skillLevelCardSelected: {
    borderColor: '#0066CC',
    backgroundColor: '#F0F8FF',
  },
  skillLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillLevelName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  skillLevelNameSelected: {
    color: '#0066CC',
  },
  skillLevelDescription: {
    fontSize: 14,
    color: '#666',
  },
  skillLevelDescriptionSelected: {
    color: '#004499',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#0066CC',
    backgroundColor: '#0066CC',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  validationMessage: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEB9C',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  validationText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  spacer: {
    height: 40,
  },
});