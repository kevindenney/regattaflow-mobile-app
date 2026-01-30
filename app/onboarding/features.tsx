
import { useRouter } from 'expo-router';
import { Bell, User, Users, Watch } from 'lucide-react-native';
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FeaturesScreen() {
    const router = useRouter();

    const SetupItem = ({ icon: Icon, title, description, isCompleted = false, badge }: { icon: any, title: string, description?: string, isCompleted?: boolean, badge?: string }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <Icon size={24} color="#3B82F6" strokeWidth={2} />
                </View>
                <View style={styles.textContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text style={styles.cardTitle}>{title}</Text>
                        {badge && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{badge}</Text>
                            </View>
                        )}
                    </View>
                    {description && <Text style={styles.cardDescription}>{description}</Text>}
                </View>
                {isCompleted && (
                    <View style={styles.checkIcon}>
                        {/* Placeholder for checkmark if we wanted to show completion */}
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.contentContainer}>

                    <View style={styles.header}>
                        <Text style={styles.mainTitle}>Logbook</Text>
                        <Text style={styles.subtitle}>
                            Waiting for fresh wind?{"\n"}
                            Get the most out of RegattaFlow.
                        </Text>

                        <View style={styles.progressContainer}>
                            <Text style={styles.stepText}>Completed 0 out of 5 steps.</Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressIndicator, { width: '5%' }]} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.listContainer}>
                        <SetupItem
                            icon={Watch}
                            title="Install the Watch App"
                            description="Track your races and performance directly from your wrist."
                            badge="Coming Soon"
                        />
                        <SetupItem
                            icon={Bell}
                            title="Enable Smart Reminders"
                            description="If you forget to start recording, RegattaFlow can alert you when you're near the start line."
                        />
                        <SetupItem
                            icon={User}
                            title="Create an Account"
                            description="Make a free RegattaFlow account so your future recordings are kept safe online."
                        />
                        <SetupItem
                            icon={Users}
                            title="Join the Community"
                            description="Find crew, join clubs, and connect with other sailors near you."
                        />
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => router.push('/onboarding/watch-app')}
                        >
                            <Text style={styles.buttonText}>Get Started</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9', // Slightly darker than F8FAFC for better card contrast
    },
    safeArea: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    header: {
        marginBottom: 16,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748B',
        marginBottom: 12,
        lineHeight: 20,
    },
    progressContainer: {
        gap: 6,
    },
    stepText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        width: '100%',
    },
    progressIndicator: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 3,
    },
    listContainer: {
        gap: 10,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center', // Align center vertically
    },
    iconContainer: {
        marginRight: 12,
        marginTop: 0, // Remove top margin since we align center
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    badge: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        color: '#3B82F6',
        fontWeight: '700',
    },
    cardDescription: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
    checkIcon: {
        marginLeft: 8,
    },
    footer: {
        marginTop: 16,
    },
    button: {
        backgroundColor: '#0F172A',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
