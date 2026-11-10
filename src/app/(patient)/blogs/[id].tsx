// src/app/(patient)/blogs/[id].tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  Calendar,
  ExternalLink,
  Globe,
  Sparkles,
  Stethoscope,
  User,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import {
  BlogRichContent,
  openExternalUrl,
  VideoWatchCard,
} from '../../../components/blog/BlogRichContent';
import { Colors, Shadows } from '../../../constants/theme';
import { BlogItem, BlogTranslation } from '../../../types/patient';
import {
  extractBlogVideos,
  formatBlogDate,
  getBlogAuthor,
  getBlogTags,
  getCachedBlogItem,
  resolveRemoteImageUrl,
} from '../../../utils/blogContent';

export default function BlogDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const blogId = Array.isArray(params.id) ? params.id[0] : params.id || '';

  const initialCached = useMemo(
    () => (blogId ? getCachedBlogItem(blogId) : undefined),
    [blogId]
  );

  const [blog, setBlog] = useState<BlogItem | null>(initialCached || null);
  const [loading, setLoading] = useState(!initialCached);
  const [error, setError] = useState<string | null>(null);

  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);
  const [translatedData, setTranslatedData] = useState<BlogTranslation | null>(
    initialCached?.translations?.hi || null
  );

  useEffect(() => {
    if (!blogId) {
      setLoading(false);
      setError('Blog ID is missing.');
      return;
    }

    let cancelled = false;
    patientApi
      .getBlogById(blogId)
      .then((fresh) => {
        if (cancelled) return;
        setBlog((prev) => ({
          ...prev,
          ...fresh,
          // Keep normalized videos/embeds if list endpoint provided them
          videos: fresh.videos ?? prev?.videos,
          embeds: fresh.embeds ?? prev?.embeds,
          image: fresh.image ?? prev?.image,
        }));
        if (fresh?.translations?.hi) {
          setTranslatedData(fresh.translations.hi);
        }
        setError(null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        if (!initialCached) {
          setError(err?.message || 'Could not load this article.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [blogId, initialCached]);

  const handleToggleTranslate = async () => {
    if (showTranslated) {
      setShowTranslated(false);
      return;
    }

    if (translatedData) {
      setShowTranslated(true);
      return;
    }

    if (!blogId) return;
    setIsTranslating(true);
    try {
      const translated = await patientApi.translateBlog(blogId, 'hi');
      setTranslatedData(translated);
      setShowTranslated(true);
    } catch (err: any) {
      Alert.alert(
        'Hindi Translation Unavailable',
        err?.message?.toLowerCase().includes('not found')
          ? 'Hindi translation is currently available for doctor-authored articles only.'
          : err?.message || 'Unable to translate this article right now.'
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const videos = useMemo(() => (blog ? extractBlogVideos(blog) : []), [blog]);
  const coverImage = useMemo(() => resolveRemoteImageUrl(blog?.image), [blog?.image]);
  const hasEmbeddedVideo = useMemo(
    () => videos.length > 0 || /<iframe|<video/i.test(blog?.description || ''),
    [videos.length, blog?.description]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.inkStrong} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Loading...</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!blog || error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.inkStrong} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Article</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {error || 'No blog data found. Please go back and try another article.'}
          </Text>
          <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
            <ArrowLeft size={15} color="#ffffff" />
            <Text style={styles.backPillText}>Back to Blogs</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayTitle =
    showTranslated && translatedData?.title ? translatedData.title : blog.title;
  const displayCategory =
    showTranslated && translatedData?.category ? translatedData.category : blog.category;
  const displayContent =
    showTranslated && translatedData?.description
      ? translatedData.description
      : blog.description || '<p>Content not available.</p>';
  const author = getBlogAuthor(blog);
  const dateLabel = formatBlogDate(blog.date, 'Date unavailable');
  const tags = getBlogTags(blog);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Navigation + Hindi Translate Switch */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
          accessibilityLabel="Back to blogs"
        >
          <ArrowLeft size={20} color={Colors.inkStrong} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.translateBtn, showTranslated && styles.translateBtnActive]}
          onPress={handleToggleTranslate}
          disabled={isTranslating}
          activeOpacity={0.82}
        >
          {isTranslating ? (
            <>
              <ActivityIndicator size="small" color={Colors.oliveDeep} />
              <Text style={styles.translateBtnText}>Translating to Hindi...</Text>
            </>
          ) : showTranslated ? (
            <>
              <Globe size={14} color="#ffffff" />
              <Text style={[styles.translateBtnText, styles.translateBtnTextActive]}>
                View Original English
              </Text>
            </>
          ) : (
            <>
              <Sparkles size={14} color={Colors.turmericGold} />
              <Text style={styles.translateBtnText}>Translate to Hindi (हिंदी)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Video Card(s) if Video Blog */}
        {videos.length > 0 ? (
          <View style={styles.videosSection}>
            {videos.map((vid, idx) => (
              <VideoWatchCard
                key={vid.id}
                video={vid}
                label={
                  videos.length > 1
                    ? `Watch Featured Video ${idx + 1}`
                    : displayTitle
                }
              />
            ))}
          </View>
        ) : null}

        {/* Cover Image (when not an embedded video blog, matching web Blog.jsx) */}
        {coverImage && !hasEmbeddedVideo ? (
          <Image
            source={{ uri: coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : null}

        {/* Title & Metadata Header */}
        <View style={styles.headerMetaCard}>
          {displayCategory ? (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{displayCategory}</Text>
            </View>
          ) : null}

          <Text style={styles.title}>{displayTitle}</Text>

          <View style={styles.bylineRow}>
            <View style={styles.bylineItem}>
              <User size={13} color={Colors.oliveAction} />
              <Text style={styles.bylineText}>By {author}</Text>
            </View>
            <View style={styles.bylineItem}>
              <Calendar size={13} color={Colors.inkMuted} />
              <Text style={styles.bylineText}>{dateLabel}</Text>
            </View>
          </View>

          {tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Rich Article Body */}
        <View style={styles.articleCard}>
          <BlogRichContent html={displayContent} />
        </View>

        {/* External Reference Link (for curated AI blogs) */}
        {blog.url && /^https?:\/\//i.test(blog.url) ? (
          <TouchableOpacity
            style={styles.sourceBtn}
            activeOpacity={0.85}
            onPress={() => openExternalUrl(blog.url!)}
          >
            <ExternalLink size={15} color={Colors.oliveDeep} />
            <Text style={styles.sourceBtnText}>Read Original Source</Text>
          </TouchableOpacity>
        ) : null}

        {/* Doctor Consultation Footer CTA */}
        <View style={styles.consultFooter}>
          <Text style={styles.consultFooterTitle}>
            Want personalized Ayurvedic advice?
          </Text>
          <Text style={styles.consultFooterDesc}>
            Speak with a certified JeevanHub doctor for Dosha-tailored remedies and treatment plans.
          </Text>
          <TouchableOpacity
            style={styles.consultFooterBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(patient)/(tabs)/doctors')}
          >
            <Stethoscope size={16} color={Colors.oliveDeep} />
            <Text style={styles.consultFooterBtnText}>Consult a Doctor</Text>
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
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.surface,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  translateBtnActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  translateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  translateBtnTextActive: {
    color: '#ffffff',
  },
  content: {
    padding: 16,
    paddingBottom: 44,
    gap: 16,
  },
  videosSection: {
    gap: 12,
  },
  coverImage: {
    width: '100%',
    height: 210,
    borderRadius: 20,
    backgroundColor: Colors.sagePale,
  },
  headerMetaCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Shadows.card,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  bylineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
  },
  bylineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bylineText: {
    fontSize: 12,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tagChip: {
    backgroundColor: Colors.creamTint,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.oliveDeep,
  },
  articleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.sagePale,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  sourceBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  consultFooter: {
    backgroundColor: Colors.oliveDeep,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  consultFooterTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  consultFooterDesc: {
    fontSize: 13,
    color: Colors.creamTint,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 6,
  },
  consultFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
  },
  consultFooterBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
    lineHeight: 20,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  backPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});

