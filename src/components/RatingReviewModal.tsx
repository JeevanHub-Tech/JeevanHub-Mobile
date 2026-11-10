// src/components/RatingReviewModal.tsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { patientApi } from '../api/patient';
import { Colors } from '../constants/theme';

interface RatingReviewModalProps {
  visible: boolean;
  bookingId: string;
  doctorName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function RatingReviewModal({
  visible,
  bookingId,
  doctorName,
  onClose,
  onSubmitted,
}: RatingReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!bookingId) return;
    setSubmitting(true);
    try {
      await patientApi.submitRatingReview(bookingId, rating, review.trim());
      Alert.alert('Review Submitted', 'Thank you for rating your consultation.');
      onSubmitted();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Rate Consultation</Text>
              <Text style={styles.modalSubtitle}>{doctorName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <X size={20} color={Colors.inkMuted} />
            </TouchableOpacity>
          </View>

          {/* Star Rating Row */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starTouch}
              >
                <Star
                  size={32}
                  color={star <= rating ? Colors.turmericGold : '#d7ccc8'}
                  fill={star <= rating ? Colors.turmericGold : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.ratingText}>
            {rating === 5
              ? 'Excellent Consultation'
              : rating === 4
              ? 'Very Good'
              : rating === 3
              ? 'Average'
              : rating === 2
              ? 'Below Expectations'
              : 'Poor Experience'}
          </Text>

          {/* Review Input */}
          <Text style={styles.label}>Clinical Feedback (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={review}
            onChangeText={setReview}
            placeholder="Share your experience with the diagnosis, doctor's guidance, and remedies..."
            placeholderTextColor={Colors.inkMuted}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.cream} />
            ) : (
              <Text style={styles.submitBtnText}>Submit Clinical Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 14,
  },
  starTouch: {
    padding: 4,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: Colors.oliveDeep,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.inkStrong,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: Colors.oliveAction,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.cream,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
