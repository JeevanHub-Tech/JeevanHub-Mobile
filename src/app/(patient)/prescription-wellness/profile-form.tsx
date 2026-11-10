// src/app/(patient)/prescription-wellness/profile-form.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  Activity,
  ArrowLeft,
  Check,
  HeartPulse,
  Ruler,
  Salad,
  Save,
  Sun,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import { Colors, Shadows } from '../../../constants/theme';
import type { WellnessProfile } from '../../../types/patient';
import { computeBmi, getBmiCategory } from '../../../utils/wellnessHelpers';

const toList = (str: string): string[] =>
  str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const toStr = (arr?: string[]): string => (Array.isArray(arr) ? arr.join(', ') : '');

const BODY_TYPES = [
  { value: 'lean_thin', label: 'Lean / Thin' },
  { value: 'athletic_defined', label: 'Athletic / Defined' },
  { value: 'medium_frame', label: 'Medium Frame' },
  { value: 'soft_round', label: 'Soft / Round' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
];

const SLEEP_QUALITIES = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
];

const STRESS_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
];

const DIET_TYPES = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'non_vegetarian', label: 'Non-Veg' },
  { value: 'vegan', label: 'Vegan' },
];

const REGIONAL_CUISINES = [
  { value: 'no_preference', label: 'No Preference' },
  { value: 'north_indian', label: 'North Indian' },
  { value: 'south_indian', label: 'South Indian' },
  { value: 'indo_chinese', label: 'Indo-Chinese' },
];

const SEASONS = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'monsoon', label: 'Monsoon' },
  { value: 'autumn', label: 'Autumn' },
  { value: 'winter', label: 'Winter' },
];

type ConditionKey =
  | 'diabetes'
  | 'highBP'
  | 'obesityFocus'
  | 'skinDisease'
  | 'jointPainArthritis'
  | 'digestiveIssues'
  | 'respiratoryIssues';

