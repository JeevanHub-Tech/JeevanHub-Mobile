// src/app/(doctor)/patient/[patientId].tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Activity,
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Heart,
  Mail,
  MapPin,
  Phone,
  Pill,
  Sparkles,
  User,
} from 'lucide-react-native';
import { doctorApi } from '../../../api/doctor';
import { Colors } from '../../../constants/theme';
import { PatientDossier } from '../../../types/doctor';

export default function PatientDossierScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId: string }>();

  const [dossier, setDossier] = useState<PatientDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDossier = async () => {
    if (!patientId) return;
    try {
      const data = await doctorApi.getPatientDossier(patientId);
      setDossier(data);
    } catch (err) {
      console.error('Error loading patient dossier:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [patientId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDossier();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading Clinical Dossier...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const patient = dossier?.patient;
  const dosha = dossier?.doshaAssessment;
  const medicalHistory = dossier?.medicalHistory || [];
  const consultations = dossier?.consultations || [];

  const fullName = patient
    ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient'
    : 'Patient';

  // Dosha percentage calculations
  const vata = dosha?.scores?.vata || 0;
  const pitta = dosha?.scores?.pitta || 0;
  const kapha = dosha?.scores?.kapha || 0;
  const totalScore = vata + pitta + kapha || 1;
  const vataPct = Math.round((vata / totalScore) * 100);
  const pittaPct = Math.round((pitta / totalScore) * 100);
  const kaphaPct = Math.round((kapha / totalScore) * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.oliveDeep} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Clinical Dossier</Text>
          <Text style={styles.headerSubtitle}>{fullName}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {/* Patient Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <User size={28} color={Colors.oliveDeep} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.patientName}>{fullName}</Text>
              <View style={styles.genderRow}>
                {patient?.gender && (
                  <Text style={styles.badge}>{patient.gender}</Text>
                )}
                {patient?.dob && (
                  <Text style={styles.badge}>DOB: {patient.dob}</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.contactDetails}>
            {patient?.email && (
              <View style={styles.contactItem}>
                <Mail size={14} color={Colors.inkMuted} />
                <Text style={styles.contactText}>{patient.email}</Text>
              </View>
            )}
            {patient?.phone && (
              <View style={styles.contactItem}>
                <Phone size={14} color={Colors.inkMuted} />
                <Text style={styles.contactText}>{patient.phone}</Text>
              </View>
            )}
            {patient?.address && (
              <View style={styles.contactItem}>
                <MapPin size={14} color={Colors.inkMuted} />
                <Text style={styles.contactText}>
                  {patient.address} {patient.zipCode ? `(${patient.zipCode})` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Ayurvedic Prakriti & Dosha Assessment */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Sparkles size={18} color={Colors.turmericGold} />
            <Text style={styles.sectionTitle}>Ayurvedic Constitution (Prakriti)</Text>
          </View>

          {dosha ? (
            <View>
              <View style={styles.dominantRow}>
                <Text style={styles.dominantLabel}>Dominant Dosha:</Text>
                <View style={styles.dominantBadge}>
                  <Text style={styles.dominantText}>{dosha.dominantDosha}</Text>
                </View>
              </View>

              {/* Dosha Progress Bars */}
              <View style={styles.barsContainer}>
                {/* Vata */}
                <View style={styles.barItem}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barName}>Vata (Air & Space)</Text>
                    <Text style={styles.barPct}>{vataPct}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${vataPct}%`, backgroundColor: '#80cbc4' }]} />
                  </View>
                </View>

                {/* Pitta */}
                <View style={styles.barItem}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barName}>Pitta (Fire & Water)</Text>
                    <Text style={styles.barPct}>{pittaPct}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pittaPct}%`, backgroundColor: Colors.turmericGold }]} />
                  </View>
                </View>

                {/* Kapha */}
                <View style={styles.barItem}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barName}>Kapha (Earth & Water)</Text>
                    <Text style={styles.barPct}>{kaphaPct}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${kaphaPct}%`, backgroundColor: Colors.oliveAction }]} />
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyNotice}>
              <Text style={styles.emptyNoticeText}>
                No Prakriti dosha assessment recorded yet for this patient.
              </Text>
            </View>
          )}
        </View>

        {/* Medical Vault & OCR Extractions */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <FileText size={18} color={Colors.olive} />
            <Text style={styles.sectionTitle}>Medical Records Vault ({medicalHistory.length})</Text>
          </View>

          {medicalHistory.length === 0 ? (
            <View style={styles.emptyNotice}>
              <Text style={styles.emptyNoticeText}>
                No medical records uploaded by patient yet.
              </Text>
            </View>
          ) : (
            medicalHistory.map((rec, idx) => (
              <View key={idx} style={styles.recordItem}>
                <View style={styles.recordTop}>
                  <Text style={styles.recordFileName} numberOfLines={1}>
                    📄 {rec.fileName || 'Prescription Document'}
                  </Text>
                  {rec.url && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(rec.url)}
                      hitSlop={8}
                    >
                      <ExternalLink size={14} color={Colors.oliveDeep} />
                    </TouchableOpacity>
                  )}
                </View>

                {rec.uploadedAt && (
                  <Text style={styles.recordDate}>
                    Uploaded: {new Date(rec.uploadedAt).toLocaleDateString()}
                  </Text>
                )}

                {/* OCR Medicines */}
                {rec.ocr?.medicines && rec.ocr.medicines.length > 0 && (
                  <View style={styles.ocrBox}>
                    <Text style={styles.ocrHeading}>OCR Extracted Medicines:</Text>
                    {rec.ocr.medicines.map((med, mIdx) => (
                      <View key={mIdx} style={styles.medRow}>
                        <Pill size={12} color={Colors.oliveDeep} />
                        <Text style={styles.medName}>
                          {med.name} {med.dosage ? `(${med.dosage})` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Consultation History */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color={Colors.oliveDeep} />
            <Text style={styles.sectionTitle}>Consultation History ({consultations.length})</Text>
          </View>

          {consultations.length === 0 ? (
            <View style={styles.emptyNotice}>
              <Text style={styles.emptyNoticeText}>
                No previous visits logged with you.
              </Text>
            </View>
          ) : (
            consultations.map((c, idx) => (
              <View key={c._id || idx} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyDate}>
                    📅 {c.date} at {c.time}
                  </Text>
                  <Text style={styles.historyStatus}>{c.status}</Text>
                </View>

                {c.symptoms ? (
                  <Text style={styles.historySymptoms}>Chief Complaints: {c.symptoms}</Text>
                ) : null}

                {c.recommendedSupplements && c.recommendedSupplements.length > 0 && (
                  <View style={styles.supplementsList}>
                    <Text style={styles.supplementsTitle}>Prescribed Formulations:</Text>
                    {c.recommendedSupplements.map((s, sIdx) => (
                      <Text key={sIdx} style={styles.supplementItem}>
                        • {s.medicineName} — {s.dosage} ({s.timing || 'Daily'})
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 4,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  contactDetails: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  dominantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dominantLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.inkMuted,
  },
  dominantBadge: {
    backgroundColor: Colors.turmericGold + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.turmericGold,
  },
  dominantText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  barsContainer: {
    gap: 10,
  },
  barItem: {
    gap: 4,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.inkStrong,
  },
  barPct: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.cream,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyNotice: {
    paddingVertical: 12,
  },
  emptyNoticeText: {
    fontSize: 12,
    color: Colors.inkMuted,
    fontStyle: 'italic',
  },
  recordItem: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
    flex: 1,
    marginRight: 8,
  },
  recordDate: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginBottom: 6,
  },
  ocrBox: {
    backgroundColor: Colors.surface,
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    gap: 4,
  },
  ocrHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  medName: {
    fontSize: 11,
    color: Colors.inkStrong,
  },
  historyCard: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  historyStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
    textTransform: 'uppercase',
  },
  historySymptoms: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginBottom: 6,
  },
  supplementsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 6,
    gap: 2,
  },
  supplementsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
    marginBottom: 2,
  },
  supplementItem: {
    fontSize: 11,
    color: Colors.inkStrong,
  },
});
