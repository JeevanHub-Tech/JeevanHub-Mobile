// src/app/(doctor)/prescribe/[bookingId].tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  Check,
  CheckCircle2,
  FileCheck,
  FileText,
  Pill,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react-native';
import { doctorApi } from '../../../api/doctor';
import { Colors } from '../../../constants/theme';
import {
  DoctorAppointment,
  MedicineCatalogItem,
  PrescribedSupplement,
} from '../../../types/doctor';

const TIMING_OPTIONS = [
  'Before meals (Pragbhakta)',
  'After meals (Adhobhakta)',
  'Empty stomach (Abhakta)',
  'Bedtime (Nishi)',
];

const ANUPANA_OPTIONS = [
  'Warm water (Ushnodaka)',
  'Honey (Madhu)',
  'Warm milk (Ksheera)',
  'Ghee (Ghrita)',
  'Buttermilk (Takra)',
];

const FREQUENCIES = ['Once daily', 'Twice daily', 'Thrice daily'];
const DURATIONS = ['7 days', '14 days', '21 days', '30 days'];

export default function PrescribeScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<DoctorAppointment | null>(null);
  const [loading, setLoading] = useState(true);

  // Diagnosis
  const [diagnosis, setDiagnosis] = useState('');
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);

  // Medicine search & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MedicineCatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineCatalogItem | null>(null);

  // Prescription builder inputs
  const [customMedName, setCustomMedName] = useState('');
  const [dosage, setDosage] = useState('1 tablet');
  const [frequency, setFrequency] = useState('Twice daily');
  const [timing, setTiming] = useState(TIMING_OPTIONS[1]);
  const [anupana, setAnupana] = useState(ANUPANA_OPTIONS[0]);
  const [duration, setDuration] = useState('14 days');
  const [specialAdvice, setSpecialAdvice] = useState('');
  const [addingSupplement, setAddingSupplement] = useState(false);

  // Publish
  const [publishing, setPublishing] = useState(false);

  const fetchBooking = async () => {
    if (!bookingId) return;
    try {
      const data = await doctorApi.getBookingById(bookingId);
      if (data) {
        setBooking(data);
        if (data.notes) setDiagnosis(data.notes);
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Search medicines
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const meds = await doctorApi.searchMedicines(searchQuery.trim());
        setSearchResults(meds);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSaveDiagnosis = async () => {
    if (!bookingId || !diagnosis.trim()) return;
    setSavingDiagnosis(true);
    try {
      await doctorApi.updateDiagnosis(bookingId, diagnosis.trim());
      Alert.alert('Saved', 'Clinical diagnosis updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update diagnosis.');
    } finally {
      setSavingDiagnosis(false);
    }
  };

  const handleAddSupplement = async () => {
    if (!bookingId) return;
    const medName = selectedMedicine?.name || customMedName.trim();
    if (!medName) {
      Alert.alert('Required', 'Please select or type a medicine formulation.');
      return;
    }

    setAddingSupplement(true);
    try {
      const instructions = `Timing: ${timing} | Vehicle (Anupana): ${anupana} | Duration: ${duration}${
        specialAdvice.trim() ? ` | Notes: ${specialAdvice.trim()}` : ''
      }`;

      await doctorApi.addSupplementToBooking(bookingId, {
        medicineId: selectedMedicine?._id,
        medicineName: medName,
        dosage: `${dosage} (${frequency})`,
        instructions,
      });

      // Clear builder
      setSelectedMedicine(null);
      setCustomMedName('');
      setSearchQuery('');
      setSpecialAdvice('');

      // Refresh booking
      await fetchBooking();
      Alert.alert('Formulation Added', `${medName} added to the prescription draft.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add formulation.');
    } finally {
      setAddingSupplement(false);
    }
  };

  const handleDeleteSupplement = (supp: PrescribedSupplement) => {
    if (!bookingId || !supp._id) return;
    Alert.alert('Remove Medicine', `Remove ${supp.medicineName} from this prescription?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await doctorApi.deleteSupplement(bookingId, supp._id!);
            await fetchBooking();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Could not remove formulation.');
          }
        },
      },
    ]);
  };

  const handlePublishPrescription = async () => {
    if (!bookingId) return;
    Alert.alert(
      'Publish Prescription',
      'This will publish the prescription, notify the patient, and prepare their Ayurvedic pharmacy cart. Confirm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish Now',
          onPress: async () => {
            setPublishing(true);
            try {
              if (diagnosis.trim()) {
                await doctorApi.updateDiagnosis(bookingId, diagnosis.trim());
              }
              await doctorApi.publishPrescription(bookingId);
              Alert.alert(
                'Prescription Published',
                'Prescription has been sent to the patient.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (err: any) {
              Alert.alert(
                'Error',
                err?.response?.data?.message || 'Failed to publish prescription.'
              );
            } finally {
              setPublishing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading Prescription Room...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const patientName =
    typeof booking?.patientId === 'object' && booking?.patientId !== null
      ? `${booking.patientId.firstName} ${booking.patientId.lastName || ''}`.trim()
      : booking?.patientName || 'Patient';

  const supplements = booking?.recommendedSupplements || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.oliveDeep} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ayurvedic Prescription</Text>
          <Text style={styles.headerSubtitle}>
            {patientName} • {booking?.date}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Patient Chief Complaints */}
        {booking?.symptoms && (
          <View style={styles.complaintsCard}>
            <Text style={styles.complaintsTitle}>Patient's Reported Symptoms:</Text>
            <Text style={styles.complaintsText}>{booking.symptoms}</Text>
          </View>
        )}

        {/* Clinical Diagnosis Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ayurvedic Clinical Diagnosis & Roganidana</Text>
          <TextInput
            style={styles.diagnosisInput}
            value={diagnosis}
            onChangeText={setDiagnosis}
            placeholder="e.g. Vataja Grahani / Pitta-kapha Jvara / Stress-induced insomnia..."
            placeholderTextColor={Colors.inkMuted}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={styles.saveDiagnosisBtn}
            onPress={handleSaveDiagnosis}
            disabled={savingDiagnosis}
            activeOpacity={0.8}
          >
            {savingDiagnosis ? (
              <ActivityIndicator size="small" color={Colors.oliveDeep} />
            ) : (
              <Text style={styles.saveDiagnosisText}>Save Diagnosis</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Current Prescriptions List */}
        <View style={styles.sectionCard}>
          <View style={styles.supplementsHeader}>
            <Text style={styles.sectionTitle}>
              Prescribed Formulations ({supplements.length})
            </Text>
          </View>

          {supplements.length === 0 ? (
            <View style={styles.emptySupplements}>
              <Pill size={24} color={Colors.inkMuted} />
              <Text style={styles.emptySupplementsText}>
                No medicines added yet. Use the builder below to prescribe herbal formulations.
              </Text>
            </View>
          ) : (
            supplements.map((supp, idx) => (
              <View key={supp._id || idx} style={styles.suppItemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suppItemName}>{supp.medicineName}</Text>
                  <Text style={styles.suppItemDosage}>{supp.dosage}</Text>
                  {supp.instructions && (
                    <Text style={styles.suppItemInstructions}>{supp.instructions}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteSupplement(supp)}
                  style={styles.deleteSuppBtn}
                >
                  <Trash2 size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Add Formulation Builder */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Add Ayurvedic Formulation</Text>

          {/* Search Medicine Catalog */}
          <Text style={styles.label}>Search JeevanHub Pharmacy Catalog</Text>
          <View style={styles.searchBar}>
            <Search size={16} color={Colors.inkMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search Ashwagandha, Triphala, Dashamularishta..."
              placeholderTextColor={Colors.inkMuted}
            />
            {searching && <ActivityIndicator size="small" color={Colors.olive} />}
          </View>

          {/* Search Suggestions Dropdown */}
          {searchResults.length > 0 && (
            <View style={styles.suggestionsBox}>
              {searchResults.slice(0, 5).map((med) => (
                <TouchableOpacity
                  key={med._id}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSelectedMedicine(med);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <View>
                    <Text style={styles.suggestionName}>{med.name}</Text>
                    <Text style={styles.suggestionCategory}>
                      {med.category || 'Ayurvedic Supplement'} • ₹{med.price || 200}
                    </Text>
                  </View>
                  <Plus size={16} color={Colors.oliveDeep} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Selected Medicine Chip */}
          {selectedMedicine ? (
            <View style={styles.selectedMedChip}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedMedName}>✓ {selectedMedicine.name}</Text>
                <Text style={styles.selectedMedSub}>From JeevanHub Pharmacy Catalog</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedMedicine(null)}>
                <X size={18} color={Colors.oliveDeep} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Or Enter Custom Formulation Name</Text>
              <TextInput
                style={styles.textInput}
                value={customMedName}
                onChangeText={setCustomMedName}
                placeholder="e.g. Mahasudarshan Churna"
                placeholderTextColor={Colors.inkMuted}
              />
            </View>
          )}

          {/* Dosage & Frequency */}
          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Dosage</Text>
              <TextInput
                style={styles.textInput}
                value={dosage}
                onChangeText={setDosage}
                placeholder="1 tablet / 5g / 10ml"
                placeholderTextColor={Colors.inkMuted}
              />
            </View>
          </View>

          {/* Frequency Chips */}
          <Text style={styles.label}>Frequency</Text>
          <View style={styles.chipsRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, frequency === f && styles.chipActive]}
                onPress={() => setFrequency(f)}
              >
                <Text style={[styles.chipText, frequency === f && styles.chipTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ayurvedic Timing / Kala */}
          <Text style={styles.label}>Ayurvedic Intake Timing (Kala)</Text>
          <View style={styles.optionsWrap}>
            {TIMING_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pillOption, timing === t && styles.pillOptionActive]}
                onPress={() => setTiming(t)}
              >
                <Text
                  style={[styles.pillOptionText, timing === t && styles.pillOptionTextActive]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Vehicle / Anupana */}
          <Text style={styles.label}>Vehicle (Anupana)</Text>
          <View style={styles.optionsWrap}>
            {ANUPANA_OPTIONS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.pillOption, anupana === a && styles.pillOptionActive]}
                onPress={() => setAnupana(a)}
              >
                <Text
                  style={[styles.pillOptionText, anupana === a && styles.pillOptionTextActive]}
                >
                  {a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Duration Chips */}
          <Text style={styles.label}>Duration</Text>
          <View style={styles.chipsRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, duration === d && styles.chipActive]}
                onPress={() => setDuration(d)}
              >
                <Text style={[styles.chipText, duration === d && styles.chipTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dietary Advice / Pathya */}
          <Text style={styles.label}>Dietary Guidelines (Pathya / Apathya)</Text>
          <TextInput
            style={styles.textInput}
            value={specialAdvice}
            onChangeText={setSpecialAdvice}
            placeholder="e.g. Avoid cold drinks, curd at night, deep-fried items..."
            placeholderTextColor={Colors.inkMuted}
          />

          {/* Add Medicine Button */}
          <TouchableOpacity
            style={[styles.addSuppBtn, addingSupplement && styles.btnDisabled]}
            onPress={handleAddSupplement}
            disabled={addingSupplement}
            activeOpacity={0.8}
          >
            {addingSupplement ? (
              <ActivityIndicator size="small" color={Colors.cream} />
            ) : (
              <>
                <Plus size={16} color={Colors.cream} />
                <Text style={styles.addSuppBtnText}>Add Formulation to Prescription</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Publish Prescription Action */}
        <TouchableOpacity
          style={[styles.publishBtn, publishing && styles.btnDisabled]}
          onPress={handlePublishPrescription}
          disabled={publishing}
          activeOpacity={0.8}
        >
          {publishing ? (
            <ActivityIndicator size="small" color={Colors.cream} />
          ) : (
            <>
              <Send size={18} color={Colors.cream} />
              <Text style={styles.publishBtnText}>Publish Prescription & Send to Patient</Text>
            </>
          )}
        </TouchableOpacity>
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
  complaintsCard: {
    backgroundColor: '#fff8e6',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.turmericGold,
  },
  complaintsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.turmericGold,
    marginBottom: 2,
  },
  complaintsText: {
    fontSize: 13,
    color: Colors.inkStrong,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 10,
  },
  diagnosisInput: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: Colors.inkStrong,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  saveDiagnosisBtn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.sagePale,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveDiagnosisText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  supplementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptySupplements: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  emptySupplementsText: {
    fontSize: 12,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  suppItemCard: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  suppItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  suppItemDosage: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.oliveDeep,
    marginTop: 2,
  },
  suppItemInstructions: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 4,
    lineHeight: 15,
  },
  deleteSuppBtn: {
    padding: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginTop: 12,
    marginBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  suggestionsBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  suggestionCategory: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  selectedMedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sagePale,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedMedName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  selectedMedSub: {
    fontSize: 10,
    color: Colors.inkMuted,
  },
  textInput: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.inkStrong,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  chipTextActive: {
    color: Colors.cream,
  },
  optionsWrap: {
    gap: 6,
  },
  pillOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillOptionActive: {
    backgroundColor: Colors.sagePale,
    borderColor: Colors.oliveAction,
  },
  pillOptionText: {
    fontSize: 12,
    color: Colors.inkStrong,
    fontWeight: '600',
  },
  pillOptionTextActive: {
    color: Colors.oliveDeep,
    fontWeight: '800',
  },
  addSuppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.oliveAction,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 18,
  },
  addSuppBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.cream,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.oliveDeep,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 6,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  publishBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.cream,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
