// src/app/(doctor)/appointments.tsx
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
import { useRouter } from 'expo-router';
import {
  Calendar,
  CheckCircle,
  Clock,
  FileEdit,
  FileText,
  MapPin,
  Search,
  User,
  Video,
} from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { DailyCallModal } from '../../components/consult/DailyCallModal';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { DoctorAppointment } from '../../types/doctor';

type SegmentTab = 'today' | 'upcoming' | 'completed';

export default function DoctorAppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SegmentTab>('today');
  const [bookings, setBookings] = useState<DoctorAppointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [callBooking, setCallBooking] = useState<DoctorAppointment | null>(null);

  const fetchBookings = async () => {
    if (!user?.id) return;
    try {
      const data = await doctorApi.getDoctorBookings(user.id);
      setBookings(data);
    } catch (err) {
      console.error('Error fetching doctor appointments:', err);
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

  const todayStr = new Date().toISOString().split('T')[0];

  const getFilteredBookings = () => {
    return bookings.filter((b) => {
      // 1. Tab filter
      const bDate = b.date ? b.date.split('T')[0] : '';
      const isCompleted = b.status === 'completed';
      const isCancelled = b.status === 'cancelled';

      if (activeTab === 'today') {
        if (bDate !== todayStr || isCancelled) return false;
      } else if (activeTab === 'upcoming') {
        if (isCompleted || isCancelled || bDate < todayStr) return false;
      } else if (activeTab === 'completed') {
        if (!isCompleted && bDate >= todayStr) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const pName = (
          typeof b.patientId === 'object' && b.patientId !== null
            ? `${b.patientId.firstName} ${b.patientId.lastName}`
            : b.patientName || ''
        ).toLowerCase();
        const pSymptoms = (b.symptoms || '').toLowerCase();
        return pName.includes(query) || pSymptoms.includes(query);
      }

      return true;
    });
  };

  const getPatientDisplayName = (booking: DoctorAppointment) => {
    if (typeof booking.patientId === 'object' && booking.patientId !== null) {
      return `${booking.patientId.firstName} ${booking.patientId.lastName || ''}`.trim();
    }
    return booking.patientName || 'Patient';
  };

  const handleStartVideo = (booking: DoctorAppointment) => {
    setCallBooking(booking);
  };

  const handleMarkCompleted = (bookingId: string) => {
    Alert.alert(
      'Complete Consultation',
      'Do you want to mark this visit as completed? You can also publish prescriptions anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Completed',
          onPress: async () => {
            try {
              await doctorApi.updateBookingStatus(bookingId, 'completed');
              fetchBookings();
            } catch (err: any) {
              Alert.alert(
                'Error',
                err?.response?.data?.message || 'Could not update appointment status.'
              );
            }
          },
        },
      ]
    );
  };

  const filtered = getFilteredBookings();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Consultations Queue</Text>
        <Text style={styles.headerSubtitle}>
          Manage clinical appointments, video calls, and visit summaries
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.inkMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by patient name or symptom..."
            placeholderTextColor={Colors.inkMuted}
          />
        </View>
      </View>

      {/* Segmented Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'today' && styles.tabItemActive]}
          onPress={() => setActiveTab('today')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
            Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'upcoming' && styles.tabItemActive]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'completed' && styles.tabItemActive]}
          onPress={() => setActiveTab('completed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.olive} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={36} color={Colors.inkMuted} />
            <Text style={styles.emptyTitle}>No consultations found</Text>
            <Text style={styles.emptyDesc}>
              {activeTab === 'today'
                ? 'No appointments scheduled for today.'
                : activeTab === 'upcoming'
                ? 'No upcoming patient visits in the queue.'
                : 'No completed consultation records yet.'}
            </Text>
          </View>
        ) : (
          filtered.map((appointment) => {
            const patientName =
              typeof appointment.patientId === 'object' && appointment.patientId !== null
                ? `${appointment.patientId.firstName} ${appointment.patientId.lastName || ''}`.trim()
                : appointment.patientName || 'Patient';

            const patientIdStr =
              typeof appointment.patientId === 'object' && appointment.patientId !== null
                ? appointment.patientId._id
                : appointment.patientId;

            const isOnline = appointment.consultationType?.toLowerCase() !== 'in-person';
            const isCompleted = appointment.status === 'completed';

            return (
              <View key={appointment._id} style={styles.appointmentCard}>
                {/* Top Row: Date, Time & Mode */}
                <View style={styles.cardHeader}>
                  <View style={styles.timeTag}>
                    <Clock size={14} color={Colors.oliveDeep} />
                    <Text style={styles.timeText}>
                      {appointment.date} • {appointment.time}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.modeBadge,
                      isOnline ? styles.modeOnline : styles.modeInPerson,
                    ]}
                  >
                    {isOnline ? (
                      <Video size={12} color={Colors.oliveDeep} />
                    ) : (
                      <MapPin size={12} color={Colors.turmericGold} />
                    )}
                    <Text style={styles.modeText}>{appointment.consultationType}</Text>
                  </View>
                </View>

                {/* Patient Information */}
                <View style={styles.patientRow}>
                  <View style={styles.avatar}>
                    <User size={20} color={Colors.oliveDeep} />
                  </View>
                  <View style={styles.patientMeta}>
                    <Text style={styles.patientNameText}>{patientName}</Text>
                    {appointment.patientPhone && (
                      <Text style={styles.patientPhoneText}>{appointment.patientPhone}</Text>
                    )}
                  </View>
                  <Text style={styles.feeText}>₹{appointment.fee}</Text>
                </View>

                {/* Symptoms / Chief Complaints */}
                {appointment.symptoms ? (
                  <View style={styles.complaintsBox}>
                    <Text style={styles.complaintsLabel}>Complaints:</Text>
                    <Text style={styles.complaintsText}>{appointment.symptoms}</Text>
                  </View>
                ) : null}

                {/* Status Indicator */}
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusPill,
                      isCompleted ? styles.statusPillDone : styles.statusPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isCompleted ? styles.statusPillTextDone : styles.statusPillTextActive,
                      ]}
                    >
                      {appointment.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.actionsRow}>
                  {isOnline && !isCompleted && (
                    <TouchableOpacity
                      style={styles.videoBtn}
                      onPress={() => handleStartVideo(appointment)}
                      activeOpacity={0.8}
                    >
                      <Video size={15} color={Colors.cream} />
                      <Text style={styles.videoBtnText}>Start Video</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.prescribeBtn}
                    onPress={() =>
                      router.push(`/(doctor)/prescribe/${appointment._id}` as any)
                    }
                    activeOpacity={0.8}
                  >
                    <FileEdit size={15} color={Colors.oliveDeep} />
                    <Text style={styles.prescribeBtnText}>Prescribe</Text>
                  </TouchableOpacity>

                  {patientIdStr && (
                    <TouchableOpacity
                      style={styles.dossierBtn}
                      onPress={() =>
                        router.push(`/(doctor)/patient/${patientIdStr}` as any)
                      }
                      activeOpacity={0.8}
                    >
                      <FileText size={15} color={Colors.oliveDeep} />
                      <Text style={styles.dossierBtnText}>Dossier</Text>
                    </TouchableOpacity>
                  )}

                  {!isCompleted && (
                    <TouchableOpacity
                      style={styles.completeBtn}
                      onPress={() => handleMarkCompleted(appointment._id)}
                      activeOpacity={0.7}
                    >
                      <CheckCircle size={15} color={Colors.success} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <DailyCallModal
        visible={Boolean(callBooking)}
        onClose={() => setCallBooking(null)}
        bookingId={callBooking?._id}
        role="doctor"
        participantTitle={callBooking ? getPatientDisplayName(callBooking) : 'Patient'}
        dateLabel={
          callBooking ? callBooking.dateOfAppointment || callBooking.date : undefined
        }
        timeLabel={callBooking ? callBooking.timeSlot || callBooking.time : undefined}
        fallbackLink={
          callBooking
            ? (callBooking.meetLink && callBooking.meetLink !== 'no'
                ? callBooking.meetLink
                : '') || callBooking.meetingLink
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
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.inkStrong,
    padding: 0,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.oliveAction,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  tabTextActive: {
    color: Colors.oliveDeep,
  },
  listContainer: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: Colors.surface,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  modeOnline: {
    backgroundColor: Colors.sagePale,
  },
  modeInPerson: {
    backgroundColor: '#fff8e6',
  },
  modeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  patientMeta: {
    flex: 1,
  },
  patientNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  patientPhoneText: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  feeText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  complaintsBox: {
    backgroundColor: Colors.cream,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  complaintsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted,
    marginBottom: 2,
  },
  complaintsText: {
    fontSize: 12,
    color: Colors.inkStrong,
    lineHeight: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillActive: {
    backgroundColor: Colors.successBg,
  },
  statusPillDone: {
    backgroundColor: Colors.sagePale,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPillTextActive: {
    color: Colors.success,
  },
  statusPillTextDone: {
    color: Colors.oliveDeep,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  videoBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.oliveAction,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  videoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.cream,
  },
  prescribeBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sagePale,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  prescribeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  dossierBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  dossierBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  completeBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
