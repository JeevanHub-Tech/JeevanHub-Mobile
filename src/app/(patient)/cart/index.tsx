// src/app/(patient)/cart/index.tsx
import React, { useCallback, useState } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Leaf,
  Lock,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Stethoscope,
  Trash2,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import { Colors, Shadows } from '../../../constants/theme';
import { useAuthStore } from '../../../store/authStore';
import type { CartLineItem, DoctorCart } from '../../../types/patient';
import { formatInr, getMedicineThumbUrl } from '../../../utils/medicineHelpers';

function CartRow({
  item,
  busy,
  onInc,
  onDec,
  onRemove,
  onOpenDetail,
}: {
  item: CartLineItem;
  busy: boolean;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
  onOpenDetail: () => void;
}) {
  const med = item.medicineId;
  const thumb = getMedicineThumbUrl(med);
  const lineTotal = (med?.price || 0) * item.quantity;

  return (
    <View style={styles.rowCard}>
      <TouchableOpacity onPress={onOpenDetail} activeOpacity={0.8}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.rowThumb} resizeMode="cover" />
        ) : (
          <View style={styles.rowThumbFallback}>
            <Leaf size={22} color={Colors.oliveAction} />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.rowInfo}>
        <TouchableOpacity onPress={onOpenDetail} activeOpacity={0.8}>
          <Text style={styles.rowName} numberOfLines={2}>
            {med?.name || 'Medicine'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.rowEach}>{formatInr(med?.price)} each</Text>

        <View style={styles.rowControls}>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[styles.stepBtn, item.quantity <= 1 && styles.disabledBtn]}
              disabled={busy || item.quantity <= 1}
              onPress={onDec}
            >
              <Minus size={13} color={Colors.oliveDeep} />
            </TouchableOpacity>
            <Text style={styles.stepVal}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              disabled={busy}
              onPress={onInc}
            >
              <Plus size={13} color={Colors.oliveDeep} />
            </TouchableOpacity>
          </View>

          <Text style={styles.lineTotal}>{formatInr(lineTotal)}</Text>

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={onRemove}
            disabled={busy}
            hitSlop={6}
          >
            <Trash2 size={15} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [defaultItems, setDefaultItems] = useState<CartLineItem[]>([]);
  const [defaultTotal, setDefaultTotal] = useState(0);
  const [doctorCarts, setDoctorCarts] = useState<DoctorCart[]>([]);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadCart = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      if (!isRefresh) setLoading(true);
      try {
        const res = await patientApi.getCart(user.id);
        setDefaultItems(res.defaultCart?.items || []);
        setDefaultTotal(res.defaultCart?.totalPrice || 0);
        setDoctorCarts(res.doctorCarts || []);
        if (res.doctorCarts?.length && Object.keys(expandedDocs).length === 0) {
          const firstDocId = res.doctorCarts[0]?.doctorId?._id;
          if (firstDocId) {
            setExpandedDocs({ [firstDocId]: true });
          }
        }
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Unable to load cart.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useFocusEffect(
    useCallback(() => {
      loadCart(false);
    }, [loadCart])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCart(true);
  };

  const handleDefaultQty = async (medicineId: string, action: 'increment' | 'decrement') => {
    if (!user?.id) return;
    setBusyKey(`def-${medicineId}`);
    try {
      const res = await patientApi.updateCartQuantity(user.id, medicineId, action);
      if (res?.cartItems) {
        setDefaultItems(res.cartItems.items || []);
        setDefaultTotal(res.cartItems.totalPrice || 0);
      } else {
        await loadCart(true);
      }
    } catch (err: any) {
      Alert.alert('Cart Error', err?.message || 'Could not update quantity.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleDefaultRemove = async (medicineId: string) => {
    if (!user?.id) return;
    setBusyKey(`def-${medicineId}`);
    try {
      const res = await patientApi.removeFromCart(user.id, medicineId);
      if (res?.cartItems) {
        setDefaultItems(res.cartItems.items || []);
        setDefaultTotal(res.cartItems.totalPrice || 0);
      } else {
        await loadCart(true);
      }
    } catch (err: any) {
      Alert.alert('Cart Error', err?.message || 'Could not remove item.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleDoctorQty = async (
    doctorId: string,
    medicineId: string,
    action: 'increment' | 'decrement'
  ) => {
    setBusyKey(`doc-${doctorId}-${medicineId}`);
    try {
      const res = await patientApi.updateDoctorCartQuantity(doctorId, medicineId, action);
      if (res?.cartItems) {
        setDoctorCarts((prev) =>
          prev.map((dc) =>
            dc.doctorId?._id === doctorId
              ? {
                  ...dc,
                  items: res.cartItems.items || [],
                  totalPrice: res.cartItems.totalPrice || 0,
                }
              : dc
          )
        );
      } else {
        await loadCart(true);
      }
    } catch (err: any) {
      Alert.alert('Cart Error', err?.message || 'Could not update quantity.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleDoctorRemoveItem = async (doctorId: string, medicineId: string) => {
    setBusyKey(`doc-${doctorId}-${medicineId}`);
    try {
      await patientApi.removeFromDoctorCart(doctorId, medicineId);
      await loadCart(true);
    } catch (err: any) {
      Alert.alert('Cart Error', err?.message || 'Could not remove item.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleMoveDoctorCart = async (doctorId: string) => {
    setBusyKey(`move-${doctorId}`);
    try {
      await patientApi.moveDoctorCartToDefault(doctorId);
      await loadCart(true);
      Alert.alert('Moved to My Cart', 'Prescribed medicines moved to your checkout cart.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not move items to cart.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleDiscardDoctorCart = (doctorId: string, doctorName: string) => {
    Alert.alert(
      'Discard Prescribed Cart?',
      `Remove all items in ${doctorName}'s prescribed cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            setBusyKey(`del-${doctorId}`);
            try {
              await patientApi.deleteDoctorCart(doctorId);
              await loadCart(true);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not discard cart.');
            } finally {
              setBusyKey(null);
            }
          },
        },
      ]
    );
  };

  const computedTotal =
    defaultTotal ||
    defaultItems.reduce((sum, i) => sum + (i.medicineId?.price || 0) * i.quantity, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkStrong} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Cart</Text>
        <TouchableOpacity
          style={styles.browseChip}
          onPress={() => router.push('/(patient)/medicines' as any)}
        >
          <Text style={styles.browseChipText}>+ Store</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading your cart...</Text>
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
          {/* 1. Patient Default Cart */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <ShoppingCart size={18} color={Colors.oliveAction} />
              <Text style={styles.sectionTitle}>My Cart ({defaultItems.length})</Text>
            </View>
            {defaultItems.length > 0 ? (
              <Text style={styles.subtotalHeader}>{formatInr(computedTotal)}</Text>
            ) : null}
          </View>

          {defaultItems.length === 0 ? (
            <View style={styles.emptyBox}>
              <ShoppingBag size={30} color={Colors.olive} />
              <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
              <Text style={styles.emptyDesc}>
                Add Ayurvedic medicines from the store or move a doctor-prescribed cart below.
              </Text>
              <TouchableOpacity
                style={styles.shopBtn}
                onPress={() => router.push('/(patient)/medicines' as any)}
              >
                <Text style={styles.shopBtnText}>Browse Medicines</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {defaultItems.map((item) => {
                const medId = item.medicineId?._id;
                if (!medId) return null;
                return (
                  <CartRow
                    key={medId}
                    item={item}
                    busy={busyKey === `def-${medId}`}
                    onInc={() => handleDefaultQty(medId, 'increment')}
                    onDec={() => handleDefaultQty(medId, 'decrement')}
                    onRemove={() => handleDefaultRemove(medId)}
                    onOpenDetail={() =>
                      router.push({
                        pathname: '/(patient)/medicines/[id]',
                        params: { id: medId },
                      } as any)
                    }
                  />
                );
              })}

              <View style={styles.checkoutBox}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Cart Subtotal</Text>
                  <Text style={styles.totalValue}>{formatInr(computedTotal)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={() => router.push('/(patient)/checkout' as any)}
                  activeOpacity={0.85}
                >
                  <Lock size={15} color="#ffffff" />
                  <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                  <ArrowRight size={15} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 2. Doctor-Prescribed Carts */}
          {doctorCarts.length > 0 ? (
            <View style={styles.doctorSection}>
              <View style={styles.sectionTitleRow}>
                <Stethoscope size={18} color={Colors.oliveAction} />
                <Text style={styles.sectionTitle}>
                  Doctor-Prescribed Carts ({doctorCarts.length})
                </Text>
              </View>

              {doctorCarts.map((dc) => {
                const docId = dc.doctorId?._id || dc._id;
                const docName = dc.doctorId?.firstName
                  ? `Dr. ${dc.doctorId.firstName} ${dc.doctorId.lastName || ''}`.trim()
                  : 'Consulting Doctor';
                const expanded = Boolean(expandedDocs[docId]);
                const docTotal =
                  dc.totalPrice ||
                  (dc.items || []).reduce(
                    (s, i) => s + (i.medicineId?.price || 0) * i.quantity,
                    0
                  );

                return (
                  <View key={dc._id} style={styles.doctorCartCard}>
                    <TouchableOpacity
                      style={styles.doctorCartHeader}
                      onPress={() =>
                        setExpandedDocs((prev) => ({
                          ...prev,
                          [docId]: !prev[docId],
                        }))
                      }
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.doctorCartName}>{docName}</Text>
                        <Text style={styles.doctorCartMeta}>
                          {(dc.items || []).length} prescribed item(s) • {formatInr(docTotal)}
                        </Text>
                      </View>
                      {expanded ? (
                        <ChevronUp size={18} color={Colors.oliveDeep} />
                      ) : (
                        <ChevronDown size={18} color={Colors.oliveDeep} />
                      )}
                    </TouchableOpacity>

                    {expanded ? (
                      <View style={styles.doctorCartBody}>
                        {(dc.items || []).map((item) => {
                          const medId = item.medicineId?._id;
                          if (!medId) return null;
                          return (
                            <CartRow
                              key={medId}
                              item={item}
                              busy={busyKey === `doc-${docId}-${medId}`}
                              onInc={() => handleDoctorQty(docId, medId, 'increment')}
                              onDec={() => handleDoctorQty(docId, medId, 'decrement')}
                              onRemove={() => handleDoctorRemoveItem(docId, medId)}
                              onOpenDetail={() =>
                                router.push({
                                  pathname: '/(patient)/medicines/[id]',
                                  params: { id: medId },
                                } as any)
                              }
                            />
                          );
                        })}

                        <View style={styles.docActionsRow}>
                          <TouchableOpacity
                            style={styles.moveBtn}
                            onPress={() => handleMoveDoctorCart(docId)}
                            disabled={busyKey === `move-${docId}`}
                          >
                            <ArrowRightLeft size={14} color="#ffffff" />
                            <Text style={styles.moveBtnText}>Move to My Cart</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.discardBtn}
                            onPress={() => handleDiscardDoctorCart(docId, docName)}
                            disabled={busyKey === `del-${docId}`}
                          >
                            <Trash2 size={14} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}
        </ScrollView>
      )}
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
  browseChip: {
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  browseChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
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
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  subtotalHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  emptyBox: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  shopBtn: {
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 4,
  },
  shopBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  itemsList: {
    gap: 10,
  },
  rowCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.card,
  },
  rowThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Colors.sagePale,
  },
  rowThumbFallback: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Colors.creamTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 4,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  rowEach: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  rowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.sagePale,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.oliveDeep,
    minWidth: 16,
    textAlign: 'center',
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  removeBtn: {
    padding: 4,
  },
  disabledBtn: {
    opacity: 0.4,
  },
  checkoutBox: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    gap: 12,
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.oliveAction,
    borderRadius: 14,
    paddingVertical: 13,
  },
  checkoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  doctorSection: {
    gap: 10,
    marginTop: 8,
  },
  doctorCartCard: {
    backgroundColor: Colors.creamTint,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    overflow: 'hidden',
  },
  doctorCartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 10,
  },
  doctorCartName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  doctorCartMeta: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  doctorCartBody: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    gap: 10,
  },
  docActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  moveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Colors.oliveAction,
    borderRadius: 12,
    paddingVertical: 11,
  },
  moveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  discardBtn: {
    width: 44,
    borderRadius: 12,
    backgroundColor: Colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

