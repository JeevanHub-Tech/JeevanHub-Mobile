// src/app/(auth)/forgot-password.tsx
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { KeyRound, Lock, Mail } from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { RoleToggle } from '../../components/ui/RoleToggle';
import { Colors } from '../../constants/theme';
import { UserRole } from '../../types/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequestOTP = async () => {
    setErrorMessage(null);
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/auth/forgot-password', {
        email: email.trim().toLowerCase(),
        role,
      });
      Alert.alert(
        'Verification Code Sent',
        'If an account exists with this email, an OTP has been sent. Please enter the OTP to reset your password.'
      );
      setStep('verify');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMessage(null);
    if (!otp.trim()) {
      setErrorMessage('Please enter the OTP received on your email/WhatsApp.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Step 2a: Verify OTP to get resetToken
      const verifyRes = await apiClient.post<{ resetToken: string }>('/api/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        role,
        otp: otp.trim(),
      });

      const { resetToken } = verifyRes.data;

      // Step 2b: Update password using verified resetToken
      await apiClient.post('/api/auth/reset-password', {
        email: email.trim().toLowerCase(),
        role,
        resetToken,
        newPassword,
      });

      Alert.alert(
        'Password Reset Successful',
        'Your password has been updated. Please sign in with your new password.',
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password. Check the OTP and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.heading}>Reset Your Password</Text>
            <Text style={styles.subheading}>
              {step === 'request'
                ? 'Enter your registered email and role to receive a verification OTP.'
                : `Enter the OTP sent for ${email} and set your new password.`}
            </Text>

            {errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            )}

            {step === 'request' ? (
              <>
                <RoleToggle selectedRole={role} onSelectRole={setRole} />

                <Input
                  label="Registered Email Address"
                  placeholder="e.g. yourname@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  leftIcon={<Mail size={16} color={Colors.inkMuted} />}
                />

                <Button
                  title="Send Verification OTP"
                  onPress={handleRequestOTP}
                  loading={loading}
                  size="lg"
                  style={styles.submitBtn}
                />
              </>
            ) : (
              <>
                <Input
                  label="Enter OTP"
                  placeholder="6-digit verification code"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  leftIcon={<KeyRound size={16} color={Colors.inkMuted} />}
                />

                <Input
                  label="New Password (min 8 characters)"
                  placeholder="Create new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  leftIcon={<Lock size={16} color={Colors.inkMuted} />}
                />

                <Input
                  label="Confirm New Password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  leftIcon={<Lock size={16} color={Colors.inkMuted} />}
                />

                <Button
                  title="Update Password"
                  onPress={handleResetPassword}
                  loading={loading}
                  size="lg"
                  style={styles.submitBtn}
                />

                <TouchableOpacity
                  onPress={() => setStep('request')}
                  style={styles.backStepLink}
                >
                  <Text style={styles.backStepText}>Resend OTP or change email</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.footerRow}>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.footerLink}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.oliveDeep,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 13,
    color: Colors.inkMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: Colors.errorBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorBannerText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 16,
  },
  backStepLink: {
    alignItems: 'center',
    marginBottom: 16,
  },
  backStepText: {
    fontSize: 13,
    color: Colors.oliveAction,
    fontWeight: '600',
  },
  footerRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.oliveAction,
  },
});
