import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/services/supabase';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Error', passwordError);
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      // First, verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        Alert.alert('Error', 'Current password is incorrect');
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      Alert.alert(
        'Success',
        'Your password has been changed successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (password.length === 0) return { strength: '', color: '' };
    if (password.length < 8) return { strength: 'Weak', color: '#EF4444' };

    let score = 0;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length >= 12) score++;

    if (score <= 2) return { strength: 'Weak', color: '#EF4444' };
    if (score <= 3) return { strength: 'Medium', color: '#F59E0B' };
    return { strength: 'Strong', color: '#10B981' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Change Password</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Info Card */}
        <View className="bg-blue-50 mx-4 mt-4 p-4 rounded-lg border border-blue-200">
          <View className="flex-row">
            <Lock size={20} color="#2563EB" />
            <View className="flex-1 ml-3">
              <Text className="text-blue-900 font-semibold mb-1">
                Password Requirements
              </Text>
              <Text className="text-blue-700 text-sm">
                • At least 8 characters long{'\n'}
                • Contains uppercase and lowercase letters{'\n'}
                • Contains at least one number{'\n'}
                • Different from current password
              </Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View className="bg-white mt-4 px-4 py-4">
          {/* Current Password */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Current Password</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex-row items-center">
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry={!showCurrentPassword}
                className="flex-1 text-gray-800"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">New Password</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex-row items-center">
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry={!showNewPassword}
                className="flex-1 text-gray-800"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
            {newPassword.length > 0 && (
              <View className="flex-row items-center mt-2">
                <Text className="text-sm text-gray-600 mr-2">Strength:</Text>
                <Text
                  className="text-sm font-semibold"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.strength}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-2">Confirm New Password</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex-row items-center">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmPassword}
                className="flex-1 text-gray-800"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text className="text-red-500 text-sm mt-1">
                Passwords do not match
              </Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={loading}
            className="bg-blue-500 rounded-lg py-4 items-center"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Change Password
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Forgot Password Link */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Reset Password',
              'A password reset link will be sent to your email',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Send Link',
                  onPress: async () => {
                    try {
                      await supabase.auth.resetPasswordForEmail(user?.email || '');
                      Alert.alert('Success', 'Password reset link sent to your email');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to send reset link');
                    }
                  }
                }
              ]
            );
          }}
          className="mt-4 py-3"
        >
          <Text className="text-blue-500 text-center font-medium">
            Forgot your current password?
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
