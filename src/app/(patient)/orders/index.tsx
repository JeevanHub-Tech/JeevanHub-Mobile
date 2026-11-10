// src/app/(patient)/orders/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
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
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Leaf,
  ListChecks,
  Package,
  PackageSearch,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
  Truck,
  X,
  XCircle,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import { OrderTrackingModal } from '../../../components/orders/OrderTrackingModal';
import { Colors, Shadows } from '../../../constants/theme';
import { useAuthStore } from '../../../store/authStore';
import type { OrderRecord } from '../../../types/patient';
import { formatInr, getMedicineThumbUrl } from '../../../utils/medicineHelpers';

type OrderTab = 'all' | 'pending' | 'completed' | 'cancelled';

const TAB_DEFS: Array<{
  id: OrderTab;
  label: string;
  match: (status: string) => boolean;
}> = [
  { id: 'all', label: 'All Orders', match: () => true },
  {
    id: 'pending',
    label: 'Pending',
    match: (s) =>
      s === 'pending' || s === 'accepted' || s === 'processing' || s === 'shipped',
  },
  { id: 'completed', label: 'Completed', match: (s) => s === 'delivered' },
  {
    id: 'cancelled',
    label: 'Cancelled',
    match: (s) => s === 'cancelled' || s === 'rejected',
  },
];

