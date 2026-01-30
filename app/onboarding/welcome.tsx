
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Background Image/Gradient Placeholder - Slopes uses a nice skiing photo, we can use a sailing one or a gradient for now */}
            <View style={styles.backgroundContainer}>
                {/* You can replace this with an actual Image component when you have the asset */}
                <View style={styles.placeholderBackground} />
                <View style={styles.overlay} />
            </View>

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.contentContainer}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>Welcome to</Text>
                        <Text style={styles.appName}>RegattaFlow</Text>
                    </View>

                    <View style={styles.messageContainer}>
                        <Text style={styles.greeting}>Hi. I'm working hard to build my dream app for tracking your sailing adventures.</Text>
                        <Text style={styles.subMessage}>I hope you love using RegattaFlow to track your days on the water.</Text>

                        <View style={styles.signatureContainer}>
                            <View style={styles.avatarPlaceholder} />
                            <Text style={styles.signature}>- Kevin</Text>
                        </View>
                    </View>

                    <View style={styles.footerContainer}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => router.push('/onboarding/features')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>Let's Do This</Text>
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
        backgroundColor: '#0F172A', // Dark blue/slate background
    },
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    placeholderBackground: {
        flex: 1,
        backgroundColor: '#3B82F6', // Blue-500
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)', // Slight dark overlay
    },
    safeArea: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'space-between',
        paddingBottom: Platform.OS === 'ios' ? 20 : 40,
    },
    headerContainer: {
        marginTop: height * 0.15,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    appName: {
        fontSize: 48,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: -5,
        letterSpacing: -1,
    },
    messageContainer: {
        marginTop: 40,
        flex: 1,
    },
    greeting: {
        fontSize: 18,
        lineHeight: 28,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    subMessage: {
        fontSize: 18,
        lineHeight: 28,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 20,
        fontWeight: '500',
    },
    signatureContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
        justifyContent: 'flex-end',
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#CBD5E1',
        marginRight: 10,
    },
    signature: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    footerContainer: {
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#0F172A',
        fontSize: 18,
        fontWeight: '700',
    },
});
