// src/app/(patient)/appointments.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  PlusCircle,
  Video,
  XCircle,
} from 'lucide-react-native';
import { patientApi } from '../../api/patient';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Appointment } from '../../types/patient';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const fetchBookings = async () => {
    if (!user?.id) return;
    try {
      const data = await patientApi.getPatientBookings(user.id);
      setBookings(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  );

  const displayedList = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const handleJoinCall = (appointment: Appointment) => {
    const link = appointment.meetingLink || 'https://meet.google.com';
    Linking.openURL(link).catch(() => {
      alert('Could not open video consultation link.');
    });
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const doctorObj = typeof item.doctorId === 'object' ? item.doctorId : null;
    const doctorName = doctorObj
      ? `Dr. ${doctorObj.firstName} ${doctorObj.lastName || ''}`.trim()
      : item.doctorName || 'Ayurvedic Specialist';
    const specialization = doctorObj?.specialization?.join(', ') || 'Clinical Ayurveda';

    const isConfirmed = item.status === 'confirmed';
    const isPending = item.status === 'pending';
    const isCompleted = item.status === 'completed';

    return (
      <View style={styles.card}>
        {/* Status Header */}
        <View style={styles.cardHeader}>
          <View style={styles.modeBadge}>
            {item.consultationType === 'Online' ? (
              <Video size={14} color={Colors.olive} />
            ) : (
              <MapPin size={14} color={Colors.turmericGold} />
            )}
            <Text style={styles.modeText}>
              {item.consultationType === 'Online' ? 'Video Consult' : 'In-Person Visit'}
            </Text>
          </View>

          <View
            style={[
              styles.statusPill,
              isConfirmed && styles.statusConfirmed,
              isPending && styles.statusPending,
              isCompleted && styles.statusCompleted,
            ]}
          >
            {isConfirmed && <CheckCircle2 size={12} color={Colors.success} />}
            {isPending && <Clock size={12} color={Colors.warning} />}
            {item.status === 'cancelled' && <XCircle size={12} color={Colors.error} />}
            <Text
              style={[
                styles.statusText,
                isConfirmed && { color: Colors.success },
                isPending && { color: Colors.warning },
                isCompleted && { color: '#0288d1' },
                item.status === 'cancelled' && { color: Colors.error },
              ]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Doctor Info */}
        <Text style={styles.doctorName}>{doctorName}</Text>
        <Text style={styles.specialization}>{specialization}</Text>

        {/* Date & Time Box */}
        <View style={styles.scheduleBox}>
          <View style={styles.scheduleItem}>
            <Calendar size={15} color={Colors.olive} />
            <Text style={styles.scheduleText}>{item.date}</Text>
          </View>
          <View style={styles.scheduleDivider} />
          <View style={styles.scheduleItem}>
            <Clock size={15} color={Colors.olive} />
            <Text style={styles.scheduleText}>{item.time}</Text>
          </View>
        </View>

        {/* Notes / Symptoms */}
        {item.notes && (
          <Text style={styles.notesText} numberOfLines={2}>
            📝 Notes: {item.notes}
          </Text>
        )}

        {/* Footer Actions */}
        <View style={styles.cardFooter}>
          <Text style={styles.feeText}>Fee: ₹{item.fee || 500}</Text>

          {isConfirmed && item.consultationType === 'Online' && (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => handleJoinCall(item)}
              activeOpacity={0.8}
            >
              <Video size={15} color={Colors.cream} />
              <Text style={styles.joinButtonText}>Join Video Call</Text>
              <ExternalLink size={13} color={Colors.cream} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <Text style={styles.headerSubtitle}>
          Track your Ayurvedic consultations, medical sessions, and history
        </Text>

        {/* Segmented Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'upcoming' && styles.tabButtonActive]}
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'upcoming' && styles.tabButtonTextActive,
              ]}
            >
              Upcoming ({upcomingBookings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'past' && styles.tabButtonActive]}
            onPress={() => setActiveTab('past')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'past' && styles.tabButtonTextActive,
              ]}
            >
              Past ({pastBookings.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Appointment List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedList}
          keyExtractor={(item) => item._id}
          renderItem={renderAppointmentItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Calendar size={36} color={Colors.inkMuted} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'upcoming'
                  ? 'Consult verified Ayurvedic specialists for health, diet, and Panchakarma guidance.'
                  : 'Your completed consultations and clinical histories will appear here.'}
              </Text>

              {activeTab === 'upcoming' && (
                <TouchableOpacity
                  style={styles.newConsultBtn}
                  onPress={() => router.push('/(patient)/doctors')}
                  activeOpacity={0.8}
                >
                  <PlusCircle size={16} color={Colors.cream} />
                  <Text style={styles.newConsultText}>Find a Doctor</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
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
    paddingBottom: 16,
    backgroundColor: Colors.cream,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: Colors.oliveAction,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.inkMuted,
  },
  tabButtonTextActive: {
    color: Colors.cream,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  statusConfirmed: {
    backgroundColor: '#e8f5e9',
  },
  statusPending: {
    backgroundColor: '#fff8e1',
  },
  statusCompleted: {
    backgroundColor: '#e1f5fe',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 2,
  },
  specialization: {
    fontSize: 12,
    color: Colors.olive,
    fontWeight: '600',
    marginBottom: 12,
  },
  scheduleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sagePale,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  scheduleItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  scheduleDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.borderStrong,
  },
  scheduleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  notesText: {
    fontSize: 12,
    color: Colors.inkMuted,
    lineHeight: 16,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0ece3',
    paddingTop: 12,
  },
  feeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  joinButton: {
    backgroundColor: Colors.oliveAction,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.cream,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.inkMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  newConsultBtn: {
    backgroundColor: Colors.oliveAction,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  newConsultText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.cream,
  },
});
