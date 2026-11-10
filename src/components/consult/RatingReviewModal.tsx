// src/components/consult/RatingReviewModal.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { Colors } from '../../constants/theme';

interface RatingReviewModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  initialRating?: number;
  initialReview?: string;
  showReceivingDate?: boolean;
  onSubmit: (payload: {
    rating: number;
    comment: string;
    receivingDate?: string;
  }) => Promise<void>;
}

const MOOD_LABELS = ['', 'Needs Improvement', 'Fair', 'Good', 'Very Good', 'Excellent'];

export function RatingReviewModal({
  visible,
  onClose,
  title,
  subtitle,
  initialRating = 0,
  initialReview = '',
  showReceivingDate = false,
  onSubmit,
}: RatingReviewModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialReview);
  const [receivingDate, setReceivingDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(initialRating || 0);
      setComment(initialReview || '');
      setReceivingDate('');
    }
  }, [visible, initialRating, initialReview]);

  const handlePressSubmit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
        receivingDate: receivingDate.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color={Colors.inkStrong} />
            </TouchableOpacity>
          </View>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setRating(n)}
                hitSlop={6}
                accessibilityLabel={`Rate ${n} stars`}
              >
                <Star
                  size={32}
                  color={n <= rating ? Colors.turmericGold : Colors.borderStrong}
                  fill={n <= rating ? Colors.turmericGold : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 ? (
            <Text style={styles.moodText}>{MOOD_LABELS[rating]}</Text>
          ) : null}

          {showReceivingDate ? (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Order Received Date (optional, YYYY-MM-DD)</Text>
              <TextInput
                style={styles.dateInput}
                value={receivingDate}
                onChangeText={setReceivingDate}
                placeholder="e.g. 2026-11-10"
                placeholderTextColor={Colors.inkLight}
              />
            </View>
          ) : null}

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Share your feedback (optional)</Text>
            <TextInput
              style={styles.textArea}
              value={comment}
              onChangeText={setComment}
              placeholder="Write your experience..."
              placeholderTextColor={Colors.inkLight}
              multiline
            />
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (rating < 1 || submitting) && styles.disabledBtn,
              ]}
              onPress={handlePressSubmit}
              disabled={rating < 1 || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : null}
              <Text style={styles.submitBtnText}>
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 4,
  },
  moodText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.barkBrown,
  },
  fieldWrap: {
    gap: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  dateInput: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.inkStrong,
  },
  textArea: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    minHeight: 84,
    textAlignVertical: 'top',
    fontSize: 13,
    color: Colors.inkStrong,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.sagePale,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.oliveAction,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  disabledBtn: {
    opacity: 0.45,
  },
});

