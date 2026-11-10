import { SafeAreaView } from 'react-native-safe-area-context';
// src/app/consultation/[bookingId].tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  FileEdit,
  FileText,
  PhoneOff,
  ShieldCheck,
  User,
  Video,
} from 'lucide-react-native';
import { consultationApi } from '../../api/consultation';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function ConsultationRoomScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user } = useAuthStore();
  const isDoctor = user?.role === 'doctor';

  const [booking, setBooking] = useState<any>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (sessionActive) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive]);

  const fetchSessionInfo = async () => {
    if (!bookingId) return;
    try {
      const [bookingData, joinInfo] = await Promise.all([
        consultationApi.getBooking(bookingId),
        consultationApi.getDailyJoinInfo(bookingId),
      ]);

      setBooking(bookingData);

      const computedUrl =
        joinInfo?.url ||
        joinInfo?.roomUrl ||
        bookingData?.meetingLink ||
        'https://meet.google.com';

      setRoomUrl(computedUrl);
    } catch (err) {
      console.error('Error fetching consultation session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionInfo();
  }, [bookingId]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleLaunchVideoRoom = async () => {
    if (!roomUrl) return;
    setSessionActive(true);
    try {
      await WebBrowser.openBrowserAsync(roomUrl, {
        showTitle: true,
        enableBarCollapsing: false,
        dismissButtonStyle: 'close',
      });
    } catch {
      Linking.openURL(roomUrl).catch(() => {
        Alert.alert('Error', 'Unable to launch consultation video stream.');
      });
    }
  };

  const handleEndSession = () => {
    Alert.alert(
      'Leave Consultation',
      isDoctor
        ? 'Do you want to leave and mark this clinical visit as completed?'
        : 'Do you want to leave the consultation room?',
      [
        { text: 'Keep In Room', style: 'cancel' },
        {
          text: isDoctor ? 'Mark Completed & Exit' : 'Exit Room',
          style: 'destructive',
          onPress: async () => {
            if (isDoctor && bookingId) {
              await consultationApi.endConsultation(bookingId);
            }
            router.back();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Securing Clinical Room Connection...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const otherPersonName = isDoctor
    ? (typeof booking?.patientId === 'object' && booking?.patientId !== null
        ? `${booking.patientId.firstName} ${booking.patientId.lastName || ''}`.trim()
        : booking?.patientName || 'Patient')
    : (typeof booking?.doctorId === 'object' && booking?.doctorId !== null
        ? `Dr. ${booking.doctorId.firstName} ${booking.doctorId.lastName || ''}`.trim()
        : booking?.doctorName || 'Doctor');

  const patientIdStr =
    typeof booking?.patientId === 'object' && booking?.patientId !== null
      ? booking.patientId._id
      : booking?.patientId;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ayurvedic Tele-Consultation</Text>
          <Text style={styles.headerSubtitle}>Encrypted Clinical Session</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.liveDot} />
          <Text style={styles.statusText}>{sessionActive ? 'IN SESSION' : 'READY'}</Text>
        </View>
      </View>

      {/* Main Video Presentation Container */}
      <View style={styles.container}>
        {/* Virtual Room Card */}
        <View style={styles.roomCard}>
          <View style={styles.avatarWrap}>
            <User size={48} color={Colors.oliveDeep} />
          </View>
          <Text style={styles.participantName}>{otherPersonName}</Text>
          <Text style={styles.sessionMode}>
            {booking?.consultationType || 'Online'} Ayurvedic Consultation
          </Text>

          {/* Session Duration Counter */}
          <View style={styles.timerBox}>
            <Clock size={16} color={Colors.turmericGold} />
            <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>
          </View>

          {/* Call-to-action button */}
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={handleLaunchVideoRoom}
            activeOpacity={0.8}
          >
            <Video size={20} color={Colors.cream} />
            <Text style={styles.joinBtnText}>
              {sessionActive ? 'Re-open Video Call' : 'Launch Video Room'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Doctor In-Consultation Side Actions */}
        {isDoctor && (
          <View style={styles.toolsCard}>
            <Text style={styles.toolsHeader}>Physician In-Call Tools</Text>
            <View style={styles.toolsRow}>
              {patientIdStr && (
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => router.push(`/(doctor)/patient/${patientIdStr}` as any)}
                  activeOpacity={0.8}
                >
                  <FileText size={18} color={Colors.oliveDeep} />
                  <Text style={styles.toolBtnText}>View Dossier</Text>
                </TouchableOpacity>
              )}

              {bookingId && (
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => router.push(`/(doctor)/prescribe/${bookingId}` as any)}
                  activeOpacity={0.8}
                >
                  <FileEdit size={18} color={Colors.oliveDeep} />
                  <Text style={styles.toolBtnText}>Prescribe Meds</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Patient Symptoms Card */}
        {booking?.symptoms ? (
          <View style={styles.symptomsCard}>
            <Text style={styles.symptomsTitle}>Chief Complaints / Reported Symptoms:</Text>
            <Text style={styles.symptomsBody}>{booking.symptoms}</Text>
          </View>
        ) : null}

        {/* End Call / Leave Button */}
        <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 20 }}>
          <TouchableOpacity style={styles.hangupBtn} onPress={handleEndSession} activeOpacity={0.8}>
            <PhoneOff size={20} color="#ffffff" />
            <Text style={styles.hangupText}>
              {isDoctor ? 'Conclude Visit & Mark Completed' : 'Leave Consultation Room'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a2212',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.inkMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
    paddingBottom: 14,
    backgroundColor: '#252f19',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.cream,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#a3b899',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74, 92, 40, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.oliveAction,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#81c784',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#81c784',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  roomCard: {
    backgroundColor: '#252f19',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 10,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  participantName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.cream,
    marginBottom: 4,
  },
  sessionMode: {
    fontSize: 13,
    color: '#a3b899',
    marginBottom: 16,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.turmericGold,
    letterSpacing: 1,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.oliveAction,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    width: '100%',
  },
  joinBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.cream,
  },
  toolsCard: {
    backgroundColor: '#252f19',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toolsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a3b899',
    marginBottom: 10,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sagePale,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  toolBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  symptomsCard: {
    backgroundColor: 'rgba(200, 162, 74, 0.1)',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(200, 162, 74, 0.3)',
  },
  symptomsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.turmericGold,
    marginBottom: 4,
  },
  symptomsBody: {
    fontSize: 13,
    color: Colors.cream,
    lineHeight: 18,
  },
  hangupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d32f2f',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
  },
  hangupText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});
