// src/app/(patient)/records.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  FolderHeart,
  Pill,
  Sparkles,
  UploadCloud,
  User,
} from 'lucide-react-native';
import { patientApi } from '../../api/patient';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { MedicalRecordItem } from '../../types/patient';

export default function RecordsScreen() {
  const { user } = useAuthStore();

  const [records, setRecords] = useState<MedicalRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchRecords = async () => {
    if (!user?.id) return;
    try {
      const data = await patientApi.getMedicalHistory(user.id);
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  const handlePickAndUpload = async () => {
    if (!user?.id) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      setUploading(true);

      await patientApi.uploadMedicalRecord(user.id, {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf',
      });

      Alert.alert(
        'Upload Successful',
        'Your medical record has been securely added to your vault. Gemini OCR is extracting the clinical prescriptions.'
      );
      await fetchRecords();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload document.');
    } finally {
      setUploading(false);
    }
  };

  const renderRecordItem = ({ item }: { item: MedicalRecordItem }) => {
    const ocrStatus = item.ocr?.status || 'pending';
    const isDone = ocrStatus === 'done';
    const isProcessing = ocrStatus === 'processing' || ocrStatus === 'pending';
    const isFailed = ocrStatus === 'failed';
    const medicines = item.ocr?.medicines || [];

    return (
      <View style={styles.card}>
        {/* Document Header */}
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <FileText size={22} color={Colors.olive} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.docName} numberOfLines={1}>
              {item.fileName}
            </Text>
            <Text style={styles.uploadDate}>
              Uploaded {new Date(item.uploadedAt).toLocaleDateString()}
            </Text>
          </View>

          {/* OCR Badge */}
          <View
            style={[
              styles.statusBadge,
              isDone && styles.statusBadgeDone,
              isProcessing && styles.statusBadgeProcessing,
              isFailed && styles.statusBadgeFailed,
            ]}
          >
            {isDone && <CheckCircle2 size={12} color={Colors.success} />}
            {isProcessing && <Clock size={12} color={Colors.warning} />}
            {isFailed && <AlertCircle size={12} color={Colors.error} />}
            <Text
              style={[
                styles.statusBadgeText,
                isDone && { color: Colors.success },
                isProcessing && { color: Colors.warning },
                isFailed && { color: Colors.error },
              ]}
            >
              {isDone ? 'OCR EXTRACTED' : isProcessing ? 'OCR IN PROGRESS' : 'OCR PENDING'}
            </Text>
          </View>
        </View>

        {/* OCR Prescriptions Breakdown (if available) */}
        {medicines.length > 0 && (
          <View style={styles.ocrBox}>
            <View style={styles.ocrHeader}>
              <Sparkles size={14} color={Colors.turmericGold} />
              <Text style={styles.ocrTitle}>Prescription Intelligence (Gemini OCR)</Text>
            </View>

            {item.ocr?.doctorName && (
              <View style={styles.prescribedByRow}>
                <User size={13} color={Colors.inkMuted} />
                <Text style={styles.prescribedByText}>
                  Doctor: <Text style={{ fontWeight: '700' }}>{item.ocr.doctorName}</Text>
                </Text>
              </View>
            )}

            <View style={styles.medsList}>
              {medicines.map((med, idx) => (
                <View key={idx} style={styles.medItem}>
                  <View style={styles.medNameRow}>
                    <Pill size={14} color={Colors.olive} />
                    <Text style={styles.medName}>{med.name}</Text>
                  </View>
                  <Text style={styles.medDetails}>
                    {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' • ')}
                  </Text>
                  {med.instructions && (
                    <Text style={styles.medInstructions}>
                      💡 {med.instructions}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* View Original File Link */}
        <TouchableOpacity
          style={styles.viewLink}
          onPress={() => Linking.openURL(item.url)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewLinkText}>View Original Document</Text>
          <ExternalLink size={14} color={Colors.oliveAction} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.headerTitle}>Medical Vault</Text>
            <Text style={styles.headerSubtitle}>
              Prescriptions, lab reports & automated OCR digitization
            </Text>
          </View>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handlePickAndUpload}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={Colors.cream} />
            ) : (
              <>
                <UploadCloud size={16} color={Colors.cream} />
                <Text style={styles.uploadBtnText}>Upload</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Record List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading vault documents...</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={renderRecordItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <FolderHeart size={38} color={Colors.inkMuted} />
              </View>
              <Text style={styles.emptyTitle}>Vault Is Empty</Text>
              <Text style={styles.emptySubtitle}>
                Upload previous prescriptions, handwritten doctor notes, or lab PDFs. Our AI automatically extracts your medicines, dosage schedules, and clinical notes.
              </Text>
              <TouchableOpacity
                style={styles.emptyUploadBtn}
                onPress={handlePickAndUpload}
                disabled={uploading}
                activeOpacity={0.8}
              >
                <UploadCloud size={18} color={Colors.cream} />
                <Text style={styles.emptyUploadBtnText}>Upload First Record</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
    paddingBottom: 16,
    backgroundColor: Colors.cream,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginTop: 2,
    maxWidth: 240,
  },
  uploadBtn: {
    backgroundColor: Colors.oliveAction,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cream,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 2,
  },
  uploadDate: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  statusBadgeDone: {
    backgroundColor: '#e8f5e9',
  },
  statusBadgeProcessing: {
    backgroundColor: '#fff8e1',
  },
  statusBadgeFailed: {
    backgroundColor: '#ffebee',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ocrBox: {
    backgroundColor: '#fbfaf7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8e2d5',
    marginBottom: 12,
  },
  ocrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ocrTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  prescribedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  prescribedByText: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  medsList: {
    gap: 8,
  },
  medItem: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  medName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  medDetails: {
    fontSize: 11,
    color: Colors.oliveAction,
    fontWeight: '600',
    marginLeft: 20,
  },
  medInstructions: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginLeft: 20,
    marginTop: 2,
    fontStyle: 'italic',
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0ece3',
  },
  viewLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveAction,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.inkMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyUploadBtn: {
    backgroundColor: Colors.oliveAction,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyUploadBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.cream,
  },
});
