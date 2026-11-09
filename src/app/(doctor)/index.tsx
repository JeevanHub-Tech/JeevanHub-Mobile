// src/app/(doctor)/index.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileEdit,
  LogOut,
  Pill,
  ShieldCheck,
  Star,
  Users,
  Video,
} from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { DoctorAppointment } from '../../types/doctor';

export default function DoctorHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const doctorName = user ? `Dr. ${user.firstName} ${user.lastName || ''}`.trim() : 'Doctor';
  const approvalStatus = user?.approvalStatus || 'Approved';

  const [bookings, setBookings] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    try {
      const data = await doctorApi.getDoctorBookings(user.id);
      setBookings(data);
    } catch (err) {
      console.error('Error loading doctor dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter((b) => b.date === todayStr);
  const pendingOrConfirmed = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
  const activeNextAppointment = pendingOrConfirmed[0] || null;

  const handleStartCall = (appointment: DoctorAppointment) => {
    const link = appointment.meetingLink || 'https://meet.google.com';
    Linking.openURL(link).catch(() => {
      alert('Could not open video consultation room.');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Ayurvedic Physician Portal</Text>
            <Text style={styles.userName}>{doctorName}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
            <LogOut size={16} color={Colors.oliveDeep} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Account Verification Banner */}
        <View
          style={[
            styles.statusBanner,
            approvalStatus === 'Approved' ? styles.statusApproved : styles.statusPending,
          ]}
        >
          {approvalStatus === 'Approved' ? (
            <ShieldCheck size={22} color={Colors.success} />
          ) : (
            <Clock size={22} color={Colors.warning} />
          )}
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {approvalStatus === 'Approved'
                ? 'AYUSH Verified Practitioner'
                : 'Account Verification Pending'}
            </Text>
            <Text style={styles.statusDesc}>
              {approvalStatus === 'Approved'
                ? 'Your clinical license is active. You are visible in the patient directory.'
                : 'Your degree certificate is under administrative review.'}
            </Text>
          </View>
        </View>

        {/* Practice Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{todayBookings.length}</Text>
            <Text style={styles.statLabel}>Today's Visits</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{pendingOrConfirmed.length}</Text>
            <Text style={styles.statLabel}>Queue</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.ratingRow}>
              <Star size={12} color={Colors.turmericGold} fill={Colors.turmericGold} />
              <Text style={styles.statNumber}>{user?.rating || 4.9}</Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>₹{user?.price || 500}</Text>
            <Text style={styles.statLabel}>Visit Fee</Text>
          </View>
        </View>

        {/* Next Scheduled Patient Card */}
        {activeNextAppointment && (
          <View style={styles.nextCard}>
            <View style={styles.nextHeader}>
              <View style={styles.nextBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.nextBadgeText}>Next Consultation</Text>
              </View>
              <Text style={styles.nextMode}>{activeNextAppointment.consultationType}</Text>
            </View>

            <Text style={styles.patientName}>
              {activeNextAppointment.patientName || 'Aarav Sharma'}
            </Text>
            <Text style={styles.appointmentTime}>
              📅 {activeNextAppointment.date} at {activeNextAppointment.time}
            </Text>
            {activeNextAppointment.symptoms && (
              <Text style={styles.symptomsText} numberOfLines={2}>
                Chief Complaints: {activeNextAppointment.symptoms}
              </Text>
            )}

            {/* Quick Action Buttons */}
            <View style={styles.nextActionsRow}>
              {activeNextAppointment.consultationType === 'Online' && (
                <TouchableOpacity
                  style={styles.startCallBtn}
                  onPress={() => handleStartCall(activeNextAppointment)}
                  activeOpacity={0.8}
                >
                  <Video size={16} color={Colors.cream} />
                  <Text style={styles.startCallText}>Start Video</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.prescribeBtn}
                onPress={() =>
                  router.push(`/(doctor)/prescribe/${activeNextAppointment._id}` as any)
                }
                activeOpacity={0.8}
              >
                <FileEdit size={16} color={Colors.oliveDeep} />
                <Text style={styles.prescribeText}>Prescribe</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Practice Management Section */}
        <Text style={styles.sectionHeader}>Practice & Clinical Tools</Text>

        <View style={styles.grid}>
          {/* 1. Consultations Queue */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/(doctor)/appointments' as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#eef2e3' }]}>
              <CalendarDays size={24} color={Colors.olive} />
            </View>
            <Text style={styles.cardTitle}>Consultations Queue</Text>
            <Text style={styles.cardDesc}>
              Daily schedule, video consultation links, and visit notes
            </Text>
          </TouchableOpacity>

          {/* 2. Slot & Schedule Management */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/(doctor)/slots' as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#fff8e6' }]}>
              <Clock size={24} color={Colors.turmericGold} />
            </View>
            <Text style={styles.cardTitle}>Availability Slots</Text>
            <Text style={styles.cardDesc}>
              Set recurring weekly hours, slot durations, and date leaves
            </Text>
          </TouchableOpacity>

          {/* 3. Patients Roster */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/(doctor)/patients' as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#e8f5e9' }]}>
              <Users size={24} color={Colors.success} />
            </View>
            <Text style={styles.cardTitle}>Patient Dossiers</Text>
            <Text style={styles.cardDesc}>
              Patient directory, Dosha profiles, and uploaded medical vaults
            </Text>
          </TouchableOpacity>

          {/* 4. Clinical Settings & Profile */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/(doctor)/profile' as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#f3e5f5' }]}>
              <ShieldCheck size={24} color="#7b1fa2" />
            </View>
            <Text style={styles.cardTitle}>Practice Settings</Text>
            <Text style={styles.cardDesc}>
              Clinic details, consultation fees, and UPI payout configurations
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  container: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 12,
    color: Colors.inkMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sagePale,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.oliveDeep,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusApproved: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.success,
  },
  statusPending: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warning,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 2,
  },
  statusDesc: {
    fontSize: 11,
    color: Colors.inkMuted,
    lineHeight: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.oliveDeep,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  nextCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  nextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  nextBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  nextMode: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 2,
  },
  appointmentTime: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginBottom: 6,
  },
  symptomsText: {
    fontSize: 12,
    color: Colors.inkMuted,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  nextActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  startCallBtn: {
    flex: 1,
    backgroundColor: Colors.oliveAction,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  startCallText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cream,
  },
  prescribeBtn: {
    flex: 1,
    backgroundColor: Colors.sagePale,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  prescribeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: Colors.inkMuted,
    lineHeight: 15,
  },
});
