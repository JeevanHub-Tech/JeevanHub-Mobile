// src/app/(patient)/index.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  ArrowRight,
  Calendar,
  HeartPulse,
  LogOut,
  MessageSquare,
  Salad,
  Sparkles,
  Stethoscope,
  User,
  Video,
} from 'lucide-react-native';
import { patientApi } from '../../api/patient';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Appointment, DoshaResult } from '../../types/patient';

export default function PatientHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const firstName = user?.firstName || 'Friend';

  const [refreshing, setRefreshing] = useState(false);
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
  const [doshaResult, setDoshaResult] = useState<DoshaResult | null>(null);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    try {
      // 1. Load latest appointment
      const bookings = await patientApi.getPatientBookings(user.id);
      const active = bookings.find((b) => b.status === 'confirmed' || b.status === 'pending');
      setUpcomingAppointment(active || null);

      // 2. Load Dosha assessment
      const assessment = await patientApi.getDoshaAssessment();
      setDoshaResult(assessment);
    } catch {
      // Non-blocking dashboard load
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
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
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <User size={22} color={Colors.cream} />
            </View>
            <View>
              <Text style={styles.greeting}>Namaste,</Text>
              <Text style={styles.userName}>{firstName}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={logout}
            style={styles.logoutBtn}
            activeOpacity={0.7}
          >
            <LogOut size={16} color={Colors.oliveDeep} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
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
              {typeof upcomingAppointment.doctorId === 'object'
                ? `Dr. ${upcomingAppointment.doctorId.firstName} ${upcomingAppointment.doctorId.lastName}`
                : upcomingAppointment.doctorName || 'Dr. Ayurveda Specialist'}
            </Text>
            <Text style={styles.upcomingTime}>
              📅 {upcomingAppointment.date} at {upcomingAppointment.time}
            </Text>
            <TouchableOpacity
              style={styles.upcomingAction}
              onPress={() => router.push('/(patient)/appointments')}
              activeOpacity={0.8}
            >
              <Video size={16} color={Colors.cream} />
              <Text style={styles.upcomingActionText}>View Booking & Join</Text>
            </TouchableOpacity>
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
