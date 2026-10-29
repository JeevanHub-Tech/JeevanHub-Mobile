// src/app/(patient)/wellness.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Award,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Flame,
  HeartHandshake,
  Moon,
  RotateCcw,
  Salad,
  Sparkles,
  Wind,
  XCircle,
} from 'lucide-react-native';
import { patientApi } from '../../api/patient';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/theme';
import { DoshaResult } from '../../types/patient';

interface QuizQuestion {
  id: number;
  category: string;
  question: string;
  options: {
    text: string;
    dosha: 'vata' | 'pitta' | 'kapha';
  }[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    category: 'Physical Frame',
    question: 'How would you describe your natural physical build?',
    options: [
      { text: 'Slender, lean, finds it difficult to gain weight', dosha: 'vata' },
      { text: 'Medium build, athletic, gains or loses weight easily', dosha: 'pitta' },
      { text: 'Solid, broad frame, tends to gain weight easily', dosha: 'kapha' },
    ],
  },
  {
    id: 2,
    category: 'Skin Characteristics',
    question: 'What is the natural texture and feel of your skin?',
    options: [
      { text: 'Dry, thin, cool to the touch, prone to roughness', dosha: 'vata' },
      { text: 'Warm, sensitive, prone to redness, moles or freckles', dosha: 'pitta' },
      { text: 'Thick, smooth, oily, well-hydrated and cool', dosha: 'kapha' },
    ],
  },
  {
    id: 3,
    category: 'Digestion & Agni',
    question: 'How is your regular digestion and appetite?',
    options: [
      { text: 'Variable, irregular, prone to gas or bloating', dosha: 'vata' },
      { text: 'Strong, intense hunger, irritable if meals are missed', dosha: 'pitta' },
      { text: 'Slow, steady, can easily skip meals without discomfort', dosha: 'kapha' },
    ],
  },
  {
    id: 4,
    category: 'Sleep Patterns',
    question: 'How do you usually sleep at night?',
    options: [
      { text: 'Light, restless sleeper, frequently wakes up at night', dosha: 'vata' },
      { text: 'Moderate (6-7 hrs), falls asleep easily, wakes up refreshed', dosha: 'pitta' },
      { text: 'Heavy, deep sleeper, loves long sleep, hard to wake up', dosha: 'kapha' },
    ],
  },
  {
    id: 5,
    category: 'Weather & Climate',
    question: 'Which weather or climate do you find most uncomfortable?',
    options: [
      { text: 'Cold, windy, and dry weather', dosha: 'vata' },
      { text: 'Hot, humid, sunny weather', dosha: 'pitta' },
      { text: 'Cold, damp, and rainy weather', dosha: 'kapha' },
    ],
  },
  {
    id: 6,
    category: 'Response to Stress',
    question: 'How do your emotions react when put under acute stress?',
    options: [
      { text: 'Anxiety, nervousness, racing thoughts and worry', dosha: 'vata' },
      { text: 'Irritability, impatience, frustration or anger', dosha: 'pitta' },
      { text: 'Withdrawn, calm resistance, lethargy or stubbornness', dosha: 'kapha' },
    ],
  },
  {
    id: 7,
    category: 'Mental Activity',
    question: 'How does your mind process new information and memories?',
    options: [
      { text: 'Quick to learn and grasp concepts, but quick to forget', dosha: 'vata' },
      { text: 'Sharp, organized, precise and logical comprehension', dosha: 'pitta' },
      { text: 'Takes time to learn, but retains memory permanently', dosha: 'kapha' },
    ],
  },
  {
    id: 8,
    category: 'Physical Stamina',
    question: 'How is your energy and stamina throughout the day?',
    options: [
      { text: 'Comes in unpredictable bursts; prone to sudden fatigue', dosha: 'vata' },
      { text: 'Strong and focused, but overworking leads to burnout', dosha: 'pitta' },
      { text: 'Steady and enduring; high stamina once in motion', dosha: 'kapha' },
    ],
  },
];

