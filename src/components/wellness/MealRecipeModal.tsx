// src/components/wellness/MealRecipeModal.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  ChefHat,
  Clock,
  Flame,
  Leaf,
  Lightbulb,
  RefreshCw,
  Share2,
  Sparkles,
  Users,
  Utensils,
  X,
} from 'lucide-react-native';
import { patientApi } from '../../api/patient';
import { Colors } from '../../constants/theme';
import type { MealKey, MealRecipe } from '../../types/patient';

const recipeMemoryCache = new Map<string, MealRecipe>();

const MEAL_LABELS: Record<MealKey, string> = {
  breakfast: 'Breakfast',
  midMorning: 'Mid Morning',
  lunch: 'Lunch',
  eveningSnack: 'Evening Snack',
  dinner: 'Dinner',
};

interface MealRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  mealKey: MealKey;
  day: string;
  items: string[];
  portion?: string;
  lang?: 'en' | 'hi';
}

export function MealRecipeModal({
  visible,
  onClose,
  mealKey,
  day,
  items,
  portion,
  lang = 'en',
}: MealRecipeModalProps) {
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<MealRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `${day}_${mealKey}_${items.join(',')}_${lang}`;

  const fetchRecipe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientApi.getMealRecipe({
        mealContext: mealKey,
        day,
        items,
        portion,
        lang,
      });
      if (res?.recipe) {
        recipeMemoryCache.set(cacheKey, res.recipe);
        setRecipe(res.recipe);
      } else {
        throw new Error('No recipe data returned.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to generate recipe right now.');
    } finally {
      setLoading(false);
    }
  }, [cacheKey, day, items, lang, mealKey, portion]);

  useEffect(() => {
    if (!visible || items.length === 0) return;
    const cached = recipeMemoryCache.get(cacheKey);
    if (cached) {
      setRecipe(cached);
      setError(null);
      setLoading(false);
      return;
    }
    fetchRecipe();
  }, [visible, cacheKey, items.length, fetchRecipe]);

  const handleShare = async () => {
    if (!recipe) return;
    const text = [
      `🌿 ${recipe.dishName}`,
      `⏱ Prep: ${recipe.prepTimeMinutes || 10}m | Cook: ${recipe.cookTimeMinutes || 15}m | Servings: ${recipe.servings || '1-2'}`,
      '',
      'INGREDIENTS:',
      ...(recipe.ingredients || []).map(
        (i) => `• ${i.item}${i.ayurvedicRole ? ` (${i.ayurvedicRole})` : ''}`
      ),
      '',
      'PREPARATION STEPS:',
      ...(recipe.steps || []).map((s, idx) => `${idx + 1}. ${s}`),
      recipe.ayurvedicBenefits ? `\nAYURVEDIC BENEFITS:\n${recipe.ayurvedicBenefits}` : '',
    ].join('\n');

    try {
      await Share.share({ message: text, title: recipe.dishName });
    } catch {
      // Dismissed
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <ChefHat size={20} color={Colors.oliveAction} />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {recipe?.dishName || items[0] || 'Ayurvedic Recipe & Prep'}
              </Text>
              <Text style={styles.headerMeta}>
                {day} • {MEAL_LABELS[mealKey] || mealKey}
                {portion ? ` • ${portion}` : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <X size={20} color={Colors.inkStrong} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.olive} />
                <View style={styles.loadingPill}>
                  <Sparkles size={14} color={Colors.turmericGold} />
                  <Text style={styles.loadingText}>
                    Crafting Ayurvedic recipe & dosha notes...
                  </Text>
                </View>
              </View>
            ) : error ? (
              <View style={styles.errorBox}>
                <AlertCircle size={32} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchRecipe}>
                  <RefreshCw size={14} color="#ffffff" />
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : recipe ? (
              <>
                {/* Metrics */}
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Clock size={15} color={Colors.oliveAction} />
                    <Text style={styles.statVal}>{recipe.prepTimeMinutes || 10} min</Text>
                    <Text style={styles.statLabel}>Prep</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Flame size={15} color={Colors.barkBrown} />
                    <Text style={styles.statVal}>{recipe.cookTimeMinutes || 15} min</Text>
                    <Text style={styles.statLabel}>Cook</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Users size={15} color={Colors.success} />
                    <Text style={styles.statVal}>{recipe.servings || '1-2'}</Text>
                    <Text style={styles.statLabel}>Servings</Text>
                  </View>
                </View>

                {/* Ingredients */}
                {recipe.ingredients?.length ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Utensils size={15} color={Colors.oliveAction} />
                      <Text style={styles.sectionTitle}>Key Ingredients & Role</Text>
                    </View>
                    <View style={styles.ingredientsList}>
                      {recipe.ingredients.map((ing, idx) => (
                        <View key={idx} style={styles.ingredientItem}>
                          <View style={styles.dot} />
                          <View style={styles.ingredientTextWrap}>
                            <Text style={styles.ingredientName}>{ing.item}</Text>
                            {ing.ayurvedicRole ? (
                              <Text style={styles.ingredientRole}>{ing.ayurvedicRole}</Text>
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Steps */}
                {recipe.steps?.length ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <ChefHat size={15} color={Colors.oliveAction} />
                      <Text style={styles.sectionTitle}>Preparation Steps</Text>
                    </View>
                    <View style={styles.stepsList}>
                      {recipe.steps.map((step, idx) => (
                        <View key={idx} style={styles.stepCard}>
                          <View style={styles.stepNum}>
                            <Text style={styles.stepNumText}>{idx + 1}</Text>
                          </View>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Benefits */}
                {recipe.ayurvedicBenefits ? (
                  <View style={styles.benefitsBox}>
                    <View style={styles.sectionHeader}>
                      <Leaf size={15} color={Colors.success} />
                      <Text style={[styles.sectionTitle, { color: Colors.success }]}>
                        Ayurvedic & Dosha Insight
                      </Text>
                    </View>
                    <Text style={styles.insightText}>{recipe.ayurvedicBenefits}</Text>
                  </View>
                ) : null}

                {/* Cooking Tips */}
                {recipe.cookingTips?.length ? (
                  <View style={styles.tipsBox}>
                    <View style={styles.sectionHeader}>
                      <Lightbulb size={15} color={Colors.warning} />
                      <Text style={[styles.sectionTitle, { color: Colors.warning }]}>
                        Kitchen Wisdom
                      </Text>
                    </View>
                    {recipe.cookingTips.map((tip, idx) => (
                      <Text key={idx} style={styles.tipItem}>
                        • {tip}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {recipe ? (
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Share2 size={15} color={Colors.oliveDeep} />
                <Text style={styles.shareBtnText}>Share Recipe</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  headerMeta: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    maxHeight: 520,
  },
  bodyContent: {
    padding: 18,
    gap: 16,
    paddingBottom: 24,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.oliveDeep,
    fontWeight: '600',
  },
  errorBox: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 3,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.oliveDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.oliveAction,
    marginTop: 5,
  },
  ingredientTextWrap: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  ingredientRole: {
    fontSize: 12,
    color: Colors.inkMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  stepsList: {
    gap: 8,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.ink,
  },
  benefitsBox: {
    backgroundColor: Colors.successBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.2)',
    gap: 6,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.inkStrong,
  },
  tipsBox: {
    backgroundColor: Colors.warningBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(178,106,0,0.2)',
    gap: 6,
  },
  tipItem: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.inkStrong,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.sagePale,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  doneBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.oliveAction,
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});

