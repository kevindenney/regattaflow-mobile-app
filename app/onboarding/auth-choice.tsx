
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { User } from 'lucide-react-native';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function AuthChoiceScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.contentContainer}>

                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <User size={40} color="#64748B" />
                        </View>
                        <Text style={styles.title}>Account</Text>
                        <Text style={styles.subtitle}>Sign in / Register</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.premiumBanner}>
                            <View style={styles.premiumIconPlaceholder} />
                            <View style={styles.premiumTextContainer}>
                                <Text style={styles.premiumTitle}>Try RegattaFlow Pro</Text>
                                <Text style={styles.premiumDesc}>Includes 1 week of Premium for you to try, for free.</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.premiumButton}
                            onPress={() => router.push('/onboarding/register')}
                        >
                            <Text style={styles.premiumButtonText}>Redeem Your Free Week</Text>
                        </TouchableOpacity>

                        <Text style={styles.premiumPrice}>Then automatic renewal (Cancel anytime)</Text>
                        <TouchableOpacity onPress={() => router.push('/onboarding/pricing')}>
                            <Text style={styles.learnMore}>Learn More {'>'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={() => router.push('/onboarding/register')}
                        >
                            <Text style={styles.primaryButtonText}>Register</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={() => router.push('/(auth)/login')} // Or a dedicated login screen in onboarding flow
                        >
                            <Text style={styles.secondaryButtonText}>Sign In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.textButton}
                            onPress={() => router.replace('/(tabs)/races')} // Skip
                        >
                            <Text style={styles.textButtonText}>Nevermind</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    safeArea: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 40,
    },
    premiumBanner: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    premiumIconPlaceholder: {
        width: 40,
        height: 40,
        backgroundColor: '#0F172A',
        borderRadius: 10,
        marginRight: 16,
    },
    premiumTextContainer: {
        flex: 1,
    },
    premiumTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    premiumDesc: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    premiumButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    premiumButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },
    premiumPrice: {
        textAlign: 'center',
        color: '#64748B',
        fontSize: 13,
        marginBottom: 16,
    },
    learnMore: {
        textAlign: 'right',
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '600',
    },
    actionsContainer: {
        gap: 16,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    primaryButtonText: {
        color: '#3B82F6',
        fontSize: 18,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
    },
    secondaryButtonText: {
        color: '#3B82F6',
        fontSize: 18,
        fontWeight: '600',
    },
    textButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    textButtonText: {
        color: '#94A3B8',
        fontSize: 16,
        fontWeight: '500',
    },
});
