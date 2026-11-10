// src/app/(patient)/prescription-wellness/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardEdit,
  HeartPulse,
  Languages,
  Leaf,
  Pill,
  RefreshCw,
  Salad,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import { DietPlanRequestModal } from '../../../components/wellness/DietPlanRequestModal';
import { OtherWellnessSection } from '../../../components/wellness/OtherWellnessSection';
import { PrescribedMedicinesTab } from '../../../components/wellness/PrescribedMedicinesTab';
import { WeeklyMealPlannerTab } from '../../../components/wellness/WeeklyMealPlannerTab';
import { YogaLifestyleSection } from '../../../components/wellness/YogaLifestyleSection';
import { Colors, Shadows } from '../../../constants/theme';
import { useAuthStore } from '../../../store/authStore';
import type {
  Appointment,
  AyurvedaDietPlanResponse,
  AyurvedaYogaPlanResponse,
  BackendDoshaAssessment,
  MedicineAvailabilityItem,
  WellnessProfile,
} from '../../../types/patient';
import {
  computeBmi,
  isWellnessProfileFilled,
} from '../../../utils/wellnessHelpers';

type PwTab = 'medicines' | 'diet' | 'yoga' | 'guidance';

const TAB_DEFS: Array<{ id: PwTab; label: string; Icon: typeof Pill }> = [
  { id: 'diet', label: 'Meal Plan', Icon: Salad },
  { id: 'medicines', label: 'Medicines', Icon: Pill },
  { id: 'yoga', label: 'Yoga & Lifestyle', Icon: HeartPulse },
  { id: 'guidance', label: 'Cooking & Avoid', Icon: Leaf },
];

