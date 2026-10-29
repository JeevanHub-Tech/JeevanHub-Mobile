// src/app/(auth)/login.tsx
import React, { useState } from 'react';
import {
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
import { Leaf, Lock, Mail } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { RoleToggle } from '../../components/ui/RoleToggle';
import { BACKEND_URL } from '../../config';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRoleChange = (newRole: 'patient' | 'doctor') => {
    setRole(newRole);
    clearError();
    setLocalError(null);
  };


  const handleLogin = async () => {
    clearError();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    try {
      console.log(`[AUTH] Attempting login: ${email.trim()} (${role}) -> ${BACKEND_URL}`);
      await login(email.trim(), password, role);
      console.log(`[AUTH] Login succeeded, navigating to: ${role}`);
      if (role === 'doctor') {
        router.replace('/(doctor)');
      } else {
        router.replace('/(patient)');
      }
    } catch (err: any) {
      console.error('[AUTH] Login error:', err?.message || err);
    }
  };

  const navigateToRegister = () => {
    clearError();
    if (role === 'patient') {
      router.push('/(auth)/register-patient');
    } else {
      router.push('/(auth)/register-doctor');
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Leaf size={28} color={Colors.cream} />
            </View>
            <Text style={styles.brandTitle}>JeevanHub</Text>
            <Text style={styles.tagline}>
              Ayurvedic Healthcare & Clinical Consultations
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.instructionText}>
              Select your role to sign into your account
            </Text>
            {/* Role Switcher */}
            <RoleToggle selectedRole={role} onSelectRole={handleRoleChange} />

            {/* Error Banner */}
            {displayError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{displayError}</Text>
              </View>
            )}

            {/* Inputs */}
            <Input
              label="Email Address"
              placeholder={`e.g. ${role}@example.com`}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (displayError) {
                  clearError();
                  setLocalError(null);
                }
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              leftIcon={<Mail size={18} color={Colors.inkMuted} />}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (displayError) {
                  clearError();
                  setLocalError(null);
                }
              }}
              secureTextEntry
              leftIcon={<Lock size={18} color={Colors.inkMuted} />}
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Button
              title={`Sign In as ${role === 'patient' ? 'Patient' : 'Doctor'}`}
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
              style={styles.submitButton}
            />

            {/* Register Link */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don't have an account yet? </Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.registerLink}>
                  Sign Up as {role === 'patient' ? 'Patient' : 'Doctor'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Server Connection Indicator */}
          <Text style={styles.serverIndicatorText}>
            Server: {BACKEND_URL}
          </Text>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 30 : 10,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.oliveDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.oliveDeep,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 13,
    color: Colors.inkMuted,
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
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: Colors.oliveAction,
    fontWeight: '600',
  },
  submitButton: {
    marginBottom: 20,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
    color: Colors.inkMuted,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.oliveAction,
  },
  serverIndicatorText: {
    fontSize: 11,
    color: Colors.inkMuted,
    textAlign: 'center',
    marginTop: 18,
    opacity: 0.7,
  },
});
