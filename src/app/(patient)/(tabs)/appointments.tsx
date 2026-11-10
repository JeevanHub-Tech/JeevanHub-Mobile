// src/app/(patient)/appointments.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flag,
  MapPin,
  MessageSquare,
  Pill,
  PlusCircle,
  Salad,
  Star,
  Video,
  X,
  XCircle,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import { DailyCallModal } from '../../../components/consult/DailyCallModal';
import { RatingReviewModal } from '../../../components/consult/RatingReviewModal';
import { DietPlanRequestModal } from '../../../components/wellness/DietPlanRequestModal';
import { Colors } from '../../../constants/theme';
import { useAuthStore } from '../../../store/authStore';
import { Appointment } from '../../../types/patient';
import {
  getBookingDietFee,
  getBookingDisplayDate,
  getBookingDisplayTime,
  getBookingDoctorName,
  isBookingAccepted,
  resolveBookingStatus,
} from '../../../utils/wellnessHelpers';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [dietModalBooking, setDietModalBooking] = useState<Appointment | null>(null);
  const [callBooking, setCallBooking] = useState<Appointment | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Appointment | null>(null);
  const [disputeBooking, setDisputeBooking] = useState<Appointment | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

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

  const upcomingBookings = bookings.filter((b) => {
    const st = resolveBookingStatus(b);
    return st === 'confirmed' || st === 'pending';
  });
  const pastBookings = bookings.filter((b) => {
    const st = resolveBookingStatus(b);
    return st === 'completed' || st === 'cancelled';
  });

  const displayedList = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const handleJoinCall = (appointment: Appointment) => {
    setCallBooking(appointment);
  };

  const handleSubmitReview = async ({
    rating,
    comment,
  }: {
    rating: number;
    comment: string;
  }) => {
    if (!reviewBooking) return;
    await patientApi.submitBookingReview(reviewBooking._id, rating, comment);
    Alert.alert('Thank You', 'Your consultation feedback has been submitted.');
    await fetchBookings();
  };

  const handleSubmitDispute = async () => {
    if (!disputeBooking) return;
    if (!disputeReason.trim()) {
      Alert.alert('Reason Required', 'Please describe the issue with this consultation.');
      return;
    }
    setDisputeSubmitting(true);
    try {
      await patientApi.raiseBookingDispute(disputeBooking._id, disputeReason.trim());
      Alert.alert(
        'Issue Reported',
        'Your consultation dispute has been logged. Payment payout remains on hold for review.'
      );
      setDisputeBooking(null);
      setDisputeReason('');
      await fetchBookings();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Could not raise a dispute for this booking.';
      Alert.alert('Dispute Error', msg);
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const doctorObj = typeof item.doctorId === 'object' ? item.doctorId : null;
    const doctorName = getBookingDoctorName(item);
    const specialization = doctorObj?.specialization?.join(', ') || 'Clinical Ayurveda';

    const resolvedStatus = resolveBookingStatus(item);
    const isConfirmed = resolvedStatus === 'confirmed';
    const isPending = resolvedStatus === 'pending';
    const isCompleted = resolvedStatus === 'completed';
    const accepted = isBookingAccepted(item);
    const displayDate = getBookingDisplayDate(item);
    const displayTime = getBookingDisplayTime(item) || 'Scheduled';
    const displayFee = item.fee ?? item.amountPaid ?? 500;
    const publishedSupplements = (item.recommendedSupplements || []).filter(
      (s) => s.published !== false
    );
    const hasPrescription = Boolean(item.diagnosis?.trim()) || publishedSupplements.length > 0;
    const dietFee = getBookingDietFee(item);

    return (
      <View style={styles.card}>
        {/* Status Header */}
        <View style={styles.cardHeader}>
          <View style={styles.modeBadge}>
            {item.consultationType !== 'In-Person' ? (
              <Video size={14} color={Colors.olive} />
            ) : (
              <MapPin size={14} color={Colors.turmericGold} />
            )}
            <Text style={styles.modeText}>
              {item.consultationType !== 'In-Person' ? 'Video Consult' : 'In-Person Visit'}
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
            {resolvedStatus === 'cancelled' && <XCircle size={12} color={Colors.error} />}
            <Text
              style={[
                styles.statusText,
                isConfirmed && { color: Colors.success },
                isPending && { color: Colors.warning },
                isCompleted && { color: '#0288d1' },
                resolvedStatus === 'cancelled' && { color: Colors.error },
              ]}
            >
              {resolvedStatus.toUpperCase()}
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
            <Text style={styles.scheduleText}>{displayDate}</Text>
          </View>
          <View style={styles.scheduleDivider} />
          <View style={styles.scheduleItem}>
            <Clock size={15} color={Colors.olive} />
            <Text style={styles.scheduleText}>{displayTime}</Text>
          </View>
        </View>

        {/* Notes / Symptoms */}
        {(item.notes || item.patientIllness) && (
          <Text style={styles.notesText} numberOfLines={2}>
            📝 Notes: {item.notes || item.patientIllness}
          </Text>
        )}

        {/* Prescription & Diet Plan Quick Links */}
        {accepted && (hasPrescription || item.dietPlanRequested) ? (
          <View style={styles.wellnessPillsRow}>
            {hasPrescription ? (
              <TouchableOpacity
                style={styles.rxPill}
                onPress={() =>
                  router.push({
                    pathname: '/(patient)/prescription-wellness',
                    params: { tab: 'medicines' },
                  } as any)
                }
                activeOpacity={0.8}
              >
                <Pill size={13} color={Colors.oliveDeep} />
                <Text style={styles.rxPillText}>
                  Rx ({publishedSupplements.length} Meds)
                </Text>
              </TouchableOpacity>
            ) : null}

            {item.dietPlanRequested ? (
              <TouchableOpacity
                style={[
                  styles.dietStatusPill,
                  item.dietPlanStatus === 'completed'
                    ? styles.dietReadyPill
                    : styles.dietPendingPill,
                ]}
                disabled={item.dietPlanStatus !== 'completed'}
                onPress={() =>
                  router.push({
                    pathname: '/(patient)/prescription-wellness',
                    params: { tab: 'diet' },
                  } as any)
                }
                activeOpacity={0.8}
              >
                <Salad
                  size={13}
                  color={
                    item.dietPlanStatus === 'completed'
                      ? Colors.success
                      : Colors.warning
                  }
                />
                <Text
                  style={[
                    styles.dietStatusText,
                    {
                      color:
                        item.dietPlanStatus === 'completed'
                          ? Colors.success
                          : Colors.warning,
                    },
                  ]}
                >
                  {item.dietPlanStatus === 'completed'
                    ? 'Diet Plan Ready'
                    : 'Diet Plan Pending'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Existing Rating & Review */}
        {item.rating && item.rating > 0 ? (
          <View style={styles.reviewBox}>
            <View style={styles.reviewStarsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={13}
                  color={Colors.turmericGold}
                  fill={star <= (item.rating || 0) ? Colors.turmericGold : 'transparent'}
                />
              ))}
              <Text style={styles.reviewRatingLabel}>You rated {item.rating}/5</Text>
            </View>
            {item.review ? <Text style={styles.reviewQuote}>“{item.review}”</Text> : null}
          </View>
        ) : null}

        {/* Footer Actions */}
        <View style={styles.cardFooter}>
          <Text style={styles.feeText}>Fee: ₹{displayFee}</Text>

          <View style={styles.footerBtnsRow}>
            {accepted && !item.rating ? (
              <TouchableOpacity
                style={styles.rateBtn}
                onPress={() => setReviewBooking(item)}
                activeOpacity={0.8}
              >
                <Star size={14} color={Colors.turmericGold} fill={Colors.turmericGold} />
                <Text style={styles.rateBtnText}>Rate Doctor</Text>
              </TouchableOpacity>
            ) : null}

            {item.payoutStatus === 'held' ? (
              <TouchableOpacity
                style={styles.disputeBtn}
                onPress={() => {
                  setDisputeReason('');
                  setDisputeBooking(item);
                }}
                activeOpacity={0.8}
              >
                <Flag size={13} color={Colors.error} />
                <Text style={styles.disputeBtnText}>Report Issue</Text>
              </TouchableOpacity>
            ) : null}

            {accepted && !item.dietPlanRequested ? (
              <TouchableOpacity
                style={styles.requestDietBtn}
                onPress={() => setDietModalBooking(item)}
                activeOpacity={0.8}
              >
                <Salad size={14} color={Colors.oliveDeep} />
                <Text style={styles.requestDietText}>
                  Diet Plan (+₹{dietFee})
                </Text>
              </TouchableOpacity>
            ) : null}

            {isConfirmed && item.consultationType !== 'In-Person' && (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => handleJoinCall(item)}
                activeOpacity={0.8}
              >
                <Video size={15} color={Colors.cream} />
                <Text style={styles.joinButtonText}>Join Call</Text>
                <ExternalLink size={13} color={Colors.cream} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>My Appointments</Text>
          <TouchableOpacity
            style={styles.feedbackHubBtn}
            onPress={() => router.push('/(patient)/feedback' as any)}
            activeOpacity={0.8}
          >
            <MessageSquare size={14} color={Colors.oliveDeep} />
            <Text style={styles.feedbackHubText}>My Reviews</Text>
          </TouchableOpacity>
        </View>
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

      <DietPlanRequestModal
        visible={Boolean(dietModalBooking)}
        booking={dietModalBooking}
        onClose={() => setDietModalBooking(null)}
        onSuccess={fetchBookings}
      />

      <DailyCallModal
        visible={Boolean(callBooking)}
        onClose={() => setCallBooking(null)}
        bookingId={callBooking?._id}
        role="patient"
        participantTitle={callBooking ? getBookingDoctorName(callBooking) : 'Doctor'}
        dateLabel={callBooking ? getBookingDisplayDate(callBooking) : undefined}
        timeLabel={callBooking ? getBookingDisplayTime(callBooking) : undefined}
        fallbackLink={
          callBooking
            ? (callBooking.meetLink && callBooking.meetLink !== 'no'
                ? callBooking.meetLink
                : '') || callBooking.meetingLink
            : undefined
        }
      />

      <RatingReviewModal
        visible={Boolean(reviewBooking)}
        onClose={() => setReviewBooking(null)}
        title="Rate Consultation"
        subtitle={reviewBooking ? getBookingDoctorName(reviewBooking) : undefined}
        initialRating={reviewBooking?.rating || 5}
        initialReview={reviewBooking?.review || ''}
        onSubmit={handleSubmitReview}
      />

      <Modal
        visible={Boolean(disputeBooking)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!disputeSubmitting) setDisputeBooking(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Consultation Issue</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!disputeSubmitting) setDisputeBooking(null);
                }}
                hitSlop={10}
              >
                <X size={20} color={Colors.inkMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {disputeBooking ? getBookingDoctorName(disputeBooking) : 'Consultation'} • Hold payout for admin review
            </Text>
            <TextInput
              style={styles.disputeInput}
              placeholder="Explain what went wrong (e.g. doctor did not join, audio issue)..."
              placeholderTextColor={Colors.inkLight}
              value={disputeReason}
              onChangeText={setDisputeReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.disputeSubmitBtn, disputeSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmitDispute}
              disabled={disputeSubmitting}
              activeOpacity={0.85}
            >
              {disputeSubmitting ? (
                <ActivityIndicator size="small" color={Colors.cream} />
              ) : (
                <Text style={styles.disputeSubmitText}>Submit Issue</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  footerBtnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  wellnessPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  rxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  rxPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  dietStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dietReadyPill: {
    backgroundColor: Colors.successBg,
  },
  dietPendingPill: {
    backgroundColor: Colors.warningBg,
  },
  dietStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  requestDietBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.creamTint,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  requestDietText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  feedbackHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  feedbackHubText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  reviewBox: {
    backgroundColor: Colors.creamTint,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingLabel: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  reviewQuote: {
    marginTop: 5,
    fontSize: 12,
    color: Colors.inkMuted,
    lineHeight: 17,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff8e6',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1d997',
  },
  rateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  disputeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.errorBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f5c2c0',
  },
  disputeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.error,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 36, 20, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  disputeInput: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 96,
    fontSize: 13,
    color: Colors.inkStrong,
    marginBottom: 14,
  },
  disputeSubmitBtn: {
    backgroundColor: Colors.error,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  disputeSubmitText: {
    color: Colors.cream,
    fontSize: 14,
    fontWeight: '700',
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
