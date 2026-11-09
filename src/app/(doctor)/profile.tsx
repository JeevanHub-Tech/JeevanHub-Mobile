// src/app/(doctor)/profile.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Award,
  Building,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  GraduationCap,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function DoctorProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [price, setPrice] = useState(user?.price ? String(user.price) : '500');
  const [dietPlanFee, setDietPlanFee] = useState('299');
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.zipCode || '');

  const fetchDoctorProfile = async () => {
    if (!user?.id) return;
    try {
      const data = await doctorApi.getDoctorProfile(user.id);
      if (data) {
        if (data.price) setPrice(String(data.price));
        if (data.dietPlanFee) setDietPlanFee(String(data.dietPlanFee));
        if (data.upiId) setUpiId(data.upiId);
        if (data.phone) setPhone(data.phone);
        if (data.address) setAddress(data.address);
      }
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
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

  const handleSaveSettings = async () => {
    if (!user?.id) return;
    if (upiId.trim() && !/^[a-zA-Z0-9.\-_]{1,256}@[a-zA-Z0-9.\-_]{1,64}$/.test(upiId.trim())) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID (e.g. yourname@oksbi).');
      return;
    }

    setSaving(true);
    try {
      const updates = {
        price: Number(price) || 500,
        dietPlanFee: Number(dietPlanFee) || 299,
        upiId: upiId.trim(),
        phone: phone.trim(),
        address: address.trim(),
      };

      const res = await doctorApi.updateDoctorProfile(user.id, updates);
      if (res && res.data) {
        updateUser(res.data);
      } else {
        updateUser({
          price: updates.price,
          upiId: updates.upiId,
          phone: updates.phone,
        });
      }
      Alert.alert('Saved', 'Your practice details and payout settings have been updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const doctorName = user ? `Dr. ${user.firstName} ${user.lastName || ''}`.trim() : 'Doctor';
  const specializations = Array.isArray(user?.specialization)
    ? user.specialization.join(', ')
    : user?.specialization || 'Ayurvedic Medicine & Surgery';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practitioner Profile</Text>
        <Text style={styles.headerSubtitle}>License credentials & consultation settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Stethoscope size={30} color={Colors.oliveDeep} />
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctorName}</Text>
              <Text style={styles.specialization}>{specializations}</Text>
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

        {/* Clinical Credentials Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>AYUSH License & Credentials</Text>

          <View style={styles.detailRow}>
            <Award size={16} color={Colors.oliveDeep} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Registration / License Number</Text>
              <Text style={styles.detailValue}>
                {user?.registrationNumber || 'AYUSH-IN-2024-98421'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <GraduationCap size={16} color={Colors.oliveDeep} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Degree & Qualifications</Text>
              <Text style={styles.detailValue}>{user?.education || 'BAMS, MD (Ayurveda)'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Clock size={16} color={Colors.oliveDeep} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Clinical Experience</Text>
              <Text style={styles.detailValue}>{user?.experience || 8} Years Practice</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Building size={16} color={Colors.oliveDeep} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Designation / Clinic</Text>
              <Text style={styles.detailValue}>
                {user?.designation || 'Senior Ayurvedic Consultant'}
              </Text>
            </View>
          </View>
        </View>

        {/* Practice Fees & Digital Payout Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Practice Fees & Payout Configuration</Text>
          <Text style={styles.sectionDesc}>
            Patients pay fees before or during appointment confirmation. Digital consultation
            fees are credited directly to your UPI ID.
          </Text>

          {/* Consultation Fee */}
          <Text style={styles.inputLabel}>Consultation Visit Fee (₹)</Text>
          <View style={styles.inputWrap}>
            <DollarSign size={16} color={Colors.inkMuted} />
            <TextInput
              style={styles.textInput}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="500"
              placeholderTextColor={Colors.inkMuted}
            />
          </View>

          {/* Diet Plan Fee */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Personalized Diet Plan Fee (₹)</Text>
          <View style={styles.inputWrap}>
            <DollarSign size={16} color={Colors.inkMuted} />
            <TextInput
              style={styles.textInput}
              value={dietPlanFee}
              onChangeText={setDietPlanFee}
              keyboardType="numeric"
              placeholder="299"
              placeholderTextColor={Colors.inkMuted}
            />
          </View>

          {/* UPI ID */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>UPI ID for Payouts</Text>
          <View style={styles.inputWrap}>
            <CreditCard size={16} color={Colors.inkMuted} />
            <TextInput
              style={styles.textInput}
              value={upiId}
              onChangeText={setUpiId}
              placeholder="doctor@oksbi / dr@okaxis"
              placeholderTextColor={Colors.inkMuted}
              autoCapitalize="none"
            />
          </View>

          {/* Clinic Address */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Clinic / Hospital Address</Text>
          <View style={styles.inputWrap}>
            <MapPin size={16} color={Colors.inkMuted} />
            <TextInput
              style={styles.textInput}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. Jeevan Clinic, Sector 14, Gurugram"
              placeholderTextColor={Colors.inkMuted}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSaveSettings}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.cream} />
            ) : (
              <>
                <Save size={16} color={Colors.cream} />
                <Text style={styles.saveBtnText}>Update Practice Settings</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign Out Card */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <LogOut size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out of Physician Portal</Text>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
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
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 2,
  },
  specialization: {
    fontSize: 12,
    color: Colors.oliveDeep,
    fontWeight: '600',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successBg,
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
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 11,
    color: Colors.inkMuted,
    lineHeight: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 6,
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
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.inkStrong,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.oliveAction,
    borderRadius: 14,
    paddingVertical: 13,
    gap: 8,
    marginTop: 18,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.cream,
  },
  btnDisabled: {
    opacity: 0.6,
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
