// src/components/wellness/OtherWellnessSection.tsx
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Flame, Leaf, ShieldAlert, Utensils } from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import type { AyurvedaDietPlanResponse } from '../../types/patient';
import { resolvePlanDoctorReview } from '../../utils/wellnessHelpers';

function AvoidCard({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ShieldAlert size={15} color={Colors.error} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.bulletList}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.bulletRow}>
            <View style={[styles.dot, { backgroundColor: Colors.error }]} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function OtherWellnessSection({
  plan,
  loading,
}: {
  plan: AyurvedaDietPlanResponse | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <View style={styles.centerCard}>
        <ActivityIndicator size="large" color={Colors.olive} />
        <Text style={styles.centerText}>Loading cooking & avoidance guidance...</Text>
      </View>
    );
  }

  const display = plan?.displayPlan;
  if (!display) {
    return (
      <View style={styles.centerCard}>
        <Leaf size={28} color={Colors.oliveAction} />
        <Text style={styles.emptyTitle}>No Guidance Yet</Text>
        <Text style={styles.centerText}>
          Generate your Ayurvedic diet plan above to view cooking instructions and foods to avoid.
        </Text>
      </View>
    );
  }

  const meals = display.cookingInstructions?.meals || [];
  const guidelines = display.cookingInstructions?.generalGuidelines || [];
  const avoid = display.foodsToAvoid || {};
  const review = resolvePlanDoctorReview(plan?.status, plan?.doctorReview);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Leaf size={18} color={Colors.oliveAction} />
          <Text style={styles.sectionTitle}>Cooking & Foods to Avoid</Text>
        </View>
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceBadgeText}>
            {review.isDoctorApproved ? 'Doctor Certified' : 'AI Guidance'}
          </Text>
        </View>
      </View>

      {/* Cooking Instructions */}
      {meals.length > 0 || guidelines.length > 0 ? (
        <View style={styles.group}>
          <View style={styles.groupHeader}>
            <Flame size={15} color={Colors.barkBrown} />
            <Text style={styles.groupTitle}>Cooking Instructions</Text>
          </View>

          {meals.map((m, idx) => (
            <View key={idx} style={styles.card}>
              <Text style={styles.cardTitle}>{m.mealContext || `Meal ${idx + 1}`}</Text>
              {m.cookingMethod ? (
                <Text style={styles.lineText}>
                  <Text style={styles.boldLabel}>Method: </Text>
                  {m.cookingMethod}
                </Text>
              ) : null}
              {m.preparationStyle ? (
                <Text style={styles.lineText}>
                  <Text style={styles.boldLabel}>Prep Style: </Text>
                  {m.preparationStyle}
                </Text>
              ) : null}
              {m.spicesHerbs?.length ? (
                <View style={styles.spicesRow}>
                  {m.spicesHerbs.map((sp, i) => (
                    <View key={i} style={styles.spiceChip}>
                      <Text style={styles.spiceText}>{sp}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {m.goodCombinations?.length ? (
                <Text style={styles.lineText}>
                  <Text style={styles.boldLabel}>Combine with: </Text>
                  {m.goodCombinations.join(', ')}
                </Text>
              ) : null}
              {m.avoidCombinations?.length ? (
                <Text style={styles.lineText}>
                  <Text style={[styles.boldLabel, { color: Colors.error }]}>
                    Avoid combining with:{' '}
                  </Text>
                  {m.avoidCombinations.join(', ')}
                </Text>
              ) : null}
            </View>
          ))}

          {guidelines.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>General Kitchen Guidelines</Text>
              <View style={styles.bulletList}>
                {guidelines.map((g, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <View style={styles.dot} />
                    <Text style={styles.bulletText}>{g}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Foods to Avoid */}
      <View style={styles.group}>
        <View style={styles.groupHeader}>
          <Utensils size={15} color={Colors.error} />
          <Text style={styles.groupTitle}>Foods to Avoid</Text>
        </View>

        <AvoidCard title="Dosha-Aggravating Foods" items={avoid.doshaBased} />
        <AvoidCard
          title="Medical-Condition Considerations"
          items={avoid.medicalBased}
        />
        <AvoidCard title="Seasonal Considerations" items={avoid.seasonalBased} />
        <AvoidCard
          title="Regional Dishes to Limit"
          items={avoid.regionalDishesToAvoid}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  sourceBadge: {
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  group: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  lineText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.inkMuted,
  },
  boldLabel: {
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  spicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  spiceChip: {
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  spiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  bulletList: {
    gap: 7,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.oliveAction,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.ink,
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

