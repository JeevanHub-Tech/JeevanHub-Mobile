// src/app/(patient)/book/[doctorId].tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  ShieldCheck,
  User,
  Video,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import { Button } from '../../../components/ui/Button';
import { Colors } from '../../../constants/theme';
import { useAuthStore } from '../../../store/authStore';
import { DoctorProfile } from '../../../types/patient';

interface DateOption {
  dateStr: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue
  dayNum: string; // 29, 30
  isToday: boolean;
}

const DEFAULT_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const { user } = useAuthStore();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Booking selections
  const [dateList, setDateList] = useState<DateOption[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00');
  const [consultationType, setConsultationType] = useState<'Online' | 'In-Person'>('Online');
  const [symptoms, setSymptoms] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>(DEFAULT_SLOTS);

  // Generate next 7 days
  useEffect(() => {
    const dates: DateOption[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = String(d.getDate());

      dates.push({
        dateStr,
        dayName,
        dayNum,
        isToday: i === 0,
      });
    }

    setDateList(dates);
    if (dates.length > 0) {
      setSelectedDate(dates[0].dateStr);
    }
  }, []);

  useEffect(() => {
    if (doctorId) {
      loadDoctorInfo(doctorId);
    }
  }, [doctorId]);

  const loadDoctorInfo = async (id: string) => {
    try {
      const data = await patientApi.getDoctorById(id);
      setDoctor(data);
    } catch (err) {
      console.error('Error fetching doctor details for booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!doctor || !user?.id) {
      Alert.alert('Session Error', 'Please ensure you are logged in.');
      return;
    }

    if (!selectedDate || !selectedSlot) {
      Alert.alert('Missing Details', 'Please select both an appointment date and a time slot.');
      return;
    }

    setBookingLoading(true);
    try {
      const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName || ''}`.trim();
      const patientName = `${user.firstName} ${user.lastName || ''}`.trim();

      await patientApi.createBooking({
        doctorId: doctor._id,
        patientId: user.id,
        patientEmail: user.email,
        patientPhone: user.phone || '9876543210',
        patientName,
        date: selectedDate,
        timeSlot: selectedSlot,
        consultationType,
        symptoms: symptoms.trim() || undefined,
        fee: doctor.price || 500,
      });

      Alert.alert(
        'Appointment Confirmed! 🌿',
        `Your consultation with ${doctorName} is scheduled for ${selectedDate} at ${selectedSlot}.`,
        [
          {
            text: 'View Bookings',
            onPress: () => router.replace('/(patient)/appointments'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Could not schedule appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading doctor schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const doctorName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName || ''}`.trim() : 'Doctor';
  const fee = doctor?.price || 500;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={20} color={Colors.inkStrong} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Schedule Consultation</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Doctor Summary Banner */}
          <View style={styles.doctorBanner}>
            <View style={styles.avatar}>
              <User size={24} color={Colors.cream} />
            </View>
            <View style={styles.bannerInfo}>
              <Text style={styles.doctorNameText}>{doctorName}</Text>
              <Text style={styles.doctorSpecText}>
                {(doctor?.specialization && doctor.specialization.join(' • ')) || 'Ayurveda Specialist'}
              </Text>
            </View>
            <View style={styles.feeBadge}>
              <Text style={styles.feeBadgeVal}>₹{fee}</Text>
            </View>
          </View>

          {/* Consultation Type Selector */}
          <Text style={styles.sectionHeader}>Consultation Mode</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeCard,
                consultationType === 'Online' && styles.modeCardActive,
              ]}
              onPress={() => setConsultationType('Online')}
              activeOpacity={0.8}
            >
              <Video
                size={20}
                color={consultationType === 'Online' ? Colors.oliveAction : Colors.inkMuted}
              />
              <Text
                style={[
                  styles.modeCardTitle,
                  consultationType === 'Online' && styles.modeCardTitleActive,
                ]}
              >
                Video Consult
              </Text>
              <Text style={styles.modeCardDesc}>HD Video call via browser/app</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                consultationType === 'In-Person' && styles.modeCardActive,
              ]}
              onPress={() => setConsultationType('In-Person')}
              activeOpacity={0.8}
            >
              <MapPin
                size={20}
                color={consultationType === 'In-Person' ? Colors.oliveAction : Colors.inkMuted}
              />
              <Text
                style={[
                  styles.modeCardTitle,
                  consultationType === 'In-Person' && styles.modeCardTitleActive,
                ]}
              >
                Clinic Visit
              </Text>
              <Text style={styles.modeCardDesc}>At doctor's clinical facility</Text>
            </TouchableOpacity>
          </View>

          {/* Date Selector */}
          <Text style={styles.sectionHeader}>Select Consultation Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScroll}
          >
            {dateList.map((d) => {
              const isSelected = selectedDate === d.dateStr;
              return (
                <TouchableOpacity
                  key={d.dateStr}
                  style={[styles.dateCard, isSelected && styles.dateCardActive]}
                  onPress={() => setSelectedDate(d.dateStr)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dayName, isSelected && styles.dayTextActive]}>
                    {d.isToday ? 'Today' : d.dayName}
                  </Text>
                  <Text style={[styles.dayNum, isSelected && styles.dayTextActive]}>
                    {d.dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Time Slot Selector */}
          <Text style={styles.sectionHeader}>Available Time Slots</Text>
          <View style={styles.slotsGrid}>
            {availableSlots.map((time) => {
              const isSelected = selectedSlot === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[styles.slotChip, isSelected && styles.slotChipActive]}
                  onPress={() => setSelectedSlot(time)}
                  activeOpacity={0.75}
                >
                  <Clock
                    size={14}
                    color={isSelected ? Colors.cream : Colors.oliveDeep}
                  />
                  <Text
                    style={[styles.slotText, isSelected && styles.slotTextActive]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Health Symptoms & Notes */}
          <Text style={styles.sectionHeader}>Health Notes & Symptoms (Optional)</Text>
          <View style={styles.notesContainer}>
            <TextInput
              style={styles.notesInput}
              placeholder="Describe your health symptoms, past diagnosis, or wellness goals for the doctor..."
              placeholderTextColor={Colors.inkMuted}
              multiline
              numberOfLines={4}
              value={symptoms}
              onChangeText={setSymptoms}
              textAlignVertical="top"
            />
          </View>

          {/* Booking Summary Box */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Consultation Mode</Text>
              <Text style={styles.summaryValue}>{consultationType}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Scheduled Time</Text>
              <Text style={styles.summaryValue}>
                {selectedDate} at {selectedSlot}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{fee}</Text>
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title={`Confirm Booking (₹${fee})`}
            onPress={handleConfirmBooking}
            loading={bookingLoading}
            size="lg"
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cream,
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  doctorBanner: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerInfo: {
    flex: 1,
  },
  doctorNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  doctorSpecText: {
    fontSize: 12,
    color: Colors.olive,
    marginTop: 2,
  },
  feeBadge: {
    backgroundColor: Colors.sagePale,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  feeBadgeVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modeCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modeCardActive: {
    borderColor: Colors.oliveAction,
    backgroundColor: '#f6f8f0',
  },
  modeCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginTop: 8,
    marginBottom: 2,
  },
  modeCardTitleActive: {
    color: Colors.oliveDeep,
  },
  modeCardDesc: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  dateScroll: {
    gap: 10,
    paddingBottom: 4,
    marginBottom: 20,
  },
  dateCard: {
    width: 64,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  dateCardActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.inkMuted,
    marginBottom: 4,
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  dayTextActive: {
    color: Colors.cream,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  slotChipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  slotText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  slotTextActive: {
    color: Colors.cream,
  },
  notesContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 20,
  },
  notesInput: {
    fontSize: 13,
    color: Colors.inkStrong,
    minHeight: 80,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  submitBtn: {
    marginBottom: 20,
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
});
