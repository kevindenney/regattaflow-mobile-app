
import { isAppleSignInAvailable } from '@/lib/auth/nativeOAuth';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Helper to get user-friendly error messages for signup
const getSignupErrorMessage = (error: any): string => {
    const message = error?.message?.toLowerCase() || '';
    const code = error?.code || '';

    if (message.includes('registered') || message.includes('duplicate') || message.includes('already') || code === 'user_already_exists') {
        return 'An account with this email already exists. Try signing in instead.';
    }
    if (message.includes('invalid email') || message.includes('email')) {
        return 'Please enter a valid email address.';
    }
    if (message.includes('network') || message.includes('fetch')) {
        return 'Network error. Please check your internet connection.';
    }
    if (message.includes('timeout')) {
        return 'The request timed out. Please try again.';
    }
    return error?.message || 'Unable to create your account. Please try again.';
};

export default function RegisterScreen() {
    const router = useRouter();
    const { signUp, signInWithGoogle, signInWithApple, loading: authLoading } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [appleSignInAvailable, setAppleSignInAvailable] = useState(Platform.OS === 'web');

    const isLoading = loading || authLoading;

    useEffect(() => {
        // Check Apple Sign In availability on iOS
        if (Platform.OS === 'ios') {
            isAppleSignInAvailable().then(setAppleSignInAvailable);
        }
    }, []);

    const handleSignUp = async () => {
        setErrorMessage(null);
        const trimmedEmail = email.trim();
        const trimmedName = name.trim();

        // Validate inputs
        if (!trimmedName) {
            setErrorMessage('Please enter your name.');
            return;
        }
        if (!trimmedEmail) {
            setErrorMessage('Please enter your email address.');
            return;
        }
        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            // Sign up as 'sailor'
            const result = await signUp(trimmedEmail, trimmedName, password, 'sailor');

            if (result?.user) {
                // Success! Navigate to profile setup
                router.push({
                    pathname: '/onboarding/profile-setup',
                    params: { name: encodeURIComponent(trimmedName) }
                });
            }
        } catch (error: any) {
            console.error('[Register] Account creation error:', error);
            const friendlyMessage = getSignupErrorMessage(error);
            setErrorMessage(friendlyMessage);
            // if (Platform.OS !== 'web') {
            //     Alert.alert('Signup error', friendlyMessage);
            // }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setErrorMessage(null);
        try {
            await signInWithGoogle('sailor');
            // Auth provider or callback handles the rest, but we might want to ensure we hit profile setup if possible.
            // Usually Google Auth redirects to a callback URL. Deep linking might take us back to the app.
            // For now, simpler flow is to let the standard callback handle it, or try to intercept.
        } catch (error: any) {
            console.error('[Register] Google sign-up error:', error);
            setErrorMessage(getSignupErrorMessage(error));
        }
    };

    const handleAppleSignUp = async () => {
        setErrorMessage(null);
        try {
            await signInWithApple('sailor');
        } catch (error: any) {
            console.error('[Register] Apple sign-up error:', error);
            setErrorMessage(getSignupErrorMessage(error));
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Register</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="First Last"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="me@email.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Min 6 characters"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        {errorMessage && (
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        )}

                        <TouchableOpacity
                            style={[styles.registerButton, isLoading && styles.disabledButton]}
                            onPress={handleSignUp}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.registerButtonText}>Register with Email</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <Text style={styles.dividerText}>or</Text>
                        </View>

                        {/* Social Auth */}
                        {/* Apple Sign-in */}
                        {appleSignInAvailable && (
                            Platform.OS === 'ios' ? (
                                <AppleAuthentication.AppleAuthenticationButton
                                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                                    cornerRadius={8}
                                    style={styles.appleNativeButton}
                                    onPress={handleAppleSignUp}
                                />
                            ) : (
                                <TouchableOpacity style={styles.appleButton} onPress={handleAppleSignUp}>
                                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.appleButtonText}>Sign up with Apple</Text>
                                </TouchableOpacity>
                            )
                        )}

                        {/* Google Sign-in */}
                        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignUp}>
                            <Ionicons name="logo-google" size={20} color="#000000" style={{ marginRight: 8 }} />
                            <Text style={styles.googleButtonText}>Sign up with Google</Text>
                        </TouchableOpacity>

                    </View>

                    {/* Terms */}
                    <View style={styles.termsContainer}>
                        <View style={styles.termRow}>
                            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                            <Text style={styles.termText}>I agree to the <Text style={styles.link}>terms of service</Text> & <Text style={styles.link}>how my data is managed</Text>.</Text>
                        </View>
                        <View style={styles.termRow}>
                            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                            <Text style={styles.termText}>RegattaFlow can send me helpful tips & product updates.</Text>
                        </View>
                    </View>

                </ScrollView>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
        minWidth: 44,
    },
    cancelText: {
        fontSize: 16,
        color: '#3B82F6',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#0F172A',
    },
    content: {
        padding: 24,
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#0F172A',
    },
    registerButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        marginBottom: 12,
    },
    divider: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerText: {
        color: '#94A3B8',
        fontSize: 14,
    },
    appleNativeButton: {
        width: '100%',
        height: 48,
        marginBottom: 12,
    },
    appleButton: {
        backgroundColor: '#000000',
        borderRadius: 8,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    appleButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    googleButtonText: {
        color: '#0F172A',
        fontWeight: '600',
        fontSize: 16,
    },
    termsContainer: {
        gap: 12,
    },
    termRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingRight: 20,
    },
    termText: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        flex: 1,
    },
    link: {
        color: '#3B82F6',
        textDecorationLine: 'underline',
    },
});
