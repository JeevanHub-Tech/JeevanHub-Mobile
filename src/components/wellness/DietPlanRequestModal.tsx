// src/components/wellness/DietPlanRequestModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  QrCode,
  Salad,
  Stethoscope,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react-native';
import { patientApi } from '../../api/patient';
import { Colors } from '../../constants/theme';
import type { Appointment } from '../../types/patient';
import {
  getBookingDietFee,
  getBookingDisplayDate,
  getBookingDoctorName,
  isBookingAccepted,
} from '../../utils/wellnessHelpers';

interface SelectedProofFile {
  uri: string;
  name: string;
  type: string;
}

interface DietPlanRequestModalProps {
  visible: boolean;
  onClose: () => void;
  booking?: Appointment | null;
  bookings?: Appointment[];
  onSuccess?: () => void;
  onFindDoctor?: () => void;
}

const EMPTY_BOOKINGS: Appointment[] = [];

export function DietPlanRequestModal({
  visible,
  onClose,
  booking: singleBooking,
  bookings = EMPTY_BOOKINGS,
  onSuccess,
  onFindDoctor,
}: DietPlanRequestModalProps) {
  const eligibleBookings = useMemo(() => {
    if (singleBooking) return [singleBooking];
    return bookings.filter(
      (b) =>
        isBookingAccepted(b) &&
        !(b.dietPlanRequested && b.dietPlanStatus === 'completed')
    );
  }, [singleBooking, bookings]);

  const [selectedId, setSelectedId] = useState<string>('');
  const [showUpiSection, setShowUpiSection] = useState(false);
  const [proofFiles, setProofFiles] = useState<SelectedProofFile[]>([]);
  const [submittingDirect, setSubmittingDirect] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowUpiSection(false);
      setProofFiles((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    if (singleBooking?._id) {
      setSelectedId(singleBooking._id);
    } else if (eligibleBookings.length > 0) {
      setSelectedId(eligibleBookings[0]._id);
    } else {
      setSelectedId('');
    }
  }, [visible, singleBooking?._id, eligibleBookings]);

  const activeBooking = useMemo(
    () =>
      eligibleBookings.find((b) => b._id === selectedId) ||
      eligibleBookings[0] ||
      null,
    [eligibleBookings, selectedId]
  );

  const fee = getBookingDietFee(activeBooking);
  const doctorName = activeBooking ? getBookingDoctorName(activeBooking) : '';
  const docObj =
    activeBooking && typeof activeBooking.doctorId === 'object'
      ? activeBooking.doctorId
      : null;
  const upiId =
    docObj?.upiId || activeBooking?.doctorUpiId || 'payments@jeevanhub';

  const upiUrl = activeBooking
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
        doctorName
      )}&am=${fee}&cu=INR&tn=${encodeURIComponent(
        `DietPlan-${activeBooking._id}`
      )}`
    : '';

  const qrUrl = upiUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        upiUrl
      )}`
    : '';

  const handleOpenUpiApp = async () => {
    if (!upiUrl) return;
    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
      } else {
        Alert.alert(
          'UPI App Not Found',
          `No UPI app handler detected. You can scan the QR code or pay directly to UPI ID: ${upiId}`
        );
      }
    } catch {
      Alert.alert('Unable to Open UPI', `Please scan the QR code or pay to ${upiId}.`);
    }
  };

  const handlePickScreenshots = async () => {
    if (proofFiles.length >= 5) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow photo library access to attach your UPI payment screenshot.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - proofFiles.length,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const picked: SelectedProofFile[] = result.assets.map((asset, idx) => ({
      uri: asset.uri,
      name: asset.fileName || `payment-proof-${Date.now()}-${idx}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    }));
    setProofFiles((prev) => [...prev, ...picked].slice(0, 5));
  };

  const handleUploadProof = async () => {
    if (!activeBooking) return;
    if (proofFiles.length === 0) {
      Alert.alert(
        'Screenshot Required',
        'Please attach at least one payment screenshot before submitting.'
      );
      return;
    }

    setUploadingProof(true);
    try {
      await patientApi.uploadDietPlanPaymentProof(activeBooking._id, proofFiles);
      Alert.alert(
        'Request Sent',
        `Payment proof uploaded! ${doctorName} has been notified to customize your 7-day Ayurvedic diet & yoga plan.`
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      Alert.alert(
        'Upload Failed',
        err?.message || 'Could not upload payment proof right now.'
      );
    } finally {
      setUploadingProof(false);
    }
  };

  const handleDirectRequest = async () => {
    if (!activeBooking) return;
    setSubmittingDirect(true);
    try {
      await patientApi.requestDietPlanPostBooking(activeBooking._id);
      Alert.alert(
        'Diet Plan Requested',
        `Your personalized 7-day diet & yoga plan request has been sent to ${doctorName}.`
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      Alert.alert(
        'Request Failed',
        err?.message || 'Unable to submit diet plan request.'
      );
    } finally {
      setSubmittingDirect(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Salad size={20} color={Colors.oliveAction} />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>
                Request Doctor-Certified Plan
              </Text>
              <Text style={styles.headerSub}>
                Personalized 7-day Ayurvedic Diet & Yoga review
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={Colors.inkStrong} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {!activeBooking ? (
              <View style={styles.emptyBox}>
                <Stethoscope size={36} color={Colors.olive} />
                <Text style={styles.emptyTitle}>No Eligible Appointments Yet</Text>
                <Text style={styles.emptyDesc}>
                  Book and confirm a consultation with an Ayurvedic doctor first so they can review and certify your diet & yoga plan.
                </Text>
                {onFindDoctor ? (
                  <TouchableOpacity
                    style={styles.findDocBtn}
                    onPress={() => {
                      onClose();
                      onFindDoctor();
                    }}
                  >
                    <Stethoscope size={16} color="#ffffff" />
                    <Text style={styles.findDocBtnText}>Find a Doctor</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <>
                {/* Choose Appointment if multiple */}
                {!singleBooking && eligibleBookings.length > 1 ? (
                  <View style={styles.pickerSection}>
                    <Text style={styles.pickerLabel}>
                      Select Consultation to Attach Request
                    </Text>
                    <View style={styles.bookingOptions}>
                      {eligibleBookings.map((b) => {
                        const selected = b._id === activeBooking._id;
                        return (
                          <TouchableOpacity
                            key={b._id}
                            style={[
                              styles.bookingOptionCard,
                              selected && styles.bookingOptionCardActive,
                            ]}
                            onPress={() => setSelectedId(b._id)}
                          >
                            <View style={styles.bookingOptRow}>
                              <Text style={styles.bookingOptDoctor}>
                                {getBookingDoctorName(b)}
                              </Text>
                              <Text style={styles.bookingOptFee}>
                                ₹{getBookingDietFee(b)}
                              </Text>
                            </View>
                            <View style={styles.bookingOptDateRow}>
                              <Calendar size={12} color={Colors.inkMuted} />
                              <Text style={styles.bookingOptDate}>
                                {getBookingDisplayDate(b)}
                              </Text>
                              {b.dietPlanRequested ? (
                                <Text style={styles.pendingTag}>
                                  • Already Requested ({b.dietPlanStatus || 'pending'})
                                </Text>
                              ) : null}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Consulting Doctor</Text>
                    <Text style={styles.summaryVal}>{doctorName}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Add-on Service</Text>
                    <Text style={styles.summaryVal}>7-Day Diet & Yoga Review</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.totalLabel}>Consultation Add-on Fee</Text>
                    <Text style={styles.totalVal}>₹{fee}</Text>
                  </View>
                </View>

                {activeBooking.dietPlanRequested &&
                activeBooking.dietPlanStatus === 'pending' ? (
                  <View style={styles.alreadyRequestedBox}>
                    <CheckCircle2 size={18} color={Colors.success} />
                    <Text style={styles.alreadyRequestedText}>
                      A personalized plan request is already pending for this appointment. You can upload another payment screenshot below if needed.
                    </Text>
                  </View>
                ) : null}

                {!showUpiSection ? (
                  <View style={styles.actionsCol}>
                    <Text style={styles.helperNote}>
                      Your doctor will review your Prakriti Dosha, health conditions, and food habits to tailor meals, recipes, cooking notes, and yoga videos.
                    </Text>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => setShowUpiSection(true)}
                      activeOpacity={0.85}
                    >
                      <QrCode size={17} color="#ffffff" />
                      <Text style={styles.primaryBtnText}>
                        Pay ₹{fee} via UPI & Upload Proof
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={handleDirectRequest}
                      disabled={submittingDirect}
                      activeOpacity={0.85}
                    >
                      {submittingDirect ? (
                        <ActivityIndicator size="small" color={Colors.oliveDeep} />
                      ) : (
                        <CheckCircle2 size={16} color={Colors.oliveDeep} />
                      )}
                      <Text style={styles.secondaryBtnText}>
                        {submittingDirect
                          ? 'Sending Request...'
                          : `Confirm Direct Request (₹${fee})`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.upiBox}>
                    <Text style={styles.upiHeading}>
                      Scan QR or Pay via Any UPI App
                    </Text>
                    {qrUrl ? (
                      <View style={styles.qrFrame}>
                        <Image
                          source={{ uri: qrUrl }}
                          style={styles.qrImg}
                          resizeMode="contain"
                        />
                      </View>
                    ) : null}
                    <Text style={styles.upiIdText}>
                      UPI ID: <Text style={{ fontWeight: '800' }}>{upiId}</Text>
                    </Text>

                    <TouchableOpacity
                      style={styles.openUpiBtn}
                      onPress={handleOpenUpiApp}
                    >
                      <ExternalLink size={15} color={Colors.oliveDeep} />
                      <Text style={styles.openUpiBtnText}>
                        Open UPI App to Pay ₹{fee}
                      </Text>
                    </TouchableOpacity>

                    {/* Screenshot Picker */}
                    <View style={styles.proofSection}>
                      <Text style={styles.proofTitle}>
                        Upload Payment Screenshot (Max 5)
                      </Text>
                      <View style={styles.proofGrid}>
                        {proofFiles.map((file, idx) => (
                          <View key={idx} style={styles.proofThumbWrap}>
                            <Image
                              source={{ uri: file.uri }}
                              style={styles.proofThumb}
                            />
                            <TouchableOpacity
                              style={styles.removeProofBtn}
                              onPress={() =>
                                setProofFiles((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                            >
                              <Trash2 size={11} color="#ffffff" />
                            </TouchableOpacity>
                          </View>
                        ))}
                        {proofFiles.length < 5 ? (
                          <TouchableOpacity
                            style={styles.addProofBtn}
                            onPress={handlePickScreenshots}
                          >
                            <ImagePlus size={20} color={Colors.oliveAction} />
                            <Text style={styles.addProofText}>Add</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.upiFooterRow}>
                      <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => setShowUpiSection(false)}
                        disabled={uploadingProof}
                      >
                        <Text style={styles.backBtnText}>Back</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.submitProofBtn,
                          (uploadingProof || proofFiles.length === 0) &&
                            styles.disabledBtn,
                        ]}
                        onPress={handleUploadProof}
                        disabled={uploadingProof || proofFiles.length === 0}
                      >
                        {uploadingProof ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <UploadCloud size={15} color="#ffffff" />
                        )}
                        <Text style={styles.submitProofText}>
                          {uploadingProof ? 'Uploading...' : 'Submit Proof'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    maxHeight: 560,
  },
  bodyContent: {
    padding: 18,
    gap: 14,
    paddingBottom: 28,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  findDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    marginTop: 6,
  },
  findDocBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  pickerSection: {
    gap: 8,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  bookingOptions: {
    gap: 8,
  },
  bookingOptionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  bookingOptionCardActive: {
    borderColor: Colors.oliveAction,
    backgroundColor: Colors.creamTint,
  },
  bookingOptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingOptDoctor: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  bookingOptFee: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  bookingOptDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bookingOptDate: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  pendingTag: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  alreadyRequestedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.successBg,
    borderRadius: 12,
    padding: 12,
  },
  alreadyRequestedText: {
    flex: 1,
    fontSize: 12,
    color: Colors.inkStrong,
    lineHeight: 17,
  },
  actionsCol: {
    gap: 10,
  },
  helperNote: {
    fontSize: 12,
    color: Colors.inkMuted,
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.oliveAction,
    borderRadius: 14,
    paddingVertical: 13,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.sagePale,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  upiBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 10,
  },
  upiHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  qrFrame: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrImg: {
    width: 150,
    height: 150,
  },
  upiIdText: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  openUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  openUpiBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  proofSection: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    gap: 8,
  },
  proofTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  proofGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  proofThumbWrap: {
    position: 'relative',
    width: 62,
    height: 62,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.sagePale,
  },
  proofThumb: {
    width: '100%',
    height: '100%',
  },
  removeProofBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addProofBtn: {
    width: 62,
    height: 62,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addProofText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.oliveAction,
  },
  upiFooterRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  backBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.sagePale,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  submitProofBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.oliveAction,
    borderRadius: 12,
    paddingVertical: 11,
  },
  submitProofText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});

