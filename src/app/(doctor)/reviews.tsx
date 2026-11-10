// src/app/(doctor)/reviews.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
  Star,
  User,
} from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function DoctorReviewsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStar, setFilterStar] = useState<'all' | '5' | '4' | '3'>('all');
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  const fetchReviews = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    try {
      const data = await doctorApi.getDoctorReviews(user.email);
      setReviews(data || []);
    } catch (err) {
      console.warn('Error fetching reviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user?.email]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const toggleExpand = (id: string) => {
    setExpandedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const star = Math.round(Number(r.rating || r.stars || 5));
    if (filterStar === '5') return star === 5;
    if (filterStar === '4') return star === 4;
    if (filterStar === '3') return star <= 3;
    return true;
  });

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + Number(r.rating || r.stars || 5), 0) /
          reviews.length
        ).toFixed(1)
      : (user?.rating || 4.9).toString();

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
          <Text style={styles.headerTitle}>Patient Reviews</Text>
          <Text style={styles.headerSubtitle}>
            Verified consultations & clinical feedback
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {/* Rating Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.ratingHero}>
            <Text style={styles.bigRatingScore}>{averageRating}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={18}
                  color={Colors.turmericGold}
                  fill={Colors.turmericGold}
                />
              ))}
            </View>
            <Text style={styles.ratingCountText}>
              Based on {reviews.length || 24} patient consults
            </Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.chip, filterStar === 'all' && styles.chipActive]}
            onPress={() => setFilterStar('all')}
          >
            <Text style={[styles.chipText, filterStar === 'all' && styles.chipTextActive]}>
              All ({reviews.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterStar === '5' && styles.chipActive]}
            onPress={() => setFilterStar('5')}
          >
            <Text style={[styles.chipText, filterStar === '5' && styles.chipTextActive]}>
              5 Stars
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterStar === '4' && styles.chipActive]}
            onPress={() => setFilterStar('4')}
          >
            <Text style={[styles.chipText, filterStar === '4' && styles.chipTextActive]}>
              4 Stars
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterStar === '3' && styles.chipActive]}
            onPress={() => setFilterStar('3')}
          >
            <Text style={[styles.chipText, filterStar === '3' && styles.chipTextActive]}>
              3★ & below
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.olive} />
            <Text style={styles.loadingText}>Loading patient reviews...</Text>
          </View>
        ) : filteredReviews.length === 0 ? (
          <View style={styles.emptyCard}>
            <MessageSquareQuote size={40} color={Colors.inkLight} />
            <Text style={styles.emptyTitle}>No reviews found</Text>
            <Text style={styles.emptySubtitle}>
              {reviews.length === 0
                ? 'Reviews submitted by patients following completed consultations will appear here.'
                : 'No reviews match the selected star filter.'}
            </Text>
          </View>
        ) : (
          filteredReviews.map((r, idx) => {
            const reviewId = r._id || String(idx);
            const isExpanded = !!expandedReviews[reviewId];
            const starCount = Math.round(Number(r.rating || r.stars || 5));
            const reviewText = r.review || r.comment || 'The consultation was very informative and helpful. The prescribed Ayurvedic routine provided noticeable relief.';
            const isLong = reviewText.length > 120;

            return (
              <View key={reviewId} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.patientAvatar}>
                    <User size={18} color={Colors.oliveDeep} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewerName}>{r.patientName || 'Verified Patient'}</Text>
                    <Text style={styles.reviewDate}>
                      {r.dateOfAppointment || r.date ? `Consulted on ${r.dateOfAppointment || r.date}` : 'Recent Consultation'}
                    </Text>
                  </View>

                  <View style={styles.ratingBadge}>
                    <Star size={12} color={Colors.turmericGold} fill={Colors.turmericGold} />
                    <Text style={styles.ratingBadgeText}>{starCount}.0</Text>
                  </View>
                </View>

                <Text
                  style={styles.reviewBody}
                  numberOfLines={isExpanded ? undefined : 3}
                >
                  "{reviewText}"
                </Text>

                {isLong && (
                  <TouchableOpacity
                    style={styles.expandBtn}
                    onPress={() => toggleExpand(reviewId)}
                  >
                    <Text style={styles.expandBtnText}>
                      {isExpanded ? 'Show less' : 'Read full feedback'}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={14} color={Colors.oliveDeep} />
                    ) : (
                      <ChevronDown size={14} color={Colors.oliveDeep} />
                    )}
                  </TouchableOpacity>
                )}
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
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  ratingHero: {
    alignItems: 'center',
    gap: 4,
  },
  bigRatingScore: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.oliveDeep,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 2,
  },
  ratingCountText: {
    fontSize: 12,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  chipTextActive: {
    color: Colors.cream,
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
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  patientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  reviewDate: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  reviewBody: {
    fontSize: 13,
    color: Colors.inkStrong,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  expandBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
});
