import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CoachRegistrationForm, CoachService, CoachAvailability } from '../../types/coach';
import { CoachMarketplaceService } from '../../services/CoachService';
import { useAuth } from '../../contexts/AuthContext';

// Import step components (we'll create these next)
import PersonalInfoStep from './registration/PersonalInfoStep';
import CredentialsStep from './registration/CredentialsStep';
import ExpertiseStep from './registration/ExpertiseStep';
import ServicesStep from './registration/ServicesStep';
import AvailabilityStep from './registration/AvailabilityStep';
import MediaStep from './registration/MediaStep';

const STEPS = [
  { id: 1, title: 'Personal Info', component: PersonalInfoStep },
  { id: 2, title: 'Credentials', component: CredentialsStep },
  { id: 3, title: 'Expertise', component: ExpertiseStep },
  { id: 4, title: 'Services & Pricing', component: ServicesStep },
  { id: 5, title: 'Availability', component: AvailabilityStep },
  { id: 6, title: 'Media', component: MediaStep },
];

export default function CoachRegistration() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CoachRegistrationForm>({
    personal_info: {
      first_name: '',
      last_name: '',
      email: user?.email || '',
      location: '',
      time_zone: '',
      languages: ['English'],
      bio: '',
    },
    credentials: {
      years_coaching: 0,
      students_coached: 0,
      certifications: [],
      racing_achievements: [],
    },
    expertise: {
      boat_classes: [],
      specialties: [],
      skill_levels: ['Intermediate'],
    },
    services: [],
    availability: [],
    media: {},
  });

  const updateFormData = (section: keyof CoachRegistrationForm, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: data,
    }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to register as a coach');
      return;
    }

    setIsLoading(true);
    try {
      const coach = await CoachMarketplaceService.registerCoach(formData, user.id);

      Alert.alert(
        'Registration Submitted!',
        'Your coach profile has been submitted for review. We\'ll notify you once it\'s approved.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/dashboard'),
          },
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to submit your registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isStepComplete = (stepId: number): boolean => {
    switch (stepId) {
      case 1:
        return !!(formData.personal_info.first_name &&
                 formData.personal_info.last_name &&
                 formData.personal_info.location &&
                 formData.personal_info.bio);
      case 2:
        return formData.credentials.years_coaching > 0;
      case 3:
        return formData.expertise.boat_classes.length > 0;
      case 4:
        return formData.services.length > 0;
      case 5:
        return formData.availability.length > 0;
      case 6:
        return true; // Media is optional
      default:
        return false;
    }
  };

  const getCurrentStepComponent = () => {
    const StepComponent = STEPS[currentStep - 1].component;
    return (
      <StepComponent
        data={formData}
        updateData={updateFormData}
        onNext={handleNext}
        onBack={handleBack}
        isLoading={isLoading}
        isLastStep={currentStep === STEPS.length}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          {STEPS.map((step, index) => (
            <View
              key={step.id}
              style={[
                styles.progressStep,
                {
                  backgroundColor: currentStep > step.id ? '#00FF88' :
                                  currentStep === step.id ? '#0066CC' : '#E0E0E0',
                  width: `${100 / STEPS.length}%`,
                }
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>
          Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
        </Text>
      </View>

      {/* Step Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {getCurrentStepComponent()}
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={handleBack}
          disabled={currentStep === 1}
        >
          <Text style={[styles.buttonText, { opacity: currentStep === 1 ? 0.5 : 1 }]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.nextButton,
            { opacity: !isStepComplete(currentStep) ? 0.5 : 1 }
          ]}
          onPress={handleNext}
          disabled={!isStepComplete(currentStep) || isLoading}
        >
          <Text style={styles.buttonText}>
            {currentStep === STEPS.length ? 'Submit Registration' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressBar: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 12,
  },
  progressStep: {
    height: 4,
    borderRadius: 2,
    marginRight: 2,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  backButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  nextButton: {
    backgroundColor: '#0066CC',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});