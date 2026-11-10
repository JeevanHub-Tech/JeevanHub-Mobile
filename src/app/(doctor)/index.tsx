// src/app/(doctor)/index.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
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
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileEdit,
  History,
  Landmark,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
  Video,
} from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { DoctorAppointment } from '../../types/doctor';

export default function DoctorHomeScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const doctorName = user ? `Dr. ${user.firstName} ${user.lastName || ''}`.trim() : 'Doctor';

  const [bookings, setBookings] = useState<DoctorAppointment[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const [bookingsRes, profileRes] = await Promise.all([
        doctorApi.getDoctorBookings(user.id),
        doctorApi.getDoctorProfile(user.id),
      ]);
      setBookings(bookingsRes || []);
      setProfileData(profileRes || null);
      if (profileRes) updateUser(profileRes);
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

  // ─── Filter Bookings for Today & Queue ─────────────────────────────────────
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const todayBookings = bookings.filter((b) => {
    const raw = b.dateOfAppointment || b.date;
    if (!raw) return false;
    return String(raw).startsWith(todayStr);
  });

  const todayCompleted = todayBookings.filter(
    (b) => b.status === 'completed' || (b.requestAccept === 'accepted' && new Date(b.dateOfAppointment || b.date) < now)
  );

  const todayQueue = todayBookings.filter(
    (b) => b.status !== 'completed' && b.requestAccept !== 'denied' && b.status !== 'cancelled'
  );

  const activeNextAppointment =
    todayQueue[0] ||
    bookings.find(
      (b) => b.requestAccept === 'accepted' && new Date(b.dateOfAppointment || b.date) >= now
    ) ||
    null;

  // ─── Dynamic Onboarding & Clinical Readiness Checks ────────────────────────
  const isApproved = (profileData?.approvalStatus || user?.approvalStatus) === 'Approved';
  const hasProfile = Boolean(
    (profileData?.registrationNumber || user?.registrationNumber) &&
    (profileData?.specialization || user?.specialization)
  );
  const hasCertificate = Boolean(profileData?.certificate || user?.certificate);
  const hasFees = Number(profileData?.price || user?.price) > 0;
  const hasPayout = Boolean(
    profileData?.upiId ||
    user?.upiId ||
    profileData?.bankDetails?.accountNumber ||
    user?.bankDetails?.accountNumber
  );

  const slotsObj = profileData?.availableSlots || {};
  const totalSlotsCount = Object.values(slotsObj).reduce(
    (acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0),
    0
  );
  const hasSlots = totalSlotsCount > 0;

  const onboardingSteps = [
    {
      id: 'profile',
      label: 'Doctor Profile & AYUSH Reg.',
      isDone: hasProfile,
      link: '/(doctor)/profile?tab=personal',
      actionText: 'Complete',
    },
    {
      id: 'certificate',
      label: 'AYUSH Degree Certificate',
      isDone: hasCertificate,
      link: '/(doctor)/profile?tab=certificate',
      actionText: 'Upload',
    },
    {
      id: 'fees',
      label: 'Consultation & Diet Fees',
      isDone: hasFees,
      link: '/(doctor)/profile?tab=fees',
      actionText: 'Set Fees',
    },
    {
      id: 'payout',
      label: 'Bank Account or UPI Payout',
      isDone: hasPayout,
      link: '/(doctor)/profile?tab=fees',
      actionText: 'Connect',
    },
    {
      id: 'slots',
      label: 'Weekly Availability Slots',
      isDone: hasSlots,
      link: '/(doctor)/slots',
      actionText: 'Add Slots',
    },
  ];

  const completedStepsCount = onboardingSteps.filter((s) => s.isDone).length;
  const allOnboardingComplete = completedStepsCount === onboardingSteps.length && isApproved;

  const handleStartCall = (appointment: DoctorAppointment) => {
    router.push(`/consultation/${appointment._id}` as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <View style={styles.headerDoctorInfo}>
            <View style={styles.headerAvatar}>
              <Stethoscope size={22} color={Colors.oliveDeep} />
            </View>
            <View>
              <Text style={styles.greeting}>Ayurvedic Physician</Text>
              <Text style={styles.userName}>{doctorName}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/notifications' as any)}
            style={styles.notifBtn}
            activeOpacity={0.7}
          >
            <Bell size={20} color={Colors.oliveDeep} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* ─── CLINICAL ONBOARDING & VISIBILITY STEPPER ─────────────────────── */}
        {allOnboardingComplete ? (
          <View style={styles.verifiedLiveBanner}>
            <View style={styles.liveBannerLeft}>
              <View style={styles.liveBadgeDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.liveBannerTitle}>Practice Is Live & Visible to Patients</Text>
                <Text style={styles.liveBannerDesc}>
                  All onboarding requirements verified • Your profile and slots are active in search.
                </Text>
              </View>
            </View>
            <ShieldCheck size={26} color={Colors.success} />
          </View>
        ) : (
          <View style={styles.onboardingCard}>
            <View style={styles.onboardingHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.onboardingBadge}>
                  <AlertCircle size={13} color="#b45309" />
                  <Text style={styles.onboardingBadgeText}>
                    Onboarding Setup: {completedStepsCount} of {onboardingSteps.length} Complete
                  </Text>
                </View>
                <Text style={styles.onboardingTitle}>Required Practice Setup</Text>
                <Text style={styles.onboardingDesc}>
                  Complete these steps to activate patient bookings and appear in the AYUSH directory:
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round((completedStepsCount / onboardingSteps.length) * 100)}%` },
                ]}
              />
            </View>

            {/* Steps List */}
            <View style={styles.stepsList}>
              {onboardingSteps.map((step) => (
                <View key={step.id} style={styles.stepItemRow}>
                  <View style={styles.stepItemLeft}>
                    {step.isDone ? (
                      <CheckCircle2 size={16} color={Colors.success} />
                    ) : (
                      <View style={styles.pendingDot} />
                    )}
                    <Text
                      style={[styles.stepItemLabel, step.isDone && styles.stepItemLabelDone]}
                    >
                      {step.label}
                    </Text>
                  </View>
                  {!step.isDone ? (
                    <TouchableOpacity
                      style={styles.stepActionBtn}
                      onPress={() => router.push(step.link as any)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.stepActionBtnText}>{step.actionText}</Text>
                      <ChevronRight size={12} color={Colors.cream} />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.stepDoneBadge}>Ready</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── INTERACTIVE CLINICAL KPIS (Contextual Clickable Jump Links) ──── */}
        <View style={styles.statsRow}>
          {/* 1. Today's Completed Visits */}
          <TouchableOpacity
            style={styles.statBox}
            activeOpacity={0.7}
            onPress={() => router.push('/(doctor)/appointments?tab=completed' as any)}
          >
            <View style={styles.statTopRow}>
              <Text style={styles.statNumber}>{todayCompleted.length}</Text>
              <ChevronRight size={13} color={Colors.inkMuted} />
            </View>
            <Text style={styles.statLabel}>Today's Visits</Text>
          </TouchableOpacity>

          {/* 2. Today's Upcoming Queue */}
          <TouchableOpacity
            style={styles.statBox}
            activeOpacity={0.7}
            onPress={() => router.push('/(doctor)/appointments?tab=today' as any)}
          >
            <View style={styles.statTopRow}>
              <Text style={styles.statNumber}>{todayQueue.length}</Text>
              <ChevronRight size={13} color={Colors.inkMuted} />
            </View>
            <Text style={styles.statLabel}>In Queue</Text>
          </TouchableOpacity>

          {/* 3. Patient Rating */}
          <TouchableOpacity
            style={styles.statBox}
            activeOpacity={0.7}
            onPress={() => router.push('/(doctor)/reviews' as any)}
          >
            <View style={styles.statTopRow}>
              <View style={styles.ratingRow}>
                <Star size={11} color={Colors.turmericGold} fill={Colors.turmericGold} />
                <Text style={styles.statNumber}>{user?.rating || 4.9}</Text>
              </View>
              <ChevronRight size={13} color={Colors.inkMuted} />
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </TouchableOpacity>

          {/* 4. Consultation Visit Fee */}
          <TouchableOpacity
            style={styles.statBox}
            activeOpacity={0.7}
            onPress={() => router.push('/(doctor)/profile?tab=fees' as any)}
          >
            <View style={styles.statTopRow}>
              <Text style={styles.statNumber}>₹{user?.price || 600}</Text>
              <ChevronRight size={13} color={Colors.inkMuted} />
            </View>
            <Text style={styles.statLabel}>Visit Fee</Text>
          </TouchableOpacity>
        </View>

        {/* ─── NEXT SCHEDULED PATIENT HERO CARD ────────────────────────────── */}
        {activeNextAppointment ? (
          <View style={styles.nextCard}>
            <View style={styles.nextHeader}>
              <View style={styles.nextBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.nextBadgeText}>Next Consultation</Text>
              </View>
              <Text style={styles.nextMode}>{activeNextAppointment.consultationType || 'Online Video'}</Text>
            </View>

            <Text style={styles.patientName}>
              {activeNextAppointment.patientName || 'Aarav Sharma'}
            </Text>
            <Text style={styles.appointmentTime}>
              📅 {activeNextAppointment.date || 'Today'} at {activeNextAppointment.time || '11:30 AM'}
            </Text>
            {activeNextAppointment.patientIllness && (
              <Text style={styles.symptomsText} numberOfLines={2}>
                Chief Complaints: {activeNextAppointment.patientIllness}
              </Text>
            )}

            {/* Quick Action Buttons */}
            <View style={styles.nextActionsRow}>
              {activeNextAppointment.meetLink && activeNextAppointment.meetLink !== 'no' && (
                <TouchableOpacity
                  style={styles.startCallBtn}
                  onPress={() => handleStartCall(activeNextAppointment)}
                  activeOpacity={0.8}
                >
                  <Video size={16} color={Colors.cream} />
                  <Text style={styles.startCallText}>Start Video Call</Text>
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
                <Text style={styles.prescribeText}>Open Rx Workbench</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.queueClearCard}>
            <View style={styles.queueClearIcon}>
              <Sparkles size={24} color={Colors.olive} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.queueClearTitle}>Consultation Queue Clear</Text>
              <Text style={styles.queueClearDesc}>
                No pending consultations scheduled right now. Check availability slots or patient dossiers.
              </Text>
            </View>
          </View>
        )}

        {/* ─── TODAY'S CLINICAL TIMELINE ───────────────────────────────────── */}
        {todayBookings.length > 0 && (
          <View style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CalendarDays size={18} color={Colors.oliveDeep} />
                <Text style={styles.timelineTitle}>Today's Schedule ({todayBookings.length})</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(doctor)/appointments?tab=today' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewQueueLink}>View All →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timelineList}>
              {todayBookings.map((b, idx) => {
                const isDone = b.status === 'completed';
                return (
                  <View key={b._id || idx} style={styles.timelineItem}>
                    <View style={styles.timePill}>
                      <Text style={styles.timePillText}>{b.time || '11:00 AM'}</Text>
                    </View>
                    <View style={styles.timelineInfo}>
                      <Text style={styles.timelinePatient}>{b.patientName}</Text>
                      <Text style={styles.timelineMode} numberOfLines={1}>
                        {b.consultationType || (b.meetLink !== 'no' ? 'Online Video' : 'In-Clinic')}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.timelineStatusBadge,
                        isDone ? styles.statusDoneBadge : styles.statusWaitBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timelineStatusText,
                          isDone ? styles.statusDoneText : styles.statusWaitText,
                        ]}
                      >
                        {isDone ? 'Completed' : 'Upcoming'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── SPECIALIZED CLINICAL TOOLS (Non-Tab Tools Only) ──────────────── */}
        <Text style={styles.sectionHeader}>Practice & Analytics Tools</Text>

        <View style={styles.grid}>
          {/* 1. Practice Analytics & Revenue */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/(doctor)/analytics' as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#e0f2fe' }]}>
              <BarChart3 size={24} color="#0284c7" />
            </View>
            <Text style={styles.cardTitle}>Practice Analytics</Text>
            <Text style={styles.cardDesc}>
              Revenue charts, monthly visits, patient demographics, and payout logs
            </Text>
          </TouchableOpacity>

          {/* 2. Patient Reviews & Testimonials */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/(doctor)/reviews' as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#fffbeb' }]}>
              <MessageSquareQuote size={24} color={Colors.turmericGold} />
            </View>
            <Text style={styles.cardTitle}>Patient Reviews</Text>
            <Text style={styles.cardDesc}>
              Patient feedback ratings, clinical reviews, and verified testimonials
            </Text>
          </TouchableOpacity>

          {/* 3. My Health Blogs */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/(doctor)/blogs' as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#fef3c7' }]}>
              <BookOpen size={24} color="#b45309" />
            </View>
            <Text style={styles.cardTitle}>My Health Blogs</Text>
            <Text style={styles.cardDesc}>
              Author Ayurvedic lifestyle articles, edit posts, and draft content with AI
            </Text>
          </TouchableOpacity>

          {/* 4. Appointment History Archive */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/(doctor)/history' as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#f1f5f9' }]}>
              <History size={24} color="#475569" />
            </View>
            <Text style={styles.cardTitle}>Appointment History</Text>
            <Text style={styles.cardDesc}>
              Complete consultation archive, past visit records, and payment receipts
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
    padding: 16,
    paddingBottom: 36,
    gap: 14,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerDoctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8efe0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d2debe',
  },
  greeting: {
    fontSize: 12,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.turmericGold,
    position: 'absolute',
    top: 9,
    right: 10,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },

  // ─── Verified Live Banner ─────────────────────────────────────────────────
  verifiedLiveBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  liveBadgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  liveBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  liveBannerDesc: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 2,
    lineHeight: 15,
  },

  // ─── Onboarding Stepper Card ──────────────────────────────────────────────
  onboardingCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 14,
    gap: 10,
  },
  onboardingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  onboardingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  onboardingBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400e',
  },
  onboardingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400e',
  },
  onboardingDesc: {
    fontSize: 11.5,
    color: '#78350f',
    marginTop: 2,
    lineHeight: 16,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#fde68a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.oliveAction,
    borderRadius: 3,
  },
  stepsList: {
    gap: 7,
    marginTop: 2,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  stepItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d97706',
  },
  stepItemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
  },
  stepItemLabelDone: {
    color: Colors.inkMuted,
    textDecorationLine: 'line-through',
  },
  stepActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  stepActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.cream,
  },
  stepDoneBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },

  // ─── Clickable Stats Row ──────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  statLabel: {
    fontSize: 10.5,
    color: Colors.inkMuted,
    marginTop: 3,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  // ─── Next Consultation Hero Card ──────────────────────────────────────────
  nextCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
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
    backgroundColor: '#e8efe0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.oliveAction,
  },
  nextBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  nextMode: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveAction,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  appointmentTime: {
    fontSize: 12.5,
    color: Colors.inkMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  symptomsText: {
    fontSize: 12,
    color: Colors.ink,
    marginTop: 6,
    backgroundColor: Colors.creamTint,
    padding: 8,
    borderRadius: 8,
    lineHeight: 16,
  },
  nextActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  startCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.oliveAction,
    paddingVertical: 10,
    borderRadius: 10,
  },
  startCallText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cream,
  },
  prescribeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.creamTint,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d2debe',
  },
  prescribeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },

  // ─── Queue Clear Notice ───────────────────────────────────────────────────
  queueClearCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  queueClearIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8efe0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueClearTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  queueClearDesc: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
    lineHeight: 15,
  },

  // ─── Today's Clinical Timeline ────────────────────────────────────────────
  timelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  viewQueueLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveAction,
  },
  timelineList: {
    gap: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.creamTint,
    padding: 10,
    borderRadius: 12,
    gap: 10,
  },
  timePill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  timelineInfo: {
    flex: 1,
  },
  timelinePatient: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  timelineMode: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  timelineStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDoneBadge: {
    backgroundColor: '#dcfce7',
  },
  statusWaitBadge: {
    backgroundColor: '#fef3c7',
  },
  timelineStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusDoneText: {
    color: '#15803d',
  },
  statusWaitText: {
    color: '#b45309',
  },

  // ─── Practice Tools Grid ──────────────────────────────────────────────────
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.oliveDeep,
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
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
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.oliveDeep,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 10.5,
    color: Colors.inkMuted,
    lineHeight: 14,
  },
});
