
import { useRouter } from 'expo-router';
import { Watch } from 'lucide-react-native';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WatchAppScreen() {
    const router = useRouter();

    const handleNext = () => {
        router.push('/onboarding/reminders');
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>

                    <View style={styles.imageContainer}>
                        {/* Placeholder for Watch App Image - using icon for now */}
                        <View style={styles.iconCircle}>
                            <Watch size={80} color="#0F172A" />
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>COMING SOON</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>Install the Watch App</Text>
                    <Text style={styles.subtitle}>
                        Track your races and performance directly from your wrist. Leave your phone in the dry bag.
                    </Text>

                    <View style={styles.spacer} />

                    <TouchableOpacity style={styles.button} onPress={handleNext}>
                        <Text style={styles.buttonText}>I don't have a watch</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleNext} style={styles.skipButton}>
                        {/* Treating "Next" as the main action even if they don't have one, or maybe "Continue" */}
                        <Text style={styles.skipText}>Next</Text>
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
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 40,
        position: 'relative',
    },
    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        bottom: -10,
        backgroundColor: '#3B82F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#F8FAFC',
    },
    badgeText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    spacer: {
        flex: 1,
    },
    button: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: '#0F172A',
        fontSize: 16,
        fontWeight: '600',
    },
    skipButton: {
        padding: 12,
    },
    skipText: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '600',
    },
});
