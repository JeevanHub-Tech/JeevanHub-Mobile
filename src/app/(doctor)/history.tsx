// src/app/(doctor)/history.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Receipt,
  Search,
  User,
  X,
} from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

type HistoryStatusTab = 'completed' | 'denied';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

export default function DoctorAppointmentHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [statusTab, setStatusTab] = useState<HistoryStatusTab>('completed');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Payment proof modal
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const allBookings = await doctorApi.getDoctorBookings(user.id);
      setBookings(allBookings || []);
    } catch (err) {
      console.warn('Error fetching appointment history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // ─── Filtering Logic ───────────────────────────────────────────────────────
  const now = new Date();
  const msInDay = 24 * 60 * 60 * 1000;

  const filteredBookings = bookings.filter((b) => {
    // 1. Status Tab filter
    if (statusTab === 'completed') {
      const isAcceptedOrDone =
        b.requestAccept === 'accepted' ||
        b.status === 'confirmed' ||
        b.status === 'completed';
      if (!isAcceptedOrDone) return false;
    } else {
      const isDenied =
        b.requestAccept === 'denied' ||
        b.status === 'cancelled' ||
        b.status === 'rejected';
      if (!isDenied) return false;
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const name = (b.patientName || '').toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      if (!name.includes(q)) return false;
    }

    // 3. Time filter
    const apptDate = new Date(b.dateOfAppointment || b.date);
    if (isNaN(apptDate.getTime())) return true;

    if (timeFilter === 'today') {
      return apptDate.toDateString() === now.toDateString();
    }
    if (timeFilter === 'week') {
      const diff = now.getTime() - apptDate.getTime();
      return diff >= 0 && diff <= 7 * msInDay;
    }
    if (timeFilter === 'month') {
      const diff = now.getTime() - apptDate.getTime();
      return diff >= 0 && diff <= 30 * msInDay;
    }

    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.oliveDeep} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Appointment History</Text>
          <Text style={styles.headerSubtitle}>
            Past consultations & payment verification archive
          </Text>
        </View>
      </View>

      {/* Status Segmented Tabs */}
      <View style={styles.statusTabsRow}>
        <TouchableOpacity
          style={[styles.statusTabBtn, statusTab === 'completed' && styles.statusTabBtnActive]}
          onPress={() => setStatusTab('completed')}
        >
          <CheckCircle2
            size={15}
            color={statusTab === 'completed' ? Colors.cream : Colors.inkMuted}
          />
          <Text
            style={[
              styles.statusTabBtnText,
              statusTab === 'completed' && styles.statusTabBtnTextActive,
            ]}
          >
            Completed & Confirmed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusTabBtn, statusTab === 'denied' && styles.statusTabBtnActive]}
          onPress={() => setStatusTab('denied')}
        >
          <AlertCircle
            size={15}
            color={statusTab === 'denied' ? Colors.cream : Colors.inkMuted}
          />
          <Text
            style={[
              styles.statusTabBtnText,
              statusTab === 'denied' && styles.statusTabBtnTextActive,
            ]}
          >
            Denied / Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter and Search Bar */}
      <View style={styles.filterBar}>
        <View style={styles.searchWrap}>
          <Search size={14} color={Colors.inkMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search patient name..."
            placeholderTextColor={Colors.inkMuted}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color={Colors.inkMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeFilterRow}
        >
          <TouchableOpacity
            style={[styles.timeChip, timeFilter === 'all' && styles.timeChipActive]}
            onPress={() => setTimeFilter('all')}
          >
            <Text style={[styles.timeChipText, timeFilter === 'all' && styles.timeChipTextActive]}>
              All Time
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.timeChip, timeFilter === 'today' && styles.timeChipActive]}
            onPress={() => setTimeFilter('today')}
          >
            <Text style={[styles.timeChipText, timeFilter === 'today' && styles.timeChipTextActive]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.timeChip, timeFilter === 'week' && styles.timeChipActive]}
            onPress={() => setTimeFilter('week')}
          >
            <Text style={[styles.timeChipText, timeFilter === 'week' && styles.timeChipTextActive]}>
              Last 7 Days
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.timeChip, timeFilter === 'month' && styles.timeChipActive]}
            onPress={() => setTimeFilter('month')}
          >
            <Text style={[styles.timeChipText, timeFilter === 'month' && styles.timeChipTextActive]}>
              Last 30 Days
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.olive} />
            <Text style={styles.loadingText}>Loading consultation archives...</Text>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Clock size={40} color={Colors.inkLight} />
            <Text style={styles.emptyTitle}>No consultations found</Text>
            <Text style={styles.emptySubtitle}>
              No appointments matching the selected status and time filters exist in your practice records.
            </Text>
          </View>
        ) : (
          filteredBookings.map((b, idx) => {
            const bookingId = b._id || String(idx);
            const proof = b.paymentProof || (Array.isArray(b.paymentScreenshots) && b.paymentScreenshots[0]);
            const isPaid = b.paymentStatus === 'Paid' || b.isPaid;
            const fee = Number(b.amountPaid || b.fee || user?.price || 500);

            return (
              <View key={bookingId} style={styles.historyCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.patientAvatar}>
                    <User size={18} color={Colors.oliveDeep} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{b.patientName || 'Ayurvedic Patient'}</Text>
                    <Text style={styles.dateTimeText}>
                      📅 {b.dateOfAppointment || b.date} • 🕒 {b.timeSlot || b.time || 'Completed'}
                    </Text>
                  </View>

                  <View style={styles.feeWrap}>
                    <Text style={styles.feeAmount}>₹{fee}</Text>
                    <View style={[styles.statusBadge, isPaid ? styles.paidBadge : styles.pendingBadge]}>
                      <Text style={[styles.statusBadgeText, isPaid ? styles.paidBadgeText : styles.pendingBadgeText]}>
                        {isPaid ? 'Settled' : 'Unpaid'}
                      </Text>
                    </View>
                  </View>
                </View>

                {b.symptoms ? (
                  <View style={styles.symptomsBox}>
                    <Text style={styles.symptomsLabel}>Chief Complaints / Clinical Notes:</Text>
                    <Text style={styles.symptomsText} numberOfLines={2}>
                      {b.symptoms}
                    </Text>
                  </View>
                ) : null}

                {/* Proof & Action Row */}
                <View style={styles.cardFooter}>
                  <View style={styles.servicePill}>
                    <Text style={styles.servicePillText}>
                      {b.dietPlanRequested ? 'Diet Plan + Consult' : 'Online Video Consult'}
                    </Text>
                  </View>

                  {proof ? (
                    <TouchableOpacity
                      style={styles.viewProofBtn}
                      onPress={() => setSelectedProofUrl(proof)}
                    >
                      <Receipt size={13} color={Colors.oliveDeep} />
                      <Text style={styles.viewProofBtnText}>View Payment Proof</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.directUpiText}>Direct UPI Settlement</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Payment Proof Enlarged Modal */}
      <Modal
        visible={!!selectedProofUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedProofUrl(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Receipt size={18} color={Colors.oliveDeep} />
                <Text style={styles.modalTitle}>Patient UPI Payment Proof</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedProofUrl(null)}>
                <X size={20} color={Colors.inkStrong} />
              </TouchableOpacity>
            </View>

            {selectedProofUrl ? (
              <Image
                source={{ uri: selectedProofUrl }}
                style={styles.proofModalImage}
                resizeMode="contain"
              />
            ) : null}

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setSelectedProofUrl(null)}
            >
              <Text style={styles.closeModalBtnText}>Close Proof</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  statusTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  statusTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.cream,
    gap: 6,
  },
  statusTabBtnActive: {
    backgroundColor: Colors.oliveAction,
  },
  statusTabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  statusTabBtnTextActive: {
    color: Colors.cream,
  },
  filterBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.inkStrong,
    padding: 0,
  },
  timeFilterRow: {
    gap: 6,
  },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeChipActive: {
    backgroundColor: Colors.oliveDeep,
    borderColor: Colors.oliveDeep,
  },
  timeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  timeChipTextActive: {
    color: Colors.cream,
  },
  content: {
    padding: 14,
    paddingBottom: 40,
    gap: 12,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  patientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  dateTimeText: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  feeWrap: {
    alignItems: 'flex-end',
    gap: 3,
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  paidBadge: {
    backgroundColor: '#dcfce7',
  },
  paidBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  pendingBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
  },
  symptomsBox: {
    backgroundColor: Colors.cream,
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  symptomsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  symptomsText: {
    fontSize: 12,
    color: Colors.inkStrong,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  servicePill: {
    backgroundColor: Colors.creamTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  servicePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  viewProofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  viewProofBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
  directUpiText: {
    fontSize: 10,
    color: Colors.inkMuted,
    fontStyle: 'italic',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  proofModalImage: {
    width: '100%',
    height: 350,
    borderRadius: 12,
    backgroundColor: Colors.cream,
  },
  closeModalBtn: {
    backgroundColor: Colors.oliveAction,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeModalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.cream,
  },
});
