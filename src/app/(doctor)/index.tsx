// src/app/(doctor)/index.tsx
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Activity,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Clock,
  LogOut,
  Pill,
  Star,
  Users,
} from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function DoctorHomeScreen() {
  const { user, logout } = useAuthStore();
  const doctorName = user ? `Dr. ${user.firstName} ${user.lastName || ''}`.trim() : 'Doctor';
  const approvalStatus = user?.approvalStatus || 'Approved';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Doctor Portal</Text>
            <Text style={styles.userName}>{doctorName}</Text>
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

        {/* Verification Status Banner */}
        <View
          style={[
            styles.statusBanner,
            approvalStatus === 'Approved'
              ? styles.statusApproved
              : styles.statusPending,
          ]}
        >
          {approvalStatus === 'Approved' ? (
            <CheckCircle2 size={20} color={Colors.success} />
          ) : (
            <Clock size={20} color={Colors.warning} />
          )}
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              Account Status: {approvalStatus}
            </Text>
            <Text style={styles.statusDesc}>
              {approvalStatus === 'Approved'
                ? 'Your Ayurvedic license is verified. You are active to receive appointments.'
                : 'Your degree certificate is under administrative review.'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Today's Appts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>4.9</Text>
            <View style={styles.ratingRow}>
              <Star size={12} color={Colors.turmericGold} fill={Colors.turmericGold} />
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>₹{user?.price || 500}</Text>
            <Text style={styles.statLabel}>Fee / Visit</Text>
          </View>
        </View>

        {/* Clinical Operations Section */}
        <Text style={styles.sectionHeader}>Practice & Clinical Tools</Text>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={[styles.iconWrap, { backgroundColor: '#eef2e3' }]}>
              <CalendarRange size={24} color={Colors.olive} />
            </View>
            <Text style={styles.cardTitle}>Appointment Slots</Text>
            <Text style={styles.cardDesc}>
              Set up recurring availability templates and manage daily bookings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={[styles.iconWrap, { backgroundColor: '#e8f5e9' }]}>
              <Users size={24} color={Colors.success} />
            </View>
            <Text style={styles.cardTitle}>Patient Roster</Text>
            <Text style={styles.cardDesc}>
              View patients under your care, dossiers, and medical histories
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={[styles.iconWrap, { backgroundColor: '#fff8e6' }]}>
              <Pill size={24} color={Colors.turmericGold} />
            </View>
            <Text style={styles.cardTitle}>Clinical Prescribing</Text>
            <Text style={styles.cardDesc}>
              Generate digital prescriptions, diet plans, and review OCR reports
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={[styles.iconWrap, { backgroundColor: '#e1f5fe' }]}>
              <BarChart3 size={24} color="#0288d1" />
            </View>
            <Text style={styles.cardTitle}>Doctor Analytics</Text>
            <Text style={styles.cardDesc}>
              Track consultations, patient retention, and clinical earnings
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
    paddingTop: 10,
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
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
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 2,
  },
  statusDesc: {
    fontSize: 12,
    color: Colors.inkMuted,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.inkMuted,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
