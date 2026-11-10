// src/app/(doctor)/blogs.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function DoctorBlogsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBlogs = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const data = await doctorApi.getDoctorBlogs(user.id);
      setBlogs(data || []);
    } catch (err) {
      console.warn('Error fetching blogs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBlogs();
  };

  const handleDeleteBlog = (blog: any) => {
    Alert.alert(
      'Delete Blog Post',
      `Are you sure you want to delete "${blog.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(blog._id);
            try {
              await doctorApi.deleteBlog(blog._id);
              setBlogs((prev) => prev.filter((b) => b._id !== blog._id));
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete blog.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.oliveDeep} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>My Health Blogs</Text>
          <Text style={styles.headerSubtitle}>
            Ayurvedic articles & educational guidance
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newBlogHeaderBtn}
          onPress={() => router.push('/(doctor)/write-blog' as any)}
          activeOpacity={0.8}
        >
          <Plus size={16} color={Colors.cream} />
          <Text style={styles.newBlogHeaderBtnText}>Write</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {/* Banner with AI Writer CTA */}
        <View style={styles.aiWriterBanner}>
          <View style={styles.aiIconBadge}>
            <Sparkles size={22} color={Colors.turmericGold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiBannerTitle}>Ayurvedic AI Blog Studio</Text>
            <Text style={styles.aiBannerDesc}>
              Draft informative wellness articles in seconds. Publish directly to the JeevanHub patient community.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.aiBannerBtn}
            onPress={() => router.push('/(doctor)/write-blog' as any)}
          >
            <Text style={styles.aiBannerBtnText}>Draft with AI</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          Published Articles ({blogs.length})
        </Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.olive} />
            <Text style={styles.loadingText}>Loading your publications...</Text>
          </View>
        ) : blogs.length === 0 ? (
          <View style={styles.emptyCard}>
            <BookOpen size={42} color={Colors.inkLight} />
            <Text style={styles.emptyTitle}>No blogs published yet</Text>
            <Text style={styles.emptySubtitle}>
              Share Ayurvedic insights, Dinacharya tips, and dietary guidance with thousands of patients.
            </Text>
            <TouchableOpacity
              style={styles.writeFirstBtn}
              onPress={() => router.push('/(doctor)/write-blog' as any)}
            >
              <Plus size={16} color={Colors.cream} />
              <Text style={styles.writeFirstBtnText}>Write Your First Blog</Text>
            </TouchableOpacity>
          </View>
        ) : (
          blogs.map((blog) => {
            const dateStr = blog.createdAt || blog.date
              ? new Date(blog.createdAt || blog.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recent';

            const cleanDescription = (blog.description || '')
              .replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            return (
              <View key={blog._id} style={styles.blogCard}>
                {blog.image ? (
                  <Image source={{ uri: blog.image }} style={styles.blogCover} resizeMode="cover" />
                ) : null}

                <View style={styles.blogBody}>
                  <View style={styles.categoryRow}>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>
                        {blog.category || 'Ayurvedic Wellness'}
                      </Text>
                    </View>
                    <Text style={styles.blogDate}>📅 {dateStr}</Text>
                  </View>

                  <Text style={styles.blogTitle}>{blog.title}</Text>
                  <Text style={styles.blogSnippet} numberOfLines={3}>
                    {cleanDescription || 'No preview text available.'}
                  </Text>

                  {/* Actions */}
                  <View style={styles.blogActionsRow}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/(doctor)/write-blog',
                          params: { id: blog._id },
                        } as any)
                      }
                    >
                      <Pencil size={13} color={Colors.oliveDeep} />
                      <Text style={styles.editBtnText}>Edit Post</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteBlog(blog)}
                      disabled={deletingId === blog._id}
                    >
                      {deletingId === blog._id ? (
                        <ActivityIndicator size="small" color={Colors.error} />
                      ) : (
                        <>
                          <Trash2 size={13} color={Colors.error} />
                          <Text style={styles.deleteBtnText}>Delete</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  newBlogHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  newBlogHeaderBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.cream,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  aiWriterBanner: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  aiBannerDesc: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
    lineHeight: 14,
  },
  aiBannerBtn: {
    backgroundColor: '#92400e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiBannerBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.cream,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.oliveDeep,
    marginTop: 4,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  writeFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  writeFirstBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.cream,
  },
  blogCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  blogCover: {
    width: '100%',
    height: 150,
  },
  blogBody: {
    padding: 16,
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    backgroundColor: Colors.creamTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  blogDate: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
    lineHeight: 22,
  },
  blogSnippet: {
    fontSize: 12,
    color: Colors.inkMuted,
    lineHeight: 17,
  },
  blogActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.cream,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.error,
  },
});
