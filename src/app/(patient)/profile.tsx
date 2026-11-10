// src/app/(patient)/profile.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  Edit3,
  FolderHeart,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  User,
} from 'lucide-react-native';
import { patientApi } from '../../api/patient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

const GENDERS = ['Male', 'Female', 'Others'] as const;

export default function PatientProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser, updateToken } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState(user?.dob ? user.dob.slice(0, 10) : '');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [zipCode, setZipCode] = useState(user?.zipCode || '');
  const [address, setAddress] = useState(user?.address || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const hydrateFromProfile = useCallback((data: any) => {
    setFirstName(data.firstName || '');
    setLastName(data.lastName || '');
    setEmail(data.email || '');
    setPhone(data.phone || '');
    setDob(data.dob ? new Date(data.dob).toISOString().split('T')[0] : '');
    setGender(data.gender || 'Male');
    setZipCode(data.zipCode || '');
    setAddress(data.address || '');
    setProfileImage(data.profileImage || '');
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await patientApi.getPatientProfile(user.id);
      if (data) {
        hydrateFromProfile(data);
        updateUser({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          dob: data.dob,
          gender: data.gender,
          zipCode: data.zipCode,
          address: data.address,
          profileImage: data.profileImage,
        });
      }
    } catch (err: any) {
      console.error('Error fetching patient profile:', err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, hydrateFromProfile, updateUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handlePickPhoto = async () => {
    if (!user?.id) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Please allow photo library access to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      const res = await patientApi.uploadProfileImage(user.id, {
        uri: asset.uri,
        name: asset.fileName || `profile-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });

      if (res.url) {
        setProfileImage(res.url);
        updateUser({ profileImage: res.url });
        Alert.alert('Updated', 'Your profile photo has been updated.');
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message || 'Could not upload profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing Details', 'First name and last name are required.');
      return;
    }
    if (phone.trim() && !/^\d{10}$/.test(phone.trim())) {
      Alert.alert('Invalid Phone', 'Please enter a 10-digit Indian phone number.');
      return;
    }
    if (zipCode.trim() && !/^\d{6}$/.test(zipCode.trim())) {
      Alert.alert('Invalid PIN Code', 'PIN code must be 6 digits.');
      return;
    }

    setSaving(true);
    try {
      const res = await patientApi.updatePatientProfile(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dateOfBirth: dob.trim() || undefined,
        gender,
        pincode: zipCode.trim(),
        address: address.trim(),
        profileImage,
      });

      const updated = res.data;
      if (updated) {
        hydrateFromProfile(updated);
        updateUser({
          firstName: updated.firstName,
          lastName: updated.lastName,
          phone: updated.phone,
          dob: updated.dob,
          gender: updated.gender,
          zipCode: updated.zipCode,
          address: updated.address,
          profileImage: updated.profileImage,
        });
      }
      setIsEditing(false);
      Alert.alert('Saved', 'Your profile details have been updated.');
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await patientApi.changePassword(currentPassword, newPassword);
      if (res.token) {
        await updateToken(res.token);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Your password has been changed.');
    } catch (err: any) {
      Alert.alert('Password Error', err?.message || 'Could not change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of JeevanHub?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const fullName = `${firstName} ${lastName}`.trim() || 'Patient';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={Colors.oliveDeep} />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>Personal details & account security</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsEditing((prev) => !prev)}
          style={[styles.editChip, isEditing && styles.editChipActive]}
          activeOpacity={0.7}
        >
          <Edit3 size={14} color={isEditing ? Colors.cream : Colors.oliveDeep} />
          <Text style={[styles.editChipText, isEditing && styles.editChipTextActive]}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexOne}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.olive} />
            <Text style={styles.loadingText}>Loading your profile...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
            }
          >
            {/* Avatar & Summary Card */}
            <View style={styles.profileCard}>
              <TouchableOpacity
                onPress={handlePickPhoto}
                disabled={uploadingPhoto}
                activeOpacity={0.8}
                style={styles.avatarWrap}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={34} color={Colors.cream} />
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  {uploadingPhoto ? (
                    <ActivityIndicator size="small" color={Colors.cream} />
                  ) : (
                    <Camera size={14} color={Colors.cream} />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.identityCol}>
                <Text style={styles.fullName}>{fullName}</Text>
                <Text style={styles.emailText}>{email}</Text>
                <View style={styles.pillRow}>
                  <View style={styles.rolePill}>
                    <ShieldCheck size={12} color={Colors.success} />
                    <Text style={styles.rolePillText}>Patient Account</Text>
                  </View>
                  {gender ? (
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>{gender}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Personal Information Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              {isEditing ? (
                <View>
                  <Input
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                  />
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                  />
                  <Input
                    label="Phone Number"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="10-digit mobile number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    leftIcon={<Phone size={16} color={Colors.inkMuted} />}
                  />
                  <Input
                    label="Date of Birth (YYYY-MM-DD)"
                    value={dob}
                    onChangeText={setDob}
                    placeholder="1995-01-01"
                  />

                  <Text style={styles.fieldLabel}>Gender</Text>
                  <View style={styles.genderRow}>
                    {GENDERS.map((g) => {
                      const active = gender === g;
                      return (
                        <TouchableOpacity
                          key={g}
                          onPress={() => setGender(g)}
                          style={[styles.genderChip, active && styles.genderChipActive]}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.genderChipText, active && styles.genderChipTextActive]}>
                            {g}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Input
                    label="PIN Code"
                    value={zipCode}
                    onChangeText={setZipCode}
                    placeholder="6-digit PIN code"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <Input
                    label="Address"
                    value={address}
                    onChangeText={setAddress}
                    placeholder="House / Street / City"
                    multiline
                    leftIcon={<MapPin size={16} color={Colors.inkMuted} />}
                  />

                  <Button
                    title="Save Changes"
                    onPress={handleSaveProfile}
                    loading={saving}
                    style={styles.saveBtn}
                  />
                </View>
              ) : (
                <View style={styles.readOnlyList}>
                  <View style={styles.infoRow}>
                    <Mail size={16} color={Colors.olive} />
                    <View style={styles.infoTextCol}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{email || 'Not set'}</Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <Phone size={16} color={Colors.olive} />
                    <View style={styles.infoTextCol}>
                      <Text style={styles.infoLabel}>Phone</Text>
                      <Text style={styles.infoValue}>{phone || 'Not set'}</Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <User size={16} color={Colors.olive} />
                    <View style={styles.infoTextCol}>
                      <Text style={styles.infoLabel}>Date of Birth & Gender</Text>
                      <Text style={styles.infoValue}>
                        {dob || 'DOB not set'} · {gender || 'Not specified'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <MapPin size={16} color={Colors.olive} />
                    <View style={styles.infoTextCol}>
                      <Text style={styles.infoLabel}>Address & PIN</Text>
                      <Text style={styles.infoValue}>
                        {[address, zipCode].filter(Boolean).join(', ') || 'Not set'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Quick Link to Medical Vault */}
            <TouchableOpacity
              onPress={() => router.push('/(patient)/records')}
              style={styles.vaultCard}
              activeOpacity={0.8}
            >
              <View style={styles.vaultIcon}>
                <FolderHeart size={20} color={Colors.oliveDeep} />
              </View>
              <View style={styles.flexOne}>
                <Text style={styles.vaultTitle}>Medical History & Prescriptions</Text>
                <Text style={styles.vaultSub}>View or upload documents in your health vault</Text>
              </View>
            </TouchableOpacity>

            {/* Quick Link to Feedback & Reviews */}
            <TouchableOpacity
              onPress={() => router.push('/(patient)/feedback' as any)}
              style={styles.vaultCard}
              activeOpacity={0.8}
            >
              <View style={[styles.vaultIcon, { backgroundColor: '#fff8e6' }]}>
                <Star size={20} color={Colors.turmericGold} fill={Colors.turmericGold} />
              </View>
              <View style={styles.flexOne}>
                <Text style={styles.vaultTitle}>Feedback & Reviews</Text>
                <Text style={styles.vaultSub}>Rate consultations, medicine orders & view reviews</Text>
              </View>
            </TouchableOpacity>

            {/* Change Password Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Lock size={17} color={Colors.oliveDeep} />
                <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>Change Password</Text>
              </View>

              <Input
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry
              />
              <Input
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 6 characters"
                secureTextEntry
              />
              <Input
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                secureTextEntry
              />

              <Button
                title="Update Password"
                variant="secondary"
                onPress={handleChangePassword}
                loading={changingPassword}
              />
            </View>

            {/* Sign Out */}
            <TouchableOpacity
              onPress={handleSignOut}
              style={styles.signOutBtn}
              activeOpacity={0.8}
            >
              <LogOut size={18} color={Colors.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  flexOne: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.sagePale,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  editChipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  editChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  editChipTextActive: {
    color: Colors.cream,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.inkMuted,
  },
  container: {
    padding: 16,
    paddingBottom: 36,
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: Colors.sagePale,
  },
  avatarPlaceholder: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.oliveDeep,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCol: {
    flex: 1,
  },
  fullName: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  emailText: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: Colors.successBg,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  metaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: Colors.sagePale,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 14,
  },
  sectionTitleInline: {
    marginBottom: 0,
  },
  readOnlyList: {
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.inkStrong,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.inkStrong,
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  genderChipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  genderChipTextActive: {
    color: Colors.cream,
  },
  saveBtn: {
    marginTop: 4,
  },
  vaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.sagePale,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  vaultIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  vaultSub: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: 'rgba(163, 61, 50, 0.25)',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.error,
  },
});

