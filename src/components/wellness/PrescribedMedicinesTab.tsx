// src/components/wellness/PrescribedMedicinesTab.tsx
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Pill,
  RefreshCw,
  Stethoscope,
  UserCheck,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import type { Appointment, MedicineAvailabilityItem } from '../../types/patient';
import {
  getBookingDisplayDate,
  getBookingDoctorName,
} from '../../utils/wellnessHelpers';

interface PrescribedMedicinesTabProps {
  bookings: Appointment[];
  availability: Record<string, MedicineAvailabilityItem | null>;
  loading: boolean;
  loadFailed: boolean;
  onRetry: () => void;
}

interface PrescribedRow {
  key: string;
  medicineId?: string;
  medicineName: string;
  dosage?: string;
  instructions?: string;
  addedAt?: string;
  doctorName: string;
  diagnosis?: string;
  visitDate?: string;
}

export function PrescribedMedicinesTab({
  bookings,
  availability,
  loading,
  loadFailed,
  onRetry,
}: PrescribedMedicinesTabProps) {
  const router = useRouter();
  if (loading) {
    return (
      <View style={styles.centerCard}>
        <ActivityIndicator size="large" color={Colors.olive} />
        <Text style={styles.centerText}>Loading prescribed medicines...</Text>
      </View>
    );
  }

  if (loadFailed) {
    return (
      <View style={styles.centerCard}>
        <AlertCircle size={32} color={Colors.error} />
        <Text style={styles.emptyTitle}>Unable to load prescriptions</Text>
        <Text style={styles.centerText}>
          We couldn't fetch your doctor prescriptions right now.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <RefreshCw size={14} color="#ffffff" />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rows: PrescribedRow[] = bookings.flatMap((booking) => {
    const doctorName = getBookingDoctorName(booking);
    const visitDate = getBookingDisplayDate(booking);
    return (booking.recommendedSupplements || [])
      .filter((supp) => supp.published !== false)
      .map((supp, idx) => ({
        key: supp._id || `${booking._id}-${idx}`,
        medicineId: supp.medicineId,
        medicineName: supp.medicineName,
        dosage: supp.dosage,
        instructions: supp.instructions,
        addedAt: supp.addedAt,
        doctorName,
        diagnosis: booking.diagnosis,
        visitDate,
      }));
  });

  if (rows.length === 0) {
    return (
      <View style={styles.centerCard}>
        <View style={styles.emptyIcon}>
          <Pill size={28} color={Colors.oliveAction} />
        </View>
        <Text style={styles.emptyTitle}>No Medicines Prescribed Yet</Text>
        <Text style={styles.centerText}>
          Once your consulting Ayurvedic doctor submits a prescription, your medicines, herbs, and dosages will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Pill size={18} color={Colors.oliveAction} />
          <Text style={styles.title}>Medicines, Herbs & Supplements</Text>
        </View>
        <View style={styles.doctorSourceBadge}>
          <UserCheck size={12} color={Colors.oliveDeep} />
          <Text style={styles.doctorSourceText}>Doctor Prescribed</Text>
        </View>
      </View>

      {rows.map((row) => {
        const medInfo = row.medicineId ? availability[row.medicineId] : null;
        const isAvailable = Boolean(medInfo && medInfo.isActive !== false);
        const dateText = row.addedAt
          ? new Date(row.addedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : row.visitDate;

        return (
          <TouchableOpacity
            key={row.key}
            style={styles.card}
            activeOpacity={isAvailable ? 0.84 : 1}
            disabled={!isAvailable || !row.medicineId}
            onPress={() => {
              if (isAvailable && row.medicineId) {
                router.push({
                  pathname: '/(patient)/medicines/[id]',
                  params: { id: row.medicineId },
                } as any);
              }
            }}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.medName}>{row.medicineName}</Text>
              {row.medicineId ? (
                <View
                  style={[
                    styles.availBadge,
                    isAvailable ? styles.availYes : styles.availNo,
                  ]}
                >
                  {isAvailable ? (
                    <CheckCircle2 size={11} color={Colors.success} />
                  ) : null}
                  <Text
                    style={[
                      styles.availText,
                      isAvailable
                        ? { color: Colors.success }
                        : { color: Colors.error },
                    ]}
                  >
                    {isAvailable
                      ? medInfo?.price
                        ? `In Store · ₹${medInfo.price}`
                        : 'Available'
                      : 'Unavailable'}
                  </Text>
                </View>
              ) : null}
              {isAvailable ? (
                <ChevronRight size={16} color={Colors.oliveAction} />
              ) : null}
            </View>

            {row.diagnosis ? (
              <View style={styles.diagnosisBox}>
                <Stethoscope size={13} color={Colors.oliveAction} />
                <Text style={styles.diagnosisText}>
                  Diagnosis: {row.diagnosis}
                </Text>
              </View>
            ) : null}

            {row.dosage ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Dosage:</Text>
                <Text style={styles.detailValue}>{row.dosage}</Text>
              </View>
            ) : null}

            {row.instructions ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Instructions:</Text>
                <Text style={styles.detailValue}>{row.instructions}</Text>
              </View>
            ) : null}

            <View style={styles.cardFooter}>
              <Text style={styles.footerDoctor}>{row.doctorName}</Text>
              {dateText ? (
                <View style={styles.footerDateRow}>
                  <Calendar size={12} color={Colors.inkMuted} />
                  <Text style={styles.footerDate}>{dateText}</Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  doctorSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  doctorSourceText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    ...Shadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  medName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  availYes: {
    backgroundColor: Colors.successBg,
  },
  availNo: {
    backgroundColor: Colors.errorBg,
  },
  availText: {
    fontSize: 11,
    fontWeight: '700',
  },
  diagnosisBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.creamTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  diagnosisText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.oliveDeep,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 6,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: Colors.inkStrong,
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 9,
    marginTop: 2,
  },
  footerDoctor: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  footerDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerDate: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  centerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
    textAlign: 'center',
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
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});

