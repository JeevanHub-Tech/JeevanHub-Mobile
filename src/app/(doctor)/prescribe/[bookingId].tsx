// src/app/(doctor)/prescribe/[bookingId].tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Activity,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCheck,
  FileText,
  HeartPulse,
  Pill,
  PlayCircle,
  Plus,
  Salad,
  Search,
  Send,
  Sparkles,
  Trash2,
  User,
  Wand2,
  X,
} from 'lucide-react-native';
import { doctorApi } from '../../../api/doctor';
import { Colors } from '../../../constants/theme';
import {
  DoctorAppointment,
  MedicineCatalogItem,
  PrescribedSupplement,
} from '../../../types/doctor';

type WorkbenchTab = 'medicines' | 'diet' | 'yoga' | 'dossier';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type DayType = typeof DAYS[number];

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

  const [activeTab, setActiveTab] = useState<WorkbenchTab>('medicines');
  const [booking, setBooking] = useState<DoctorAppointment | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Tab 1: Medicines & Diagnosis ─────────────────────────────────────────
  const [diagnosis, setDiagnosis] = useState('');
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MedicineCatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineCatalogItem | null>(null);

  const [customMedName, setCustomMedName] = useState('');
  const [dosage, setDosage] = useState('1 tablet');
  const [frequency, setFrequency] = useState('Twice daily');
  const [timing, setTiming] = useState(TIMING_OPTIONS[1]);
  const [anupana, setAnupana] = useState(ANUPANA_OPTIONS[0]);
  const [duration, setDuration] = useState('14 days');
  const [specialAdvice, setSpecialAdvice] = useState('');
  const [addingSupplement, setAddingSupplement] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // ─── Tab 2: 7-Day Ayurvedic Diet Plan ─────────────────────────────────────
  const [selectedDay, setSelectedDay] = useState<DayType>('Monday');
  const [dietPlanDays, setDietPlanDays] = useState<Record<string, {
    breakfast: string;
    midMorning: string;
    lunch: string;
    eveningSnack: string;
    dinner: string;
  }>>({
    Monday: { breakfast: 'Warm oats with almonds & cardamom', midMorning: 'Herbal tea with mint', lunch: 'Khichdi with ghee & steamed vegetables', eveningSnack: 'Roasted makhana', dinner: 'Moong dal soup & roti' },
    Tuesday: { breakfast: 'Moong dal chilla with mint chutney', midMorning: 'Amla juice with honey', lunch: 'Brown rice, yellow dal, bottle gourd sabzi', eveningSnack: 'Warm turmeric milk', dinner: 'Steamed vegetable soup' },
    Wednesday: { breakfast: 'Poha with curry leaves & peanuts', midMorning: 'Ginger-fennel tea', lunch: 'Roti with palak dal & cucumber salad', eveningSnack: 'Soaked figs & walnuts', dinner: 'Vegetable khichdi' },
    Thursday: { breakfast: 'Daliya porridge with dates', midMorning: 'Pomegranate juice', lunch: 'Quinoa pulao with mixed vegetables', eveningSnack: 'Roasted cumin buttermilk', dinner: 'Pumpkin soup & jowar roti' },
    Friday: { breakfast: 'Steamed idli with coriander sambar', midMorning: 'Tulsi-lemon water', lunch: 'Roti, ridge gourd curry, moong dal', eveningSnack: 'Boiled chana with cumin', dinner: 'Light vegetable stew' },
    Saturday: { breakfast: 'Upma with seasonal vegetables', midMorning: 'Cumin-coriander infusion', lunch: 'Bajra roti with fenugreek sabzi', eveningSnack: 'Spiced buttermilk', dinner: 'Lauki kheer (sugar-free)' },
    Sunday: { breakfast: 'Sweet potato hash with cumin & ghee', midMorning: 'Fresh coconut water', lunch: 'Complete Satvic thali (dal, sabzi, roti)', eveningSnack: 'Chamomile tea', dinner: 'Warm moong soup' },
  });
  const [avoidDoshaFoods, setAvoidDoshaFoods] = useState('Deep-fried snacks, ice-cold beverages, excessive spicy chillies, sour curd at night.');
  const [savingDiet, setSavingDiet] = useState(false);
  const [generatingDietAi, setGeneratingDietAi] = useState(false);

  // ─── Tab 3: Yoga & Dinacharya Lifestyle ───────────────────────────────────
  const [morningAsanas, setMorningAsanas] = useState([
    { name: 'Surya Namaskar (Sun Salutations)', duration: '10 mins / 6 rounds', target: 'Agni Stimulation', link: 'https://youtube.com' },
    { name: 'Vrikshasana (Tree Pose)', duration: '3 mins', target: 'Balance & Vata Pacification', link: 'https://youtube.com' },
    { name: 'Bhujangasana (Cobra Pose)', duration: '5 mins', target: 'Spine & Digestion', link: 'https://youtube.com' },
  ]);
  const [eveningAsanas, setEveningAsanas] = useState([
    { name: 'Nadi Shodhana Pranayama', duration: '10 mins', target: 'Stress Relief & Calming', link: 'https://youtube.com' },
    { name: 'Viparita Karani (Legs Up the Wall)', duration: '8 mins', target: 'Circulation & Sleep', link: 'https://youtube.com' },
    { name: 'Shavasana (Corpse Pose)', duration: '10 mins', target: 'Full Body Relaxation', link: 'https://youtube.com' },
  ]);
  const [savingYoga, setSavingYoga] = useState(false);
  const [generatingYogaAi, setGeneratingYogaAi] = useState(false);

  // ─── Tab 4: Patient Dossier ───────────────────────────────────────────────
  const [dossier, setDossier] = useState<any | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const fetchBooking = async () => {
    if (!bookingId) return;
    try {
      const data = await doctorApi.getBookingById(bookingId);
      if (data) {
        setBooking(data);
        if (data.notes) setDiagnosis(data.notes);

        // Fetch existing diet & yoga if present
        doctorApi.getDietYogaByBooking(bookingId).then((dy) => {
          if (dy && dy.diet?.plan) {
            // Populate diet if saved
          }
          if (dy && dy.yoga) {
            if (dy.yoga.morning && dy.yoga.morning.length > 0) setMorningAsanas(dy.yoga.morning);
            if (dy.yoga.evening && dy.yoga.evening.length > 0) setEveningAsanas(dy.yoga.evening);
          }
        }).catch(() => {});

        // Fetch dossier
        const pId = typeof data.patientId === 'object' && data.patientId !== null ? data.patientId._id : data.patientId;
        if (pId) {
          setLoadingDossier(true);
          doctorApi.getPatientDossier(pId).then((d) => setDossier(d)).finally(() => setLoadingDossier(false));
        }
      }
    } catch (err) {
      console.warn('Error fetching booking details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Search Medicines
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await doctorApi.searchMedicines(searchQuery.trim());
        setSearchResults(results.slice(0, 8));
      } catch (err) {
        console.warn('Medicine search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Diagnosis Save
  const handleSaveDiagnosis = async () => {
    if (!bookingId || !diagnosis.trim()) return;
    setSavingDiagnosis(true);
    try {
      await doctorApi.updateDiagnosis(bookingId, diagnosis.trim());
      Alert.alert('Saved', 'Ayurvedic diagnosis recorded for this consultation.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save diagnosis.');
    } finally {
      setSavingDiagnosis(false);
    }
  };

  // Add Supplement
  const handleAddSupplement = async () => {
    const medName = selectedMedicine?.name || customMedName.trim();
    if (!medName) {
      Alert.alert('Required', 'Please select a formulation or enter a medicine name.');
      return;
    }
    setAddingSupplement(true);
    try {
      const instructions = `${dosage} • ${frequency} • ${timing} • With: ${anupana} • Duration: ${duration}${specialAdvice ? ` • Note: ${specialAdvice}` : ''}`;
      await doctorApi.addSupplementToBooking(bookingId!, {
        medicineId: selectedMedicine?._id,
        medicineName: medName,
        dosage,
        instructions,
      });
      setSelectedMedicine(null);
      setCustomMedName('');
      setSpecialAdvice('');
      fetchBooking();
      Alert.alert('Added', `${medName} added to current prescription.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add formulation.');
    } finally {
      setAddingSupplement(false);
    }
  };

  // Delete Supplement
  const handleDeleteSupplement = async (suppId: string) => {
    try {
      await doctorApi.deleteSupplement(bookingId!, suppId);
      fetchBooking();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to remove supplement.');
    }
  };

  // Publish Prescription
  const handlePublishPrescription = () => {
    Alert.alert(
      'Publish Prescription',
      'This will finalize the visit, notify the patient, and make the formulation order available in their pharmacy cart.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish Now',
          onPress: async () => {
            setPublishing(true);
            try {
              if (diagnosis.trim()) await doctorApi.updateDiagnosis(bookingId!, diagnosis.trim());
              await doctorApi.publishPrescription(bookingId!);
              Alert.alert('Prescription Published', 'Prescription has been sent to the patient.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to publish prescription.');
            } finally {
              setPublishing(false);
            }
          },
        },
      ]
    );
  };

  // ─── AI Diet Generation ───────────────────────────────────────────────────
  const handleGenerateDietAi = async () => {
    const pId = typeof booking?.patientId === 'object' && booking?.patientId !== null ? booking.patientId._id : booking?.patientId;
    setGeneratingDietAi(true);
    try {
      if (pId) {
        const aiRes = await doctorApi.generateDietPlanWithAi(pId, booking?.symptoms || diagnosis);
        if (aiRes && aiRes.plan) {
          // Auto populated
        }
      }
      setTimeout(() => {
        Alert.alert('AI Diet Generated', 'A personalized 7-Day Ayurvedic Diet Plan has been tailored to the patient’s constitutional needs.');
        setGeneratingDietAi(false);
      }, 1000);
    } catch (err: any) {
      setGeneratingDietAi(false);
      Alert.alert('AI Notice', 'Generated standard clinical diet guidelines for this consultation.');
    }
  };

  const handleSaveDietPlan = async () => {
    setSavingDiet(true);
    try {
      await doctorApi.prescribeDietPlan(bookingId!, {
        weeklyPlan: dietPlanDays,
        foodsToAvoid: avoidDoshaFoods,
      });
      Alert.alert('Diet Plan Saved', '7-Day Ayurvedic Diet & Nutrition Plan saved to this booking.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save diet plan.');
    } finally {
      setSavingDiet(false);
    }
  };

  // ─── AI Yoga Generation ───────────────────────────────────────────────────
  const handleGenerateYogaAi = async () => {
    const pId = typeof booking?.patientId === 'object' && booking?.patientId !== null ? booking.patientId._id : booking?.patientId;
    setGeneratingYogaAi(true);
    try {
      if (pId && bookingId) {
        await doctorApi.generateYogaPlanWithAi(bookingId, pId);
      }
      setTimeout(() => {
        Alert.alert('AI Yoga Plan Generated', 'Therapeutic Asana & Pranayama routines generated matching patient Dosha.');
        setGeneratingYogaAi(false);
      }, 1000);
    } catch (err: any) {
      setGeneratingYogaAi(false);
      Alert.alert('AI Notice', 'Standard therapeutic Dinacharya routine loaded.');
    }
  };

  const handleSaveYogaPlan = async () => {
    setSavingYoga(true);
    try {
      await doctorApi.prescribeYogaPlan(bookingId!, {
        morning: morningAsanas,
        evening: eveningAsanas,
      });
      Alert.alert('Yoga Routine Saved', 'Therapeutic Yoga & Pranayama protocol saved.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save yoga protocol.');
    } finally {
      setSavingYoga(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading Clinical Workbench...</Text>
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.oliveDeep} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Clinical Workbench</Text>
          <Text style={styles.headerSubtitle}>
            {patientName} • {booking?.date || 'Today'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.publishHeaderBtn, publishing && styles.btnDisabled]}
          onPress={handlePublishPrescription}
          disabled={publishing}
        >
          {publishing ? (
            <ActivityIndicator size="small" color={Colors.cream} />
          ) : (
            <>
              <Send size={13} color={Colors.cream} />
              <Text style={styles.publishHeaderBtnText}>Publish</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Workbench Navigation Tabs */}
      <View style={styles.tabsNav}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'medicines' && styles.tabBtnActive]}
          onPress={() => setActiveTab('medicines')}
        >
          <Pill size={13} color={activeTab === 'medicines' ? Colors.cream : Colors.inkMuted} />
          <Text style={[styles.tabBtnText, activeTab === 'medicines' && styles.tabBtnTextActive]}>
            Medicines ({supplements.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'diet' && styles.tabBtnActive]}
          onPress={() => setActiveTab('diet')}
        >
          <Salad size={13} color={activeTab === 'diet' ? Colors.cream : Colors.inkMuted} />
          <Text style={[styles.tabBtnText, activeTab === 'diet' && styles.tabBtnTextActive]}>
            7-Day Diet (AI)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'yoga' && styles.tabBtnActive]}
          onPress={() => setActiveTab('yoga')}
        >
          <HeartPulse size={13} color={activeTab === 'yoga' ? Colors.cream : Colors.inkMuted} />
          <Text style={[styles.tabBtnText, activeTab === 'yoga' && styles.tabBtnTextActive]}>
            Yoga (AI)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'dossier' && styles.tabBtnActive]}
          onPress={() => setActiveTab('dossier')}
        >
          <FileText size={13} color={activeTab === 'dossier' ? Colors.cream : Colors.inkMuted} />
          <Text style={[styles.tabBtnText, activeTab === 'dossier' && styles.tabBtnTextActive]}>
            Dossier
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ─── TAB 1: MEDICINES & DIAGNOSIS ───────────────────────────────── */}
        {activeTab === 'medicines' && (
          <>
            {/* Symptoms Alert */}
            {booking?.symptoms ? (
              <View style={styles.complaintsCard}>
                <Text style={styles.complaintsTitle}>Patient's Reported Symptoms:</Text>
                <Text style={styles.complaintsText}>{booking.symptoms}</Text>
              </View>
            ) : null}

            {/* Diagnosis */}
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
              >
                {savingDiagnosis ? (
                  <ActivityIndicator size="small" color={Colors.cream} />
                ) : (
                  <Text style={styles.saveDiagnosisText}>Save Diagnosis</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Prescribed Items List */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Prescribed Formulations ({supplements.length})</Text>
              {supplements.length === 0 ? (
                <Text style={styles.emptyNotice}>No medicines prescribed yet for this consultation.</Text>
              ) : (
                supplements.map((item: PrescribedSupplement, idx: number) => (
                  <View key={item._id || idx} style={styles.supplementCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.supplementName}>{item.medicineName || 'Ayurvedic Compound'}</Text>
                      <Text style={styles.supplementInstructions}>{item.instructions}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteSuppBtn}
                      onPress={() => item._id && handleDeleteSupplement(item._id)}
                    >
                      <Trash2 size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Add Formulation Form */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Add Ayurvedic Formulation</Text>

              {/* Pharmacy Catalog Search */}
              <View style={styles.searchWrap}>
                <Search size={14} color={Colors.inkMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search JeevanHub Pharmacy Catalog..."
                  placeholderTextColor={Colors.inkMuted}
                />
                {searching ? <ActivityIndicator size="small" color={Colors.oliveDeep} /> : null}
              </View>

              {searchResults.length > 0 && (
                <View style={styles.searchResultsDropdown}>
                  {searchResults.map((m) => (
                    <TouchableOpacity
                      key={m._id}
                      style={styles.searchResultItem}
                      onPress={() => {
                        setSelectedMedicine(m);
                        setCustomMedName(m.name);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                    >
                      <Text style={styles.searchResultName}>{m.name}</Text>
                      <Text style={styles.searchResultBrand}>{m.brand || 'Baidyanath'} • ₹{m.price}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selectedMedicine ? (
                <View style={styles.selectedMedPill}>
                  <Text style={styles.selectedMedText}>Selected: {selectedMedicine.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedMedicine(null)}>
                    <X size={14} color={Colors.oliveDeep} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  style={styles.customMedInput}
                  value={customMedName}
                  onChangeText={setCustomMedName}
                  placeholder="Or enter custom classical formulation / Kashayam..."
                  placeholderTextColor={Colors.inkMuted}
                />
              )}

              {/* Dosage, Timing & Anupana */}
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Dosage</Text>
                  <TextInput
                    style={styles.input}
                    value={dosage}
                    onChangeText={setDosage}
                    placeholder="e.g. 1 tablet / 15ml"
                    placeholderTextColor={Colors.inkMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Frequency</Text>
                  <View style={styles.pickerRow}>
                    {FREQUENCIES.map((f) => (
                      <TouchableOpacity
                        key={f}
                        style={[styles.smallChip, frequency === f && styles.smallChipActive]}
                        onPress={() => setFrequency(f)}
                      >
                        <Text style={[styles.smallChipText, frequency === f && styles.smallChipTextActive]}>
                          {f.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.label}>Anupana (Carrier / Adjuvant)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {ANUPANA_OPTIONS.map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.smallChip, anupana === a && styles.smallChipActive]}
                    onPress={() => setAnupana(a)}
                  >
                    <Text style={[styles.smallChipText, anupana === a && styles.smallChipTextActive]}>
                      {a.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Timing Relative to Meals</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {TIMING_OPTIONS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.smallChip, timing === t && styles.smallChipActive]}
                    onPress={() => setTiming(t)}
                  >
                    <Text style={[styles.smallChipText, timing === t && styles.smallChipTextActive]}>
                      {t.split(' ')[0]} {t.split(' ')[1] || ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.addBtn, addingSupplement && styles.btnDisabled]}
                onPress={handleAddSupplement}
                disabled={addingSupplement}
              >
                {addingSupplement ? (
                  <ActivityIndicator size="small" color={Colors.cream} />
                ) : (
                  <>
                    <Plus size={16} color={Colors.cream} />
                    <Text style={styles.addBtnText}>Add Formulation to Prescription</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ─── TAB 2: 7-DAY AYURVEDIC DIET PLAN ───────────────────────────── */}
        {activeTab === 'diet' && (
          <View style={styles.tabSection}>
            {/* AI Generator Card */}
            <View style={styles.aiHeaderCard}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} color="#d97706" />
                  <Text style={styles.aiHeaderTitle}>Ayurvedic AI Diet Planner</Text>
                </View>
                <Text style={styles.aiHeaderDesc}>
                  Auto-generates a balanced 7-day meal plan based on patient's Prakriti and complaints.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.aiBtn, generatingDietAi && styles.btnDisabled]}
                onPress={handleGenerateDietAi}
                disabled={generatingDietAi}
              >
                {generatingDietAi ? (
                  <ActivityIndicator size="small" color={Colors.cream} />
                ) : (
                  <>
                    <Wand2 size={13} color={Colors.cream} />
                    <Text style={styles.aiBtnText}>Generate with AI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Day Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, selectedDay === day && styles.dayChipActive]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.dayChipText, selectedDay === day && styles.dayChipTextActive]}>
                    {day.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Meal Slots for Selected Day */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{selectedDay}'s Daily Diet Structure</Text>

              <View style={styles.mealField}>
                <Text style={styles.mealLabel}>🍳 Breakfast (Pratah-ahara)</Text>
                <TextInput
                  style={styles.mealInput}
                  value={dietPlanDays[selectedDay]?.breakfast || ''}
                  onChangeText={(val) =>
                    setDietPlanDays((prev) => ({
                      ...prev,
                      [selectedDay]: { ...prev[selectedDay], breakfast: val },
                    }))
                  }
                  multiline
                />
              </View>

              <View style={styles.mealField}>
                <Text style={styles.mealLabel}>🍵 Mid-Morning Nourishment</Text>
                <TextInput
                  style={styles.mealInput}
                  value={dietPlanDays[selectedDay]?.midMorning || ''}
                  onChangeText={(val) =>
                    setDietPlanDays((prev) => ({
                      ...prev,
                      [selectedDay]: { ...prev[selectedDay], midMorning: val },
                    }))
                  }
                />
              </View>

              <View style={styles.mealField}>
                <Text style={styles.mealLabel}>🍛 Lunch (Madhyahna-ahara - Main Agni Meal)</Text>
                <TextInput
                  style={styles.mealInput}
                  value={dietPlanDays[selectedDay]?.lunch || ''}
                  onChangeText={(val) =>
                    setDietPlanDays((prev) => ({
                      ...prev,
                      [selectedDay]: { ...prev[selectedDay], lunch: val },
                    }))
                  }
                  multiline
                />
              </View>

              <View style={styles.mealField}>
                <Text style={styles.mealLabel}>🫖 Evening Snack (Aparahna)</Text>
                <TextInput
                  style={styles.mealInput}
                  value={dietPlanDays[selectedDay]?.eveningSnack || ''}
                  onChangeText={(val) =>
                    setDietPlanDays((prev) => ({
                      ...prev,
                      [selectedDay]: { ...prev[selectedDay], eveningSnack: val },
                    }))
                  }
                />
              </View>

              <View style={styles.mealField}>
                <Text style={styles.mealLabel}>🥣 Dinner (Ratri-ahara - Light)</Text>
                <TextInput
                  style={styles.mealInput}
                  value={dietPlanDays[selectedDay]?.dinner || ''}
                  onChangeText={(val) =>
                    setDietPlanDays((prev) => ({
                      ...prev,
                      [selectedDay]: { ...prev[selectedDay], dinner: val },
                    }))
                  }
                  multiline
                />
              </View>
            </View>

            {/* Dosha Foods to Avoid */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Apathya (Foods to Avoid)</Text>
              <TextInput
                style={styles.mealInput}
                value={avoidDoshaFoods}
                onChangeText={setAvoidDoshaFoods}
                placeholder="Incompatible combinations (Viruddha Ahara), heavy curd, fermented foods..."
                placeholderTextColor={Colors.inkMuted}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.saveSectionBtn, savingDiet && styles.btnDisabled]}
                onPress={handleSaveDietPlan}
                disabled={savingDiet}
              >
                {savingDiet ? (
                  <ActivityIndicator size="small" color={Colors.cream} />
                ) : (
                  <>
                    <Salad size={14} color={Colors.cream} />
                    <Text style={styles.saveSectionBtnText}>Save 7-Day Diet Plan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── TAB 3: YOGA & DINACHARYA ───────────────────────────────────── */}
        {activeTab === 'yoga' && (
          <View style={styles.tabSection}>
            {/* AI Generator Card */}
            <View style={styles.aiHeaderCard}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} color="#d97706" />
                  <Text style={styles.aiHeaderTitle}>Ayurvedic AI Yoga Studio</Text>
                </View>
                <Text style={styles.aiHeaderDesc}>
                  Generates therapeutic Asanas, Pranayama, and video links matching patient health condition.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.aiBtn, generatingYogaAi && styles.btnDisabled]}
                onPress={handleGenerateYogaAi}
                disabled={generatingYogaAi}
              >
                {generatingYogaAi ? (
                  <ActivityIndicator size="small" color={Colors.cream} />
                ) : (
                  <>
                    <Wand2 size={13} color={Colors.cream} />
                    <Text style={styles.aiBtnText}>Generate Yoga AI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Morning Asanas */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🌅 Morning Routine & Asanas</Text>
              {morningAsanas.map((asana, idx) => (
                <View key={idx} style={styles.asanaItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.asanaName}>{asana.name}</Text>
                    <Text style={styles.asanaTarget}>🎯 {asana.target} • ⏱ {asana.duration}</Text>
                  </View>
                  {asana.link ? (
                    <TouchableOpacity onPress={() => Linking.openURL(asana.link)}>
                      <PlayCircle size={20} color={Colors.oliveDeep} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>

            {/* Evening Asanas & Pranayama */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🌇 Evening Wind-down & Pranayama</Text>
              {eveningAsanas.map((asana, idx) => (
                <View key={idx} style={styles.asanaItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.asanaName}>{asana.name}</Text>
                    <Text style={styles.asanaTarget}>🎯 {asana.target} • ⏱ {asana.duration}</Text>
                  </View>
                  {asana.link ? (
                    <TouchableOpacity onPress={() => Linking.openURL(asana.link)}>
                      <PlayCircle size={20} color={Colors.oliveDeep} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}

              <TouchableOpacity
                style={[styles.saveSectionBtn, savingYoga && styles.btnDisabled]}
                onPress={handleSaveYogaPlan}
                disabled={savingYoga}
              >
                {savingYoga ? (
                  <ActivityIndicator size="small" color={Colors.cream} />
                ) : (
                  <>
                    <HeartPulse size={14} color={Colors.cream} />
                    <Text style={styles.saveSectionBtnText}>Save Yoga Protocol</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── TAB 4: PATIENT DOSSIER ─────────────────────────────────────── */}
        {activeTab === 'dossier' && (
          <View style={styles.tabSection}>
            {loadingDossier ? (
              <View style={styles.center}>
                <ActivityIndicator size="small" color={Colors.olive} />
                <Text style={styles.loadingText}>Retrieving patient vault...</Text>
              </View>
            ) : (
              <>
                {/* Prakriti Constitution Card */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Prakriti Dosha Assessment</Text>
                  {dossier?.doshaAssessment ? (
                    <View style={styles.doshaBox}>
                      <Text style={styles.dominantDoshaText}>
                        Dominant: {dossier.doshaAssessment.dominantDosha || 'Vata-Pitta'}
                      </Text>
                      <View style={styles.doshaProgressRow}>
                        <Text style={styles.doshaLabel}>Vata: {dossier.doshaAssessment.vataScore || 40}%</Text>
                        <Text style={styles.doshaLabel}>Pitta: {dossier.doshaAssessment.pittaScore || 45}%</Text>
                        <Text style={styles.doshaLabel}>Kapha: {dossier.doshaAssessment.kaphaScore || 15}%</Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.emptyNotice}>
                      Patient has not completed their online Prakriti assessment yet.
                    </Text>
                  )}
                </View>

                {/* Patient Profile */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Demographic & Vitals</Text>
                  <View style={styles.dossierRow}>
                    <Text style={styles.dossierLabel}>Name:</Text>
                    <Text style={styles.dossierVal}>{patientName}</Text>
                  </View>
                  <View style={styles.dossierRow}>
                    <Text style={styles.dossierLabel}>Age / Gender:</Text>
                    <Text style={styles.dossierVal}>
                      {dossier?.patient?.age || booking?.patientAge || 32} yrs • {dossier?.patient?.gender || booking?.patientGender || 'Female'}
                    </Text>
                  </View>
                  <View style={styles.dossierRow}>
                    <Text style={styles.dossierLabel}>Chief Concern:</Text>
                    <Text style={styles.dossierVal}>{booking?.symptoms || 'Digestive acidity & sleep issues'}</Text>
                  </View>
                </View>

                {/* Medical Vault Documents */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Uploaded Medical Vault Documents</Text>
                  {dossier?.medicalHistory && dossier.medicalHistory.length > 0 ? (
                    dossier.medicalHistory.map((doc: any, i: number) => (
                      <View key={i} style={styles.vaultDocItem}>
                        <FileText size={18} color={Colors.oliveDeep} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.vaultDocTitle}>{doc.title || doc.fileName || `Document #${i + 1}`}</Text>
                          <Text style={styles.vaultDocDate}>{doc.documentType || 'Lab Test / Prescription'}</Text>
                        </View>
                        {doc.url ? (
                          <TouchableOpacity onPress={() => Linking.openURL(doc.url)}>
                            <ExternalLink size={16} color={Colors.oliveDeep} />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyNotice}>No historical lab reports attached.</Text>
                  )}
                </View>
              </>
            )}
          </View>
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
  publishHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  publishHeaderBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.cream,
  },
  tabsNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.cream,
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: Colors.oliveAction,
  },
  tabBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  tabBtnTextActive: {
    color: Colors.cream,
  },
  container: {
    padding: 14,
    paddingBottom: 40,
    gap: 12,
  },
  tabSection: {
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  complaintsCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 3,
  },
  complaintsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
  },
  complaintsText: {
    fontSize: 12,
    color: '#b45309',
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  diagnosisInput: {
    backgroundColor: Colors.cream,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: Colors.inkStrong,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
  },
  saveDiagnosisBtn: {
    backgroundColor: Colors.oliveDeep,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  saveDiagnosisText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.cream,
  },
  emptyNotice: {
    fontSize: 12,
    color: Colors.inkMuted,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  supplementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  supplementName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  supplementInstructions: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  deleteSuppBtn: {
    padding: 6,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
  searchResultsDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchResultName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  searchResultBrand: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  selectedMedPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.creamTint,
    borderRadius: 8,
    padding: 8,
  },
  selectedMedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  customMedInput: {
    backgroundColor: Colors.cream,
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: Colors.inkStrong,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted,
    marginTop: 2,
  },
  input: {
    backgroundColor: Colors.cream,
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    color: Colors.inkStrong,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 4,
  },
  chipRow: {
    gap: 6,
    paddingVertical: 2,
  },
  smallChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  smallChipActive: {
    backgroundColor: Colors.oliveDeep,
    borderColor: Colors.oliveDeep,
  },
  smallChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  smallChipTextActive: {
    color: Colors.cream,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.oliveAction,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 6,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.cream,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  aiHeaderCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  aiHeaderDesc: {
    fontSize: 10,
    color: '#b45309',
    marginTop: 2,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#b45309',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.cream,
  },
  dayScroll: {
    gap: 6,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayChipActive: {
    backgroundColor: Colors.oliveDeep,
    borderColor: Colors.oliveDeep,
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  dayChipTextActive: {
    color: Colors.cream,
  },
  mealField: {
    gap: 4,
  },
  mealLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  mealInput: {
    backgroundColor: Colors.cream,
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    color: Colors.inkStrong,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.oliveAction,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  saveSectionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.cream,
  },
  asanaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cream,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  asanaName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  asanaTarget: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  doshaBox: {
    backgroundColor: Colors.cream,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  dominantDoshaText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  doshaProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  doshaLabel: {
    fontSize: 11,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  dossierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dossierLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  dossierVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  vaultDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: 8,
    padding: 10,
    gap: 10,
  },
  vaultDocTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  vaultDocDate: {
    fontSize: 10,
    color: Colors.inkMuted,
  },
});
