
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RemindersScreen() {
    const router = useRouter();

    const handleEnable = async () => {
        // In a real app, request permission here:
        // const { status } = await Notifications.requestPermissionsAsync();
        // For now, just proceed
        Alert.alert(
            "Notifications Enabled",
            "Great! We'll let you know when to hit the start line.",
            [{ text: "OK", onPress: () => router.push('/onboarding/auth-choice') }]
        );
    };

    const handleSkip = () => {
        router.push('/onboarding/auth-choice');
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>

                    <View style={styles.imageContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                            <Bell size={64} color="#3B82F6" />
                        </View>
                    </View>

                    <Text style={styles.title}>Enable Smart Reminders</Text>
                    <Text style={styles.subtitle}>
                        Never miss a start sequence. RegattaFlow can alert you when you're near the race area or if you forget to start recording.
                    </Text>

                    <View style={styles.spacer} />

                    <TouchableOpacity style={styles.primaryButton} onPress={handleEnable}>
                        <Text style={styles.primaryButtonText}>Enable Smart Reminders</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleSkip} style={styles.secondaryButton}>
                        <Text style={styles.secondaryText}>Maybe Later</Text>
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
        marginBottom: 32,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
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
        paddingHorizontal: 16,
    },
    spacer: {
        flex: 1,
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        padding: 12,
    },
    secondaryText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '600',
    },
});
