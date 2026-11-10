// src/app/(patient)/medicines/index.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Minus,
  Pill,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  X,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import { Colors, Shadows } from '../../../constants/theme';
import { useAuthStore } from '../../../store/authStore';
import type { MedicineItem } from '../../../types/patient';
import {
  formatInr,
  getMedicineThumbUrl,
  getRetailerDisplayName,
  isRetailerVerified,
} from '../../../utils/medicineHelpers';

const PRICE_RANGES = [
  { value: 'all', label: 'All Prices' },
  { value: 'under-500', label: 'Under ₹500' },
  { value: '500-1000', label: '₹500 – ₹1,000' },
  { value: '1000-2000', label: '₹1,000 – ₹2,000' },
  { value: 'above-2000', label: 'Above ₹2,000' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'price-low', label: 'Price: Low-High' },
  { value: 'price-high', label: 'Price: High-Low' },
  { value: 'popularity', label: 'Popularity' },
];

export default function MedicinesStoreScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // medicineId -> quantity in patient's default cart
  const [cartQtyMap, setCartQtyMap] = useState<Record<string, number>>({});
  const [totalCartItems, setTotalCartItems] = useState(0);
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    patientApi.getMedicineCategories().then(setCategories);
  }, []);

  const loadCartCounts = useCallback(async () => {
    if (!user?.id) return;
    try {
      const cartData = await patientApi.getCart(user.id);
      const map: Record<string, number> = {};
      let count = 0;
      for (const item of cartData.defaultCart?.items || []) {
        if (item.medicineId?._id) {
          map[item.medicineId._id] = item.quantity;
          count += item.quantity;
        }
      }
      setCartQtyMap(map);
      setTotalCartItems(count);
    } catch {
      // Non-blocking cart badge fetch
    }
  }, [user?.id]);

  const fetchMedicines = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError(null);
      try {
        const res = await patientApi.getMedicines({
          page,
          limit: 20,
          search: debouncedSearch || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          priceRange: priceRange !== 'all' ? priceRange : undefined,
          sortBy,
        });
        setMedicines(Array.isArray(res.medicines) ? res.medicines : []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      } catch (err: any) {
        setError(err?.message || 'Unable to load medicines catalog.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, debouncedSearch, selectedCategory, priceRange, sortBy]
  );

  useEffect(() => {
    fetchMedicines(false);
  }, [fetchMedicines]);

  useFocusEffect(
    useCallback(() => {
      loadCartCounts();
    }, [loadCartCounts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedicines(true);
    loadCartCounts();
  };

  const handleAddToCart = async (med: MedicineItem) => {
    if (!user?.id) return;
    if (pendingIds[med._id]) return;

    setPendingIds((prev) => ({ ...prev, [med._id]: true }));
    try {
      await patientApi.addToCart(user.id, med._id, 1);
      await loadCartCounts();
    } catch (err: any) {
      Alert.alert('Cart Error', err?.message || 'Could not add medicine to cart.');
    } finally {
      setPendingIds((prev) => ({ ...prev, [med._id]: false }));
    }
  };

  const handleUpdateQty = async (med: MedicineItem, delta: 1 | -1) => {
    if (!user?.id) return;
    if (pendingIds[med._id]) return;

    const currentQty = cartQtyMap[med._id] || 0;
    setPendingIds((prev) => ({ ...prev, [med._id]: true }));
    try {
      if (delta === -1 && currentQty <= 1) {
        await patientApi.removeFromCart(user.id, med._id);
      } else {
        await patientApi.updateCartQuantity(
          user.id,
          med._id,
          delta > 0 ? 'increment' : 'decrement'
        );
      }
      await loadCartCounts();
    } catch (err: any) {
      Alert.alert('Cart Error', err?.message || 'Could not update cart quantity.');
    } finally {
      setPendingIds((prev) => ({ ...prev, [med._id]: false }));
    }
  };

  const renderMedicineCard = ({ item }: { item: MedicineItem }) => {
    const thumb = getMedicineThumbUrl(item);
    const pharmacy = getRetailerDisplayName(item.retailerId);
    const verified = isRetailerVerified(item.retailerId);
    const inStock = (item.quantity ?? 0) > 0;
    const qtyInCart = cartQtyMap[item._id] || 0;
    const busy = Boolean(pendingIds[item._id]);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.86}
        onPress={() =>
          router.push({
            pathname: '/(patient)/medicines/[id]',
            params: { id: item._id },
          } as any)
        }
      >
        <View style={styles.imageWrap}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.medImage} resizeMode="cover" />
          ) : (
            <View style={styles.medPlaceholder}>
              <Leaf size={30} color={Colors.oliveAction} />
            </View>
          )}

          {item.prescription ? (
            <View style={styles.rxBadge}>
              <Text style={styles.rxBadgeText}>Rx</Text>
            </View>
          ) : null}

          {!inStock ? (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardBody}>
          {item.category ? (
            <Text style={styles.categoryLabel} numberOfLines={1}>
              {item.category}
            </Text>
          ) : null}

          <Text style={styles.medName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.pharmacyRow}>
            <Store size={11} color={Colors.inkMuted} />
            <Text style={styles.pharmacyText} numberOfLines={1}>
              {pharmacy}
            </Text>
            {verified ? <ShieldCheck size={12} color={Colors.success} /> : null}
          </View>

          <View style={styles.priceActionRow}>
            <Text style={styles.priceText}>{formatInr(item.price)}</Text>

            {qtyInCart > 0 ? (
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleUpdateQty(item, -1)}
                  disabled={busy}
                >
                  <Minus size={13} color={Colors.oliveDeep} />
                </TouchableOpacity>
                <Text style={styles.stepVal}>{qtyInCart}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleUpdateQty(item, 1)}
                  disabled={busy}
                >
                  <Plus size={13} color={Colors.oliveDeep} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addBtn, (!inStock || busy) && styles.disabledBtn]}
                onPress={() => handleAddToCart(item)}
                disabled={!inStock || busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Plus size={13} color="#ffffff" />
                    <Text style={styles.addBtnText}>Add</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkStrong} />
        </TouchableOpacity>

        <View style={styles.navTitleWrap}>
          <Text style={styles.navTitle}>Ayurvedic Pharmacy</Text>
          {!loading ? (
            <Text style={styles.navSubtitle}>{totalCount} verified formulations</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.cartNavBtn}
          onPress={() => router.push('/(patient)/cart' as any)}
          accessibilityLabel="Open Cart"
        >
          <ShoppingCart size={19} color={Colors.oliveDeep} />
          {totalCartItems > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {totalCartItems > 99 ? '99+' : totalCartItems}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <FlatList
        data={loading ? [] : medicines}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
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
          <View style={styles.filtersBlock}>
            {/* Search Input */}
            <View style={styles.searchWrap}>
              <Search size={18} color={Colors.inkMuted} />
              <TextInput
                style={styles.searchInput}
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Search medicines, herbs, or ailments..."
                placeholderTextColor={Colors.inkLight}
                returnKeyType="search"
              />
              {searchInput.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchInput('')} hitSlop={8}>
                  <X size={16} color={Colors.inkMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Category Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {['all', ...categories].map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setPage(1);
                    }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Price Range + Sort Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {PRICE_RANGES.map((pr) => {
                const active = priceRange === pr.value;
                return (
                  <TouchableOpacity
                    key={pr.value}
                    style={[styles.subChip, active && styles.subChipActive]}
                    onPress={() => {
                      setPriceRange(pr.value);
                      setPage(1);
                    }}
                  >
                    <Text style={[styles.subChipText, active && styles.subChipTextActive]}>
                      {pr.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {SORT_OPTIONS.map((opt) => {
                const active = sortBy === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.sortChip, active && styles.sortChipActive]}
                    onPress={() => {
                      setSortBy(opt.value);
                      setPage(1);
                    }}
                  >
                    <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                      Sort: {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={renderMedicineCard}
        ListFooterComponent={
          !loading && totalPages > 1 ? (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageBtn, page <= 1 && styles.disabledBtn]}
                disabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} color={Colors.oliveDeep} />
                <Text style={styles.pageBtnText}>Prev</Text>
              </TouchableOpacity>

              <Text style={styles.pageInfo}>
                Page {page} of {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.pageBtn, page >= totalPages && styles.disabledBtn]}
                disabled={page >= totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <Text style={styles.pageBtnText}>Next</Text>
                <ChevronRight size={16} color={Colors.oliveDeep} />
              </TouchableOpacity>
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={Colors.olive} />
              <Text style={styles.centerText}>Loading Ayurvedic medicines...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <Text style={styles.errorTitle}>Couldn't load store</Text>
              <Text style={styles.centerText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => fetchMedicines(false)}
              >
                <RefreshCw size={15} color="#ffffff" />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.centerState}>
              <Pill size={34} color={Colors.inkLight} />
              <Text style={styles.emptyTitle}>No Medicines Found</Text>
              <Text style={styles.centerText}>
                No matching active medicines from verified retailers with Delhivery & payout configured. Try clearing filters or checking again later.
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
  navTitleWrap: {
    flex: 1,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  navSubtitle: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  cartNavBtn: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  filtersBlock: {
    gap: 10,
    marginBottom: 14,
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
  chipsScroll: {
    gap: 8,
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
  subChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.creamTint,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subChipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  subChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.oliveDeep,
  },
  subChipTextActive: {
    color: '#ffffff',
  },
  sortChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: {
    borderColor: Colors.turmericGold,
    backgroundColor: '#fff8e6',
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.inkMuted,
  },
  sortChipTextActive: {
    color: Colors.barkBrown,
    fontWeight: '700',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: '48.3%',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  imageWrap: {
    position: 'relative',
    height: 126,
    backgroundColor: Colors.sagePale,
  },
  medImage: {
    width: '100%',
    height: '100%',
  },
  medPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.creamTint,
  },
  rxBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.warning,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rxBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(163,61,50,0.9)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardBody: {
    padding: 11,
    gap: 5,
    flex: 1,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.oliveAction,
    textTransform: 'uppercase',
  },
  medName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.inkStrong,
    lineHeight: 18,
  },
  pharmacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pharmacyText: {
    flex: 1,
    fontSize: 10,
    color: Colors.inkMuted,
  },
  priceActionRow: {
    marginTop: 'auto',
    paddingTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sagePale,
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 3,
    gap: 6,
  },
  stepBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.oliveDeep,
    minWidth: 14,
    textAlign: 'center',
  },
  disabledBtn: {
    opacity: 0.45,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingVertical: 8,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  pageInfo: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkMuted,
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
});
