// src/components/wellness/WeeklyMealPlannerTab.tsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Apple,
  ArrowRight,
  ChefHat,
  GlassWater,
  Moon,
  Salad,
  Sparkles,
  Sun,
  UserCheck,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import type {
  AyurvedaDietPlanResponse,
  MealKey,
  MealSlot,
} from '../../types/patient';
import { resolvePlanDoctorReview } from '../../utils/wellnessHelpers';
import { MealRecipeModal } from './MealRecipeModal';

const MEAL_META: Array<{
  key: MealKey;
  label: string;
  Icon: typeof Sun;
}> = [
  { key: 'breakfast', label: 'Breakfast', Icon: Sun },
  { key: 'midMorning', label: 'Mid Morning', Icon: Apple },
  { key: 'lunch', label: 'Lunch', Icon: Salad },
  { key: 'eveningSnack', label: 'Evening Snack', Icon: GlassWater },
  { key: 'dinner', label: 'Dinner', Icon: Moon },
];

interface WeeklyMealPlannerTabProps {
  plan: AyurvedaDietPlanResponse | null;
  loading: boolean;
  lang: 'en' | 'hi';
  onRequestDoctorPlan: () => void;
}

export function WeeklyMealPlannerTab({
  plan,
  loading,
  lang,
  onRequestDoctorPlan,
}: WeeklyMealPlannerTabProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [recipeModal, setRecipeModal] = useState<{
    mealKey: MealKey;
    day: string;
    items: string[];
    portion?: string;
  } | null>(null);

  if (loading) {
    return (
      <View style={styles.centerCard}>
        <ActivityIndicator size="large" color={Colors.olive} />
        <Text style={styles.centerText}>Loading 7-day meal planner...</Text>
      </View>
    );
  }

  const days = plan?.displayPlan?.weeklyPlan || [];
  const reviewMeta = resolvePlanDoctorReview(plan?.status, plan?.doctorReview);
  const activeDay = days[selectedDay] || days[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Salad size={18} color={Colors.oliveAction} />
          <Text style={styles.title}>7-Day Weekly Meal Planner</Text>
        </View>
        {plan ? (
          <View
            style={[
              styles.sourceBadge,
              reviewMeta.isDoctorApproved && styles.sourceBadgeDoctor,
            ]}
          >
            {reviewMeta.isDoctorApproved ? (
              <UserCheck size={12} color={Colors.oliveDeep} />
            ) : (
              <Sparkles size={12} color={Colors.turmericGold} />
            )}
            <Text style={styles.sourceBadgeText}>
              {reviewMeta.isDoctorApproved
                ? 'Doctor Certified'
                : reviewMeta.isDoctorModified
                  ? 'Doctor Edited'
                  : 'AI Personalized'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Doctor Approved Banner OR Request With Doctor Promo */}
      {reviewMeta.isDoctorApproved ? (
        <View style={styles.approvedBanner}>
          <View style={styles.approvedHeader}>
            <UserCheck size={15} color={Colors.oliveAction} />
            <Text style={styles.approvedTitle}>
              Certified by {reviewMeta.doctorName}
              {reviewMeta.reviewedDate ? ` on ${reviewMeta.reviewedDate}` : ''}
            </Text>
          </View>
          {reviewMeta.notes ? (
            <Text style={styles.approvedNotes}>“{reviewMeta.notes}”</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.promoBanner}>
          <View style={styles.promoTextWrap}>
            <Text style={styles.promoTitle}>
              Want a Doctor-Certified Personalized Plan?
            </Text>
            <Text style={styles.promoDesc}>
              Have your consulting Ayurvedic doctor review and customize this 7-day routine for your Dosha & condition.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.promoBtn}
            onPress={onRequestDoctorPlan}
            activeOpacity={0.85}
          >
            <Text style={styles.promoBtnText}>Request with Doctor</Text>
            <ArrowRight size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}

      {!days.length ? (
        <View style={styles.centerCard}>
          <Salad size={30} color={Colors.oliveAction} />
          <Text style={styles.emptyTitle}>No Weekly Meal Plan Yet</Text>
          <Text style={styles.centerText}>
            Complete your Prakriti assessment and Wellness Profile above, then tap Generate Plan to build your 7-day Ayurvedic meal schedule.
          </Text>
        </View>
      ) : (
        <>
          {/* Day Selector Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysScroll}
          >
            {days.map((d, idx) => {
              const active = idx === selectedDay;
              const label = (d.day || `Day ${idx + 1}`).slice(0, 3).toUpperCase();
              return (
                <TouchableOpacity
                  key={`${d.day}-${idx}`}
                  style={[styles.dayPill, active && styles.dayPillActive]}
                  onPress={() => setSelectedDay(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayPillText, active && styles.dayPillTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.activeDayHeading}>{activeDay.day}</Text>

          {/* 5 Meal Cards */}
          <View style={styles.mealsList}>
            {MEAL_META.map(({ key, label, Icon }) => {
              const meal: MealSlot | undefined = activeDay[key];
              const items = meal?.items || [];
              const hasItems = items.length > 0;

              return (
                <View key={key} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealTitleWrap}>
                      <Icon size={16} color={Colors.oliveAction} />
                      <Text style={styles.mealLabel}>{label}</Text>
                    </View>
                    {meal?.portion ? (
                      <View style={styles.portionBadge}>
                        <Text style={styles.portionText}>{meal.portion}</Text>
                      </View>
                    ) : null}
                  </View>

                  {hasItems ? (
                    <View style={styles.itemsWrap}>
                      {items.map((item, i) => (
                        <View key={i} style={styles.foodChip}>
                          <Text style={styles.foodChipText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.notSpecified}>Not specified</Text>
                  )}

                  {meal?.purpose ? (
                    <Text style={styles.purposeText}>{meal.purpose}</Text>
                  ) : null}

                  {hasItems ? (
                    <View style={styles.mealFooter}>
                      <TouchableOpacity
                        style={styles.recipeBtn}
                        onPress={() =>
                          setRecipeModal({
                            mealKey: key,
                            day: activeDay.day,
                            items,
                            portion: meal?.portion,
                          })
                        }
                        activeOpacity={0.8}
                      >
                        <ChefHat size={14} color={Colors.oliveAction} />
                        <Text style={styles.recipeBtnText}>View Recipe & Prep</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </>
      )}

      {recipeModal ? (
        <MealRecipeModal
          visible={Boolean(recipeModal)}
          onClose={() => setRecipeModal(null)}
          mealKey={recipeModal.mealKey}
          day={recipeModal.day}
          items={recipeModal.items}
          portion={recipeModal.portion}
          lang={lang}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  sourceBadgeDoctor: {
    backgroundColor: Colors.sagePale,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  approvedBanner: {
    backgroundColor: Colors.creamTint,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    gap: 4,
  },
  approvedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  approvedTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  approvedNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.inkMuted,
  },
  promoBanner: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    gap: 10,
  },
  promoTextWrap: {
    gap: 3,
  },
  promoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  promoDesc: {
    fontSize: 12,
    color: Colors.inkMuted,
    lineHeight: 17,
  },
  promoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  promoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  daysScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  dayPill: {
    minWidth: 52,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  dayPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  dayPillTextActive: {
    color: '#ffffff',
  },
  activeDayHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  mealsList: {
    gap: 10,
  },
  mealCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 9,
    ...Shadows.card,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  mealTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  mealLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  portionBadge: {
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '58%',
  },
  portionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.oliveDeep,
  },
  itemsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  foodChip: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.18)',
  },
  foodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.inkStrong,
  },
  notSpecified: {
    fontSize: 12,
    color: Colors.inkLight,
  },
  purposeText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.inkMuted,
    lineHeight: 17,
  },
  mealFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 9,
    alignItems: 'flex-end',
  },
  recipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.creamTint,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  recipeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveAction,
  },
  centerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  centerText: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
});

