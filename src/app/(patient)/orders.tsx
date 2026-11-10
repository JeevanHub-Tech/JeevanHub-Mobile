import { SafeAreaView } from 'react-native-safe-area-context';
// src/app/(patient)/orders.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ExternalLink,
  Package,
  Pill,
  ShoppingBag,
  Truck,
  XCircle,
} from 'lucide-react-native';
import { orderApi } from '../../api/order';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { OrderHistoryItem } from '../../types/cart';

export default function PatientOrdersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!user?.id) return;
    try {
      const data = await orderApi.getOrdersByPatient(user.id);
      setOrders(data);
    } catch (err) {
      console.error('Error fetching patient orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return {
          bg: Colors.successBg,
          text: Colors.success,
          label: 'DELIVERED',
          icon: <CheckCircle size={12} color={Colors.success} />,
        };
      case 'shipped':
        return {
          bg: '#e3f2fd',
          text: '#1976d2',
          label: 'IN TRANSIT (DELHIVERY)',
          icon: <Truck size={12} color="#1976d2" />,
        };
      case 'confirmed':
        return {
          bg: Colors.sagePale,
          text: Colors.oliveDeep,
          label: 'PROCESSING',
          icon: <Package size={12} color={Colors.oliveDeep} />,
        };
      case 'cancelled':
        return {
          bg: '#ffebee',
          text: Colors.error,
          label: 'CANCELLED',
          icon: <XCircle size={12} color={Colors.error} />,
        };
      default:
        return {
          bg: Colors.warningBg,
          text: Colors.warning,
          label: 'PAYMENT VERIFYING',
          icon: <Clock size={12} color={Colors.warning} />,
        };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading Your Pharmacy Orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.oliveDeep} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Pharmacy Orders</Text>
          <Text style={styles.headerSubtitle}>Courier deliveries & shipment tracking</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Package size={48} color={Colors.inkMuted} />
            <Text style={styles.emptyTitle}>No orders placed yet</Text>
            <Text style={styles.emptyDesc}>
              Formulations you order from our pharmacy or doctor prescriptions will be tracked here.
            </Text>
            <TouchableOpacity
              style={styles.cartBtn}
              onPress={() => router.push('/(patient)/cart' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.cartBtnText}>View Pharmacy Cart</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order) => {
            const statusInfo = getStatusBadge(order.orderStatus);
            const dateStr = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString()
              : 'Recent';

            return (
              <View key={order._id} style={styles.orderCard}>
                {/* Order Top Bar */}
                <View style={styles.orderTop}>
                  <View>
                    <Text style={styles.orderIdText}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{dateStr}</Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    {statusInfo.icon}
                    <Text style={[styles.statusText, { color: statusInfo.text }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                {/* Items Preview */}
                <View style={styles.itemsPreview}>
                  {order.items &&
                    order.items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Pill size={14} color={Colors.oliveDeep} />
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.medicineId?.name || 'Ayurvedic Medicine'}
                        </Text>
                        <Text style={styles.itemQty}>x{item.quantity}</Text>
                        <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                      </View>
                    ))}
                </View>

                {/* Shipment Tracking Info (Delhivery) */}
                {order.shipments && order.shipments.length > 0 && order.shipments[0].trackingId ? (
                  <View style={styles.trackingCard}>
                    <Truck size={16} color="#1976d2" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.trackingCarrier}>
                        Courier: {order.shipments[0].platform || 'Delhivery Express'}
                      </Text>
                      <Text style={styles.trackingAwb}>
                        AWB: {order.shipments[0].trackingId}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* Bottom Total & Address */}
                <View style={styles.orderFooter}>
                  <Text style={styles.addressText} numberOfLines={1}>
                    📍 {order.shippingAddress?.street}, {order.shippingAddress?.city}
                  </Text>
                  <Text style={styles.totalText}>Total: ₹{order.totalPrice}</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.inkMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginTop: 14,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  cartBtn: {
    backgroundColor: Colors.oliveAction,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  cartBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cream,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  orderDate: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemsPreview: {
    gap: 6,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: Colors.inkStrong,
    fontWeight: '600',
  },
  itemQty: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  trackingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bbdefb',
    gap: 10,
    marginBottom: 10,
  },
  trackingCarrier: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1565c0',
  },
  trackingAwb: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  addressText: {
    fontSize: 11,
    color: Colors.inkMuted,
    flex: 1,
    marginRight: 10,
  },
  totalText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
});
