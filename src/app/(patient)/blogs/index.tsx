// src/app/(patient)/blogs/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
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
  ArrowLeft,
  BookOpen,
  Calendar,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  User,
  X,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import { Colors, Shadows } from '../../../constants/theme';
import { BlogItem } from '../../../types/patient';
import {
  BLOG_CATEGORY_OPTIONS,
  cacheBlogItems,
  formatBlogDate,
  getBlogAuthor,
  getBlogCardThumbnail,
  getBlogTags,
  isVideoBlog,
  stripHtmlPreview,
} from '../../../utils/blogContent';

type ContentTab = 'all' | 'blog' | 'video';

const TABS: Array<{ id: ContentTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'blog', label: 'Blogs' },
  { id: 'video', label: 'Videos' },
];

export default function BlogsVideosScreen() {
  const router = useRouter();

  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ContentTab>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBlogs = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const items = await patientApi.getAllBlogs();
      cacheBlogItems(items);
      setBlogs(items);
    } catch (err: any) {
      setError(err?.message || 'Unable to load blogs and videos right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs(false);
  }, [fetchBlogs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBlogs(true);
  };

  const selectedCategoryOption = useMemo(
    () => BLOG_CATEGORY_OPTIONS.find((opt) => opt.value === selectedCategory),
    [selectedCategory]
  );

  const filteredBlogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return blogs.filter((item) => {
      const isVideo = isVideoBlog(item);
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'blog' && !isVideo) ||
        (activeTab === 'video' && isVideo);

      if (!matchesTab) return false;

      if (selectedCategory !== 'all') {
        const itemTags = getBlogTags(item).map((t) => t.toLowerCase());
        const targets = [
          selectedCategory.toLowerCase(),
          ...(selectedCategoryOption?.aliases || []).map((a) => a.toLowerCase()),
        ];
        const matchesCat = itemTags.some((tag) => targets.includes(tag));
        if (!matchesCat) return false;
      }

      if (q) {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const bodyMatch = stripHtmlPreview(item.description, 400).toLowerCase().includes(q);
        const authorMatch = getBlogAuthor(item).toLowerCase().includes(q);
        const tagMatch = getBlogTags(item).some((t) => t.toLowerCase().includes(q));
        if (!titleMatch && !bodyMatch && !authorMatch && !tagMatch) return false;
      }

      return true;
    });
  }, [blogs, activeTab, selectedCategory, selectedCategoryOption, searchQuery]);

  const openBlogDetail = (item: BlogItem) => {
    cacheBlogItems([item]);
    router.push({
      pathname: '/(patient)/blogs/[id]',
      params: { id: item._id },
    } as any);
  };

  const renderCard = ({ item }: { item: BlogItem }) => {
    const isVideo = isVideoBlog(item);
    const thumbnail = getBlogCardThumbnail(item);
    const tags = getBlogTags(item);
    const author = getBlogAuthor(item);
    const preview = stripHtmlPreview(item.description, 120);
    const dateLabel = formatBlogDate(item.date);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.86}
        onPress={() => openBlogDetail(item)}
      >
        {/* Cover / Video Thumbnail */}
        <View style={styles.mediaWrap}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.mediaImg} resizeMode="cover" />
          ) : (
            <View style={styles.mediaPlaceholder}>
              {isVideo ? (
                <Play size={30} color={Colors.oliveAction} />
              ) : (
                <BookOpen size={30} color={Colors.oliveAction} />
              )}
            </View>
          )}

          {isVideo ? (
            <View style={styles.videoPlayOverlay}>
              <View style={styles.playCircle}>
                <Play size={18} color="#ffffff" fill="#ffffff" />
              </View>
            </View>
          ) : null}

          <View style={[styles.typeBadge, isVideo ? styles.typeBadgeVideo : styles.typeBadgeArticle]}>
            {isVideo ? (
              <Play size={11} color="#ffffff" fill="#ffffff" />
            ) : (
              <BookOpen size={11} color={Colors.oliveDeep} />
            )}
            <Text
              style={[
                styles.typeBadgeText,
                isVideo ? styles.typeBadgeTextVideo : styles.typeBadgeTextArticle,
              ]}
            >
              {isVideo ? 'Video' : item.type === 'ai' ? 'Curated' : 'Article'}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <User size={12} color={Colors.inkMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {author}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={12} color={Colors.inkMuted} />
              <Text style={styles.metaText}>{dateLabel}</Text>
            </View>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.cardPreview} numberOfLines={2}>
            {preview}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.tagsWrap}>
              {tags.slice(0, 2).map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText} numberOfLines={1}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.ctaPill}>
              {isVideo ? (
                <Play size={12} color="#ffffff" fill="#ffffff" />
              ) : (
                <BookOpen size={12} color="#ffffff" />
              )}
              <Text style={styles.ctaText}>
                {isVideo ? 'Watch Video' : 'Read Article'}
              </Text>
            </View>
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

        <Text style={styles.navTitle}>Blogs & Videos</Text>

        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filteredBlogs.length}</Text>
        </View>
      </View>

      <FlatList
        data={loading ? [] : filteredBlogs}
        keyExtractor={(item, idx) => item._id || `blog-${idx}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.olive}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {/* Hero Banner */}
            <View style={styles.heroBanner}>
              <View style={styles.heroBadge}>
                <Sparkles size={13} color={Colors.turmericGold} />
                <Text style={styles.heroBadgeText}>Ayurvedic Knowledge Hub</Text>
              </View>
              <Text style={styles.heroTitle}>Health Blogs & Wellness Videos</Text>
              <Text style={styles.heroSubtitle}>
                Doctor-authored insights, herbal wisdom, and guided video features with instant Hindi translation.
              </Text>
              <View style={styles.heroActions}>
                <TouchableOpacity
                  style={styles.heroBtnPrimary}
                  activeOpacity={0.85}
                  onPress={() => setActiveTab('blog')}
                >
                  <BookOpen size={14} color="#ffffff" />
                  <Text style={styles.heroBtnPrimaryText}>Explore Articles</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.heroBtnSecondary}
                  activeOpacity={0.85}
                  onPress={() => setActiveTab('video')}
                >
                  <Play size={14} color={Colors.oliveDeep} />
                  <Text style={styles.heroBtnSecondaryText}>Watch Videos</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchWrap}>
              <Search size={18} color={Colors.inkMuted} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search articles, videos, herbs, or authors..."
                placeholderTextColor={Colors.inkLight}
                returnKeyType="search"
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                  <X size={16} color={Colors.inkMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* All / Blogs / Videos Segmented Tabs */}
            <View style={styles.tabsRow}>
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tabBtn, active && styles.tabBtnActive]}
                    activeOpacity={0.8}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    {tab.id === 'blog' ? (
                      <BookOpen
                        size={14}
                        color={active ? '#ffffff' : Colors.oliveDeep}
                      />
                    ) : tab.id === 'video' ? (
                      <Play
                        size={14}
                        color={active ? '#ffffff' : Colors.oliveDeep}
                      />
                    ) : null}
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {BLOG_CATEGORY_OPTIONS.map((opt) => {
                const active = selectedCategory === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedCategory(opt.value)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={renderCard}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={Colors.olive} />
              <Text style={styles.centerText}>Loading Ayurvedic blogs & videos...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <Text style={styles.errorTitle}>Couldn't load content</Text>
              <Text style={styles.centerText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => fetchBlogs(false)}
                activeOpacity={0.85}
              >
                <RefreshCw size={15} color="#ffffff" />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.centerState}>
              <Search size={34} color={Colors.inkLight} />
              <Text style={styles.emptyTitle}>No matching content found</Text>
              <Text style={styles.centerText}>
                Try adjusting your search query, category filter, or tab.
              </Text>
            </View>
          )
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
  countBadge: {
    minWidth: 36,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  headerBlock: {
    gap: 12,
    marginBottom: 6,
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
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.inkMuted,
    lineHeight: 19,
    marginBottom: 14,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  heroBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  heroBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  heroBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
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
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtnActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.oliveDeep,
    borderColor: Colors.oliveDeep,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.inkMuted,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  mediaWrap: {
    position: 'relative',
    height: 170,
    backgroundColor: Colors.sagePale,
  },
  mediaImg: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.creamTint,
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeBadgeVideo: {
    backgroundColor: 'rgba(47,53,36,0.88)',
  },
  typeBadgeArticle: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  typeBadgeTextVideo: {
    color: '#ffffff',
  },
  typeBadgeTextArticle: {
    color: Colors.oliveDeep,
  },
  cardBody: {
    padding: 15,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '55%',
  },
  metaText: {
    fontSize: 11,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
    lineHeight: 23,
  },
  cardPreview: {
    fontSize: 13,
    color: Colors.inkMuted,
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  tagPill: {
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 110,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    gap: 10,
  },
  centerText: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.error,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 4,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
