import { SafeAreaView } from 'react-native-safe-area-context';
// src/app/(patient)/checkout.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Banknote,
  Camera,
  CheckCircle2,
  Copy,
  CreditCard,
  MapPin,
  QrCode,
  ShieldCheck,
  Truck,
  UploadCloud,
  X,
} from 'lucide-react-native';
import { cartApi } from '../../api/cart';
import { orderApi } from '../../api/order';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { CartItem, CreateOrderPayload, ShippingAddress } from '../../types/cart';

const OFFICIAL_UPI_ID = 'jeevanhub@okaxis';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Shipping Address Form
  const [street, setStreet] = useState(user?.zipCode ? `Plot 4, Sector 12` : '');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [pinCode, setPinCode] = useState(user?.zipCode || '110001');

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'onlinePayment' | 'cashOnDelivery'>('onlinePayment');
  const [paymentScreenshotUri, setPaymentScreenshotUri] = useState<string | null>(null);

  useEffect(() => {
    const loadCartItems = async () => {
      if (!user?.id) return;
      try {
        const data = await cartApi.getCart(user.id);
        const collected: CartItem[] = [];
        if (data.defaultCart?.items) collected.push(...data.defaultCart.items);
        if (data.doctorCarts) {
          data.doctorCarts.forEach((dc) => {
            if (dc.items) collected.push(...dc.items);
          });
        }
        setItems(collected);
      } catch (err) {
        console.error('Error loading checkout items:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCartItems();
  }, [user?.id]);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCharge = subtotal > 500 || subtotal === 0 ? 0 : 50;
  const grandTotal = subtotal + shippingCharge;

  const handlePickPaymentScreenshot = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPaymentScreenshotUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Unable to pick payment screenshot.');
    }
  };

  const handleCopyUpi = () => {
    Alert.alert('UPI ID Copied', `${OFFICIAL_UPI_ID} has been noted. Pay via GPay / PhonePe / Paytm.`);
  };

  const handlePlaceOrder = async () => {
    if (!street.trim() || !city.trim() || !state.trim() || !pinCode.trim()) {
      Alert.alert('Incomplete Address', 'Please provide your full shipping address for courier delivery.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'There are no medicines in your cart.');
      return;
    }

    setSubmitting(true);
    try {
      const shippingAddress: ShippingAddress = {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pinCode: pinCode.trim(),
        country: 'India',
      };

      const orderPayload: CreateOrderPayload = {
        items: items.map((i) => ({
          medicineId: i.medicineId?._id || (i as any)._id,
          quantity: i.quantity,
          price: i.price,
        })),
        buyer: {
          buyerId: user?.id || '',
          buyerModel: 'Patient',
          buyerName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Patient',
          buyerEmail: user?.email || '',
          buyerContactNumber: user?.phone || '9999999999',
        },
        shippingAddress,
        paymentMethod,
        shippingCharge,
      };

      const res = await orderApi.createOrder(orderPayload);
      const placedOrder = res?.order || res;

      // Upload payment screenshot if provided
      if (placedOrder?._id && paymentScreenshotUri) {
        try {
          await orderApi.uploadPaymentProof(placedOrder._id, paymentScreenshotUri);
        } catch (proofErr) {
          console.warn('Payment proof upload error:', proofErr);
        }
      }

      Alert.alert(
        'Order Placed Successfully!',
        'Your Ayurvedic formulations have been queued for dispatch with Delhivery courier tracking.',
        [
          {
            text: 'Track Order',
            onPress: () => router.replace('/(patient)/orders' as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Order Failed', err?.response?.data?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Preparing Checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.oliveDeep} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Delivery & Payment</Text>
          <Text style={styles.headerSubtitle}>Official JeevanHub Pharmacy Supply</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Shipping Address Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color={Colors.oliveDeep} />
            <Text style={styles.sectionTitle}>Courier Delivery Address</Text>
          </View>

          <Text style={styles.label}>Street / House / Colony Address</Text>
          <TextInput
            style={styles.textInput}
            value={street}
            onChangeText={setStreet}
            placeholder="e.g. Flat 302, Green Valley Apartments"
            placeholderTextColor={Colors.inkMuted}
          />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.textInput}
                value={city}
                onChangeText={setCity}
                placeholder="New Delhi"
                placeholderTextColor={Colors.inkMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.textInput}
                value={state}
                onChangeText={setState}
                placeholder="Delhi"
                placeholderTextColor={Colors.inkMuted}
              />
            </View>
          </View>

          <Text style={styles.label}>PIN Code</Text>
          <TextInput
            style={styles.textInput}
            value={pinCode}
            onChangeText={setPinCode}
            keyboardType="numeric"
            placeholder="110001"
            placeholderTextColor={Colors.inkMuted}
            maxLength={6}
          />
        </View>

        {/* Payment Method Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <CreditCard size={18} color={Colors.oliveDeep} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          {/* Payment Method Selector */}
          <View style={styles.paymentMethodsRow}>
            <TouchableOpacity
              style={[
                styles.methodCard,
                paymentMethod === 'onlinePayment' && styles.methodCardActive,
              ]}
              onPress={() => setPaymentMethod('onlinePayment')}
              activeOpacity={0.8}
            >
              <QrCode size={20} color={paymentMethod === 'onlinePayment' ? Colors.oliveDeep : Colors.inkMuted} />
              <Text
                style={[
                  styles.methodCardText,
                  paymentMethod === 'onlinePayment' && styles.methodCardTextActive,
                ]}
              >
                UPI Payment
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodCard,
                paymentMethod === 'cashOnDelivery' && styles.methodCardActive,
              ]}
              onPress={() => setPaymentMethod('cashOnDelivery')}
              activeOpacity={0.8}
            >
              <Banknote size={20} color={paymentMethod === 'cashOnDelivery' ? Colors.oliveDeep : Colors.inkMuted} />
              <Text
                style={[
                  styles.methodCardText,
                  paymentMethod === 'cashOnDelivery' && styles.methodCardTextActive,
                ]}
              >
                Cash on Delivery
              </Text>
            </TouchableOpacity>
          </View>

          {/* Online UPI Transfer Instructions */}
          {paymentMethod === 'onlinePayment' && (
            <View style={styles.upiBox}>
              <View style={styles.upiRow}>
                <View>
                  <Text style={styles.upiLabel}>Official JeevanHub UPI ID:</Text>
                  <Text style={styles.upiValue}>{OFFICIAL_UPI_ID}</Text>
                </View>
                <TouchableOpacity onPress={handleCopyUpi} style={styles.copyBtn}>
                  <Copy size={16} color={Colors.oliveDeep} />
                </TouchableOpacity>
              </View>

              <Text style={styles.proofNote}>
                Pay ₹{grandTotal} using any UPI app (GPay / PhonePe / Paytm / BHIM) and upload the payment receipt below.
              </Text>

              {/* Upload Screenshot Button */}
              {paymentScreenshotUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: paymentScreenshotUri }} style={styles.previewImg} />
                  <TouchableOpacity
                    style={styles.removeProofBtn}
                    onPress={() => setPaymentScreenshotUri(null)}
                  >
                    <X size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={handlePickPaymentScreenshot}
                  activeOpacity={0.8}
                >
                  <Camera size={18} color={Colors.oliveDeep} />
                  <Text style={styles.uploadBtnText}>Attach Payment Screenshot</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Order Bill Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Summary ({items.length} items)</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Courier Shipping</Text>
            <Text style={styles.summaryValue}>
              {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total Payable</Text>
            <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
          </View>
        </View>

        {/* Place Order CTA */}
        <TouchableOpacity
          style={[styles.placeOrderBtn, submitting && styles.btnDisabled]}
          onPress={handlePlaceOrder}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.cream} />
          ) : (
            <>
              <Truck size={20} color={Colors.cream} />
              <Text style={styles.placeOrderText}>Confirm & Place Order (₹{grandTotal})</Text>
            </>
          )}
        </TouchableOpacity>
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
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginTop: 10,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.inkStrong,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 14,
  },
  methodCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  methodCardActive: {
    backgroundColor: Colors.sagePale,
    borderColor: Colors.oliveAction,
  },
  methodCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  methodCardTextActive: {
    color: Colors.oliveDeep,
  },
  upiBox: {
    backgroundColor: Colors.cream,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  upiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upiLabel: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  upiValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
    marginTop: 2,
  },
  copyBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  proofNote: {
    fontSize: 11,
    color: Colors.inkMuted,
    lineHeight: 16,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.oliveAction,
    borderStyle: 'dashed',
    paddingVertical: 12,
    gap: 8,
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  previewImg: {
    width: 200,
    height: 120,
    borderRadius: 12,
  },
  removeProofBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 12,
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
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.oliveAction,
    paddingVertical: 15,
    borderRadius: 16,
    gap: 10,
    marginTop: 6,
  },
  placeOrderText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.cream,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
