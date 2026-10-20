// src/app/(auth)/register-patient.tsx
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
import { Lock, Mail, Phone, User, Calendar, MapPin } from 'lucide-react-native';
import { authApi } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function RegisterPatientScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [zipCode, setZipCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    setErrorMessage(null);

    // Basic Validations
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please provide your full first and last name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!zipCode.trim() || zipCode.trim().length < 6) {
      setErrorMessage('Please enter a valid 6-digit PIN / Zip code.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.registerPatient({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        dob: dob.trim() || undefined,
        gender,
        zipCode: zipCode.trim(),
        password,
      });

      // Automatically sign in the newly registered patient
      await setAuth(data.token, data.user);
      Alert.alert(
        'Registration Successful',
        `Welcome to JeevanHub, ${data.user.firstName}!`,
        [{ text: 'Get Started' }]
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
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
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.heading}>Create Patient Account</Text>
            <Text style={styles.subheading}>
              Join JeevanHub to consult certified Ayurvedic doctors, access personalized diet and yoga regimens, and track your wellness.
            </Text>

            {errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            )}

            {/* Name Fields */}
            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Input
                  label="First Name *"
                  placeholder="e.g. Ramesh"
                  value={firstName}
                  onChangeText={setFirstName}
                  leftIcon={<User size={16} color={Colors.inkMuted} />}
                />
              </View>
              <View style={styles.halfCol}>
                <Input
                  label="Last Name *"
                  placeholder="e.g. Sharma"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* Email & Phone */}
            <Input
              label="Email Address *"
              placeholder="e.g. ramesh@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={16} color={Colors.inkMuted} />}
            />

            <Input
              label="Phone Number (10 digits) *"
              placeholder="e.g. 9876543210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              leftIcon={<Phone size={16} color={Colors.inkMuted} />}
            />

            {/* Date of Birth & Zip Code */}
            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Input
                  label="Date of Birth"
                  placeholder="YYYY-MM-DD"
                  value={dob}
                  onChangeText={setDob}
                  leftIcon={<Calendar size={16} color={Colors.inkMuted} />}
                />
              </View>
              <View style={styles.halfCol}>
                <Input
                  label="PIN / Zip Code *"
                  placeholder="e.g. 110001"
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  leftIcon={<MapPin size={16} color={Colors.inkMuted} />}
                />
              </View>
            </View>

            {/* Gender Selector Chips */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={[
                      styles.genderChip,
                      gender === g && styles.genderChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderChipText,
                        gender === g && styles.genderChipTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Passwords */}
            <Input
              label="Password (min 8 characters) *"
              placeholder="Choose a strong password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Lock size={16} color={Colors.inkMuted} />}
            />

            <Input
              label="Confirm Password *"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leftIcon={<Lock size={16} color={Colors.inkMuted} />}
            />

            {/* Submit Button */}
            <Button
              title="Create My Account"
              onPress={handleRegister}
              loading={loading}
              size="lg"
              style={styles.submitBtn}
            />

            {/* Already have account */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.footerLink}>Sign In</Text>
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
    paddingBottom: 40,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.sagePale,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genderChipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },
  genderChipTextActive: {
    color: Colors.cream,
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
    marginTop: 10,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.inkMuted,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.oliveAction,
  },
});
