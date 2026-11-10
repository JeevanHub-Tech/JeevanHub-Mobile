// src/app/(patient)/checkout/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  Leaf,
  Lock,
  MapPin,
  PackageCheck,
  ShoppingCart,
  Trash2,
  Truck,
  UploadCloud,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import { BACKEND_URL } from '../../../config';
import { Colors, Shadows } from '../../../constants/theme';
import { useAuthStore } from '../../../store/authStore';
import type { CartLineItem, ShippingAddress } from '../../../types/patient';
import {
  formatInr,
  getMedicineThumbUrl,
  getRetailerDisplayName,
} from '../../../utils/medicineHelpers';

type CheckoutStep = 'summary' | 'shipping' | 'prescription' | 'confirmation';

interface FreightRow {
  retailerId: string;
  retailerName: string;
  weightGrams?: number;
  zone?: string;
  onlineAmount: number;
  codAmount: number;
  error?: string | null;
}

interface PickedRxFile {
  uri: string;
  name: string;
  type: string;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [cartItems, setCartItems] = useState<CartLineItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);

  const [address, setAddress] = useState<ShippingAddress>({
    street: user?.address || '',
    city: '',
    state: '',
    postalCode: user?.zipCode || '',
    country: 'India',
  });
  const [paymentMethod, setPaymentMethod] = useState<'onlinePayment' | 'cashOnDelivery'>(
    'onlinePayment'
  );

  const [freightLoading, setFreightLoading] = useState(false);
  const [freightRows, setFreightRows] = useState<FreightRow[]>([]);

  const [rxFiles, setRxFiles] = useState<PickedRxFile[]>([]);
  const [rxUrls, setRxUrls] = useState<string[]>([]);
  const [rxUploading, setRxUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) {
      setCartLoading(false);
      return;
    }
    patientApi
      .getCart(user.id)
      .then((res) => {
        setCartItems(res.defaultCart?.items || []);
      })
      .catch((err: any) => {
        setError(err?.message || 'Unable to load cart.');
      })
      .finally(() => setCartLoading(false));
  }, [user?.id]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + (item.medicineId?.price || 0) * item.quantity,
        0
      ),
    [cartItems]
  );

  const prescriptionNeeded = useMemo(
    () => cartItems.some((item) => item.medicineId?.prescription === true),
    [cartItems]
  );

  const steps: CheckoutStep[] = useMemo(() => {
    const list: CheckoutStep[] = ['summary', 'shipping'];
    if (prescriptionNeeded) list.push('prescription');
    list.push('confirmation');
    return list;
  }, [prescriptionNeeded]);

  const currentStep = steps[stepIndex] || 'summary';

  const shippingCharge = useMemo(
    () =>
      freightRows.reduce(
        (sum, r) =>
          sum + (paymentMethod === 'onlinePayment' ? r.onlineAmount : r.codAmount),
        0
      ),
    [freightRows, paymentMethod]
  );

  const grandTotal = subtotal + shippingCharge;

  const fetchFreight = useCallback(
    async (pin: string) => {
      if (!/^\d{6}$/.test(pin) || cartItems.length === 0) return;
      setFreightLoading(true);

      const groups: Record<
        string,
        {
          retailerId: string;
          retailerName: string;
          items: Array<{ medicineId: string; quantity: number }>;
        }
      > = {};

      for (const item of cartItems) {
        const med = item.medicineId;
        if (!med?._id) continue;
        const rid =
          typeof med.retailerId === 'object' ? med.retailerId?._id : med.retailerId;
        if (!rid) continue;
        if (!groups[rid]) {
          groups[rid] = {
            retailerId: rid,
            retailerName: getRetailerDisplayName(med.retailerId),
            items: [],
          };
        }
        groups[rid].items.push({ medicineId: med._id, quantity: item.quantity });
      }

      const rows: FreightRow[] = [];
      for (const grp of Object.values(groups)) {
        try {
          const [onRes, codRes] = await Promise.allSettled([
            patientApi.estimateFreight({
              platform: 'delhivery',
              retailerId: grp.retailerId,
              destPin: pin,
              items: grp.items,
              paymentMethod: 'onlinePayment',
            }),
            patientApi.estimateFreight({
              platform: 'delhivery',
              retailerId: grp.retailerId,
              destPin: pin,
              items: grp.items,
              paymentMethod: 'cashOnDelivery',
            }),
          ]);

          const onData = onRes.status === 'fulfilled' ? onRes.value : null;
          const codData = codRes.status === 'fulfilled' ? codRes.value : null;

          rows.push({
            retailerId: grp.retailerId,
            retailerName: grp.retailerName,
            weightGrams: onData?.weightGrams || codData?.weightGrams,
            zone: onData?.zone || codData?.zone,
            onlineAmount: onData?.totalAmount || 0,
            codAmount: codData?.totalAmount || 0,
            error:
              !onData && !codData
                ? 'Freight estimate unavailable for this pincode'
                : null,
          });
        } catch {
          rows.push({
            retailerId: grp.retailerId,
            retailerName: grp.retailerName,
            onlineAmount: 0,
            codAmount: 0,
            error: 'Shipping estimation unavailable',
          });
        }
      }

      setFreightRows(rows);
      setFreightLoading(false);
    },
    [cartItems]
  );

  useEffect(() => {
    if (
      currentStep === 'shipping' &&
      /^\d{6}$/.test(address.postalCode.trim()) &&
      cartItems.length > 0
    ) {
      fetchFreight(address.postalCode.trim());
    }
  }, [currentStep, address.postalCode, cartItems.length, fetchFreight]);

  const handlePickRx = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;
      const picked = res.assets.slice(0, 5).map((a) => ({
        uri: a.uri,
        name: a.name || `rx-${Date.now()}.jpg`,
        type: a.mimeType || 'image/jpeg',
      }));
      setRxFiles((prev) => [...prev, ...picked].slice(0, 5));
      setRxUrls([]);
    } catch (err: any) {
      Alert.alert('Picker Error', err?.message || 'Could not select prescription file.');
    }
  };

  const handleUploadRx = async () => {
    if (rxFiles.length === 0) {
      setError('Please choose at least one prescription image or PDF.');
      return;
    }
    setRxUploading(true);
    setError('');
    try {
      const urls = await patientApi.uploadOrderPrescriptions(rxFiles);
      if (urls.length === 0) {
        throw new Error('No prescription URLs returned by server.');
      }
      setRxUrls(urls);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload prescription.');
    } finally {
      setRxUploading(false);
    }
  };

  const buildOrderPayload = (extra: Record<string, any> = {}) => ({
    items: cartItems.map((i) => ({
      medicineId: i.medicineId._id,
      quantity: i.quantity,
    })),
    buyer: {
      firstName: user?.firstName || 'Patient',
      lastName: user?.lastName || '',
      type: user?.role || 'patient',
    },
    shippingAddress: {
      street: address.street.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      postalCode: address.postalCode.trim(),
      country: address.country.trim() || 'India',
    },
    paymentMethod,
    shippingCharge,
    ...(prescriptionNeeded ? { prescriptionUrls: rxUrls } : {}),
    ...extra,
  });

  const handlePlaceOrder = async () => {
    setError('');
    if (
      !address.street.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !/^\d{6}$/.test(address.postalCode.trim())
    ) {
      setError('Please complete all shipping address fields including a 6-digit pincode.');
      return;
    }
    if (prescriptionNeeded && rxUrls.length === 0) {
      setError('Please upload your prescription before placing the order.');
      return;
    }

    setSubmitting(true);

    if (paymentMethod === 'cashOnDelivery') {
      try {
        const order = await patientApi.createMedicineOrder(buildOrderPayload());
        setPlacedOrderId(order._id);
        setStepIndex(steps.length - 1);
      } catch (err: any) {
        setError(err?.message || 'Failed to place Cash on Delivery order.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Online payment via Razorpay web-browser bridge (Expo Go has no native Razorpay SDK)
    try {
      const rzpOrder = await patientApi.createRazorpayOrder(
        Number(grandTotal.toFixed(2))
      );
      const redirectUri = Linking.createURL('razorpay-callback');
      const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

      const qs = new URLSearchParams({
        orderId: rzpOrder.id,
        amount: String(rzpOrder.amount),
        currency: rzpOrder.currency || 'INR',
        name: fullName,
        email: user?.email || '',
        contact: user?.phone || '',
        description: 'JeevanHub Medicine Order',
        redirectUri,
      }).toString();

      const checkoutUrl = `${BACKEND_URL}/api/payment/checkout?${qs}`;
      const authResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, redirectUri);

      if (authResult.type !== 'success' || !authResult.url) {
        setError('Payment window was cancelled before completion.');
        setSubmitting(false);
        return;
      }

      const parsed = Linking.parse(authResult.url);
      const q = parsed.queryParams || {};
      const status = String(q.status || '');

      if (status !== 'success') {
        const msg = q.error
          ? String(q.error)
          : status === 'cancelled'
            ? 'Payment was cancelled.'
            : 'Payment did not complete.';
        setError(msg);
        setSubmitting(false);
        return;
      }

      const razorpayOrderId = String(q.razorpay_order_id || '');
      const razorpayPaymentId = String(q.razorpay_payment_id || '');
      const razorpaySignature = String(q.razorpay_signature || '');

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        setError('Incomplete Razorpay payment verification parameters received.');
        setSubmitting(false);
        return;
      }

      const order = await patientApi.createMedicineOrder(
        buildOrderPayload({
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        })
      );
      setPlacedOrderId(order._id);
      setStepIndex(steps.length - 1);
    } catch (err: any) {
      setError(err?.message || 'Online payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goNextFromShipping = () => {
    setError('');
    if (
      !address.street.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !/^\d{6}$/.test(address.postalCode.trim())
    ) {
      setError('Please enter street, city, state, and a valid 6-digit postal code.');
      return;
    }
    if (prescriptionNeeded) {
      setStepIndex((i) => i + 1);
    } else {
      handlePlaceOrder();
    }
  };

  if (cartLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Preparing checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0 && currentStep !== 'confirmation') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.inkStrong} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <ShoppingCart size={36} color={Colors.inkLight} />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.loadingText}>Add medicines before checking out.</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(patient)/medicines' as any)}
          >
            <Text style={styles.primaryBtnText}>Browse Medicines</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => {
            if (stepIndex > 0 && currentStep !== 'confirmation') {
              setStepIndex((i) => i - 1);
            } else {
              router.back();
            }
          }}
        >
          <ArrowLeft size={20} color={Colors.inkStrong} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Checkout</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepIndicatorText}>
            {stepIndex + 1}/{steps.length}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Step Progress Pills */}
          <View style={styles.stepsBar}>
            {steps.map((s, i) => {
              const active = i <= stepIndex;
              const label =
                s === 'summary'
                  ? 'Summary'
                  : s === 'shipping'
                    ? 'Shipping'
                    : s === 'prescription'
                      ? 'Rx Upload'
                      : 'Done';
              return (
                <View
                  key={s}
                  style={[styles.stepPill, active && styles.stepPillActive]}
                >
                  <Text
                    style={[styles.stepPillText, active && styles.stepPillTextActive]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <AlertTriangle size={15} color={Colors.error} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* STEP 1: SUMMARY */}
          {currentStep === 'summary' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Order Summary</Text>
              {cartItems.map((item) => {
                const thumb = getMedicineThumbUrl(item.medicineId);
                return (
                  <View key={item.medicineId._id} style={styles.summaryRow}>
                    {thumb ? (
                      <Image source={{ uri: thumb }} style={styles.thumb} />
                    ) : (
                      <View style={styles.thumbFallback}>
                        <Leaf size={18} color={Colors.oliveAction} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.medicineId.name}</Text>
                      <Text style={styles.itemMeta}>
                        {formatInr(item.medicineId.price)} × {item.quantity}
                      </Text>
                      {item.medicineId.prescription ? (
                        <Text style={styles.rxTag}>Prescription required</Text>
                      ) : null}
                    </View>
                    <Text style={styles.itemSubtotal}>
                      {formatInr((item.medicineId.price || 0) * item.quantity)}
                    </Text>
                  </View>
                );
              })}

              <View style={styles.divider} />
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Medicines Subtotal</Text>
                <Text style={styles.totalVal}>{formatInr(subtotal)}</Text>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setStepIndex(1)}
              >
                <Text style={styles.primaryBtnText}>Next: Shipping & Payment</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* STEP 2: SHIPPING & PAYMENT */}
          {currentStep === 'shipping' ? (
            <>
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <MapPin size={16} color={Colors.oliveAction} />
                  <Text style={styles.cardTitle}>Shipping Address</Text>
                </View>

                <Text style={styles.label}>Street Address</Text>
                <TextInput
                  style={styles.input}
                  value={address.street}
                  onChangeText={(v) => setAddress((a) => ({ ...a, street: v }))}
                  placeholder="House no, street, locality"
                  placeholderTextColor={Colors.inkLight}
                />

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>City</Text>
                    <TextInput
                      style={styles.input}
                      value={address.city}
                      onChangeText={(v) => setAddress((a) => ({ ...a, city: v }))}
                      placeholder="City"
                      placeholderTextColor={Colors.inkLight}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>State</Text>
                    <TextInput
                      style={styles.input}
                      value={address.state}
                      onChangeText={(v) => setAddress((a) => ({ ...a, state: v }))}
                      placeholder="State"
                      placeholderTextColor={Colors.inkLight}
                    />
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Pincode (6 digits)</Text>
                    <TextInput
                      style={styles.input}
                      value={address.postalCode}
                      onChangeText={(v) =>
                        setAddress((a) => ({ ...a, postalCode: v.replace(/\D/g, '').slice(0, 6) }))
                      }
                      keyboardType="numeric"
                      maxLength={6}
                      placeholder="110001"
                      placeholderTextColor={Colors.inkLight}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Country</Text>
                    <TextInput
                      style={[styles.input, { opacity: 0.7 }]}
                      value={address.country}
                      editable={false}
                    />
                  </View>
                </View>

                {/* Delhivery Freight Estimate */}
                {address.postalCode.length === 6 ? (
                  <View style={styles.freightBox}>
                    <View style={styles.cardHeaderRow}>
                      <Truck size={14} color={Colors.oliveAction} />
                      <Text style={styles.freightTitle}>Delhivery Freight Estimate</Text>
                    </View>
                    {freightLoading ? (
                      <View style={styles.freightLoadingRow}>
                        <ActivityIndicator size="small" color={Colors.olive} />
                        <Text style={styles.freightHint}>
                          Calculating courier charges...
                        </Text>
                      </View>
                    ) : freightRows.length > 0 ? (
                      freightRows.map((r) => (
                        <View key={r.retailerId} style={styles.freightRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.freightRetailer}>{r.retailerName}</Text>
                            <Text style={styles.freightHint}>
                              {r.error
                                ? r.error
                                : `${r.weightGrams ? `${(r.weightGrams / 1000).toFixed(1)} kg` : ''}${r.zone ? ` • ${r.zone}` : ''}`}
                            </Text>
                          </View>
                          <Text style={styles.freightCost}>
                            {r.error
                              ? '—'
                              : formatInr(
                                  paymentMethod === 'onlinePayment'
                                    ? r.onlineAmount
                                    : r.codAmount
                                )}
                          </Text>
                        </View>
                      ))
                    ) : null}
                  </View>
                ) : null}
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <CreditCard size={16} color={Colors.oliveAction} />
                  <Text style={styles.cardTitle}>Payment Method</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.payOption,
                    paymentMethod === 'onlinePayment' && styles.payOptionActive,
                  ]}
                  onPress={() => setPaymentMethod('onlinePayment')}
                >
                  <View style={styles.radioOuter}>
                    {paymentMethod === 'onlinePayment' ? (
                      <View style={styles.radioInner} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payTitle}>Online Payment (Razorpay)</Text>
                    <Text style={styles.payDesc}>
                      UPI, Cards & NetBanking via secure Razorpay browser checkout
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.payOption,
                    paymentMethod === 'cashOnDelivery' && styles.payOptionActive,
                  ]}
                  onPress={() => setPaymentMethod('cashOnDelivery')}
                >
                  <View style={styles.radioOuter}>
                    {paymentMethod === 'cashOnDelivery' ? (
                      <View style={styles.radioInner} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payTitle}>Cash on Delivery</Text>
                    <Text style={styles.payDesc}>
                      Pay in cash when your medicines arrive
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.totalsCard}>
                  <View style={styles.totalLine}>
                    <Text style={styles.metaLine}>Medicines</Text>
                    <Text style={styles.metaLine}>{formatInr(subtotal)}</Text>
                  </View>
                  <View style={styles.totalLine}>
                    <Text style={styles.metaLine}>Shipping</Text>
                    <Text style={styles.metaLine}>{formatInr(shippingCharge)}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.totalLine}>
                    <Text style={styles.totalLabel}>Order Total</Text>
                    <Text style={styles.totalVal}>{formatInr(grandTotal)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, submitting && styles.disabledBtn]}
                  onPress={goNextFromShipping}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Lock size={15} color="#ffffff" />
                  )}
                  <Text style={styles.primaryBtnText}>
                    {submitting
                      ? 'Processing...'
                      : prescriptionNeeded
                        ? 'Next: Upload Prescription'
                        : paymentMethod === 'onlinePayment'
                          ? `Pay ${formatInr(grandTotal)} with Razorpay`
                          : 'Place Cash on Delivery Order'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          {/* STEP 3: PRESCRIPTION UPLOAD */}
          {currentStep === 'prescription' ? (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <FileText size={17} color={Colors.oliveAction} />
                <Text style={styles.cardTitle}>Upload Prescription</Text>
              </View>
              <Text style={styles.rxHelper}>
                Your order includes prescription-required medicines. Upload up to 5 clear images or PDFs of your doctor's prescription.
              </Text>

              <TouchableOpacity
                style={styles.pickBtn}
                onPress={handlePickRx}
                disabled={rxUploading}
              >
                <UploadCloud size={18} color={Colors.oliveDeep} />
                <Text style={styles.pickBtnText}>
                  Select Prescription File(s) ({rxFiles.length}/5)
                </Text>
              </TouchableOpacity>

              {rxFiles.map((f, idx) => (
                <View key={idx} style={styles.rxFileRow}>
                  <FileText size={14} color={Colors.oliveAction} />
                  <Text style={styles.rxFileName} numberOfLines={1}>
                    {f.name}
                  </Text>
                  {rxUrls.length === 0 ? (
                    <TouchableOpacity
                      onPress={() =>
                        setRxFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <Trash2 size={15} color={Colors.error} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}

              {rxFiles.length > 0 && rxUrls.length === 0 ? (
                <TouchableOpacity
                  style={[styles.uploadRxBtn, rxUploading && styles.disabledBtn]}
                  onPress={handleUploadRx}
                  disabled={rxUploading}
                >
                  {rxUploading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <UploadCloud size={15} color="#ffffff" />
                  )}
                  <Text style={styles.uploadRxText}>
                    {rxUploading ? 'Uploading...' : 'Upload Prescription'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {rxUrls.length > 0 ? (
                <View style={styles.rxUploadedBanner}>
                  <CheckCircle2 size={16} color={Colors.success} />
                  <Text style={styles.rxUploadedText}>
                    {rxUrls.length} prescription file(s) uploaded!
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (submitting || rxUrls.length === 0) && styles.disabledBtn,
                ]}
                onPress={handlePlaceOrder}
                disabled={submitting || rxUrls.length === 0}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Lock size={15} color="#ffffff" />
                )}
                <Text style={styles.primaryBtnText}>
                  {submitting
                    ? 'Processing...'
                    : paymentMethod === 'onlinePayment'
                      ? `Pay ${formatInr(grandTotal)} with Razorpay`
                      : 'Place Order'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* STEP 4: CONFIRMATION */}
          {currentStep === 'confirmation' ? (
            <View style={styles.confirmCard}>
              <View style={styles.confirmIcon}>
                <PackageCheck size={34} color={Colors.success} />
              </View>
              <Text style={styles.confirmTitle}>Order Placed Successfully!</Text>
              <Text style={styles.confirmSub}>
                Thank you for choosing JeevanHub Ayurvedic Pharmacy.
              </Text>
              {placedOrderId ? (
                <View style={styles.orderIdPill}>
                  <Text style={styles.orderIdText}>
                    Order #{placedOrderId.slice(-8).toUpperCase()}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.confirmTotal}>
                Total: {formatInr(grandTotal)} (
                {paymentMethod === 'cashOnDelivery' ? 'Cash on Delivery' : 'Paid Online'})
              </Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.replace('/(patient)/orders' as any)}
              >
                <Truck size={16} color="#ffffff" />
                <Text style={styles.primaryBtnText}>View & Track My Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.replace('/(patient)/medicines' as any)}
              >
                <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
  stepIndicator: {
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  stepIndicatorText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
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
  stepsBar: {
    flexDirection: 'row',
    gap: 6,
  },
  stepPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepPillActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  stepPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  stepPillTextActive: {
    color: '#ffffff',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorBg,
    borderRadius: 12,
    padding: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.error,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.sagePale,
  },
  thumbFallback: {
    width: 52,
    height: 52,
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
  itemMeta: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  rxTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.warning,
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  metaLine: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  input: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.inkStrong,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
    gap: 5,
  },
  freightBox: {
    backgroundColor: Colors.creamTint,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  freightTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  freightLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  freightRetailer: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  freightHint: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  freightCost: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  payOptionActive: {
    borderColor: Colors.oliveAction,
    backgroundColor: Colors.creamTint,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.oliveAction,
  },
  payTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  payDesc: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  totalsCard: {
    backgroundColor: Colors.sagePale,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.oliveAction,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sagePale,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    width: '100%',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  rxHelper: {
    fontSize: 13,
    color: Colors.inkMuted,
    lineHeight: 19,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.creamTint,
    borderRadius: 14,
    paddingVertical: 14,
  },
  pickBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  rxFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  rxFileName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.inkStrong,
  },
  uploadRxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Colors.barkBrown,
    borderRadius: 12,
    paddingVertical: 11,
  },
  uploadRxText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  rxUploadedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successBg,
    borderRadius: 12,
    padding: 11,
  },
  rxUploadedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  confirmCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    ...Shadows.card,
  },
  confirmIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.oliveDeep,
    textAlign: 'center',
  },
  confirmSub: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
  },
  orderIdPill: {
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  confirmTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 4,
  },
});