const CONDITION_ITEMS: Array<{ key: ConditionKey; label: string }> = [
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'highBP', label: 'High BP' },
  { key: 'obesityFocus', label: 'Weight Management' },
  { key: 'skinDisease', label: 'Skin Disease' },
  { key: 'jointPainArthritis', label: 'Joint Pain / Arthritis' },
  { key: 'digestiveIssues', label: 'Digestive (GERD/IBS)' },
  { key: 'respiratoryIssues', label: 'Respiratory Issues' },
];

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.choiceChip, active && styles.choiceChipActive]}
            onPress={() => onChange(active ? '' : opt.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function WellnessProfileFormScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [bodyType, setBodyType] = useState('');

  const [conditions, setConditions] = useState<Record<ConditionKey, boolean>>({
    diabetes: false,
    highBP: false,
    obesityFocus: false,
    skinDisease: false,
    jointPainArthritis: false,
    digestiveIssues: false,
    respiratoryIssues: false,
  });
  const [otherConditions, setOtherConditions] = useState('');
  const [medications, setMedications] = useState('');
  const [allergies, setAllergies] = useState('');

  const [activityLevel, setActivityLevel] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [stressLevel, setStressLevel] = useState('');
  const [exerciseHabits, setExerciseHabits] = useState('');
  const [workRoutine, setWorkRoutine] = useState('');

  const [dietType, setDietType] = useState('');
  const [regionalPreference, setRegionalPreference] = useState('no_preference');
  const [preferredFoods, setPreferredFoods] = useState('');
  const [dislikedFoods, setDislikedFoods] = useState('');
  const [eatingTimings, setEatingTimings] = useState('');
  const [waterIntakeLiters, setWaterIntakeLiters] = useState('');
  const [season, setSeason] = useState('');

  useEffect(() => {
    patientApi
      .getWellnessProfile()
      .then((p) => {
        if (!p) return;
        setHeightCm(p.basicDetails?.heightCm != null ? String(p.basicDetails.heightCm) : '');
        setWeightKg(p.basicDetails?.weightKg != null ? String(p.basicDetails.weightKg) : '');
        setBodyType(p.basicDetails?.bodyType || '');

        setConditions({
          diabetes: Boolean(p.healthInfo?.conditions?.diabetes),
          highBP: Boolean(p.healthInfo?.conditions?.highBP),
          obesityFocus: Boolean(p.healthInfo?.conditions?.obesityFocus),
          skinDisease: Boolean(p.healthInfo?.conditions?.skinDisease),
          jointPainArthritis: Boolean(p.healthInfo?.conditions?.jointPainArthritis),
          digestiveIssues: Boolean(p.healthInfo?.conditions?.digestiveIssues),
          respiratoryIssues: Boolean(p.healthInfo?.conditions?.respiratoryIssues),
        });
        setOtherConditions(toStr(p.healthInfo?.conditions?.other));
        setMedications(toStr(p.healthInfo?.medications));
        setAllergies(toStr(p.healthInfo?.allergies));

        setActivityLevel(p.lifestyle?.activityLevel || '');
        setSleepHours(p.lifestyle?.sleepHours != null ? String(p.lifestyle.sleepHours) : '');
        setSleepQuality(p.lifestyle?.sleepQuality || '');
        setStressLevel(p.lifestyle?.stressLevel || '');
        setExerciseHabits(p.lifestyle?.exerciseHabits || '');
        setWorkRoutine(p.lifestyle?.workRoutine || '');

        setDietType(p.foodHabits?.dietType || '');
        setRegionalPreference(p.foodHabits?.regionalPreference || 'no_preference');
        setPreferredFoods(toStr(p.foodHabits?.preferredFoods));
        setDislikedFoods(toStr(p.foodHabits?.dislikedFoods));
        setEatingTimings(p.foodHabits?.eatingTimings || '');
        setWaterIntakeLiters(
          p.foodHabits?.waterIntakeLiters != null ? String(p.foodHabits.waterIntakeLiters) : ''
        );
        setSeason(p.season?.current || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const bmi = computeBmi(heightCm, weightKg);
  const bmiCat = getBmiCategory(bmi);

  const toggleCondition = (key: ConditionKey) => {
    setConditions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: WellnessProfile = {
        basicDetails: {
          heightCm: heightCm.trim() ? Number(heightCm) : undefined,
          weightKg: weightKg.trim() ? Number(weightKg) : undefined,
          bodyType: bodyType || undefined,
        },
        healthInfo: {
          conditions: {
            ...conditions,
            other: toList(otherConditions),
          },
          medications: toList(medications),
          allergies: toList(allergies),
        },
        lifestyle: {
          activityLevel: activityLevel || undefined,
          sleepHours: sleepHours.trim() ? Number(sleepHours) : undefined,
          sleepQuality: sleepQuality || undefined,
          stressLevel: stressLevel || undefined,
          exerciseHabits: exerciseHabits.trim() || undefined,
          workRoutine: workRoutine.trim() || undefined,
        },
        foodHabits: {
          dietType: dietType || undefined,
          regionalPreference: regionalPreference || 'no_preference',
          preferredFoods: toList(preferredFoods),
          dislikedFoods: toList(dislikedFoods),
          eatingTimings: eatingTimings.trim() || undefined,
          waterIntakeLiters: waterIntakeLiters.trim() ? Number(waterIntakeLiters) : undefined,
        },
        season: season ? { current: season } : undefined,
      };

      await patientApi.saveWellnessProfile(payload);
      Alert.alert('Saved', 'Your Ayurveda wellness profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save wellness profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkStrong} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Wellness Profile</Text>
        <TouchableOpacity
          style={styles.saveNavBtn}
          onPress={handleSave}
          disabled={saving || loading}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Save size={14} color="#ffffff" />
              <Text style={styles.saveNavText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading wellness profile...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>
              Every field is optional — share what feels relevant to personalize your 7-day Ayurvedic meal and yoga plan.
            </Text>

            {/* 1. Basic Details */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ruler size={16} color={Colors.oliveAction} />
                <Text style={styles.cardTitle}>Basic Details</Text>
              </View>

              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <Text style={styles.label}>Height (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={heightCm}
                    onChangeText={setHeightCm}
                    keyboardType="numeric"
                    placeholder="e.g. 170"
                    placeholderTextColor={Colors.inkLight}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={weightKg}
                    onChangeText={setWeightKg}
                    keyboardType="numeric"
                    placeholder="e.g. 68"
                    placeholderTextColor={Colors.inkLight}
                  />
                </View>
              </View>

              {bmi !== null ? (
                <View style={styles.bmiBanner}>
                  <Text style={styles.bmiText}>
                    Estimated BMI: <Text style={{ fontWeight: '800' }}>{bmi}</Text>
                  </Text>
                  <View style={styles.bmiPill}>
                    <Text style={styles.bmiPillText}>{bmiCat}</Text>
                  </View>
                </View>
              ) : null}

              <Text style={styles.label}>Body Type</Text>
              <ChipGroup options={BODY_TYPES} value={bodyType} onChange={setBodyType} />
            </View>

            {/* 2. Health Info */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <HeartPulse size={16} color={Colors.oliveAction} />
                <Text style={styles.cardTitle}>Health Information</Text>
              </View>

              <Text style={styles.label}>Health Conditions</Text>
              <View style={styles.chipRow}>
                {CONDITION_ITEMS.map((item) => {
                  const checked = conditions[item.key];
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.choiceChip, checked && styles.choiceChipActive]}
                      onPress={() => toggleCondition(item.key)}
                      activeOpacity={0.8}
                    >
                      {checked ? <Check size={12} color="#ffffff" /> : null}
                      <Text
                        style={[
                          styles.choiceChipText,
                          checked && styles.choiceChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Other Conditions (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={otherConditions}
                onChangeText={setOtherConditions}
                placeholder="e.g. Thyroid, Migraine"
                placeholderTextColor={Colors.inkLight}
              />

              <Text style={styles.label}>Current Medications (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={medications}
                onChangeText={setMedications}
                placeholder="e.g. Metformin, Ashwagandha"
                placeholderTextColor={Colors.inkLight}
              />

              <Text style={styles.label}>Food Allergies (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="e.g. Peanuts, Lactose"
                placeholderTextColor={Colors.inkLight}
              />
            </View>

            {/* 3. Lifestyle */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Activity size={16} color={Colors.oliveAction} />
                <Text style={styles.cardTitle}>Lifestyle & Routine</Text>
              </View>

              <Text style={styles.label}>Activity Level</Text>
              <ChipGroup
                options={ACTIVITY_LEVELS}
                value={activityLevel}
                onChange={setActivityLevel}
              />

              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <Text style={styles.label}>Sleep Hours / Night</Text>
                  <TextInput
                    style={styles.input}
                    value={sleepHours}
                    onChangeText={setSleepHours}
                    keyboardType="numeric"
                    placeholder="e.g. 7"
                    placeholderTextColor={Colors.inkLight}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Water (Liters / Day)</Text>
                  <TextInput
                    style={styles.input}
                    value={waterIntakeLiters}
                    onChangeText={setWaterIntakeLiters}
                    keyboardType="numeric"
                    placeholder="e.g. 2.5"
                    placeholderTextColor={Colors.inkLight}
                  />
                </View>
              </View>

              <Text style={styles.label}>Sleep Quality</Text>
              <ChipGroup
                options={SLEEP_QUALITIES}
                value={sleepQuality}
                onChange={setSleepQuality}
              />

              <Text style={styles.label}>Stress Level</Text>
              <ChipGroup
                options={STRESS_LEVELS}
                value={stressLevel}
                onChange={setStressLevel}
              />

              <Text style={styles.label}>Exercise Habits</Text>
              <TextInput
                style={styles.input}
                value={exerciseHabits}
                onChangeText={setExerciseHabits}
                placeholder="e.g. Morning walk 30 mins"
                placeholderTextColor={Colors.inkLight}
              />

              <Text style={styles.label}>Work Routine</Text>
              <TextInput
                style={styles.input}
                value={workRoutine}
                onChangeText={setWorkRoutine}
                placeholder="e.g. Desk job 9-6"
                placeholderTextColor={Colors.inkLight}
              />
            </View>

            {/* 4. Food Habits & Season */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Salad size={16} color={Colors.oliveAction} />
                <Text style={styles.cardTitle}>Food Habits & Season</Text>
              </View>

              <Text style={styles.label}>Diet Type</Text>
              <ChipGroup options={DIET_TYPES} value={dietType} onChange={setDietType} />

              <Text style={styles.label}>Regional Cuisine Preference</Text>
              <ChipGroup
                options={REGIONAL_CUISINES}
                value={regionalPreference}
                onChange={(v) => setRegionalPreference(v || 'no_preference')}
              />

              <Text style={styles.label}>Preferred Foods (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={preferredFoods}
                onChangeText={setPreferredFoods}
                placeholder="e.g. Moong dal, Poha, Buttermilk"
                placeholderTextColor={Colors.inkLight}
              />

              <Text style={styles.label}>Foods Disliked / Avoided (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={dislikedFoods}
                onChangeText={setDislikedFoods}
                placeholder="e.g. Bitter gourd, Mushrooms"
                placeholderTextColor={Colors.inkLight}
              />

              <Text style={styles.label}>Typical Meal Timings</Text>
              <TextInput
                style={styles.input}
                value={eatingTimings}
                onChangeText={setEatingTimings}
                placeholder="e.g. 8:30 AM, 1:30 PM, 8:00 PM"
                placeholderTextColor={Colors.inkLight}
              />

              <View style={styles.seasonHeader}>
                <Sun size={14} color={Colors.turmericGold} />
                <Text style={styles.label}>Current Season (Ritucharya)</Text>
              </View>
              <ChipGroup options={SEASONS} value={season} onChange={setSeason} />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Save size={17} color="#ffffff" />
              )}
              <Text style={styles.submitBtnText}>
                {saving ? 'Saving Profile...' : 'Save Wellness Profile'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  saveNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  saveNavText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  content: {
    padding: 16,
    paddingBottom: 44,
    gap: 14,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.inkMuted,
    lineHeight: 19,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
    gap: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginTop: 2,
  },
  input: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.inkStrong,
  },
  bmiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.sagePale,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bmiText: {
    fontSize: 13,
    color: Colors.inkStrong,
  },
  bmiPill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bmiPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  choiceChipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  choiceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.inkStrong,
  },
  choiceChipTextActive: {
    color: '#ffffff',
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.oliveAction,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
    ...Shadows.button,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});

