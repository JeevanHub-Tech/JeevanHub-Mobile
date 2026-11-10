// src/app/(patient)/treatments/index.tsx
import React, { useMemo, useState } from 'react';
import {
  FlatList,
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
  ArrowRight,
  Bone,
  Brain,
  Droplets,
  Eye,
  Flame,
  HandHeart,
  HeartHandshake,
  HeartPulse,
  Languages,
  Leaf,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Sparkles,
  Wind,
  X,
  Zap,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../../constants/theme';
import {
  getCategoryDisplayName,
  getTreatmentData,
  TREATMENT_CATEGORIES,
  TreatmentCategoryMeta,
  TreatmentIconName,
  TreatmentLanguage,
} from '../../../data/treatments';

function renderCategoryIcon(icon: TreatmentIconName, color: string, size = 24) {
  switch (icon) {
    case 'Flame':
      return <Flame size={size} color={color} />;
    case 'Wind':
      return <Wind size={size} color={color} />;
    case 'Sparkles':
      return <Sparkles size={size} color={color} />;
    case 'Bone':
      return <Bone size={size} color={color} />;
    case 'HeartPulse':
      return <HeartPulse size={size} color={color} />;
    case 'Brain':
      return <Brain size={size} color={color} />;
    case 'Activity':
      return <Activity size={size} color={color} />;
    case 'ShieldCheck':
      return <ShieldCheck size={size} color={color} />;
    case 'HeartHandshake':
      return <HeartHandshake size={size} color={color} />;
    case 'Zap':
      return <Zap size={size} color={color} />;
    case 'Droplets':
      return <Droplets size={size} color={color} />;
    case 'Eye':
      return <Eye size={size} color={color} />;
    case 'Smile':
      return <Smile size={size} color={color} />;
    case 'Leaf':
      return <Leaf size={size} color={color} />;
    case 'ShieldAlert':
      return <ShieldAlert size={size} color={color} />;
    case 'HandHeart':
      return <HandHeart size={size} color={color} />;
    default:
      return <Leaf size={size} color={color} />;
  }
}

export default function TreatmentsDirectoryScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<TreatmentLanguage>('en');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return TREATMENT_CATEGORIES;

    return TREATMENT_CATEGORIES.filter((cat) => {
      const enName = getCategoryDisplayName(cat.key, 'en').toLowerCase();
      const hiName = getCategoryDisplayName(cat.key, 'hi').toLowerCase();
      const dataEn = getTreatmentData(cat.key, 'en');
      const dataHi = getTreatmentData(cat.key, 'hi');

      const concernMatch =
        dataEn?.concerns.some((c) => c.title.toLowerCase().includes(q)) ||
        dataHi?.concerns.some((c) => c.title.toLowerCase().includes(q));

      return enName.includes(q) || hiName.includes(q) || Boolean(concernMatch);
    });
  }, [searchQuery]);

  const openCategory = (categoryKey: string) => {
    router.push({
      pathname: '/(patient)/treatments/[category]',
      params: { category: categoryKey, lang },
    } as any);
  };

  const renderCategoryCard = ({ item }: { item: TreatmentCategoryMeta }) => {
    const displayName = getCategoryDisplayName(item.key, lang);
    const detail = getTreatmentData(item.key, lang);
    const concernCount = detail?.concerns.length || 0;
    const previewConcern = detail?.concerns[0]?.title || '';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.84}
        onPress={() => openCategory(item.key)}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.iconBox, { backgroundColor: item.tint }]}>
            {renderCategoryIcon(item.icon, item.accent, 22)}
          </View>
          <View style={styles.arrowChip}>
            <ArrowRight size={14} color={Colors.oliveDeep} />
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {displayName}
        </Text>

        {previewConcern ? (
          <Text style={styles.cardPreview} numberOfLines={2}>
            {previewConcern}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={[styles.countPill, { backgroundColor: item.tint }]}>
            <Text style={[styles.countText, { color: item.accent }]}>
              {concernCount} {lang === 'hi' ? 'उपचार विषय' : 'concerns'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={Colors.inkStrong} />
        </TouchableOpacity>

        <Text style={styles.navTitle}>
          {lang === 'hi' ? 'आयुर्वेदिक उपचार' : 'Ayurvedic Treatments'}
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

      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.key}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {/* Intro Hero */}
            <View style={styles.heroBanner}>
              <View style={styles.heroBadge}>
                <Leaf size={13} color={Colors.oliveAction} />
                <Text style={styles.heroBadgeText}>
                  {lang === 'hi' ? 'समग्र आयुर्वेदिक मार्गदर्शन' : 'Holistic Ayurvedic Care'}
                </Text>
              </View>
              <Text style={styles.heroTitle}>
                {lang === 'hi'
                  ? 'स्वास्थ्य समस्या के अनुसार उपचार खोजें'
                  : 'Explore Care Across 16 Health Areas'}
              </Text>
              <Text style={styles.heroSubtitle}>
                {lang === 'hi'
                  ? 'दोष-आधारित लक्षण, आहार नियम, जीवनशैली और प्रामाणिक जड़ी-बूटियों की जानकारी देखें।'
                  : 'Browse remedies, classical herbal approaches, diet guidance, and book specialist care.'}
              </Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchWrap}>
              <Search size={18} color={Colors.inkMuted} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={
                  lang === 'hi'
                    ? 'उपचार या लक्षण खोजें (जैसे पाचन, त्वचा, तनाव)...'
                    : 'Search category or concern (e.g. IBS, asthma, PCOS)...'
                }
                placeholderTextColor={Colors.inkLight}
                returnKeyType="search"
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                  <X size={16} color={Colors.inkMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        }
        renderItem={renderCategoryCard}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Leaf size={36} color={Colors.inkLight} />
            <Text style={styles.emptyTitle}>
              {lang === 'hi' ? 'कोई उपचार श्रेणी नहीं मिली' : 'No matching treatments'}
            </Text>
            <Text style={styles.emptyDesc}>
              {lang === 'hi'
                ? 'कृपया कोई अन्य स्वास्थ्य शब्द आज़माएं।'
                : 'Try searching a different health area or symptom.'}
            </Text>
          </View>
        }
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
  listContent: {
    padding: 16,
    paddingBottom: 36,
  },
  headerBlock: {
    marginBottom: 16,
    gap: 14,
  },
  heroBanner: {
    backgroundColor: Colors.creamTint,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.oliveDeep,
    marginBottom: 6,
    lineHeight: 26,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.inkMuted,
    lineHeight: 19,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.inkStrong,
    padding: 0,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: '48.3%',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
    lineHeight: 19,
    marginBottom: 6,
  },
  cardPreview: {
    fontSize: 11,
    color: Colors.inkMuted,
    lineHeight: 15,
    marginBottom: 12,
  },
  cardFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  countPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
  },
});
