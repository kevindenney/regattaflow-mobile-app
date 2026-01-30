
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Users, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PricingScreen() {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<'individual' | 'team' | null>('individual');
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        if (!selectedPlan) return;

        setLoading(true);
        // Store the selected plan and proceed to registration
        // After registration, user will be taken to profile-setup
        setTimeout(() => {
            setLoading(false);
            router.push({
                pathname: '/onboarding/register',
                params: { plan: selectedPlan }
            });
        }, 500);
    };

    const handleSkip = () => {
        // Skip pricing, go to registration with free plan
        router.push({
            pathname: '/onboarding/register',
            params: { plan: 'free' }
        });
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.header}>
                        <Text style={styles.title}>Choose Your Plan</Text>
                        <Text style={styles.subtitle}>Unlock the full potential of RegattaFlow.</Text>
                    </View>

                    <View style={styles.cardsContainer}>
                        {/* Individual Plan */}
                        <TouchableOpacity
                            style={[
                                styles.planCard,
                                selectedPlan === 'individual' && styles.selectedCard
                            ]}
                            onPress={() => setSelectedPlan('individual')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                                    <Zap size={24} color="#3B82F6" />
                                </View>
                                {selectedPlan === 'individual' && (
                                    <View style={styles.checkCircle}>
                                        <Ionicons name="checkmark" size={16} color="#FFF" />
                                    </View>
                                )}
                            </View>
                            <Text style={styles.planName}>Individual</Text>
                            <Text style={styles.planPrice}>$10<Text style={styles.period}>/month</Text></Text>
                            <Text style={styles.planDesc}>Perfect for solo sailors tracking their own progress.</Text>
                        </TouchableOpacity>

                        {/* Team Plan */}
                        <TouchableOpacity
                            style={[
                                styles.planCard,
                                selectedPlan === 'team' && styles.selectedCard
                            ]}
                            onPress={() => setSelectedPlan('team')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                                    <Users size={24} color="#9333EA" />
                                </View>
                                {selectedPlan === 'team' && (
                                    <View style={styles.checkCircle}>
                                        <Ionicons name="checkmark" size={16} color="#FFF" />
                                    </View>
                                )}
                            </View>
                            <Text style={styles.planName}>Team</Text>
                            <Text style={styles.planPrice}>$35<Text style={styles.period}>/month</Text></Text>
                            <Text style={styles.planDesc}>Up to 5 users. ideal for crews and sailing teams.</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.featuresList}>
                        <Text style={styles.featuresTitle}>Includes:</Text>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.featureText}>Unlimited Race Logging</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.featureText}>Advanced Analytics</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.featureText}>Weather & Tide Integration</Text>
                        </View>
                    </View>

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        disabled={loading}
                    >
                        <Text style={styles.continueButtonText}>
                            {loading ? 'Processing...' : `Start ${selectedPlan === 'individual' ? 'Individual' : 'Team'} Plan`}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleSkip}
                    >
                        <Text style={styles.skipButtonText}>I'll decide later</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        marginTop: 20,
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
    },
    cardsContainer: {
        gap: 16,
        marginBottom: 32,
    },
    planCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    selectedCard: {
        borderColor: '#3B82F6',
        backgroundColor: '#F0F9FF',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    planName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    planPrice: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    period: {
        fontSize: 16,
        fontWeight: '500',
        color: '#64748B',
    },
    planDesc: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    featuresList: {
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    featuresTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    featureText: {
        fontSize: 16,
        color: '#334155',
    },
    footer: {
        padding: 24,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    continueButton: {
        backgroundColor: '#0F172A',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    skipButtonText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '600',
    },
});
