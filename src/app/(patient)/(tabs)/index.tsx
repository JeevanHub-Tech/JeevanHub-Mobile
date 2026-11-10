// src/app/(patient)/index.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  HeartPulse,
  Leaf,
  LogOut,
  MessageSquare,
  Package,
  Pill,
  Salad,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  User,
  Video,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import { DailyCallModal } from '../../../components/consult/DailyCallModal';
import { Colors } from '../../../constants/theme';
import { useAuthStore } from '../../../store/authStore';
import { Appointment, DoshaResult } from '../../../types/patient';
import {
  getBookingDisplayDate,
  getBookingDisplayTime,
  getBookingDoctorName,
  getBookingTimestamp,
  resolveBookingStatus,
} from '../../../utils/wellnessHelpers';

export default function PatientHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const firstName = user?.firstName || 'Friend';

  const [refreshing, setRefreshing] = useState(false);
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
  const [doshaResult, setDoshaResult] = useState<DoshaResult | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showCallModal, setShowCallModal] = useState(false);

  const loadUnreadNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const items = await patientApi.getNotifications();
      setUnreadNotifications(items.filter((n) => !n.isRead).length);
    } catch {
      // Non-blocking badge fetch
    }
  }, [user?.id]);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Load latest appointment
      const bookings = await patientApi.getPatientBookings(user.id);
      const upcoming = bookings
        .filter((b) => {
          const st = resolveBookingStatus(b);
          return st === 'confirmed' || st === 'pending';
        })
        .sort(
          (a, b) =>
            (getBookingTimestamp(a) ?? Number.MAX_SAFE_INTEGER) -
            (getBookingTimestamp(b) ?? Number.MAX_SAFE_INTEGER)
        );
      setUpcomingAppointment(upcoming[0] || null);

      // 2. Load Dosha assessment
      const assessment = await patientApi.getDoshaAssessment();
      setDoshaResult(assessment);

      // 3. Load unread notifications count
      await loadUnreadNotifications();
    } catch {
      // Non-blocking dashboard load
    }
  }, [user?.id, loadUnreadNotifications]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useFocusEffect(
    useCallback(() => {
      loadUnreadNotifications();
    }, [loadUnreadNotifications])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.push('/(patient)/profile')}
            style={styles.userInfo}
            activeOpacity={0.75}
            accessibilityLabel="Open profile"
          >
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <User size={22} color={Colors.cream} />
              </View>
            )}
            <View>
              <Text style={styles.greeting}>Namaste,</Text>
              <Text style={styles.userName}>{firstName}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.topActions}>
            <TouchableOpacity
              onPress={() => router.push('/(patient)/notifications')}
              style={styles.bellBtn}
              activeOpacity={0.7}
              accessibilityLabel="Notifications"
            >
              <Bell size={18} color={Colors.oliveDeep} />
              {unreadNotifications > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={logout}
              style={styles.logoutBtn}
              activeOpacity={0.7}
              accessibilityLabel="Sign out"
            >
              <LogOut size={16} color={Colors.oliveDeep} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Appointment Card (if active) */}
        {upcomingAppointment && (
          <View style={styles.upcomingCard}>
            <View style={styles.upcomingHeader}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Upcoming Consultation</Text>
              </View>
              <Text style={styles.consultTypeBadge}>
                {upcomingAppointment.consultationType}
              </Text>
            </View>
            <Text style={styles.upcomingDoctor}>
              {getBookingDoctorName(upcomingAppointment)}
            </Text>
            <Text style={styles.upcomingTime}>
              📅 {getBookingDisplayDate(upcomingAppointment)} at{' '}
              {getBookingDisplayTime(upcomingAppointment) || 'Scheduled'}
            </Text>
            <View style={styles.upcomingBtnRow}>
              {upcomingAppointment.consultationType !== 'In-Person' ? (
                <TouchableOpacity
                  style={[styles.upcomingAction, { flex: 1 }]}
                  onPress={() => setShowCallModal(true)}
                  activeOpacity={0.8}
                >
                  <Video size={16} color={Colors.cream} />
                  <Text style={styles.upcomingActionText}>Join Video Call</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[
                  upcomingAppointment.consultationType !== 'In-Person'
                    ? styles.upcomingSecondaryBtn
                    : [styles.upcomingAction, { flex: 1 }],
                ]}
                onPress={() => router.push('/(patient)/appointments')}
                activeOpacity={0.8}
              >
                <Text
                  style={
                    upcomingAppointment.consultationType !== 'In-Person'
                      ? styles.upcomingSecondaryText
                      : styles.upcomingActionText
                  }
                >
                  {upcomingAppointment.consultationType !== 'In-Person'
                    ? 'Details'
                    : 'View Booking'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Prakriti / Dosha Banner */}
        <TouchableOpacity
          style={styles.prakritiCard}
          activeOpacity={0.85}
          onPress={() => router.push('/(patient)/wellness')}
        >
          <View style={styles.prakritiIconWrap}>
            <Sparkles size={24} color={Colors.turmericGold} />
          </View>
          <View style={styles.prakritiContent}>
            <Text style={styles.prakritiTitle}>
              {doshaResult ? `Your Prakriti: ${doshaResult.dominantDosha}` : 'Ayurvedic Dosha Profile'}
            </Text>
            <Text style={styles.prakritiDesc}>
              {doshaResult
                ? 'Your constitution is analyzed. Tap to review your personalized diet & yoga guidelines.'
                : 'Discover your unique constitution (Vata, Pitta, Kapha) for personalized wellness.'}
            </Text>
          </View>
          <ArrowRight size={18} color={Colors.olive} />
        </TouchableOpacity>

        {/* Section Title */}
        <Text style={styles.sectionHeader}>Healthcare & Clinical Services</Text>

        {/* 2x2 Service Grid */}
        <View style={styles.grid}>
          {/* 1. Consult Doctors */}
          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(patient)/doctors')}
          >
            <View style={[styles.serviceIcon, { backgroundColor: '#eef2e3' }]}>
              <Stethoscope size={24} color={Colors.olive} />
            </View>
            <Text style={styles.serviceTitle}>Consult Doctors</Text>
            <Text style={styles.serviceDesc}>
              Book video consultations with verified Ayurvedic practitioners
            </Text>
          </TouchableOpacity>

          {/* 2. My Appointments */}
          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(patient)/appointments')}
          >
            <View style={[styles.serviceIcon, { backgroundColor: '#fff8e6' }]}>
              <Calendar size={24} color={Colors.turmericGold} />
            </View>
            <Text style={styles.serviceTitle}>My Appointments</Text>
            <Text style={styles.serviceDesc}>
              Scheduled consultations, status updates, and video links
            </Text>
          </TouchableOpacity>

          {/* 3. Ayurveda Wellness Quiz */}
          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(patient)/wellness')}
          >
            <View style={[styles.serviceIcon, { backgroundColor: '#e8f5e9' }]}>
              <Salad size={24} color={Colors.success} />
            </View>
            <Text style={styles.serviceTitle}>Dosha Assessment</Text>
            <Text style={styles.serviceDesc}>
              Dosha-specific meal schedules, herbal guidance, and yoga tips
            </Text>
          </TouchableOpacity>

          {/* 4. Prescription Vault */}
          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(patient)/records')}
          >
            <View style={[styles.serviceIcon, { backgroundColor: '#f3e5f5' }]}>
              <HeartPulse size={24} color="#7b1fa2" />
            </View>
            <Text style={styles.serviceTitle}>Medical Vault</Text>
            <Text style={styles.serviceDesc}>
              Upload prescriptions, view OCR medicine drafts and doctor reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Holistic Care & Knowledge Section */}
        <Text style={styles.sectionHeader}>Holistic Care & Knowledge</Text>

        {/* Full Prescription & Wellness Featured Card */}
        <TouchableOpacity
          style={styles.pwFeaturedCard}
          activeOpacity={0.85}
          onPress={() => router.push('/(patient)/prescription-wellness' as any)}
        >
          <View style={[styles.serviceIcon, { backgroundColor: '#e8f5e9', marginBottom: 0 }]}>
            <Salad size={24} color={Colors.success} />
          </View>
          <View style={styles.prakritiContent}>
            <Text style={styles.prakritiTitle}>Prescription & Wellness</Text>
            <Text style={styles.prakritiDesc}>
              Doctor medicines, 7-day meal planner, yoga videos & diet plan requests
            </Text>
          </View>
          <ArrowRight size={18} color={Colors.olive} />
        </TouchableOpacity>

        <View style={styles.grid}>
          {/* 1. Ayurvedic Treatments */}
          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(patient)/treatments' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: '#eef3e4' }]}>
              <Leaf size={24} color={Colors.oliveAction} />
            </View>
            <Text style={styles.serviceTitle}>Treatments</Text>
            <Text style={styles.serviceDesc}>
              16 health areas with herbal remedies, diet & bilingual care guides
            </Text>
          </TouchableOpacity>

          {/* 2. Health Blogs & Videos */}
          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(patient)/blogs' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: '#fdf4eb' }]}>
              <BookOpen size={24} color={Colors.barkBrown} />
            </View>
            <Text style={styles.serviceTitle}>Blogs & Videos</Text>
            <Text style={styles.serviceDesc}>
              Expert Ayurvedic articles, wellness videos & Hindi translation
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ayurvedic Pharmacy & Orders Section */}
        <Text style={styles.sectionHeader}>Ayurvedic Pharmacy & Orders</Text>

        <TouchableOpacity
          style={styles.pwFeaturedCard}
          activeOpacity={0.85}
          onPress={() => router.push('/(patient)/medicines' as any)}
        >
          <View style={[styles.serviceIcon, { backgroundColor: '#eef2e3', marginBottom: 0 }]}>
            <Pill size={24} color={Colors.oliveAction} />
          </View>
          <View style={styles.prakritiContent}>
            <Text style={styles.prakritiTitle}>Ayurvedic Medicines Store</Text>
            <Text style={styles.prakritiDesc}>
              Browse verified herbal formulations, search by ailment & order online
            </Text>
          </View>
          <ArrowRight size={18} color={Colors.olive} />
        </TouchableOpacity>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(patient)/cart' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: '#fff8e6' }]}>
              <ShoppingCart size={24} color={Colors.turmericGold} />
            </View>
            <Text style={styles.serviceTitle}>My Cart</Text>
            <Text style={styles.serviceDesc}>
              Review cart & doctor-prescribed items before checkout
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(patient)/orders' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: '#fdf4eb' }]}>
              <Package size={24} color={Colors.barkBrown} />
            </View>
            <Text style={styles.serviceTitle}>My Orders</Text>
            <Text style={styles.serviceDesc}>
              Track Delhivery shipments, delivery updates & order history
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sanjeevani AI Assistant Banner */}
        <TouchableOpacity
          style={styles.chatbotCard}
          activeOpacity={0.85}
          onPress={() => router.push('/(patient)/chat')}
        >
          <View style={styles.chatbotHeader}>
            <View style={styles.aiBadge}>
              <MessageSquare size={18} color={Colors.cream} />
            </View>
            <Text style={styles.chatbotTitle}>Sanjeevani AI Assistant</Text>
          </View>
          <Text style={styles.chatbotDesc}>
            Have an Ayurvedic health query? Ask Sanjeevani for instant herbal remedies, dosage guidance, and clinical triage.
          </Text>
          <View style={styles.chatbotFooter}>
            <Text style={styles.chatbotCta}>Ask a Question Now</Text>
            <ArrowRight size={14} color={Colors.cream} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      <DailyCallModal
        visible={showCallModal && Boolean(upcomingAppointment)}
        onClose={() => setShowCallModal(false)}
        bookingId={upcomingAppointment?._id}
        role="patient"
        participantTitle={
          upcomingAppointment ? getBookingDoctorName(upcomingAppointment) : 'Doctor'
        }
        dateLabel={
          upcomingAppointment ? getBookingDisplayDate(upcomingAppointment) : undefined
        }
        timeLabel={
          upcomingAppointment ? getBookingDisplayTime(upcomingAppointment) : undefined
        }
        fallbackLink={
          upcomingAppointment
            ? (upcomingAppointment.meetLink && upcomingAppointment.meetLink !== 'no'
                ? upcomingAppointment.meetLink
                : '') || upcomingAppointment.meetingLink
            : undefined
        }
      />
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
    paddingTop: 10,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.sagePale,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  greeting: {
    fontSize: 12,
    color: Colors.inkMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sagePale,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  upcomingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveIndicator: {
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
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
    letterSpacing: 0.3,
  },
  consultTypeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  upcomingDoctor: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 4,
  },
  upcomingTime: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginBottom: 14,
  },
  upcomingAction: {
    backgroundColor: Colors.oliveAction,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  upcomingActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cream,
  },
  upcomingBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upcomingSecondaryBtn: {
    backgroundColor: Colors.sagePale,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  prakritiCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  pwFeaturedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  prakritiIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#fff8e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prakritiContent: {
    flex: 1,
  },
  prakritiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 2,
  },
  prakritiDesc: {
    fontSize: 12,
    color: Colors.inkMuted,
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  serviceCard: {
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
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 11,
    color: Colors.inkMuted,
    lineHeight: 15,
  },
  chatbotCard: {
    backgroundColor: Colors.oliveDeep,
    borderRadius: 20,
    padding: 18,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  chatbotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  aiBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatbotTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.cream,
  },
  chatbotDesc: {
    fontSize: 12,
    color: Colors.sagePale,
    lineHeight: 17,
    marginBottom: 12,
  },
  chatbotFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatbotCta: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.cream,
  },
});
