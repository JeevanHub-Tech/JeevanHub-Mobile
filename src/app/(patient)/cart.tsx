import { SafeAreaView } from 'react-native-safe-area-context';
// src/app/(patient)/cart.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  ArrowRight,
  Minus,
  Pill,
  Plus,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Trash2,
} from 'lucide-react-native';
import { cartApi } from '../../api/cart';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { CartGroup, CartItem, PatientCartResponse } from '../../types/cart';

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [cartData, setCartData] = useState<PatientCartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modifyingItem, setModifyingItem] = useState<string | null>(null);

  const fetchCart = async () => {
    if (!user?.id) return;
    try {
      const data = await cartApi.getCart(user.id);
      setCartData(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCart();
  };

  const handleUpdateQty = async (
    medicineId: string,
    action: 'increment' | 'decrement',
    doctorId?: string | null
  ) => {
    if (!user?.id) return;
    setModifyingItem(medicineId);
    try {
      await cartApi.updateQuantity(user.id, medicineId, action, doctorId);
      await fetchCart();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update quantity');
    } finally {
      setModifyingItem(null);
    }
  };

  const handleRemove = async (medicineId: string, doctorId?: string | null) => {
    if (!user?.id) return;
    setModifyingItem(medicineId);
    try {
      await cartApi.removeItem(user.id, medicineId, doctorId);
      await fetchCart();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to remove item');
    } finally {
      setModifyingItem(null);
    }
  };

  // Consolidate all cart groups
  const allGroups: Array<{
    title: string;
    isDoctorPrescribed: boolean;
    doctorId?: string | null;
    items: CartItem[];
  }> = [];

  if (cartData?.doctorCarts && cartData.doctorCarts.length > 0) {
    cartData.doctorCarts.forEach((dc) => {
      if (dc.items && dc.items.length > 0) {
        const docName = dc.doctorId
          ? `Dr. ${dc.doctorId.firstName} ${dc.doctorId.lastName || ''}`.trim()
          : 'Ayurvedic Physician';
        allGroups.push({
          title: `Prescribed by ${docName}`,
          isDoctorPrescribed: true,
          doctorId: dc.doctorId?._id,
          items: dc.items,
        });
      }
    });
  }

  if (cartData?.defaultCart?.items && cartData.defaultCart.items.length > 0) {
    allGroups.push({
      title: 'General Pharmacy Cart',
      isDoctorPrescribed: false,
      doctorId: null,
      items: cartData.defaultCart.items,
    });
  }

  const allItems: CartItem[] = allGroups.flatMap((g) => g.items);
  const subtotal = allItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCharge = subtotal > 500 || subtotal === 0 ? 0 : 50;
  const grandTotal = subtotal + shippingCharge;

  const handleProceedToCheckout = () => {
    if (allItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Add medicines to proceed.');
      return;
    }
    router.push('/(patient)/checkout' as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading Pharmacy Cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.oliveDeep} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ayurvedic Pharmacy Cart</Text>
          <Text style={styles.headerSubtitle}>
            {allItems.length} formulation{allItems.length === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {allItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <ShoppingBag size={48} color={Colors.inkMuted} />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyDesc}>
              Formulations prescribed during doctor consultations and pharmacy orders will appear here.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.push('/(patient)/doctors' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.browseBtnText}>Explore Ayurvedic Doctors</Text>
            </TouchableOpacity>
          </View>
        ) : (
          allGroups.map((group, gIdx) => (
            <View key={gIdx} style={styles.groupContainer}>
              <View style={styles.groupHeader}>
                {group.isDoctorPrescribed ? (
                  <Stethoscope size={16} color={Colors.oliveDeep} />
                ) : (
                  <Sparkles size={16} color={Colors.turmericGold} />
                )}
                <Text style={styles.groupTitle}>{group.title}</Text>
              </View>

              {group.items.map((item, iIdx) => {
                const med = item.medicineId;
                const medId = med?._id || item._id || '';
                const isWorking = modifyingItem === medId;

                return (
                  <View key={medId || iIdx} style={styles.itemCard}>
                    <View style={styles.itemIconWrap}>
                      <Pill size={20} color={Colors.oliveDeep} />
                    </View>

                    <View style={styles.itemMeta}>
                      <Text style={styles.itemName}>{med?.name || 'Ayurvedic Medicine'}</Text>
                      <Text style={styles.itemPrice}>₹{item.price} each</Text>
                    </View>

                    {/* Quantity Controls */}
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() =>
                          item.quantity > 1
                            ? handleUpdateQty(medId, 'decrement', group.doctorId)
                            : handleRemove(medId, group.doctorId)
                        }
                        disabled={isWorking}
                        activeOpacity={0.7}
                      >
                        {item.quantity === 1 ? (
                          <Trash2 size={13} color={Colors.error} />
                        ) : (
                          <Minus size={13} color={Colors.inkStrong} />
                        )}
                      </TouchableOpacity>

                      <Text style={styles.qtyText}>{item.quantity}</Text>

                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => handleUpdateQty(medId, 'increment', group.doctorId)}
                        disabled={isWorking}
                        activeOpacity={0.7}
                      >
                        <Plus size={13} color={Colors.inkStrong} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.itemTotal}>₹{item.price * item.quantity}</Text>
                  </View>
                );
              })}
            </View>
          ))
        )}

        {/* Pricing Summary */}
        {allItems.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Bill Breakdown</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items Subtotal</Text>
              <Text style={styles.summaryValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Courier Delivery {subtotal > 500 ? '(Free over ₹500)' : ''}
              </Text>
              <Text style={styles.summaryValue}>
                {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Checkout Action */}
      {allItems.length > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomTotalLabel}>Total Amount</Text>
            <Text style={styles.bottomTotalVal}>₹{grandTotal}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleProceedToCheckout}
            activeOpacity={0.8}
          >
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            <ArrowRight size={18} color={Colors.cream} />
          </TouchableOpacity>
        </View>
      )}
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
    gap: 16,
    paddingBottom: 100,
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
  browseBtn: {
    backgroundColor: Colors.oliveAction,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  browseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cream,
  },
  groupContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  itemPrice: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  qtyBtn: {
    padding: 5,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.inkStrong,
    minWidth: 16,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
    minWidth: 50,
    textAlign: 'right',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 10,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.oliveDeep,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  bottomTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.oliveDeep,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.oliveAction,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
  },
  checkoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.cream,
  },
});
