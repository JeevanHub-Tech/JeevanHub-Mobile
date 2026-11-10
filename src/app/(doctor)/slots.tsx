import { SafeAreaView } from 'react-native-safe-area-context';
// src/app/(doctor)/slots.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {
  AlertCircle,
  Calendar,
  CalendarOff,
  Check,
  Clock,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { DayOfWeek, SlotItem } from '../../types/doctor';

const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const PRESET_DURATIONS = [15, 30, 45, 60];
const QUICK_TIMES = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
];

export default function DoctorSlotsScreen() {
  const { user } = useAuthStore();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [slotsMap, setSlotsMap] = useState<Record<string, SlotItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Slot Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [startTime, setStartTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [consultType, setConsultType] = useState<'Online' | 'In-Person' | 'Both'>('Online');
  const [capacity, setCapacity] = useState('1');
  const [slotFee, setSlotFee] = useState(user?.price ? String(user.price) : '500');
  const [submitting, setSubmitting] = useState(false);

  // Date cancellation modal state
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelDate, setCancelDate] = useState('');
  const [cancelReason, setCancelReason] = useState('Personal leave');
  const [cancelling, setCancelling] = useState(false);

  const fetchDoctorProfile = async () => {
    if (!user?.id) return;
    try {
      const data = await doctorApi.getDoctorProfile(user.id);
      if (data && data.availableSlots) {
        setSlotsMap(data.availableSlots);
      }
    } catch (err) {
      console.error('Error fetching doctor slots:', err);
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

  const currentSlots: SlotItem[] = slotsMap[selectedDay] || [];
  const allDisabled =
    currentSlots.length > 0 && currentSlots.every((s) => s.isDisabled === true);

  const handleToggleDay = async () => {
    try {
      const newDisable = !allDisabled;
      const res = await doctorApi.toggleDisableDay(selectedDay, newDisable);
      if (res && res.availableSlots) {
        setSlotsMap(res.availableSlots);
      } else {
        fetchDoctorProfile();
      }
      Alert.alert(
        'Schedule Updated',
        `${selectedDay} slots are now ${newDisable ? 'paused' : 'active'}.`
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not update day status.');
    }
  };

  const handleCreateSlot = async () => {
    if (!startTime.trim()) {
      Alert.alert('Required', 'Please select or enter a start time (e.g. 09:30).');
      return;
    }
    setSubmitting(true);
    try {
      const newSlot: SlotItem = {
        startTime: startTime.trim(),
        duration,
        consultationType: consultType,
        sessionType: '1-to-1',
        maxCapacity: Number(capacity) || 1,
        fee: Number(slotFee) || user?.price || 500,
      };
      const res = await doctorApi.addSlotTemplate(selectedDay, newSlot);
      if (res && res.availableSlots) {
        setSlotsMap(res.availableSlots);
      } else {
        await fetchDoctorProfile();
      }
      setModalVisible(false);
      Alert.alert('Success', `New slot ${startTime} added to ${selectedDay}.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not add slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = (slot: SlotItem) => {
    if (!slot._id) return;
    Alert.alert(
      'Delete Slot',
      `Are you sure you want to remove the ${slot.startTime} slot from ${selectedDay}? Any future unfulfilled bookings for this slot will be cancelled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await doctorApi.deleteSlotTemplate(selectedDay, slot._id!);
              if (res && res.availableSlots) {
                setSlotsMap(res.availableSlots);
              } else {
                fetchDoctorProfile();
              }
            } catch (err: any) {
              Alert.alert(
                'Error',
                err?.response?.data?.message || 'Could not delete slot template.'
              );
            }
          },
        },
      ]
    );
  };

  const handleCancelDateSlots = async () => {
    if (!cancelDate.trim()) {
      Alert.alert('Required', 'Please enter date to cancel in YYYY-MM-DD format.');
      return;
    }
    setCancelling(true);
    try {
      await doctorApi.cancelDateSlots(cancelDate.trim(), cancelReason.trim());
      setCancelModalVisible(false);
      setCancelDate('');
      Alert.alert(
        'Leave Scheduled',
        `All consultation slots on ${cancelDate} have been marked as cancelled.`
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel date.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Availability Slots</Text>
          <Text style={styles.headerSubtitle}>Configure your recurring clinical hours</Text>
        </View>
        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={() => setCancelModalVisible(true)}
          activeOpacity={0.8}
        >
          <CalendarOff size={16} color={Colors.warning} />
          <Text style={styles.leaveBtnText}>Apply Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Day Tabs */}
      <View style={styles.dayTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayTabs}
        >
          {DAYS.map((day) => {
            const isSelected = selectedDay === day;
            const count = (slotsMap[day] || []).length;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayTab, isSelected && styles.dayTabActive]}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayTabText, isSelected && styles.dayTabTextActive]}>
                  {day.slice(0, 3)}
                </Text>
                <View
                  style={[
                    styles.slotCountBadge,
                    isSelected ? styles.slotCountActive : styles.slotCountInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotCountText,
                      isSelected ? styles.slotCountTextActive : styles.slotCountTextInactive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {/* Day Control Bar */}
        <View style={styles.dayControlBar}>
          <View style={styles.dayTitleRow}>
            <Text style={styles.dayTitle}>{selectedDay}'s Schedule</Text>
            <Text style={styles.daySlotCount}>
              {currentSlots.length} slot{currentSlots.length === 1 ? '' : 's'}
            </Text>
          </View>

          {currentSlots.length > 0 && (
            <TouchableOpacity
              style={[styles.pauseBtn, allDisabled ? styles.resumeBtn : null]}
              onPress={handleToggleDay}
              activeOpacity={0.7}
            >
              <Text style={[styles.pauseBtnText, allDisabled ? styles.resumeBtnText : null]}>
                {allDisabled ? 'Resume Day' : 'Pause Day'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.olive} style={{ marginTop: 40 }} />
        ) : currentSlots.length === 0 ? (
          <View style={styles.emptyCard}>
            <Clock size={36} color={Colors.inkMuted} />
            <Text style={styles.emptyTitle}>No slots set for {selectedDay}</Text>
            <Text style={styles.emptyDesc}>
              Add standard appointment slots so patients can book visits with you on this day.
            </Text>
            <TouchableOpacity
              style={styles.addSlotBtnPrimary}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Plus size={16} color={Colors.cream} />
              <Text style={styles.addSlotBtnText}>Add First Slot</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.slotsList}>
            {currentSlots.map((slot, idx) => (
              <View
                key={slot._id || idx}
                style={[styles.slotCard, slot.isDisabled && styles.slotCardDisabled]}
              >
                <View style={styles.slotMain}>
                  <View style={styles.timeBadge}>
                    <Clock size={16} color={Colors.oliveDeep} />
                    <Text style={styles.timeText}>{slot.startTime}</Text>
                  </View>

                  <View style={styles.slotDetails}>
                    <Text style={styles.slotType}>
                      {slot.consultationType || 'Online'} • {slot.duration || 30} mins
                    </Text>
                    <Text style={styles.slotFee}>
                      ₹{slot.fee || user?.price || 500}
                      {slot.maxCapacity && slot.maxCapacity > 1
                        ? ` • Cap: ${slot.maxCapacity}`
                        : ''}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteSlot(slot)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Plus size={16} color={Colors.oliveDeep} />
              <Text style={styles.addMoreBtnText}>Add Another Slot to {selectedDay}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal: Add Slot */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Slot ({selectedDay})</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={10}>
                <X size={20} color={Colors.inkMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Quick Pick Start Time */}
              <Text style={styles.inputLabel}>Start Time (HH:mm)</Text>
              <TextInput
                style={styles.textInput}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="10:00"
                placeholderTextColor={Colors.inkMuted}
                autoCapitalize="none"
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickChips}
              >
                {QUICK_TIMES.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.quickChip, startTime === time && styles.quickChipActive]}
                    onPress={() => setStartTime(time)}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        startTime === time && styles.quickChipTextActive,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Duration */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Duration</Text>
              <View style={styles.durationRow}>
                {PRESET_DURATIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.durationChip, duration === d && styles.durationChipActive]}
                    onPress={() => setDuration(d)}
                  >
                    <Text
                      style={[
                        styles.durationChipText,
                        duration === d && styles.durationChipTextActive,
                      ]}
                    >
                      {d} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Consultation Mode */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Consultation Mode</Text>
              <View style={styles.modeRow}>
                {(['Online', 'In-Person', 'Both'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modeChip, consultType === m && styles.modeChipActive]}
                    onPress={() => setConsultType(m)}
                  >
                    <Text
                      style={[styles.modeChipText, consultType === m && styles.modeChipTextActive]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Fee */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Fee (₹)</Text>
              <TextInput
                style={styles.textInput}
                value={slotFee}
                onChangeText={setSlotFee}
                keyboardType="numeric"
                placeholder="500"
                placeholderTextColor={Colors.inkMuted}
              />

              {/* Max Capacity */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Max Patient Capacity</Text>
              <TextInput
                style={styles.textInput}
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={Colors.inkMuted}
              />

              <TouchableOpacity
                style={[styles.modalSubmitBtn, submitting && styles.btnDisabled]}
                onPress={handleCreateSlot}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={Colors.cream} />
                ) : (
                  <>
                    <Check size={18} color={Colors.cream} />
                    <Text style={styles.modalSubmitText}>Save Slot</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Date Cancellation / Leave */}
      <Modal visible={cancelModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CalendarOff size={18} color={Colors.warning} />
                <Text style={styles.modalTitle}>Cancel Date / Apply Leave</Text>
              </View>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)} hitSlop={10}>
                <X size={20} color={Colors.inkMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.cancelNotice}>
              Marking a date as cancelled removes all slots for that day and prevents new bookings.
            </Text>

            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              value={cancelDate}
              onChangeText={setCancelDate}
              placeholder={new Date().toISOString().split('T')[0]}
              placeholderTextColor={Colors.inkMuted}
              autoCapitalize="none"
            />

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Reason for Leave (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="e.g. Clinical conference / Personal leave"
              placeholderTextColor={Colors.inkMuted}
            />

            <TouchableOpacity
              style={[styles.cancelSubmitBtn, cancelling && styles.btnDisabled]}
              onPress={handleCancelDateSlots}
              disabled={cancelling}
              activeOpacity={0.8}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.cancelSubmitText}>Confirm Date Cancellation</Text>
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
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningBg,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  leaveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.warning,
  },
  dayTabsWrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
  },
  dayTabs: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.cream,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayTabActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  dayTabTextActive: {
    color: Colors.cream,
  },
  slotCountBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  slotCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  slotCountInactive: {
    backgroundColor: Colors.sagePale,
  },
  slotCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  slotCountTextActive: {
    color: Colors.cream,
  },
  slotCountTextInactive: {
    color: Colors.oliveDeep,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  dayControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  dayTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  daySlotCount: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  pauseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.sagePale,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resumeBtn: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.success,
  },
  pauseBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  resumeBtnText: {
    color: Colors.success,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  addSlotBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.oliveAction,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  addSlotBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.cream,
  },
  slotsList: {
    gap: 12,
  },
  slotCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slotCardDisabled: {
    opacity: 0.5,
  },
  slotMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sagePale,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  slotDetails: {
    gap: 2,
  },
  slotType: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  slotFee: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.olive,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
  },
  addMoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.inkStrong,
  },
  quickChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingBottom: 4,
  },
  quickChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickChipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.inkStrong,
  },
  quickChipTextActive: {
    color: Colors.cream,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  durationChipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  durationChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  durationChipTextActive: {
    color: Colors.cream,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeChipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  modeChipTextActive: {
    color: Colors.cream,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.oliveAction,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.cream,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  cancelNotice: {
    fontSize: 12,
    color: Colors.inkMuted,
    lineHeight: 16,
    marginBottom: 16,
  },
  cancelSubmitBtn: {
    backgroundColor: Colors.error,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  cancelSubmitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
