import { SafeAreaView } from 'react-native-safe-area-context';
// src/app/(doctor)/patients.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
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
  ChevronRight,
  Clock,
  FileText,
  Search,
  User,
  Users,
} from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { DoctorAppointment } from '../../types/doctor';

interface PatientSummary {
  patientId: string;
  name: string;
  phone?: string;
  email?: string;
  gender?: string;
  lastVisitDate: string;
  totalVisits: number;
  lastSymptoms?: string;
}

export default function DoctorPatientsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPatients = async () => {
    if (!user?.id) return;
    try {
      const bookings: DoctorAppointment[] = await doctorApi.getDoctorBookings(user.id);

      // Group bookings by unique patientId
      const patientMap = new Map<string, PatientSummary>();

      for (const b of bookings) {
        let pId = '';
        let pName = b.patientName || 'Patient';
        let pPhone = b.patientPhone;
        let pEmail = b.patientEmail;
        let pGender = '';

        if (typeof b.patientId === 'object' && b.patientId !== null) {
          pId = b.patientId._id;
          pName = `${b.patientId.firstName} ${b.patientId.lastName || ''}`.trim();
          pPhone = b.patientId.phone || pPhone;
          pEmail = b.patientId.email || pEmail;
          pGender = b.patientId.gender || '';
        } else if (typeof b.patientId === 'string') {
          pId = b.patientId;
        }

        if (!pId) continue;

        if (!patientMap.has(pId)) {
          patientMap.set(pId, {
            patientId: pId,
            name: pName,
            phone: pPhone,
            email: pEmail,
            gender: pGender,
            lastVisitDate: b.date,
            totalVisits: 1,
            lastSymptoms: b.symptoms,
          });
        } else {
          const existing = patientMap.get(pId)!;
          existing.totalVisits += 1;
          if (b.date > existing.lastVisitDate) {
            existing.lastVisitDate = b.date;
            existing.lastSymptoms = b.symptoms || existing.lastSymptoms;
          }
        }
      }

      setPatients(Array.from(patientMap.values()));
    } catch (err) {
      console.error('Error fetching patient list:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const filteredPatients = patients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.phone && p.phone.includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient Roster</Text>
        <Text style={styles.headerSubtitle}>
          Clinical history, Ayurvedic Dosha assessments, and medical vaults
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.inkMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search patient by name, phone, or email..."
            placeholderTextColor={Colors.inkMuted}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.olive} style={{ marginTop: 40 }} />
        ) : filteredPatients.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={36} color={Colors.inkMuted} />
            <Text style={styles.emptyTitle}>No patients found</Text>
            <Text style={styles.emptyDesc}>
              {searchQuery
                ? 'No matching patient records found for this search.'
                : 'Patients who book consultations with you will appear in your clinical roster.'}
            </Text>
          </View>
        ) : (
          filteredPatients.map((patient) => (
            <TouchableOpacity
              key={patient.patientId}
              style={styles.patientCard}
              onPress={() => router.push(`/(doctor)/patient/${patient.patientId}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.avatar}>
                <User size={22} color={Colors.oliveDeep} />
              </View>

              <View style={styles.patientInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  {patient.gender && (
                    <Text style={styles.genderBadge}>{patient.gender}</Text>
                  )}
                </View>

                {patient.phone ? (
                  <Text style={styles.phoneText}>📞 {patient.phone}</Text>
                ) : null}

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    Visits: <Text style={styles.metaBold}>{patient.totalVisits}</Text>
                  </Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>Last visit: {patient.lastVisitDate}</Text>
                </View>

                {patient.lastSymptoms ? (
                  <Text style={styles.symptomsNote} numberOfLines={1}>
                    Prior complaint: {patient.lastSymptoms}
                  </Text>
                ) : null}
              </View>

              <ChevronRight size={18} color={Colors.inkMuted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  container: {
    padding: 16,
    gap: 12,
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
    lineHeight: 18,
  },
  patientCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  genderBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.oliveDeep,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  phoneText: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  metaBold: {
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  metaDot: {
    fontSize: 10,
    color: Colors.inkMuted,
  },
  symptomsNote: {
    fontSize: 11,
    color: Colors.inkMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
