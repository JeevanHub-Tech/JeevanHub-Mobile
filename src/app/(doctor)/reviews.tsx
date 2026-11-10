// src/app/(doctor)/reviews.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, MessageSquare, Star } from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { Colors, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { DoctorAppointment } from '../../types/doctor';

export default function DoctorReviewsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [reviews, setReviews] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReviews = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      if (!isRefresh) setLoading(true);
      try {
        const list = await doctorApi.getDoctorReviews(user.id);
        setReviews(list);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    loadReviews(false);
  }, [loadReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews(true);
  };

  const averageRating = useMemo(() => {
    const rated = reviews.filter((r) => typeof r.rating === 'number' && r.rating > 0);
    if (!rated.length) return user?.rating ? Number(user.rating).toFixed(1) : '—';
    const sum = rated.reduce((s, r) => s + (r.rating || 0), 0);
    return (sum / rated.length).toFixed(1);
  }, [reviews, user?.rating]);

  const renderReview = ({ item }: { item: DoctorAppointment }) => {
    const dateRaw = item.dateOfAppointment || item.date;
    const dateLabel = dateRaw
      ? new Date(dateRaw).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.patientName}>{item.patientName || 'Patient'}</Text>
          {dateLabel ? (
            <View style={styles.dateRow}>
              <Calendar size={12} color={Colors.inkMuted} />
              <Text style={styles.dateText}>{dateLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={15}
              color={
                n <= (item.rating || 0) ? Colors.turmericGold : Colors.borderStrong
              }
              fill={n <= (item.rating || 0) ? Colors.turmericGold : 'transparent'}
            />
          ))}
        </View>

        {item.review ? <Text style={styles.reviewText}>“{item.review}”</Text> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkStrong} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Patient Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={loading ? [] : reviews}
        keyExtractor={(item) => item._id}
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
          <View style={styles.summaryCard}>
            <View style={styles.avgBadge}>
              <Star size={20} color={Colors.turmericGold} fill={Colors.turmericGold} />
              <Text style={styles.avgNum}>{averageRating}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Patient Feedback</Text>
              <Text style={styles.summarySub}>
                {reviews.length} verified consultation review
                {reviews.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        }
        renderItem={renderReview}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={Colors.olive} />
              <Text style={styles.centerText}>Loading patient reviews...</Text>
            </View>
          ) : (
            <View style={styles.centerBox}>
              <MessageSquare size={34} color={Colors.inkLight} />
              <Text style={styles.emptyTitle}>No Reviews Yet</Text>
              <Text style={styles.centerText}>
                Feedback submitted by patients after consultations will appear here.
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    ...Shadows.card,
  },
  avgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff8e6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  avgNum: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  summarySub: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  reviewText: {
    fontSize: 13,
    color: Colors.ink,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
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
  },
});

