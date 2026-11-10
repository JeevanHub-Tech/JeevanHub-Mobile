// src/app/(patient)/medicines/[id].tsx
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
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import { Colors, Shadows } from '../../../constants/theme';
import { useAuthStore } from '../../../store/authStore';
import type { MedicineItem } from '../../../types/patient';
import {
  formatInr,
  getRetailerDisplayName,
  isRetailerVerified,
  resolveMedicineImageUrl,
} from '../../../utils/medicineHelpers';

export default function MedicineDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const medicineId = Array.isArray(params.id) ? params.id[0] : params.id || '';
  const { user } = useAuthStore();

  const [medicine, setMedicine] = useState<MedicineItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!medicineId) {
      setLoading(false);
      setError('Invalid medicine ID.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    patientApi
      .getMedicineDetail(medicineId)
      .then((data) => {
        if (!cancelled) {
          setMedicine(data);
          setError(null);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || 'Medicine is currently unavailable.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [medicineId]);

  const images = useMemo(() => {
    if (!medicine) return [];
    const rawList = [
      ...(medicine.images || []),
      ...(medicine.image ? [medicine.image] : []),
    ];
    return Array.from(
      new Set(rawList.map((p) => resolveMedicineImageUrl(p)).filter(Boolean))
    ) as string[];
  }, [medicine]);

  const handleAdd = async (goToCart = false) => {
    if (!user?.id || !medicine) return;
    setAdding(true);
    try {
      await patientApi.addToCart(user.id, medicine._id, qty);
      if (goToCart) {
        router.push('/(patient)/cart' as any);
      } else {
        Alert.alert('Added to Cart', `${medicine.name} (×${qty}) added to your cart.`);
      }
    } catch (err: any) {
      Alert.alert('Cart Error', err?.message || 'Could not add item to cart.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.inkStrong} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Medicine Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading formulation details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!medicine || error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.inkStrong} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Medicine Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Leaf size={36} color={Colors.inkLight} />
          <Text style={styles.errorTitle}>Medicine Not Available</Text>
          <Text style={styles.loadingText}>{error || 'Could not load medicine.'}</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.replace('/(patient)/medicines' as any)}
          >
            <Text style={styles.browseBtnText}>Browse Medicines</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const pharmacy = getRetailerDisplayName(medicine.retailerId);
  const verified = isRetailerVerified(medicine.retailerId);
  const maxStock = Math.max(0, medicine.quantity ?? 0);
  const inStock = maxStock > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkStrong} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {medicine.name}
        </Text>
        <TouchableOpacity
          style={styles.navCartBtn}
          onPress={() => router.push('/(patient)/cart' as any)}
        >
          <ShoppingCart size={19} color={Colors.oliveDeep} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <View style={styles.galleryCard}>
          {images.length > 0 ? (
            <Image
              source={{ uri: images[imgIndex] || images[0] }}
              style={styles.heroImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imageFallback}>
              <Leaf size={48} color={Colors.oliveAction} />
            </View>
          )}

          {images.length > 1 ? (
            <>
              <TouchableOpacity
                style={[styles.galleryArrow, { left: 12 }]}
                onPress={() =>
                  setImgIndex((i) => (i === 0 ? images.length - 1 : i - 1))
                }
              >
                <ChevronLeft size={18} color={Colors.inkStrong} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.galleryArrow, { right: 12 }]}
                onPress={() =>
                  setImgIndex((i) => (i === images.length - 1 ? 0 : i + 1))
                }
              >
                <ChevronRight size={18} color={Colors.inkStrong} />
              </TouchableOpacity>
              <View style={styles.dotsRow}>
                {images.map((_, idx) => (
                  <View
                    key={idx}
                    style={[styles.dot, idx === imgIndex && styles.dotActive]}
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>

        {/* Core Product Info */}
        <View style={styles.infoCard}>
          <View style={styles.badgesRow}>
            {medicine.category ? (
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{medicine.category}</Text>
              </View>
            ) : null}
            {medicine.prescription ? (
              <View style={styles.rxWarnBadge}>
                <AlertTriangle size={12} color={Colors.warning} />
                <Text style={styles.rxWarnText}>Prescription Required</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.title}>{medicine.name}</Text>

          <View style={styles.pharmacyRow}>
            <Store size={14} color={Colors.oliveAction} />
            <Text style={styles.pharmacyText}>{pharmacy}</Text>
            {verified ? (
              <View style={styles.verifiedPill}>
                <ShieldCheck size={12} color={Colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.priceStockRow}>
            <Text style={styles.price}>{formatInr(medicine.price)}</Text>
            <Text
              style={[
                styles.stockLabel,
                { color: inStock ? Colors.success : Colors.error },
              ]}
            >
              {inStock ? `${maxStock} units in stock` : 'Out of Stock'}
            </Text>
          </View>

          {inStock ? (
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Quantity</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus size={15} color={Colors.oliveDeep} />
                </TouchableOpacity>
                <Text style={styles.stepVal}>{qty}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setQty((q) => Math.min(maxStock, q + 1))}
                >
                  <Plus size={15} color={Colors.oliveDeep} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>

        {/* Description */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>About This Formulation</Text>
          <Text style={styles.descText}>
            {medicine.description || 'Authentic Ayurvedic formulation prepared under GMP standards.'}
          </Text>

          {medicine.diseasesTreated?.length ? (
            <View style={styles.tagsBlock}>
              <Text style={styles.subLabel}>Indications / Supports</Text>
              <View style={styles.tagsRow}>
                {medicine.diseasesTreated.map((d, i) => (
                  <View key={i} style={styles.tagChip}>
                    <Text style={styles.tagText}>{d}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.safetyBox}>
            <Text style={styles.safetyText}>
              Storage & Safety: Store in a cool, dry place away from direct sunlight. Consult an Ayurvedic practitioner for personalized dosage.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.addToCartBtn, (!inStock || adding) && styles.disabledBtn]}
          disabled={!inStock || adding}
          onPress={() => handleAdd(false)}
          activeOpacity={0.85}
        >
          <ShoppingCart size={17} color={Colors.oliveDeep} />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buyNowBtn, (!inStock || adding) && styles.disabledBtn]}
          disabled={!inStock || adding}
          onPress={() => handleAdd(true)}
          activeOpacity={0.85}
        >
          {adding ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <ShoppingBag size={17} color="#ffffff" />
          )}
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
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
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  navCartBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  content: {
    padding: 16,
    paddingBottom: 110,
    gap: 14,
  },
  galleryCard: {
    position: 'relative',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.creamTint,
  },
  galleryArrow: {
    position: 'absolute',
    top: '44%',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(47,53,36,0.25)',
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.oliveAction,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Shadows.card,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catBadge: {
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  rxWarnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.warningBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rxWarnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.warning,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.inkStrong,
    lineHeight: 27,
  },
  pharmacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pharmacyText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.inkMuted,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },
  priceStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  stockLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  qtyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.sagePale,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.oliveDeep,
    minWidth: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  descText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.inkMuted,
  },
  tagsBlock: {
    gap: 6,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: Colors.creamTint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.oliveDeep,
  },
  safetyBox: {
    backgroundColor: Colors.sagePale,
    borderRadius: 12,
    padding: 12,
  },
  safetyText: {
    fontSize: 12,
    color: Colors.inkMuted,
    lineHeight: 17,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Colors.sagePale,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  buyNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Colors.oliveAction,
    borderRadius: 14,
    paddingVertical: 13,
  },
  buyNowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  disabledBtn: {
    opacity: 0.45,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
  },
  browseBtn: {
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 4,
  },
  browseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});