export default function PrescriptionWellnessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user } = useAuthStore();

  const initialTab: PwTab =
    params.tab === 'medicines' ||
    params.tab === 'yoga' ||
    params.tab === 'guidance' ||
    params.tab === 'diet'
      ? params.tab
      : 'diet';

  const [activeTab, setActiveTab] = useState<PwTab>(initialTab);
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [profile, setProfile] = useState<WellnessProfile | null>(null);
  const [dosha, setDosha] = useState<BackendDoshaAssessment | null>(null);
  const [dietPlan, setDietPlan] = useState<AyurvedaDietPlanResponse | null>(null);
  const [yogaPlan, setYogaPlan] = useState<AyurvedaYogaPlanResponse | null>(null);

  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [bookingsFailed, setBookingsFailed] = useState(false);
  const [availability, setAvailability] = useState<
    Record<string, MedicineAvailabilityItem | null>
  >({});

  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const loadBookingsAndMedicines = useCallback(async () => {
    if (!user?.id) return;
    setBookingsFailed(false);
    try {
      const list = await patientApi.getPatientBookings(user.id);
      setBookings(list);

      const medIds = Array.from(
        new Set(
          list.flatMap((b) =>
            (b.recommendedSupplements || [])
              .map((s) => s.medicineId)
              .filter((id): id is string => Boolean(id))
          )
        )
      );

      if (medIds.length > 0) {
        const results = await Promise.allSettled(
          medIds.map((id) => patientApi.getMedicineById(id))
        );
        const map: Record<string, MedicineAvailabilityItem | null> = {};
        medIds.forEach((id, i) => {
          const r = results[i];
          map[id] = r.status === 'fulfilled' ? r.value : null;
        });
        setAvailability(map);
      }
    } catch {
      setBookingsFailed(true);
    }
  }, [user?.id]);

  const loadAll = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      try {
        const [prof, dAssess, dPlan, yPlan] = await Promise.all([
          patientApi.getWellnessProfile(),
          patientApi.getBackendDoshaAssessment(),
          patientApi.getDietPlan(lang),
          patientApi.getYogaPlan(lang),
        ]);
        setProfile(prof);
        setDosha(dAssess);
        setDietPlan(dPlan);
        setYogaPlan(yPlan);
        await loadBookingsAndMedicines();
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lang, loadBookingsAndMedicines]
  );

  useEffect(() => {
    loadAll(false);
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      // Refresh intake statuses when returning from quiz or profile form
      Promise.all([
        patientApi.getWellnessProfile(),
        patientApi.getBackendDoshaAssessment(),
      ]).then(([prof, dAssess]) => {
        setProfile(prof);
        setDosha(dAssess);
      });
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAll(true);
  };

  const profileFilled = useMemo(() => isWellnessProfileFilled(profile), [profile]);
  const doshaComplete = Boolean(dosha?.primaryDosha);
  const bmi = computeBmi(profile?.basicDetails?.heightCm, profile?.basicDetails?.weightKg);

  const isDoctorEditedPlan = Boolean(
    dietPlan?.doctorReview?.published ||
      dietPlan?.status === 'doctor_approved' ||
      dietPlan?.status === 'ai_modified'
  );

  const handleGenerate = async () => {
    const missing = [
      !doshaComplete && 'the Prakriti Dosha Assessment',
      !profileFilled && 'your Wellness Profile',
    ].filter(Boolean);

    if (missing.length > 0) {
      Alert.alert(
        'Prerequisites Needed',
        `Please complete ${missing.join(' and ')} before generating your personalized plan.`
      );
      return;
    }

    setGenerating(true);
    try {
      const res = await patientApi.generateBothAyurvedaPlans();
      await loadAll(true);
      if (!res.dietOk || !res.yogaOk) {
        Alert.alert(
          'Partial Generation',
          [res.dietError, res.yogaError].filter(Boolean).join('\n')
        );
      } else {
        Alert.alert(
          'Plans Ready',
          'Your personalized 7-day Ayurvedic meal plan and yoga routine have been generated!'
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Generation Failed',
        err?.message || 'Unable to generate plans right now. Please try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleDeletePlans = () => {
    Alert.alert(
      'Delete Current Plan?',
      'This removes your current AI diet and yoga plan so you can generate a fresh one.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setGenerating(true);
            try {
              await Promise.allSettled([
                patientApi.deleteDietPlan(),
                patientApi.deleteYogaPlan(),
              ]);
              setDietPlan(null);
              setYogaPlan(null);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not delete plans.');
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
  };

  const doshaSummary = dosha
    ? dosha.secondaryDosha
      ? `${dosha.primaryDosha} · ${dosha.secondaryDosha}`
      : dosha.primaryDosha
    : 'Not completed yet';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <ArrowLeft size={20} color={Colors.inkStrong} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Prescription & Wellness
        </Text>
        <TouchableOpacity
          style={styles.langToggle}
          onPress={() => setLang((prev) => (prev === 'en' ? 'hi' : 'en'))}
          activeOpacity={0.8}
        >
          <Languages size={14} color={Colors.oliveDeep} />
          <Text style={styles.langToggleText}>
            {lang === 'en' ? 'हिंदी' : 'EN'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.olive}
          />
        }
      >
        {/* Ayurvedic Intake & Plan Generator Card */}
        <View style={styles.intakeCard}>
          <View style={styles.intakeTilesRow}>
            {/* Prakriti Status */}
            <TouchableOpacity
              style={styles.intakeTile}
              activeOpacity={0.8}
              onPress={() => router.push('/(patient)/(tabs)/wellness')}
            >
              <View style={styles.tileTopRow}>
                <View
                  style={[
                    styles.tileIcon,
                    doshaComplete && styles.tileIconDone,
                  ]}
                >
                  {doshaComplete ? (
                    <CheckCircle2 size={17} color={Colors.success} />
                  ) : (
                    <Leaf size={17} color={Colors.inkMuted} />
                  )}
                </View>
                <Text style={styles.tileAction}>
                  {doshaComplete ? 'View Quiz' : 'Start Quiz'}
                </Text>
              </View>
              <Text style={styles.tileTitle}>Prakriti Dosha</Text>
              <Text
                style={[
                  styles.tileStatus,
                  doshaComplete && { color: Colors.oliveDeep },
                ]}
                numberOfLines={1}
              >
                {doshaSummary}
              </Text>
            </TouchableOpacity>

            {/* Wellness Profile Status */}
            <TouchableOpacity
              style={styles.intakeTile}
              activeOpacity={0.8}
              onPress={() =>
                router.push('/(patient)/prescription-wellness/profile-form' as any)
              }
            >
              <View style={styles.tileTopRow}>
                <View
                  style={[
                    styles.tileIcon,
                    profileFilled && styles.tileIconDone,
                  ]}
                >
                  {profileFilled ? (
                    <CheckCircle2 size={17} color={Colors.success} />
                  ) : (
                    <ClipboardEdit size={17} color={Colors.inkMuted} />
                  )}
                </View>
                <Text style={styles.tileAction}>
                  {profileFilled ? 'Edit' : 'Fill Now'}
                </Text>
              </View>
              <Text style={styles.tileTitle}>Wellness Profile</Text>
              <Text
                style={[
                  styles.tileStatus,
                  profileFilled && { color: Colors.oliveDeep },
                ]}
                numberOfLines={1}
              >
                {profileFilled
                  ? bmi
                    ? `Filled · BMI ${bmi}`
                    : 'Filled'
                  : 'Not filled yet'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Plan Generation / Staleness / Regenerate Row */}
          {dietPlan?.isStale ? (
            <View style={styles.staleBanner}>
              <AlertTriangle size={14} color={Colors.warning} />
              <Text style={styles.staleText}>
                Your profile or Prakriti changed — regenerate to update your plan.
              </Text>
            </View>
          ) : null}

          <View style={styles.planActionsRow}>
            {!dietPlan ? (
              <TouchableOpacity
                style={[styles.generateBtn, generating && { opacity: 0.65 }]}
                onPress={handleGenerate}
                disabled={generating}
                activeOpacity={0.85}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Sparkles size={16} color="#ffffff" />
                )}
                <Text style={styles.generateBtnText}>
                  {generating
                    ? 'Generating Diet & Yoga Plan...'
                    : 'Generate AI Diet & Yoga Plan'}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                {!isDoctorEditedPlan ? (
                  <TouchableOpacity
                    style={[styles.regenBtn, generating && { opacity: 0.65 }]}
                    onPress={handleGenerate}
                    disabled={generating}
                    activeOpacity={0.85}
                  >
                    {generating ? (
                      <ActivityIndicator size="small" color={Colors.oliveDeep} />
                    ) : (
                      <RefreshCw size={14} color={Colors.oliveDeep} />
                    )}
                    <Text style={styles.regenBtnText}>
                      {generating ? 'Regenerating...' : 'Regenerate Plan'}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleDeletePlans}
                  disabled={generating}
                  activeOpacity={0.85}
                >
                  <Trash2 size={14} color={Colors.error} />
                  <Text style={styles.deleteBtnText}>Delete Plan</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Sub-tab Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {TAB_DEFS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.tabPill, active && styles.tabPillActive]}
                onPress={() => setActiveTab(id)}
                activeOpacity={0.82}
              >
                <Icon
                  size={15}
                  color={active ? '#ffffff' : Colors.oliveDeep}
                />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Tab Content */}
        {activeTab === 'medicines' ? (
          <PrescribedMedicinesTab
            bookings={bookings}
            availability={availability}
            loading={loading}
            loadFailed={bookingsFailed}
            onRetry={() => loadAll(false)}
          />
        ) : activeTab === 'diet' ? (
          <WeeklyMealPlannerTab
            plan={dietPlan}
            loading={loading}
            lang={lang}
            onRequestDoctorPlan={() => setRequestModalOpen(true)}
          />
        ) : activeTab === 'yoga' ? (
          <YogaLifestyleSection
            yogaPlan={yogaPlan}
            dietPlan={dietPlan}
            loading={loading}
          />
        ) : (
          <OtherWellnessSection plan={dietPlan} loading={loading} />
        )}
      </ScrollView>

      <DietPlanRequestModal
        visible={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        bookings={bookings}
        onSuccess={() => loadAll(true)}
        onFindDoctor={() => router.push('/(patient)/(tabs)/doctors')}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cream,
    gap: 10,
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
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.sagePale,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 44,
    gap: 14,
  },
  intakeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    gap: 12,
    ...Shadows.card,
  },
  intakeTilesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  intakeTile: {
    flex: 1,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tileIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIconDone: {
    backgroundColor: Colors.successBg,
  },
  tileAction: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveAction,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  tileStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.inkMuted,
  },
  staleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.warningBg,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  staleText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning,
  },
  planActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  generateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.oliveAction,
    borderRadius: 12,
    paddingVertical: 12,
  },
  generateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  regenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.sagePale,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  regenBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.errorBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error,
  },
  tabsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabPillActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  tabTextActive: {
    color: '#ffffff',
  },
});