function getStatusMeta(statusRaw?: string) {
  const s = (statusRaw || 'pending').toLowerCase();
  switch (s) {
    case 'delivered':
      return { label: 'Completed', bg: Colors.successBg, fg: Colors.success, Icon: CheckCircle2 };
    case 'shipped':
      return { label: 'Shipped', bg: '#e3f2fd', fg: '#1565c0', Icon: Truck };
    case 'accepted':
    case 'processing':
      return { label: s.charAt(0).toUpperCase() + s.slice(1), bg: Colors.sagePale, fg: Colors.oliveDeep, Icon: ListChecks };
    case 'cancelled':
    case 'rejected':
      return { label: s.charAt(0).toUpperCase() + s.slice(1), bg: Colors.errorBg, fg: Colors.error, Icon: XCircle };
    default:
      return { label: 'Pending', bg: Colors.warningBg, fg: Colors.warning, Icon: Clock };
  }
}

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [trackTarget, setTrackTarget] = useState<{
    orderId: string;
    retailerId?: string;
  } | null>(null);

  // Dispute modal state
  const [disputeOrder, setDisputeOrder] = useState<OrderRecord | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // Review modal state
  const [reviewOrder, setReviewOrder] = useState<OrderRecord | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOrders = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      if (!isRefresh) setLoading(true);
      setError(null);
      try {
        const list = await patientApi.getOrdersByBuyerId(user.id);
        setOrders(list);
      } catch (err: any) {
        setError(err?.message || 'Failed to load orders.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  const tabCounts = useMemo(() => {
    const counts: Record<OrderTab, number> = {
      all: orders.length,
      pending: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      const s = (o.orderStatus || '').toLowerCase();
      if (TAB_DEFS[1].match(s)) counts.pending += 1;
      if (TAB_DEFS[2].match(s)) counts.completed += 1;
      if (TAB_DEFS[3].match(s)) counts.cancelled += 1;
    }
    return counts;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const def = TAB_DEFS.find((t) => t.id === activeTab) || TAB_DEFS[0];
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      if (!def.match((order.orderStatus || '').toLowerCase())) return false;
      if (!q) return true;
      const idMatch = order._id.slice(-8).toLowerCase().includes(q);
      const itemMatch = (order.items || []).some((it) =>
        (it.medicineId?.name || '').toLowerCase().includes(q)
      );
      return idMatch || itemMatch;
    });
  }, [orders, activeTab, searchTerm]);

  const handleSubmitDispute = async () => {
    if (!disputeOrder || !disputeReason.trim()) {
      Alert.alert('Reason Required', 'Please describe the issue with this order.');
      return;
    }
    setSubmittingDispute(true);
    try {
      await patientApi.raiseOrderDispute(disputeOrder._id, disputeReason.trim());
      Alert.alert(
        'Issue Reported',
        'We have flagged this order and will review it before releasing payout.'
      );
      setDisputeOrder(null);
      setDisputeReason('');
      fetchOrders(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not report issue.');
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder) return;
    setSubmittingReview(true);
    try {
      await patientApi.submitOrderReview(reviewOrder._id, rating, comment.trim());
      Alert.alert('Thank You', 'Your feedback has been submitted!');
      setReviewOrder(null);
      setComment('');
      setRating(5);
      fetchOrders(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderOrderCard = ({ item: order }: { item: OrderRecord }) => {
    const statusKey = (order.orderStatus || 'pending').toLowerCase();
    const meta = getStatusMeta(statusKey);
    const StatusIcon = meta.Icon;
    const grand = (Number(order.totalPrice) || 0) + (Number(order.shippingCharge) || 0);
    const dateLabel = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNum}>Order #{order._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{dateLabel}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <StatusIcon size={12} color={meta.fg} />
            <Text style={[styles.statusText, { color: meta.fg }]}>{meta.label}</Text>
          </View>
        </View>

        {order.retailers?.length ? (
          <Text style={styles.soldBy}>Sold by {order.retailers.join(', ')}</Text>
        ) : null}

        {/* Items */}
        <View style={styles.itemsList}>
          {(order.items || []).map((line, idx) => {
            const thumb = getMedicineThumbUrl(line.medicineId);
            return (
              <View key={idx} style={styles.itemRow}>
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.itemThumb} />
                ) : (
                  <View style={styles.itemThumbFallback}>
                    <Leaf size={16} color={Colors.oliveAction} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {line.medicineId?.name || 'Ayurvedic Medicine'}
                  </Text>
                  <Text style={styles.itemQty}>
                    {formatInr(line.medicineId?.price)} × {line.quantity}
                  </Text>
                </View>
                <Text style={styles.itemSub}>{formatInr(line.subTotal)}</Text>
              </View>
            );
          })}
        </View>

        {/* Delhivery Shipments */}
        {order.shipments?.length ? (
          <View style={styles.shipmentsWrap}>
            {order.shipments.map((sh, idx) => (
              <View key={idx} style={styles.shipmentCard}>
                <Truck size={15} color={Colors.barkBrown} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.shipmentStatus} numberOfLines={1}>
                    {sh.lastPolledStatus || 'Handed to Delhivery'}
                    {sh.lastPolledLocation ? ` · ${sh.lastPolledLocation}` : ''}
                  </Text>
                  <Text style={styles.shipmentAwb} numberOfLines={1}>
                    AWB {sh.trackingId || 'Pending'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.trackBtn}
                  onPress={() =>
                    setTrackTarget({
                      orderId: order._id,
                      retailerId: sh.retailerId,
                    })
                  }
                >
                  <PackageSearch size={13} color={Colors.oliveDeep} />
                  <Text style={styles.trackBtnText}>Track</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        {/* Existing Review */}
        {statusKey === 'delivered' && order.review?.rating ? (
          <View style={styles.reviewBox}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={14}
                  color={i <= order.review!.rating ? Colors.turmericGold : Colors.borderStrong}
                  fill={i <= order.review!.rating ? Colors.turmericGold : 'transparent'}
                />
              ))}
              <Text style={styles.reviewTag}>Your Feedback</Text>
            </View>
            {order.review.comment ? (
              <Text style={styles.reviewComment}>{order.review.comment}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View>
            <View style={styles.payMetaRow}>
              <CreditCard size={12} color={Colors.inkMuted} />
              <Text style={styles.payMetaText}>
                {order.paymentMethod === 'cashOnDelivery' ? 'COD' : 'Online'} •{' '}
                {order.paymentStatus || 'pending'}
              </Text>
            </View>
            <Text style={styles.grandText}>Total: {formatInr(grand)}</Text>
          </View>

          <View style={styles.footerActions}>
            {order.payoutStatus === 'held' ? (
              <TouchableOpacity
                style={styles.disputeBtn}
                onPress={() => setDisputeOrder(order)}
              >
                <Text style={styles.disputeBtnText}>Report Issue</Text>
              </TouchableOpacity>
            ) : null}

            {statusKey === 'delivered' && !order.review?.rating ? (
              <TouchableOpacity
                style={styles.rateBtn}
                onPress={() => setReviewOrder(order)}
              >
                <Star size={13} color="#ffffff" />
                <Text style={styles.rateBtnText}>Rate Order</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkStrong} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Orders</Text>
        <TouchableOpacity
          style={styles.storePill}
          onPress={() => router.push('/(patient)/medicines' as any)}
        >
          <ShoppingBag size={14} color={Colors.oliveDeep} />
          <Text style={styles.storePillText}>Store</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={loading ? [] : visibleOrders}
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
          <View style={styles.headerBlock}>
            {/* Search */}
            <View style={styles.searchWrap}>
              <Search size={18} color={Colors.inkMuted} />
              <TextInput
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search by order # or medicine..."
                placeholderTextColor={Colors.inkLight}
              />
              {searchTerm.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchTerm('')} hitSlop={8}>
                  <X size={16} color={Colors.inkMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* 4 Order Status Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
            >
              {TAB_DEFS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tabPill, active && styles.tabPillActive]}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>
                      {tab.label} ({tabCounts[tab.id]})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={renderOrderCard}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={Colors.olive} />
              <Text style={styles.centerText}>Loading your orders...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <AlertCircle size={32} color={Colors.error} />
              <Text style={styles.errorTitle}>Couldn't load orders</Text>
              <Text style={styles.centerText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => fetchOrders(false)}
              >
                <RefreshCw size={14} color="#ffffff" />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.centerState}>
              <Package size={36} color={Colors.inkLight} />
              <Text style={styles.emptyTitle}>
                {orders.length === 0 ? 'No Orders Yet' : 'No Matching Orders'}
              </Text>
              <Text style={styles.centerText}>
                {orders.length === 0
                  ? 'Medicines you purchase will appear here with live Delhivery tracking.'
                  : 'Try switching tabs or clearing your search.'}
              </Text>
              {orders.length === 0 ? (
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => router.push('/(patient)/medicines' as any)}
                >
                  <Text style={styles.retryText}>Shop Ayurvedic Medicines</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        }
      />

      {/* Delhivery Tracking Modal */}
      <OrderTrackingModal
        visible={Boolean(trackTarget)}
        onClose={() => setTrackTarget(null)}
        orderId={trackTarget?.orderId}
        retailerId={trackTarget?.retailerId}
      />

      {/* Report Issue Modal */}
      <Modal
        visible={Boolean(disputeOrder)}
        transparent
        animationType="fade"
        onRequestClose={() => setDisputeOrder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Report an Issue</Text>
            <Text style={styles.modalDesc}>
              Tell us what went wrong with Order #{disputeOrder?._id.slice(-6).toUpperCase()}.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholder="e.g. Never received medicines / damaged item"
              placeholderTextColor={Colors.inkLight}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDisputeOrder(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitDispute}
                disabled={submittingDispute}
              >
                <Text style={styles.modalSubmitText}>
                  {submittingDispute ? 'Submitting...' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rate Order Modal */}
      <Modal
        visible={Boolean(reviewOrder)}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewOrder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate Your Order</Text>
            <View style={styles.rateStarsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={6}>
                  <Star
                    size={28}
                    color={n <= rating ? Colors.turmericGold : Colors.borderStrong}
                    fill={n <= rating ? Colors.turmericGold : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.modalInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Share your feedback on packaging and quality..."
              placeholderTextColor={Colors.inkLight}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReviewOrder(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                <Text style={styles.modalSubmitText}>
                  {submittingReview ? 'Saving...' : 'Submit Review'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  storePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  headerBlock: {
    gap: 10,
    marginBottom: 4,
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
  tabsScroll: {
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabPillActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNum: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  orderDate: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  soldBy: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.sagePale,
  },
  itemThumbFallback: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.creamTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  itemQty: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  itemSub: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  shipmentsWrap: {
    gap: 8,
  },
  shipmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.creamTint,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shipmentStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  shipmentAwb: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  trackBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  reviewBox: {
    backgroundColor: Colors.sagePale,
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewTag: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
    marginLeft: 6,
  },
  reviewComment: {
    fontSize: 12,
    color: Colors.ink,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    gap: 10,
  },
  payMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payMetaText: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  grandText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.oliveDeep,
    marginTop: 2,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  disputeBtn: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.errorBg,
  },
  disputeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.error,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.barkBrown,
  },
  rateBtnText: {
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
  centerText: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  rateStarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  modalInput: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 13,
    color: Colors.inkStrong,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.sagePale,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  modalSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.oliveAction,
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});

