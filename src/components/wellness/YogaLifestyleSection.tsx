// src/components/wellness/YogaLifestyleSection.tsx
import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ExternalLink,
  HeartPulse,
  Moon,
  Play,
  Sparkles,
  Sun,
  UserCheck,
  Video,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import type {
  AyurvedaDietPlanResponse,
  AyurvedaYogaPlanResponse,
  YogaAsana,
} from '../../types/patient';
import {
  getAsanaVideoMeta,
  resolvePlanDoctorReview,
} from '../../utils/wellnessHelpers';
import { openExternalUrl } from '../blog/BlogRichContent';

function AsanaCard({ asana }: { asana: YogaAsana }) {
  const meta = getAsanaVideoMeta(asana.name, asana.link);

  return (
    <TouchableOpacity
      style={styles.asanaCard}
      activeOpacity={0.85}
      onPress={() => openExternalUrl(meta.watchUrl)}
    >
      {meta.thumbnailUrl ? (
        <View style={styles.thumbWrap}>
          <Image
            source={{ uri: meta.thumbnailUrl }}
            style={styles.thumbImg}
            resizeMode="cover"
          />
          <View style={styles.thumbOverlay}>
            <View style={styles.playCircle}>
              <Play size={16} color="#ffffff" fill="#ffffff" />
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.asanaInfo}>
        <Text style={styles.asanaName}>{asana.name}</Text>
        <View style={styles.watchRow}>
          <Video size={13} color={Colors.oliveAction} />
          <Text style={styles.watchText}>
            {meta.isDirectVideo ? 'Watch Yoga Tutorial' : 'Search Tutorial on YouTube'}
          </Text>
          <ExternalLink size={12} color={Colors.oliveAction} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface YogaLifestyleSectionProps {
  yogaPlan: AyurvedaYogaPlanResponse | null;
  dietPlan: AyurvedaDietPlanResponse | null;
  loading: boolean;
}

export function YogaLifestyleSection({
  yogaPlan,
  dietPlan,
  loading,
}: YogaLifestyleSectionProps) {
  if (loading) {
    return (
      <View style={styles.centerCard}>
        <ActivityIndicator size="large" color={Colors.olive} />
        <Text style={styles.centerText}>Loading yoga & lifestyle routine...</Text>
      </View>
    );
  }

  const yoga = yogaPlan?.displayPlan;
  const morning = yoga?.morning || [];
  const evening = yoga?.evening || [];
  const hasYoga = morning.length + evening.length > 0;
  const lifestyleRecs = dietPlan?.displayPlan?.lifestyleRecommendations || [];

  const yogaReview = resolvePlanDoctorReview(
    yogaPlan?.status,
    yogaPlan?.doctorReview
  );
  const dietReview = resolvePlanDoctorReview(
    dietPlan?.status,
    dietPlan?.doctorReview
  );

  return (
    <View style={styles.container}>
      {/* Yoga Practice */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.titleWrap}>
            <HeartPulse size={18} color={Colors.oliveAction} />
            <Text style={styles.sectionTitle}>Yoga & Pranayama Practice</Text>
          </View>
          {yogaPlan ? (
            <View style={styles.sourceBadge}>
              {yogaReview.isDoctorApproved ? (
                <UserCheck size={12} color={Colors.oliveDeep} />
              ) : (
                <Sparkles size={12} color={Colors.turmericGold} />
              )}
              <Text style={styles.sourceBadgeText}>
                {yogaReview.isDoctorApproved ? 'Doctor Certified' : 'AI Routine'}
              </Text>
            </View>
          ) : null}
        </View>

        {yogaReview.isDoctorApproved ? (
          <View style={styles.approvedBanner}>
            <Text style={styles.approvedText}>
              Made by {yogaReview.doctorName}
              {yogaReview.reviewedDate ? ` on ${yogaReview.reviewedDate}` : ''}
            </Text>
            {yogaReview.notes ? (
              <Text style={styles.approvedNotes}>“{yogaReview.notes}”</Text>
            ) : null}
          </View>
        ) : null}

        {hasYoga ? (
          <View style={styles.flowsWrap}>
            {morning.length > 0 ? (
              <View style={styles.flowGroup}>
                <View style={styles.flowHeader}>
                  <Sun size={16} color={Colors.turmericGold} />
                  <Text style={styles.flowTitle}>Morning Flow</Text>
                </View>
                {morning.map((asana, i) => (
                  <AsanaCard key={`m-${i}`} asana={asana} />
                ))}
              </View>
            ) : null}

            {evening.length > 0 ? (
              <View style={styles.flowGroup}>
                <View style={styles.flowHeader}>
                  <Moon size={16} color={Colors.oliveAction} />
                  <Text style={styles.flowTitle}>Evening Flow</Text>
                </View>
                {evening.map((asana, i) => (
                  <AsanaCard key={`e-${i}`} asana={asana} />
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.emptyDesc}>
            No yoga sequence generated yet. Generate your Ayurvedic plan above to unlock guided Morning & Evening yoga videos.
          </Text>
        )}
      </View>

      {/* Lifestyle Recommendations */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.titleWrap}>
            <Sparkles size={18} color={Colors.turmericGold} />
            <Text style={styles.sectionTitle}>Lifestyle Recommendations</Text>
          </View>
          {dietPlan ? (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeText}>
                {dietReview.isDoctorApproved ? 'Doctor Certified' : 'AI Routine'}
              </Text>
            </View>
          ) : null}
        </View>

        {lifestyleRecs.length > 0 ? (
          <View style={styles.recList}>
            {lifestyleRecs.map((rec, idx) => (
              <View key={idx} style={styles.recItem}>
                <View style={styles.dot} />
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyDesc}>
            Generate your Ayurvedic plan above to see personalized Dinacharya and daily lifestyle habits.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.card,
  },
  sectionHeaderRow: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  approvedBanner: {
    backgroundColor: Colors.creamTint,
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    gap: 3,
  },
  approvedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  approvedNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.inkMuted,
  },
  flowsWrap: {
    gap: 14,
  },
  flowGroup: {
    gap: 10,
  },
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  flowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  asanaCard: {
    backgroundColor: Colors.cream,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbWrap: {
    position: 'relative',
    height: 148,
    backgroundColor: Colors.oliveDeep,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  asanaInfo: {
    padding: 12,
    gap: 4,
  },
  asanaName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  watchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  watchText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveAction,
  },
  recList: {
    gap: 9,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.turmericGold,
    marginTop: 6,
  },
  recText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.ink,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
    lineHeight: 19,
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
  centerText: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
});

