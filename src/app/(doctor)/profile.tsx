// src/app/(doctor)/profile.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import {
  Award,
  Building,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  GraduationCap,
  KeyRound,
  Landmark,
  Languages,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Upload,
  User,
} from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { apiClient } from '../../api/client';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

type ProfileTab = 'personal' | 'practice' | 'certificate' | 'security';

export default function DoctorProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);

  useEffect(() => {
    if (params.tab === 'fees' || params.tab === 'practice') {
      setActiveTab('practice');
    } else if (params.tab === 'certificate') {
      setActiveTab('certificate');
    } else if (params.tab === 'personal') {
      setActiveTab('personal');
    } else if (params.tab === 'security') {
      setActiveTab('security');
    }
  }, [params.tab]);

  // ─── Editable Personal & Professional Fields ─────────────────────────────
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [registrationNumber, setRegistrationNumber] = useState(user?.registrationNumber || '');
  const [specialization, setSpecialization] = useState(
    Array.isArray(user?.specialization)
      ? user.specialization.join(', ')
      : user?.specialization || ''
  );
  const [education, setEducation] = useState(user?.education || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [experience, setExperience] = useState(user?.experience ? String(user.experience) : '');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [address, setAddress] = useState(user?.address || user?.zipCode || '');
  const [zipCode, setZipCode] = useState(user?.zipCode || '');
  const [languages, setLanguages] = useState(
    Array.isArray(user?.languages) ? user.languages.join(', ') : 'English, Hindi'
  );
  const [introduction, setIntroduction] = useState(user?.introduction || '');

  // ─── Practice & Payout Settings ──────────────────────────────────────────
  const [price, setPrice] = useState(user?.price ? String(user.price) : '500');
  const [dietPlanFee, setDietPlanFee] = useState(
    user?.dietPlanFee !== undefined ? String(user.dietPlanFee) : '299'
  );
  const [upiId, setUpiId] = useState(user?.upiId || '');

  // ─── Bank Transfer Settings (Web Parity) ──────────────────────────────────
  const [payoutMode, setPayoutMode] = useState<'upi' | 'bank'>(
    user?.bankDetails?.accountNumber ? 'bank' : 'upi'
  );
  const [accountHolderName, setAccountHolderName] = useState(
    user?.bankDetails?.accountHolderName || ''
  );
  const [accountNumber, setAccountNumber] = useState(
    user?.bankDetails?.accountNumber || ''
  );
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(
    user?.bankDetails?.accountNumber || ''
  );
  const [ifscCode, setIfscCode] = useState(user?.bankDetails?.ifscCode || '');
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || '');

  // ─── Degree Certificate ──────────────────────────────────────────────────
  const [certificateUrl, setCertificateUrl] = useState<string | null>(user?.certificate || null);

  // ─── Security / Password Fields ──────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchDoctorProfile = async () => {
    if (!user?.id) return;
    try {
      const data = await doctorApi.getDoctorProfile(user.id);
      if (data) {
        if (data.firstName) setFirstName(data.firstName);
        if (data.lastName) setLastName(data.lastName);
        if (data.phone) setPhone(data.phone);
        if (data.registrationNumber) setRegistrationNumber(data.registrationNumber);
        if (data.specialization) {
          setSpecialization(
            Array.isArray(data.specialization) ? data.specialization.join(', ') : data.specialization
          );
        }
        if (data.education) setEducation(data.education);
        if (data.designation) setDesignation(data.designation);
        if (data.experience !== undefined) setExperience(String(data.experience));
        if (data.gender) setGender(data.gender);
        if (data.age !== undefined) setAge(String(data.age));
        if (data.address) setAddress(data.address);
        if (data.zipCode) setZipCode(data.zipCode);
        if (data.languages) {
          setLanguages(Array.isArray(data.languages) ? data.languages.join(', ') : data.languages);
        }
        if (data.introduction) setIntroduction(data.introduction);
        if (data.price !== undefined) setPrice(String(data.price));
        if (data.dietPlanFee !== undefined) setDietPlanFee(String(data.dietPlanFee));
        if (data.upiId) setUpiId(data.upiId);
        if (data.certificate) setCertificateUrl(data.certificate);

        if (data.bankDetails) {
          if (data.bankDetails.accountHolderName) {
            setAccountHolderName(data.bankDetails.accountHolderName);
          }
          if (data.bankDetails.accountNumber) {
            setAccountNumber(data.bankDetails.accountNumber);
            setConfirmAccountNumber(data.bankDetails.accountNumber);
            setPayoutMode('bank');
          }
          if (data.bankDetails.ifscCode) setIfscCode(data.bankDetails.ifscCode);
          if (data.bankDetails.bankName) setBankName(data.bankDetails.bankName);
          if (data.bankDetails.upiId) {
            setUpiId(data.bankDetails.upiId);
            if (!data.bankDetails.accountNumber) setPayoutMode('upi');
          }
        }

        updateUser(data);
      }
    } catch (err: any) {
      if (err?.message !== 'Invalid or expired token.') {
        console.warn('Error fetching doctor profile:', err?.message || err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctorProfile();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctorProfile();
  };

  // ─── Save Personal / Practice Settings ─────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user?.id) return;

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validation Error', 'First name and last name are required.');
      return;
    }

    if (phone.trim() && phone.trim().length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (payoutMode === 'upi') {
      if (upiId.trim() && !/^[a-zA-Z0-9.\-_]{1,256}@[a-zA-Z0-9.\-_]{1,64}$/.test(upiId.trim())) {
        Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID format (e.g. doctor@okhdfcbank).');
        return;
      }
    } else {
      if (accountNumber.trim()) {
        if (!ifscCode.trim()) {
          Alert.alert('IFSC Required', 'Please enter an IFSC code for bank transfer.');
          return;
        }
        if (accountNumber.trim() !== confirmAccountNumber.trim()) {
          Alert.alert('Mismatch', 'Account number and confirm account number do not match.');
          return;
        }
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(ifscCode.toUpperCase().trim())) {
          Alert.alert('Invalid IFSC', 'Please enter a valid 11-digit IFSC code (e.g. HDFC0001234).');
          return;
        }
      }
    }

    setSaving(true);
    try {
      const specArray = specialization
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const langArray = languages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const bankPayload = {
        accountHolderName: accountHolderName.trim() || `${firstName} ${lastName}`.trim(),
        accountNumber: accountNumber.trim() || null,
        ifscCode: ifscCode.toUpperCase().trim() || null,
        bankName: bankName.trim() || null,
        upiId: upiId.trim() || null,
        isSubmitted: Boolean(accountNumber.trim() || upiId.trim()),
      };

      const updates: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        registrationNumber: registrationNumber.trim(),
        specialization: specArray,
        education: education.trim(),
        designation: designation.trim(),
        experience: Number(experience) || 0,
        gender,
        age: Number(age) || undefined,
        address: address.trim(),
        zipCode: zipCode.trim(),
        languages: langArray,
        introduction: introduction.trim(),
        price: Number(price) || 500,
        dietPlanFee: Number(dietPlanFee) || 299,
        upiId: upiId.trim(),
        bankDetails: bankPayload,
      };

      const res = await doctorApi.updateDoctorProfile(user.id, updates);
      if (res && res.data) {
        updateUser(res.data);
      } else {
        updateUser(updates);
      }
      Alert.alert('Saved', 'Your practitioner profile and clinic details have been updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Degree Certificate Upload ─────────────────────────────────────────────
  const handlePickAndUploadCertificate = async () => {
    if (!user?.id) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setUploadingCert(true);

        const res = await doctorApi.uploadDoctorCertificate(
          user.id,
          file.uri,
          file.name,
          file.mimeType || 'application/pdf'
        );

        const newCertUrl = res.certificate || res.url;
        if (newCertUrl) {
          setCertificateUrl(newCertUrl);
          updateUser({ certificate: newCertUrl });
          Alert.alert(
            'Certificate Uploaded',
            'Your AYUSH medical degree certificate has been securely uploaded and updated on your profile.'
          );
        } else {
          Alert.alert('Upload Finished', 'Certificate submitted successfully.');
        }
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.response?.data?.message || err.message || 'Could not upload certificate.');
    } finally {
      setUploadingCert(false);
    }
  };

  const handleViewCertificate = async () => {
    if (!certificateUrl) {
      Alert.alert('No Certificate', 'No degree certificate has been uploaded yet.');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(certificateUrl);
      if (supported) {
        await Linking.openURL(certificateUrl);
      } else {
        Alert.alert('Cannot Open', 'Unable to open certificate document URL.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open certificate viewer.');
    }
  };

  // ─── Change Password ───────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Validation Error', 'New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirmation do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await apiClient.put('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });

      Alert.alert('Success', 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert(
        'Password Change Failed',
        err?.response?.data?.message || err?.response?.data?.error || 'Failed to change password.'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // ─── Logout ────────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your doctor portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const doctorFullName = `Dr. ${firstName} ${lastName}`.trim();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Practitioner Profile</Text>
          <Text style={styles.headerSubtitle}>License credentials & practice settings</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {/* Doctor Summary Hero Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Stethoscope size={30} color={Colors.oliveDeep} />
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctorFullName || 'Dr. Physician'}</Text>
              <Text style={styles.specialization} numberOfLines={2}>
                {specialization || 'Ayurvedic Medicine & Surgery'}
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color={Colors.success} />
                  <Text style={styles.verifiedText}>AYUSH Registered</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{user?.approvalStatus || 'Approved'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Navigation Tabs with Partition Separators */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'personal' && styles.tabItemActive]}
            onPress={() => setActiveTab('personal')}
          >
            <User size={13} color={activeTab === 'personal' ? Colors.cream : Colors.oliveDeep} />
            <Text style={[styles.tabLabel, activeTab === 'personal' && styles.tabLabelActive]}>
              Personal
            </Text>
          </TouchableOpacity>

          <View style={styles.tabDivider} />

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'practice' && styles.tabItemActive]}
            onPress={() => setActiveTab('practice')}
          >
            <DollarSign size={13} color={activeTab === 'practice' ? Colors.cream : Colors.oliveDeep} />
            <Text style={[styles.tabLabel, activeTab === 'practice' && styles.tabLabelActive]}>
              Fees & Payout
            </Text>
          </TouchableOpacity>

          <View style={styles.tabDivider} />

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'certificate' && styles.tabItemActive]}
            onPress={() => setActiveTab('certificate')}
          >
            <Award size={13} color={activeTab === 'certificate' ? Colors.cream : Colors.oliveDeep} />
            <Text style={[styles.tabLabel, activeTab === 'certificate' && styles.tabLabelActive]}>
              Certificate
            </Text>
          </TouchableOpacity>

          <View style={styles.tabDivider} />

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'security' && styles.tabItemActive]}
            onPress={() => setActiveTab('security')}
          >
            <Lock size={13} color={activeTab === 'security' ? Colors.cream : Colors.oliveDeep} />
            <Text style={[styles.tabLabel, activeTab === 'security' && styles.tabLabelActive]}>
              Security
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── TAB 1: PERSONAL & CLINICAL DETAILS ─────────────────────────── */}
        {activeTab === 'personal' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Practitioner Information</Text>
                <Text style={styles.sectionDesc}>Edit your clinical credentials and details</Text>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>First Name</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.textInput}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First Name"
                    placeholderTextColor={Colors.inkMuted}
                  />
                </View>
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.textInput}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last Name"
                    placeholderTextColor={Colors.inkMuted}
                  />
                </View>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Email Address (Account ID)</Text>
              <View style={[styles.inputWrap, styles.disabledInput]}>
                <Mail size={16} color={Colors.inkMuted} />
                <TextInput
                  style={[styles.textInput, { color: Colors.inkMuted }]}
                  value={user?.email || ''}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputWrap}>
                <Phone size={16} color={Colors.inkMuted} />
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.inkMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>AYUSH / Medical Registration Number</Text>
              <View style={styles.inputWrap}>
                <Award size={16} color={Colors.oliveDeep} />
                <TextInput
                  style={styles.textInput}
                  value={registrationNumber}
                  onChangeText={setRegistrationNumber}
                  placeholder="e.g. AYUSH-DL-2024-8841"
                  placeholderTextColor={Colors.inkMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Ayurvedic Qualifications & Degree</Text>
              <View style={styles.inputWrap}>
                <GraduationCap size={16} color={Colors.oliveDeep} />
                <TextInput
                  style={styles.textInput}
                  value={education}
                  onChangeText={setEducation}
                  placeholder="e.g. BAMS, MD (Ayurveda), Panchakarma Specialist"
                  placeholderTextColor={Colors.inkMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Specialization (comma separated)</Text>
              <View style={styles.inputWrap}>
                <Sparkles size={16} color={Colors.turmericGold} />
                <TextInput
                  style={styles.textInput}
                  value={specialization}
                  onChangeText={setSpecialization}
                  placeholder="e.g. Kaya Chikitsa, Panchakarma, Rasayana"
                  placeholderTextColor={Colors.inkMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Clinical Designation</Text>
              <View style={styles.inputWrap}>
                <Building size={16} color={Colors.inkMuted} />
                <TextInput
                  style={styles.textInput}
                  value={designation}
                  onChangeText={setDesignation}
                  placeholder="e.g. Senior Ayurvedic Physician"
                  placeholderTextColor={Colors.inkMuted}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>Experience (Years)</Text>
                <View style={styles.inputWrap}>
                  <Clock size={16} color={Colors.inkMuted} />
                  <TextInput
                    style={styles.textInput}
                    value={experience}
                    onChangeText={setExperience}
                    keyboardType="numeric"
                    placeholder="e.g. 8"
                    placeholderTextColor={Colors.inkMuted}
                  />
                </View>
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>Age</Text>
                <View style={styles.inputWrap}>
                  <User size={16} color={Colors.inkMuted} />
                  <TextInput
                    style={styles.textInput}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    placeholder="e.g. 36"
                    placeholderTextColor={Colors.inkMuted}
                  />
                </View>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female', 'Others'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, gender === g && styles.genderChipActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Languages Spoken</Text>
              <View style={styles.inputWrap}>
                <Languages size={16} color={Colors.inkMuted} />
                <TextInput
                  style={styles.textInput}
                  value={languages}
                  onChangeText={setLanguages}
                  placeholder="e.g. English, Hindi, Bengali"
                  placeholderTextColor={Colors.inkMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Clinic Address & PIN Code</Text>
              <View style={styles.inputWrap}>
                <MapPin size={16} color={Colors.inkMuted} />
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Clinic address, street, city"
                  placeholderTextColor={Colors.inkMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Doctor Biography / Introduction</Text>
              <View style={[styles.inputWrap, styles.textAreaWrap]}>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={introduction}
                  onChangeText={setIntroduction}
                  multiline
                  numberOfLines={4}
                  placeholder="Introduce yourself to patients, your philosophy of Ayurvedic healing..."
                  placeholderTextColor={Colors.inkMuted}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.cream} />
              ) : (
                <>
                  <Save size={16} color={Colors.cream} />
                  <Text style={styles.saveBtnText}>Save Practitioner Profile</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ─── TAB 2: CONSULTATION FEES & PAYOUT ───────────────────────── */}
        {activeTab === 'practice' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Fees & Direct Payouts</Text>
                <Text style={styles.sectionDesc}>
                  Configure your patient consultation fees and preferred disbursement method.
                </Text>
              </View>
            </View>

            {/* Fee Settings */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Online Consultation Fee (₹)</Text>
              <View style={styles.inputWrap}>
                <DollarSign size={16} color={Colors.oliveDeep} />
                <TextInput
                  style={styles.textInput}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="600"
                  placeholderTextColor={Colors.inkMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Personalized 7-Day Diet Plan Fee (₹)</Text>
              <View style={styles.inputWrap}>
                <DollarSign size={16} color={Colors.oliveDeep} />
                <TextInput
                  style={styles.textInput}
                  value={dietPlanFee}
                  onChangeText={setDietPlanFee}
                  keyboardType="numeric"
                  placeholder="350"
                  placeholderTextColor={Colors.inkMuted}
                />
              </View>
            </View>

            {/* Payout Method Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Payout Disbursement Method</Text>
              <View style={styles.payoutModeToggle}>
                <TouchableOpacity
                  style={[
                    styles.payoutModeOption,
                    payoutMode === 'upi' && styles.payoutModeOptionActive,
                  ]}
                  onPress={() => setPayoutMode('upi')}
                  activeOpacity={0.8}
                >
                  <CreditCard
                    size={16}
                    color={payoutMode === 'upi' ? Colors.cream : Colors.oliveDeep}
                  />
                  <Text
                    style={[
                      styles.payoutModeText,
                      payoutMode === 'upi' && styles.payoutModeTextActive,
                    ]}
                  >
                    UPI ID (VPA)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.payoutModeOption,
                    payoutMode === 'bank' && styles.payoutModeOptionActive,
                  ]}
                  onPress={() => setPayoutMode('bank')}
                  activeOpacity={0.8}
                >
                  <Landmark
                    size={16}
                    color={payoutMode === 'bank' ? Colors.cream : Colors.oliveDeep}
                  />
                  <Text
                    style={[
                      styles.payoutModeText,
                      payoutMode === 'bank' && styles.payoutModeTextActive,
                    ]}
                  >
                    Bank Transfer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mode 1: UPI ID */}
            {payoutMode === 'upi' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Direct UPI ID (VPA)</Text>
                <View style={styles.inputWrap}>
                  <CreditCard size={16} color={Colors.oliveDeep} />
                  <TextInput
                    style={styles.textInput}
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="e.g. doctorname@okhdfcbank"
                    autoCapitalize="none"
                    placeholderTextColor={Colors.inkMuted}
                  />
                </View>
                {!upiId ? (
                  <View style={styles.warningNotice}>
                    <ShieldAlert size={14} color="#d97706" />
                    <Text style={styles.warningText}>
                      Payout method missing! Please enter a UPI ID or select Bank Transfer to receive patient consultation fees.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.successNotice}>
                    <CheckCircle size={14} color={Colors.success} />
                    <Text style={styles.successText}>
                      Direct UPI settlement active to {upiId}. Payouts trigger upon consultation completion.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Mode 2: Bank Account Transfer */}
            {payoutMode === 'bank' && (
              <View style={styles.bankFieldsWrap}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>Account Holder Name</Text>
                  <View style={styles.inputWrap}>
                    <User size={16} color={Colors.inkMuted} />
                    <TextInput
                      style={styles.textInput}
                      value={accountHolderName}
                      onChangeText={setAccountHolderName}
                      placeholder={doctorFullName || 'Dr. Full Name'}
                      placeholderTextColor={Colors.inkMuted}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>Bank Account Number</Text>
                  <View style={styles.inputWrap}>
                    <Landmark size={16} color={Colors.oliveDeep} />
                    <TextInput
                      style={styles.textInput}
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                      keyboardType="numeric"
                      placeholder="e.g. 50100492817291"
                      placeholderTextColor={Colors.inkMuted}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>Confirm Account Number</Text>
                  <View style={styles.inputWrap}>
                    <Landmark size={16} color={Colors.oliveDeep} />
                    <TextInput
                      style={styles.textInput}
                      value={confirmAccountNumber}
                      onChangeText={setConfirmAccountNumber}
                      keyboardType="numeric"
                      placeholder="Re-enter account number"
                      placeholderTextColor={Colors.inkMuted}
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.halfCol}>
                    <Text style={styles.inputLabel}>IFSC Code</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        style={styles.textInput}
                        value={ifscCode}
                        onChangeText={(t) => setIfscCode(t.toUpperCase())}
                        autoCapitalize="characters"
                        maxLength={11}
                        placeholder="e.g. HDFC0000060"
                        placeholderTextColor={Colors.inkMuted}
                      />
                    </View>
                  </View>

                  <View style={styles.halfCol}>
                    <Text style={styles.inputLabel}>Bank Name</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        style={styles.textInput}
                        value={bankName}
                        onChangeText={setBankName}
                        placeholder="e.g. HDFC Bank"
                        placeholderTextColor={Colors.inkMuted}
                      />
                    </View>
                  </View>
                </View>

                {!accountNumber ? (
                  <View style={styles.warningNotice}>
                    <ShieldAlert size={14} color="#d97706" />
                    <Text style={styles.warningText}>
                      Bank account details required for direct NEFT/RTGS settlement.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.successNotice}>
                    <CheckCircle size={14} color={Colors.success} />
                    <Text style={styles.successText}>
                      Direct settlement active to {bankName || 'bank account'} ending in{' '}
                      {accountNumber.slice(-4)}.
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.cream} />
              ) : (
                <>
                  <Save size={16} color={Colors.cream} />
                  <Text style={styles.saveBtnText}>Save Payout & Fee Settings</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ─── TAB 3: AYURVEDIC DEGREE CERTIFICATE ─────────────────────────── */}
        {activeTab === 'certificate' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>AYUSH Degree Certificate</Text>
                <Text style={styles.sectionDesc}>
                  Your verified degree diploma (BAMS / MD Ayurveda / Council Registration)
                </Text>
              </View>
            </View>

            {/* Certificate Status Box */}
            <View style={styles.certStatusCard}>
              <View style={styles.certIconCol}>
                {certificateUrl ? (
                  <FileCheck size={36} color={Colors.success} />
                ) : (
                  <FileText size={36} color={Colors.turmericGold} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.certCardTitle}>
                  {certificateUrl ? 'Degree Certificate Attached' : 'Certificate Pending'}
                </Text>
                <Text style={styles.certCardDesc}>
                  {certificateUrl
                    ? 'Your AYUSH qualification certificate is securely archived in the JeevanHub cloud.'
                    : 'Please upload a PDF or image of your Ayurvedic Medical Degree certificate.'}
                </Text>

                {certificateUrl && (
                  <TouchableOpacity style={styles.viewDocBtn} onPress={handleViewCertificate}>
                    <Eye size={14} color={Colors.oliveDeep} />
                    <Text style={styles.viewDocBtnText}>View Uploaded Certificate</Text>
                    <ExternalLink size={12} color={Colors.oliveDeep} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Upload or Replace Button */}
            <TouchableOpacity
              style={[styles.uploadCertBtn, uploadingCert && styles.btnDisabled]}
              onPress={handlePickAndUploadCertificate}
              disabled={uploadingCert}
            >
              {uploadingCert ? (
                <ActivityIndicator size="small" color={Colors.cream} />
              ) : (
                <>
                  <Upload size={16} color={Colors.cream} />
                  <Text style={styles.uploadCertBtnText}>
                    {certificateUrl ? 'Replace Degree Certificate' : 'Upload Degree Certificate (PDF/Image)'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.certNoteText}>
              Accepted formats: PDF, JPG, PNG (Max size: 10MB). Verified by JeevanHub Medical Board.
            </Text>
          </View>
        )}

        {/* ─── TAB 4: SECURITY & PASSWORD ─────────────────────────────────── */}
        {activeTab === 'security' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Change Password</Text>
                <Text style={styles.sectionDesc}>Update your practitioner login password</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputWrap}>
                <KeyRound size={16} color={Colors.inkMuted} />
                <TextInput
                  style={styles.textInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="Enter current password"
                  placeholderTextColor={Colors.inkMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrap}>
                <Lock size={16} color={Colors.inkMuted} />
                <TextInput
                  style={styles.textInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="At least 8 characters"
                  placeholderTextColor={Colors.inkMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputWrap}>
                <Lock size={16} color={Colors.inkMuted} />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Re-enter new password"
                  placeholderTextColor={Colors.inkMuted}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, changingPassword && styles.btnDisabled]}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator size="small" color={Colors.cream} />
              ) : (
                <>
                  <Lock size={16} color={Colors.cream} />
                  <Text style={styles.saveBtnText}>Update Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <LogOut size={16} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out of Practice</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  logoutIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.creamTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.turmericGold,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  specialization: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },
  statusBadge: {
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: Colors.oliveAction,
    elevation: 3,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  tabDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#e2e8f0',
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  tabLabelActive: {
    color: Colors.cream,
  },
  payoutModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    gap: 6,
    marginTop: 4,
  },
  payoutModeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    backgroundColor: 'transparent',
  },
  payoutModeOptionActive: {
    backgroundColor: Colors.oliveAction,
    elevation: 2,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  payoutModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  payoutModeTextActive: {
    color: Colors.cream,
  },
  bankFieldsWrap: {
    gap: 12,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  sectionHeaderRow: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  sectionDesc: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCol: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  disabledInput: {
    backgroundColor: '#f1f1f1',
    borderColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.inkStrong,
  },
  textAreaWrap: {
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.cream,
  },
  genderChipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  genderChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  genderChipTextActive: {
    color: Colors.cream,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.oliveAction,
    borderRadius: 14,
    paddingVertical: 13,
    gap: 8,
    marginTop: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.cream,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  warningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginTop: 4,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    color: '#b45309',
    lineHeight: 15,
  },
  successNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 4,
  },
  successText: {
    flex: 1,
    fontSize: 11,
    color: '#15803d',
    lineHeight: 15,
  },
  certStatusCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  certIconCol: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  certCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  certCardDesc: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.creamTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  viewDocBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  uploadCertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.oliveAction,
    borderRadius: 14,
    paddingVertical: 13,
    gap: 8,
    marginTop: 4,
  },
  uploadCertBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.cream,
  },
  certNoteText: {
    fontSize: 11,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    marginTop: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error,
  },
});
