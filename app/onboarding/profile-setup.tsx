
import { useAuth } from '@/providers/AuthProvider';
import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { decode } from 'base64-arraybuffer';

export default function ProfileSetupScreen() {
    const router = useRouter();
    const { user: authUser } = useAuth();
    const params = useLocalSearchParams<{ name?: string }>();

    const [loading, setLoading] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [sessionUser, setSessionUser] = useState<any>(null);

    const initialName = params.name ? decodeURIComponent(params.name) : '';

    // Get user from session as fallback if auth context not ready
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setSessionUser(session.user);
            }
        };
        if (!authUser) {
            getSession();
        }
    }, [authUser]);

    // Use auth context user if available, otherwise use session user
    const user = authUser || sessionUser;

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                setImageUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const uploadProfileImage = async (userId: string, uri: string): Promise<string | null> => {
        try {
            const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${userId}/${Date.now()}.${fileExt}`;
            const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

            let fileData: ArrayBuffer;

            if (Platform.OS === 'web') {
                // Web: use fetch and arrayBuffer
                const response = await fetch(uri);
                fileData = await response.arrayBuffer();
            } else {
                // Native: use expo-file-system to read as base64, then decode
                const base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                fileData = decode(base64);
            }

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, fileData, {
                    contentType,
                    upsert: true,
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error: any) {
            console.error('Error uploading image:', error);
            throw error;
        }
    };

    const handleFinish = async () => {
        setLoading(true);

        // Get user from state or fetch directly from session
        let currentUser = user;
        if (!currentUser) {
            const { data: { session } } = await supabase.auth.getSession();
            currentUser = session?.user;
        }

        if (!currentUser) {
            setLoading(false);
            Alert.alert('Error', 'No authenticated user found. Please try signing in again.');
            return;
        }

        try {
            let avatarUrl = null;
            if (imageUri) {
                try {
                    avatarUrl = await uploadProfileImage(currentUser.id, imageUri);
                } catch (uploadError: any) {
                    console.error('Avatar upload failed:', uploadError);
                    Alert.alert(
                        'Photo Upload Failed',
                        'We couldn\'t upload your profile picture. You can add it later in Settings.',
                        [{ text: 'OK' }]
                    );
                }
            }

            // Update user profile with basic info (onboarding_completed will be set at the end)
            const profileData: any = {
                id: currentUser.id,
                email: currentUser.email,
                user_type: 'sailor',
                updated_at: new Date().toISOString(),
            };

            if (initialName) {
                profileData.full_name = initialName;
            }

            // Use upsert to create or update the user profile
            const { error: upsertError } = await supabase
                .from('users')
                .upsert(profileData, { onConflict: 'id' });

            if (upsertError) throw upsertError;

            // Store user info in onboarding state for later use
            await OnboardingStateService.setUserInfo(
                currentUser.id,
                initialName || 'Sailor',
                avatarUrl || undefined
            );
            await OnboardingStateService.completeStep('profile-setup');

            // Navigate to setup choice screen (Quick Start vs Full Setup)
            router.push({
                pathname: '/onboarding/setup-choice',
                params: {
                    name: encodeURIComponent(initialName || 'Sailor'),
                    avatarUrl: avatarUrl ? encodeURIComponent(avatarUrl) : undefined,
                },
            });

        } catch (error: any) {
            console.error('Profile setup error:', error);
            Alert.alert('Error', 'Failed to complete setup. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>

                    <View style={styles.header}>
                        <Text style={styles.title}>Welcome to RegattaFlow, {initialName ? initialName.split(' ')[0] : 'Sailor'}!</Text>
                        <Text style={styles.subtitle}>Let's set up your profile.</Text>
                    </View>

                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="camera" size={32} color="#94A3B8" />
                                </View>
                            )}
                            <View style={styles.editBadge}>
                                <Ionicons name="pencil" size={12} color="#FFFFFF" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.avatarLabel}>Pick Profile Picture</Text>
                        <Text style={styles.avatarSubtext}>Your profile picture is how friends will identify you on maps and leaderboards.</Text>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.finishButton}
                            onPress={handleFinish}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.finishButtonText}>Finish</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleFinish}
                            disabled={loading}
                        >
                            <Text style={styles.skipButtonText}>I'll Do This Later</Text>
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
        backgroundColor: '#F8FAFC',
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 32,
        justifyContent: 'space-between',
    },
    header: {
        marginTop: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
    },
    avatarSection: {
        alignItems: 'center',
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#3B82F6',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#F8FAFC',
    },
    avatarLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
    },
    avatarSubtext: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
    },
    footer: {
        gap: 16,
        marginBottom: 20,
    },
    finishButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    finishButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    skipButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#94A3B8',
        fontSize: 16,
        fontWeight: '600',
    },
});
