// src/app/(auth)/register-doctor.tsx
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
import * as DocumentPicker from 'expo-document-picker';
import {
  Award,
  Calendar,
  CheckCircle,
  CreditCard,
  FileText,
  Lock,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  Upload,
  User,
} from 'lucide-react-native';
import { authApi } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function RegisterDoctorScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  // Personal
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [zipCode, setZipCode] = useState('');

  // Professional Credentials
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [specialization, setSpecialization] = useState('Kaya Chikitsa, Panchakarma');
  const [experience, setExperience] = useState('5');
  const [education, setEducation] = useState('BAMS, MD (Ayurveda)');
  const [designation, setDesignation] = useState('Senior Ayurvedic Consultant');
  const [price, setPrice] = useState('500');
  const [upiId, setUpiId] = useState('');

  // Certificate Document
  const [certificateAsset, setCertificateAsset] = useState<{
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
  } | null>(null);

  // Security
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pickCertificate = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setCertificateAsset({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType || 'image/jpeg',
          size: file.size,
        });
      }
    } catch (e: any) {
      Alert.alert('File Picker Error', e.message || 'Could not pick document.');
    }
  };

  const handleRegister = async () => {
    setErrorMessage(null);

    // Validations
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please provide your full first and last name.');
      return;
    }
    if (!registrationNumber.trim()) {
      setErrorMessage('Ayurvedic Medical Registration Number is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMessage('Please enter a 10-digit mobile number.');
      return;
    }
    if (!certificateAsset) {
      setErrorMessage('Ayurvedic degree certificate / registration proof is required.');
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
      const data = await authApi.registerDoctor({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        registrationNumber: registrationNumber.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        dob: dob.trim() || undefined,
        gender,
        zipCode: zipCode.trim(),
        experience: parseFloat(experience) || 0,
        specialization: specialization.trim(),
        education: education.trim(),
        designation: designation.trim(),
        price: parseFloat(price) || 500,
        upiId: upiId.trim() || undefined,
        password,
        certificateUri: certificateAsset.uri,
        certificateFileName: certificateAsset.name,
        certificateMimeType: certificateAsset.mimeType,
      });

      await setAuth(data.token, data.user);
      Alert.alert(
        'Doctor Account Created',
        `Welcome Dr. ${data.user.firstName}! Your profile has been submitted and is pending administrative verification.`,
        [{ text: 'Continue to Dashboard', onPress: () => router.replace('/(doctor)') }]
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Doctor registration failed. Please review the details.');
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
            <Text style={styles.heading}>Ayurvedic Practitioner Registration</Text>
            <Text style={styles.subheading}>
              Join the JeevanHub clinical network. Provide your medical credentials and practice information.
            </Text>

            {errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            )}

            {/* Section 1: Personal Details */}
            <Text style={styles.sectionTitle}>1. Personal Information</Text>

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Input
                  label="First Name *"
                  placeholder="e.g. Aarav"
                  value={firstName}
                  onChangeText={setFirstName}
                  leftIcon={<User size={16} color={Colors.inkMuted} />}
                />
              </View>
              <View style={styles.halfCol}>
                <Input
                  label="Last Name *"
                  placeholder="e.g. Verma"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <Input
              label="Email Address *"
              placeholder="e.g. dr.verma@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={16} color={Colors.inkMuted} />}
            />

            <Input
              label="Contact Phone (10 digits) *"
              placeholder="e.g. 9876543210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              leftIcon={<Phone size={16} color={Colors.inkMuted} />}
            />

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
                  label="PIN / Zip Code"
                  placeholder="e.g. 110001"
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  leftIcon={<MapPin size={16} color={Colors.inkMuted} />}
                />
              </View>
            </View>

            {/* Section 2: Clinical Credentials */}
            <Text style={styles.sectionTitle}>2. Medical & Clinical Credentials</Text>

            <Input
              label="Medical Registration Number *"
              placeholder="e.g. AYUSH-DL-2018-9842"
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
              leftIcon={<Award size={16} color={Colors.inkMuted} />}
            />

            <Input
              label="Degree / Education *"
              placeholder="e.g. BAMS, MD (Ayurveda)"
              value={education}
              onChangeText={setEducation}
              leftIcon={<FileText size={16} color={Colors.inkMuted} />}
            />

            <Input
              label="Designation / Title *"
              placeholder="e.g. Senior Ayurvedic Consultant"
              value={designation}
              onChangeText={setDesignation}
              leftIcon={<Stethoscope size={16} color={Colors.inkMuted} />}
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Input
                  label="Experience (Years) *"
                  placeholder="e.g. 5"
                  value={experience}
                  onChangeText={setExperience}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.halfCol}>
                <Input
                  label="Consultation Fee (₹) *"
                  placeholder="e.g. 500"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Input
              label="Specialization(s) (comma separated) *"
              placeholder="e.g. Panchakarma, Rasayana, Nadi Pariksha"
              value={specialization}
              onChangeText={setSpecialization}
            />

            <Input
              label="UPI ID for Payouts (Optional)"
              placeholder="e.g. doctor@okicici"
              value={upiId}
              onChangeText={setUpiId}
              leftIcon={<CreditCard size={16} color={Colors.inkMuted} />}
            />

            {/* Certificate Upload Picker */}
            <Text style={styles.sectionTitle}>3. Ayurvedic Degree Certificate *</Text>
            <TouchableOpacity
              onPress={pickCertificate}
              activeOpacity={0.8}
              style={[
                styles.uploadBox,
                certificateAsset && styles.uploadBoxSuccess,
              ]}
            >
              {certificateAsset ? (
                <View style={styles.uploadSelected}>
                  <CheckCircle size={24} color={Colors.success} />
                  <View style={styles.uploadSelectedInfo}>
                    <Text style={styles.uploadSelectedName} numberOfLines={1}>
                      {certificateAsset.name}
                    </Text>
                    <Text style={styles.uploadSelectedHint}>
                      File selected (Tap to change)
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPrompt}>
                  <Upload size={24} color={Colors.olive} />
                  <Text style={styles.uploadPromptText}>
                    Tap to upload certificate (PDF or Image, max 5MB)
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Section 4: Security */}
            <Text style={styles.sectionTitle}>4. Account Security</Text>

            <Input
              label="Password (min 8 characters) *"
              placeholder="Create strong password"
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
              title="Register as Ayurvedic Doctor"
              onPress={handleRegister}
              loading={loading}
              size="lg"
              style={styles.submitBtn}
            />

            {/* Link back */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already registered? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.footerLink}>Doctor Sign In</Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.oliveDeep,
    marginTop: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.oliveLight,
    backgroundColor: Colors.sagePale,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadBoxSuccess: {
    borderColor: Colors.success,
    backgroundColor: Colors.successBg,
    borderStyle: 'solid',
  },
  uploadPrompt: {
    alignItems: 'center',
    gap: 8,
  },
  uploadPromptText: {
    fontSize: 13,
    color: Colors.oliveDeep,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadSelectedInfo: {
    flex: 1,
  },
  uploadSelectedName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  uploadSelectedHint: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
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
    marginTop: 14,
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
