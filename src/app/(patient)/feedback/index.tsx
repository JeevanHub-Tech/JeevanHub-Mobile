// src/app/(patient)/feedback/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  Calendar,
  MessageSquare,
  Package,
  Star,
  Stethoscope,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import { RatingReviewModal } from '../../../components/consult/RatingReviewModal';
import { Colors, Shadows } from '../../../constants/theme';
import { useAuthStore } from '../../../store/authStore';
import type { Appointment, OrderRecord } from '../../../types/patient';
import { formatInr } from '../../../utils/medicineHelpers';
import {
  getBookingDisplayDate,
  getBookingDoctorName,
  isBookingAccepted,
} from '../../../utils/wellnessHelpers';

type FeedbackTab = 'consultations' | 'orders';

export default function PatientFeedbackScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<FeedbackTab>('consultations');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  const [ratingBooking, setRatingBooking] = useState<Appointment | null>(null);
  const [ratingOrder, setRatingOrder] = useState<OrderRecord | null>(null);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      if (!isRefresh) setLoading(true);
      try {
        const [allBookings, allOrders] = await Promise.all([
          patientApi.getPatientBookings(user.id),
          patientApi.getOrdersByBuyerId(user.id).catch(() => [] as OrderRecord[]),
        ]);
        setBookings(allBookings);
        setOrders(allOrders);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const pendingConsults = useMemo(
    () => bookings.filter((b) => isBookingAccepted(b) && !b.rating),
    [bookings]
  );
  const reviewedConsults = useMemo(
    () => bookings.filter((b) => Boolean(b.rating)),
    [bookings]
  );

  const pendingOrders = useMemo(
    () =>
      orders.filter(
        (o) => (o.orderStatus || '').toLowerCase() === 'delivered' && !o.review?.rating
      ),
    [orders]
  );
  const reviewedOrders = useMemo(
    () => orders.filter((o) => Boolean(o.review?.rating)),
    [orders]
  );

  const handleSubmitBookingRating = async ({
    rating,
    comment,
  }: {
    rating: number;
    comment: string;
  }) => {
    if (!ratingBooking) return;
    try {
      await patientApi.submitBookingReview(ratingBooking._id, rating, comment);
      Alert.alert('Thank You', 'Your doctor consultation review has been saved.');
      loadData(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit review.');
      throw err;
    }
  };

  const handleSubmitOrderRating = async ({
    rating,
    comment,
    receivingDate,
  }: {
    rating: number;
    comment: string;
    receivingDate?: string;
  }) => {
    if (!ratingOrder) return;
    try {
      await patientApi.submitOrderReview(
        ratingOrder._id,
        rating,
        comment,
        receivingDate
      );
      Alert.alert('Thank You', 'Your medicine order feedback has been saved.');
      loadData(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit order feedback.');
      throw err;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkStrong} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Feedback & Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Segmented Switcher */}
      <View style={styles.tabsWrap}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === 'consultations' && styles.tabBtnActive,
          ]}
          onPress={() => setActiveTab('consultations')}
        >
          <Stethoscope
            size={15}
            color={activeTab === 'consultations' ? '#ffffff' : Colors.oliveDeep}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'consultations' && styles.tabTextActive,
            ]}
          >
            Consultations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Package
            size={15}
            color={activeTab === 'orders' ? '#ffffff' : Colors.oliveDeep}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'orders' && styles.tabTextActive,
            ]}
          >
            Medicine Orders
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading your reviews...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.olive}
            />
          }
        >
          {activeTab === 'consultations' ? (
            <>
              <Text style={styles.sectionTitle}>
                Awaiting Your Rating ({pendingConsults.length})
              </Text>
              {pendingConsults.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    No unrated consultations right now.
                  </Text>
                </View>
              ) : (
                pendingConsults.map((b) => (
                  <View key={b._id} style={styles.itemCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{getBookingDoctorName(b)}</Text>
                      <View style={styles.metaRow}>
                        <Calendar size={12} color={Colors.inkMuted} />
                        <Text style={styles.metaText}>{getBookingDisplayDate(b)}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.rateBtn}
                      onPress={() => setRatingBooking(b)}
                    >
                      <Star size={14} color="#ffffff" />
                      <Text style={styles.rateBtnText}>Rate Doctor</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
                Submitted Doctor Reviews ({reviewedConsults.length})
              </Text>
              {reviewedConsults.length === 0 ? (
                <View style={styles.emptyCard}>
                  <MessageSquare size={26} color={Colors.inkLight} />
                  <Text style={styles.emptyText}>
                    You haven't reviewed any doctor consultations yet.
                  </Text>
                </View>
              ) : (
                reviewedConsults.map((b) => (
                  <View key={b._id} style={styles.reviewCard}>
                    <View style={styles.reviewTop}>
                      <Text style={styles.itemTitle}>{getBookingDoctorName(b)}</Text>
                      <Text style={styles.metaText}>{getBookingDisplayDate(b)}</Text>
                    </View>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={15}
                          color={
                            n <= (b.rating || 0)
                              ? Colors.turmericGold
                              : Colors.borderStrong
                          }
                          fill={n <= (b.rating || 0) ? Colors.turmericGold : 'transparent'}
                        />
                      ))}
                    </View>
                    {b.review ? (
                      <Text style={styles.reviewBody}>“{b.review}”</Text>
                    ) : null}
                  </View>
                ))
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                Delivered Orders Awaiting Review ({pendingOrders.length})
              </Text>
              {pendingOrders.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    No delivered orders awaiting feedback.
                  </Text>
                </View>
              ) : (
                pendingOrders.map((o) => (
                  <View key={o._id} style={styles.itemCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>
                        Order #{o._id.slice(-6).toUpperCase()}
                      </Text>
                      <Text style={styles.metaText}>
                        {o.items?.length || 0} item(s) •{' '}
                        {formatInr(
                          (Number(o.totalPrice) || 0) + (Number(o.shippingCharge) || 0)
                        )}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.rateBtn}
                      onPress={() => setRatingOrder(o)}
                    >
                      <Star size={14} color="#ffffff" />
                      <Text style={styles.rateBtnText}>Rate Order</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
                Submitted Order Reviews ({reviewedOrders.length})
              </Text>
              {reviewedOrders.length === 0 ? (
                <View style={styles.emptyCard}>
                  <MessageSquare size={26} color={Colors.inkLight} />
                  <Text style={styles.emptyText}>
                    You haven't reviewed any medicine orders yet.
                  </Text>
                </View>
              ) : (
                reviewedOrders.map((o) => (
                  <View key={o._id} style={styles.reviewCard}>
                    <View style={styles.reviewTop}>
                      <Text style={styles.itemTitle}>
                        Order #{o._id.slice(-6).toUpperCase()}
                      </Text>
                      <Text style={styles.metaText}>
                        {o.retailers?.join(', ') || 'Ayurvedic Pharmacy'}
                      </Text>
                    </View>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={15}
                          color={
                            n <= (o.review?.rating || 0)
                              ? Colors.turmericGold
                              : Colors.borderStrong
                          }
                          fill={
                            n <= (o.review?.rating || 0)
                              ? Colors.turmericGold
                              : 'transparent'
                          }
                        />
                      ))}
                    </View>
                    {o.review?.comment ? (
                      <Text style={styles.reviewBody}>“{o.review.comment}”</Text>
                    ) : null}
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      )}

      <RatingReviewModal
        visible={Boolean(ratingBooking)}
        onClose={() => setRatingBooking(null)}
        title="Rate Your Consultation"
        subtitle={ratingBooking ? getBookingDoctorName(ratingBooking) : undefined}
        onSubmit={handleSubmitBookingRating}
      />

      <RatingReviewModal
        visible={Boolean(ratingOrder)}
        onClose={() => setRatingOrder(null)}
        title="Rate Your Order"
        subtitle={
          ratingOrder ? `Order #${ratingOrder._id.slice(-6).toUpperCase()}` : undefined
        }
        showReceivingDate
        onSubmit={handleSubmitOrderRating}
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
  tabsWrap: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  content: {
    padding: 16,
    paddingBottom: 44,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Shadows.card,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  metaText: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.barkBrown,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  rateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 7,
    ...Shadows.card,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  reviewBody: {
    fontSize: 13,
    color: Colors.ink,
    fontStyle: 'italic',
    lineHeight: 19,
  },
});