export default function WellnessScreen() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DoshaResult | null>(null);

  // Quiz state
  const [inQuiz, setInQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'vata' | 'pitta' | 'kapha'>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadExistingAssessment();
  }, []);

  const loadExistingAssessment = async () => {
    try {
      const assessment = await patientApi.getDoshaAssessment();
      setResult(assessment);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (dosha: 'vata' | 'pitta' | 'kapha') => {
    const updated = { ...selectedAnswers, [currentQuestionIndex]: dosha };
    setSelectedAnswers(updated);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Final question answered: compute scores & submit
      computeAndSaveResult(updated);
    }
  };

  const computeAndSaveResult = async (answers: Record<number, 'vata' | 'pitta' | 'kapha'>) => {
    setSubmitting(true);
    let vataCount = 0;
    let pittaCount = 0;
    let kaphaCount = 0;

    Object.values(answers).forEach((d) => {
      if (d === 'vata') vataCount++;
      if (d === 'pitta') pittaCount++;
      if (d === 'kapha') kaphaCount++;
    });

    const total = QUESTIONS.length;
    const vataPct = Math.round((vataCount / total) * 100);
    const pittaPct = Math.round((pittaCount / total) * 100);
    const kaphaPct = 100 - (vataPct + pittaPct);

    let dominant: DoshaResult['dominantDosha'] = 'Vata';
    if (vataPct >= pittaPct && vataPct >= kaphaPct) dominant = 'Vata';
    else if (pittaPct >= vataPct && pittaPct >= kaphaPct) dominant = 'Pitta';
    else dominant = 'Kapha';

    // Dual dosha check
    if (Math.abs(vataPct - pittaPct) <= 12 && vataPct > 35 && pittaPct > 35) dominant = 'Vata-Pitta';
    else if (Math.abs(pittaPct - kaphaPct) <= 12 && pittaPct > 35 && kaphaPct > 35) dominant = 'Pitta-Kapha';
    else if (Math.abs(vataPct - kaphaPct) <= 12 && vataPct > 35 && kaphaPct > 35) dominant = 'Vata-Kapha';

    const computedResult: DoshaResult = {
      dominantDosha: dominant,
      scores: { vata: vataPct, pitta: pittaPct, kapha: kaphaPct },
      description: getDoshaDescription(dominant),
      dietRecommendations: getDietPlan(dominant),
      lifestyleTips: getLifestyleTips(dominant),
      recommendedHerbs: getHerbs(dominant),
    };

    try {
      await patientApi.submitDoshaAssessment({
        scores: computedResult.scores,
        dominantDosha: computedResult.dominantDosha,
        answers,
      });
    } catch {
      // Best-effort backend save
    }

    setResult(computedResult);
    setInQuiz(false);
    setSubmitting(false);
  };

  const restartQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setInQuiz(true);
  };

  const currentQ = QUESTIONS[currentQuestionIndex];
  const progressPct = Math.round(((currentQuestionIndex + 1) / QUESTIONS.length) * 100);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading Ayurvedic profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Prakriti & Dosha Wellness</Text>
          <Text style={styles.headerSubtitle}>
            Traditional Ayurvedic constitutional assessment & personalized Ahara-Vihara
          </Text>
        </View>

        {/* ─── QUIZ IN PROGRESS ─────────────────────────────────────────────── */}
        {inQuiz && (
          <View style={styles.quizCard}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progressPct}%` }]} />
            </View>
            <View style={styles.progressHeader}>
              <Text style={styles.categoryBadge}>{currentQ.category}</Text>
              <Text style={styles.questionCounter}>
                Question {currentQuestionIndex + 1} of {QUESTIONS.length}
              </Text>
            </View>

            <Text style={styles.questionText}>{currentQ.question}</Text>

            {/* Options */}
            <View style={styles.optionsList}>
              {currentQ.options.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.optionButton}
                  onPress={() => handleSelectOption(opt.dosha)}
                  activeOpacity={0.75}
                  disabled={submitting}
                >
                  <View style={styles.optionRadio}>
                    <Text style={styles.optionLetter}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <Text style={styles.optionText}>{opt.text}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {submitting && (
              <View style={styles.calculatingRow}>
                <ActivityIndicator size="small" color={Colors.olive} />
                <Text style={styles.calculatingText}>Analyzing your Dosha constitution...</Text>
              </View>
            )}
          </View>
        )}

        {/* ─── RESULT VIEW ─────────────────────────────────────────────────── */}
        {!inQuiz && result && (
          <View>
            {/* Primary Result Banner */}
            <View style={styles.resultCard}>
              <View style={styles.doshaBadgeWrap}>
                <Sparkles size={28} color={Colors.turmericGold} />
              </View>
              <Text style={styles.dominantTitle}>{result.dominantDosha} Prakriti</Text>
              <Text style={styles.doshaDescription}>{result.description}</Text>

              {/* Progress Meters */}
              <View style={styles.meterContainer}>
                {/* Vata */}
                <View style={styles.meterRow}>
                  <View style={styles.meterLabelWrap}>
                    <Wind size={15} color="#0288d1" />
                    <Text style={styles.meterName}>Vata (Air & Space)</Text>
                  </View>
                  <Text style={styles.meterVal}>{result.scores.vata}%</Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[styles.fill, { width: `${result.scores.vata}%`, backgroundColor: '#0288d1' }]}
                  />
                </View>

                {/* Pitta */}
                <View style={styles.meterRow}>
                  <View style={styles.meterLabelWrap}>
                    <Flame size={15} color="#e65100" />
                    <Text style={styles.meterName}>Pitta (Fire & Water)</Text>
                  </View>
                  <Text style={styles.meterVal}>{result.scores.pitta}%</Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[styles.fill, { width: `${result.scores.pitta}%`, backgroundColor: '#e65100' }]}
                  />
                </View>

                {/* Kapha */}
                <View style={styles.meterRow}>
                  <View style={styles.meterLabelWrap}>
                    <Moon size={15} color="#2e7d32" />
                    <Text style={styles.meterName}>Kapha (Earth & Water)</Text>
                  </View>
                  <Text style={styles.meterVal}>{result.scores.kapha}%</Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[styles.fill, { width: `${result.scores.kapha}%`, backgroundColor: '#2e7d32' }]}
                  />
                </View>
              </View>
            </View>

            {/* Diet Recommendations (Ahara) */}
            <View style={styles.guideCard}>
              <View style={styles.guideHeader}>
                <Salad size={20} color={Colors.olive} />
                <Text style={styles.guideTitle}>Ayurvedic Diet (Ahara)</Text>
              </View>

              <Text style={styles.subListHeader}>✅ Foods to Favor:</Text>
              {result.dietRecommendations.favor.map((f, i) => (
                <View key={i} style={styles.bulletRow}>
                  <CheckCircle size={14} color={Colors.success} />
                  <Text style={styles.bulletText}>{f}</Text>
                </View>
              ))}

              <Text style={[styles.subListHeader, { marginTop: 14 }]}>⚠️ Foods to Minimize:</Text>
              {result.dietRecommendations.avoid.map((a, i) => (
                <View key={i} style={styles.bulletRow}>
                  <XCircle size={14} color={Colors.error} />
                  <Text style={styles.bulletText}>{a}</Text>
                </View>
              ))}
            </View>

            {/* Recommended Herbs (Aushadhi) */}
            <View style={styles.guideCard}>
              <View style={styles.guideHeader}>
                <Award size={20} color={Colors.turmericGold} />
                <Text style={styles.guideTitle}>Nourishing Herbs (Aushadhi)</Text>
              </View>
              <View style={styles.herbsRow}>
                {result.recommendedHerbs.map((h, i) => (
                  <View key={i} style={styles.herbChip}>
                    <Text style={styles.herbText}>{h}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Lifestyle & Routines (Vihara) */}
            <View style={styles.guideCard}>
              <View style={styles.guideHeader}>
                <HeartHandshake size={20} color="#7b1fa2" />
                <Text style={styles.guideTitle}>Daily Routine (Dinacharya)</Text>
              </View>
              {result.lifestyleTips.map((tip, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.dot} />
                  <Text style={styles.bulletText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Retake Button */}
            <TouchableOpacity style={styles.retakeBtn} onPress={restartQuiz} activeOpacity={0.8}>
              <RotateCcw size={16} color={Colors.oliveDeep} />
              <Text style={styles.retakeBtnText}>Retake Prakriti Assessment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── INITIAL UNASSESSED PROMPT ───────────────────────────────────── */}
        {!inQuiz && !result && (
          <View style={styles.introCard}>
            <View style={styles.introBadge}>
              <Sparkles size={36} color={Colors.turmericGold} />
            </View>
            <Text style={styles.introTitle}>Discover Your Ayurvedic Constitution</Text>
            <Text style={styles.introDesc}>
              In Ayurveda, every person has a unique bio-energy balance known as Prakriti (Vata, Pitta, and Kapha). Taking this 2-minute clinical assessment unlocks personalized diet charts, yoga routines, and botanical recommendations.
            </Text>

            <Button
              title="Start Assessment (8 Questions)"
              onPress={restartQuiz}
              size="lg"
              style={styles.startBtn}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDoshaDescription(dominant: string): string {
  if (dominant.includes('Vata')) {
    return 'Governed by Air and Space. Vata embodies movement, creativity, agility, and enthusiasm. When balanced, you are energetic and intuitive; when imbalanced, you may experience anxiety, dry skin, and irregular digestion.';
  }
  if (dominant.includes('Pitta')) {
    return 'Governed by Fire and Water. Pitta governs transformation, digestion, and metabolism. When balanced, you have sharp intelligence, great leadership, and steady hunger; when imbalanced, you are prone to acidity and irritability.';
  }
  return 'Governed by Earth and Water. Kapha represents structure, lubrication, and endurance. When balanced, you possess calm patience, deep loyalty, and great stamina; when imbalanced, you may lean toward lethargy and sluggish digestion.';
}

function getDietPlan(dominant: string) {
  if (dominant.includes('Vata')) {
    return {
      favor: [
        'Warm, freshly cooked nourishing soups, stews, and porridges',
        'Healthy fats: Ghee, cold-pressed sesame oil, and olive oil',
        'Sweet, ripe fruits: Bananas, avocados, soaked dates, and figs',
        'Warming spices: Fresh ginger, cinnamon, cumin, and cardamom',
      ],
      avoid: [
        'Raw, cold salads and iced carbonated beverages',
        'Dry crackers, popcorn, and astringent raw beans',
        'Excessive caffeine and irregular meal times',
      ],
    };
  }
  if (dominant.includes('Pitta')) {
    return {
      favor: [
        'Cooling, sweet, and naturally bitter foods',
        'Coconut water, fresh mint tea, sweet seasonal fruits',
        'Clarified butter (Ghee), basmati rice, soaked almonds',
        'Cooling herbs: Coriander seeds, fennel, cilantro, and licorice',
      ],
      avoid: [
        'Pungent, extremely spicy, sour, and fermented foods',
        'Excessive red chilies, mustard, vinegar, and fried foods',
        'Coffee, alcohol, and dining in heated stressful settings',
      ],
    };
  }
  return {
    favor: [
      'Warm, light, dry, and stimulating vegetable preparations',
      'Whole ancient grains: Barley, millet, quinoa, and buckwheat',
      'Pungent digestive spices: Black pepper, ginger, turmeric, clove',
      'Astringent legumes: Moong dal, lentils, and steamed greens',
    ],
    avoid: [
      'Heavy dairy, cheeses, and ice creams',
      'Oily, deep-fried snacks and refined white sugars',
      'Cold left-overs, excess salt, and daytime sleeping',
    ],
  };
}

function getLifestyleTips(dominant: string): string[] {
  if (dominant.includes('Vata')) {
    return [
      'Establish a grounded daily rhythm (Abhyanga warm oil self-massage before bath)',
      'Keep your body warm, especially feet, lower back, and ears',
      'Gentle yoga: Slow Hatha flows, grounding mountain pose, and deep Nadi Shodhana breathing',
      'Sleep by 10:00 PM to protect your nervous system',
    ];
  }
  if (dominant.includes('Pitta')) {
    return [
      'Avoid midday intense sun exposure; take evening moonlight walks',
      'Cultivate moderation and take breaks from competitive environments',
      'Cooling yoga: Moon salutations (Chandra Namaskar) and Sheetali Pranayama',
      'Diffuse cooling essential oils like rose, sandalwood, and vetiver',
    ];
  }
  return [
    'Engage in brisk, vigorous daily cardio or dynamic Surya Namaskar',
    'Rise early before sunrise (by 6:00 AM) to dispel mental heaviness',
    'Dry brush your skin (Garshana) to stimulate lymphatic flow',
    'Keep your surroundings bright, warm, and actively stimulating',
  ];
}

function getHerbs(dominant: string): string[] {
  if (dominant.includes('Vata')) {
    return ['Ashwagandha (Strength)', 'Brahmi (Calm Mind)', 'Triphala (Digestion)', 'Shatavari (Vitality)'];
  }
  if (dominant.includes('Pitta')) {
    return ['Amla / Amalaki (Cooling Vitamin C)', 'Guduchi (Immunity)', 'Shatavari (Digestive Soothing)', 'Neem (Purification)'];
  }
  return ['Trikatu (Digestive Fire)', 'Tulsi / Holy Basil (Respiratory)', 'Guggulu (Metabolism)', 'Punarnava (Fluid Balance)'];
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  container: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginTop: 4,
  },
  introCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  introBadge: {
    width: 72,
    height: 72,
    borderRadius: 26,
    backgroundColor: '#fff8e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.inkStrong,
    textAlign: 'center',
    marginBottom: 10,
  },
  introDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  startBtn: {
    width: '100%',
  },
  quizCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#eee9dd',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.oliveAction,
    borderRadius: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questionCounter: {
    fontSize: 12,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf7f2',
    borderWidth: 1.5,
    borderColor: '#e8e2d5',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  optionRadio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetter: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.cream,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.inkStrong,
    fontWeight: '500',
    lineHeight: 18,
  },
  calculatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  calculatingText: {
    fontSize: 13,
    color: Colors.oliveDeep,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 16,
  },
  doshaBadgeWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#fff8e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dominantTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.oliveDeep,
    marginBottom: 8,
  },
  doshaDescription: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  meterContainer: {
    width: '100%',
    gap: 10,
  },
  meterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meterLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meterName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  meterVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  track: {
    height: 8,
    backgroundColor: '#eee9dd',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  guideCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  subListHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    color: Colors.inkMuted,
    lineHeight: 17,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.olive,
    marginTop: 6,
  },
  herbsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  herbChip: {
    backgroundColor: Colors.sagePale,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  herbText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.sagePale,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  retakeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.inkMuted,
  },
});
