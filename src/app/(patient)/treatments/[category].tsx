// src/app/(patient)/treatments/[category].tsx
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Languages,
  Leaf,
  Stethoscope,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../../constants/theme';
import {
  getCategoryDisplayName,
  getConsultationHighlight,
  getTreatmentData,
  TreatmentConcern,
  TreatmentLanguage,
} from '../../../data/treatments';

function ConcernCard({
  concern,
  index,
  lang,
  onBookConsultation,
}: {
  concern: TreatmentConcern;
  index: number;
  lang: TreatmentLanguage;
  onBookConsultation: () => void;
}) {
  const numLabel = String(index + 1).padStart(2, '0');

  return (
    <View style={styles.concernCard}>
      <View style={styles.concernTopRow}>
        <View style={styles.numBadge}>
          <Text style={styles.numBadgeText}>{numLabel}</Text>
        </View>
        <View style={styles.concernTagPill}>
          <Text style={styles.concernTagText}>
            {lang === 'hi' ? 'सामान्य समस्या' : 'COMMON CONCERN'}
          </Text>
        </View>
      </View>

      <Text style={styles.concernTitle}>{concern.title}</Text>
      <Text style={styles.concernDesc}>{concern.description}</Text>

      <View style={styles.approachHeader}>
        <Leaf size={15} color={Colors.oliveAction} />
        <Text style={styles.approachHeading}>
          {lang === 'hi' ? 'आयुर्वेदिक उपचार पद्धति' : 'Ayurvedic Approach'}
        </Text>
      </View>

      <View style={styles.approachList}>
        {concern.approach.map((step, i) => (
          <View key={i} style={styles.approachItem}>
            <View style={styles.approachLeafWrap}>
              <Leaf size={13} color={Colors.oliveAction} />
            </View>
            <Text style={styles.approachText}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.concernFooter}>
        <Text style={styles.concernCtaNote}>{concern.callToAction}</Text>
        <TouchableOpacity
          style={styles.bookBtn}
          activeOpacity={0.85}
          onPress={onBookConsultation}
        >
          <Text style={styles.bookBtnText}>
            {lang === 'hi' ? 'परामर्श बुक करें' : 'Book Consultation'}
          </Text>
          <ArrowRight size={15} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TreatmentDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; lang?: string }>();

  const decodedCategory = useMemo(() => {
    const raw = Array.isArray(params.category) ? params.category[0] : params.category || '';
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [params.category]);

  const initialLang: TreatmentLanguage = params.lang === 'hi' ? 'hi' : 'en';
  const [lang, setLang] = useState<TreatmentLanguage>(initialLang);

  const details = useMemo(
    () => getTreatmentData(decodedCategory, lang),
    [decodedCategory, lang]
  );

  const consultation = useMemo(
    () => getConsultationHighlight(decodedCategory, lang),
    [decodedCategory, lang]
  );

  const goToDoctors = () => {
    router.push('/(patient)/(tabs)/doctors');
  };

  if (!details) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.navBackBtn}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <ArrowLeft size={20} color={Colors.inkStrong} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Treatments</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notFoundWrap}>
          <Leaf size={40} color={Colors.inkLight} />
          <Text style={styles.notFoundTitle}>
            {lang === 'hi' ? 'उपचार श्रेणी नहीं मिली' : 'Treatment category not found'}
          </Text>
          <TouchableOpacity
            style={styles.backToListBtn}
            onPress={() => router.replace('/(patient)/treatments' as any)}
          >
            <ArrowLeft size={16} color="#ffffff" />
            <Text style={styles.backToListText}>
              {lang === 'hi' ? 'सभी उपचार देखें' : 'Back to Treatments'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={Colors.inkStrong} />
        </TouchableOpacity>

        <Text style={styles.navTitle} numberOfLines={1}>
          {getCategoryDisplayName(decodedCategory, lang)}
        </Text>

        <TouchableOpacity
          style={styles.langToggle}
          onPress={() => setLang((prev) => (prev === 'en' ? 'hi' : 'en'))}
          activeOpacity={0.8}
          accessibilityLabel="Switch language"
        >
          <Languages size={14} color={Colors.oliveDeep} />
          <Text style={styles.langToggleText}>{lang === 'en' ? 'हिंदी' : 'EN'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBar} />
          <Text style={styles.heroTitle}>{details.title}</Text>
          <Text style={styles.heroDesc}>{details.description}</Text>
          <View style={styles.heroMetaPill}>
            <Leaf size={13} color={Colors.oliveAction} />
            <Text style={styles.heroMetaText}>
              {details.concerns.length}{' '}
              {lang === 'hi' ? 'मुख्य स्वास्थ्य समस्याएं एवं उपचार' : 'Common Concerns & Remedies'}
            </Text>
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {lang === 'hi'
              ? 'प्रमुख समस्याएं और आयुर्वेदिक दृष्टिकोण'
              : 'Common Concerns & Ayurvedic Approach'}
          </Text>
          <View style={styles.sectionUnderline} />
        </View>

        {/* Concern Cards */}
        <View style={styles.concernsList}>
          {details.concerns.map((concern, index) => (
            <ConcernCard
              key={`${decodedCategory}-${index}`}
              concern={concern}
              index={index}
              lang={lang}
              onBookConsultation={goToDoctors}
            />
          ))}
        </View>

        {/* Ayurvedic Consultation Highlight */}
        <View style={styles.consultCard}>
          <Text style={styles.consultTitle}>{consultation.title}</Text>

          <View style={styles.consultPoints}>
            {consultation.points.map((pt, idx) => (
              <View key={idx} style={styles.consultPointRow}>
                <View style={styles.checkWrap}>
                  <Check size={13} color={Colors.turmericGold} />
                </View>
                <Text style={styles.consultPointText}>{pt}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.consultCtaText}>{consultation.callToAction}</Text>

          <TouchableOpacity
            style={styles.findDoctorBtn}
            activeOpacity={0.85}
            onPress={goToDoctors}
          >
            <Stethoscope size={17} color={Colors.oliveDeep} />
            <Text style={styles.findDoctorText}>
              {lang === 'hi' ? 'आयुर्वेदिक डॉक्टर खोजें' : 'Find an Ayurvedic Doctor'}
            </Text>
          </TouchableOpacity>
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
  content: {
    padding: 16,
    paddingBottom: 44,
    gap: 18,
  },
  heroCard: {
    backgroundColor: Colors.creamTint,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  heroBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.turmericGold,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.oliveDeep,
    lineHeight: 28,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    color: Colors.inkMuted,
    lineHeight: 21,
    marginBottom: 14,
  },
  heroMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroMetaText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  sectionHeader: {
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionUnderline: {
    width: 64,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.turmericGold,
  },
  concernsList: {
    gap: 16,
  },
  concernCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  concernTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  numBadge: {
    backgroundColor: Colors.oliveDeep,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  numBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  concernTagPill: {
    backgroundColor: '#fef6e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  concernTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.barkBrown,
    letterSpacing: 0.5,
  },
  concernTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
    lineHeight: 24,
    marginBottom: 8,
  },
  concernDesc: {
    fontSize: 14,
    color: Colors.inkMuted,
    lineHeight: 21,
    marginBottom: 14,
  },
  approachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  approachHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  approachList: {
    gap: 8,
    marginBottom: 14,
  },
  approachItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.sagePale,
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  approachLeafWrap: {
    marginTop: 3,
  },
  approachText: {
    flex: 1,
    fontSize: 13,
    color: Colors.ink,
    lineHeight: 19,
  },
  concernFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    gap: 10,
  },
  concernCtaNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.barkBrown,
    lineHeight: 18,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.oliveAction,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    ...Shadows.button,
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  consultCard: {
    backgroundColor: Colors.oliveDeep,
    borderRadius: 24,
    padding: 20,
    marginTop: 6,
    ...Shadows.card,
  },
  consultTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 25,
  },
  consultPoints: {
    gap: 10,
    marginBottom: 16,
  },
  consultPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  checkWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(200,162,74,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  consultPointText: {
    flex: 1,
    fontSize: 13,
    color: Colors.creamTint,
    lineHeight: 19,
  },
  consultCtaText: {
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    fontWeight: '500',
  },
  findDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 22,
    alignSelf: 'center',
  },
  findDoctorText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
    textAlign: 'center',
  },
  backToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  backToListText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
