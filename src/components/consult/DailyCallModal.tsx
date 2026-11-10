// src/components/consult/DailyCallModal.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mic,
  RefreshCw,
  Share2,
  ShieldCheck,
  Video,
  X,
} from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { patientApi } from '../../api/patient';
import { Colors } from '../../constants/theme';
import { openExternalUrl } from '../blog/BlogRichContent';

interface DailyCallModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId?: string | null;
  role: 'patient' | 'doctor';
  participantTitle: string;
  dateLabel?: string;
  timeLabel?: string;
  fallbackLink?: string | null;
}

export function DailyCallModal({
  visible,
  onClose,
  bookingId,
  role,
  participantTitle,
  dateLabel,
  timeLabel,
  fallbackLink,
}: DailyCallModalProps) {
  const [loading, setLoading] = useState(false);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const cleanFallback =
    fallbackLink &&
    fallbackLink !== 'no' &&
    /^https?:\/\//i.test(fallbackLink.trim())
      ? fallbackLink.trim()
      : null;

  const resolveRoom = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError('');
    setJoinUrl(null);
    try {
      const url =
        role === 'doctor'
          ? await doctorApi.getDailyJoinUrl(bookingId)
          : await patientApi.getDailyJoinUrl(bookingId);
      setJoinUrl(url);
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to the video room right now.');
    } finally {
      setLoading(false);
    }
  }, [bookingId, role]);

  useEffect(() => {
    if (visible && bookingId) {
      resolveRoom();
    }
  }, [visible, bookingId, resolveRoom]);

  const handleOpenInAppBrowser = async (url: string) => {
    await openExternalUrl(url);
  };

  const handleOpenSystemBrowser = (url: string) => {
    Linking.openURL(url).catch(() => {
      openExternalUrl(url);
    });
  };

  const handleShareLink = async (url: string) => {
    try {
      await Share.share({
        message: `JeevanHub Video Consultation Room: ${url}`,
      });
    } catch {
      // Dismissed
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Video size={20} color={Colors.oliveAction} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Daily.co Consultation Room</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {participantTitle}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={Colors.inkStrong} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {(dateLabel || timeLabel) ? (
              <View style={styles.schedulePillRow}>
                {dateLabel ? (
                  <View style={styles.scheduleChip}>
                    <Calendar size={13} color={Colors.oliveDeep} />
                    <Text style={styles.scheduleText}>{dateLabel}</Text>
                  </View>
                ) : null}
                {timeLabel ? (
                  <View style={styles.scheduleChip}>
                    <Clock size={13} color={Colors.oliveDeep} />
                    <Text style={styles.scheduleText}>{timeLabel}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {loading ? (
              <View style={styles.stateBox}>
                <ActivityIndicator size="large" color={Colors.olive} />
                <Text style={styles.stateTitle}>Preparing Encrypted Video Room...</Text>
                <Text style={styles.stateDesc}>
                  Minting your {role === 'doctor' ? 'moderator' : 'participant'} Daily.co meeting token.
                </Text>
              </View>
            ) : joinUrl ? (
              <View style={styles.readyBox}>
                <View style={styles.readyBadge}>
                  <CheckCircle2 size={16} color={Colors.success} />
                  <Text style={styles.readyBadgeText}>Room Ready</Text>
                </View>

                <View style={styles.tipsBox}>
                  <View style={styles.tipRow}>
                    <Mic size={14} color={Colors.oliveAction} />
                    <Text style={styles.tipText}>
                      Allow Camera & Microphone access when prompted in the browser.
                    </Text>
                  </View>
                  <View style={styles.tipRow}>
                    <ShieldCheck size={14} color={Colors.oliveAction} />
                    <Text style={styles.tipText}>
                      End-to-end Daily.co session token is bound to your consultation slot.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.joinPrimaryBtn}
                  onPress={() => handleOpenInAppBrowser(joinUrl)}
                  activeOpacity={0.85}
                >
                  <Video size={17} color="#ffffff" />
                  <Text style={styles.joinPrimaryText}>Join Video Call</Text>
                </TouchableOpacity>

                <View style={styles.secondaryRow}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => handleOpenSystemBrowser(joinUrl)}
                    activeOpacity={0.8}
                  >
                    <ExternalLink size={14} color={Colors.oliveDeep} />
                    <Text style={styles.secondaryBtnText}>System Browser</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => handleShareLink(joinUrl)}
                    activeOpacity={0.8}
                  >
                    <Share2 size={14} color={Colors.oliveDeep} />
                    <Text style={styles.secondaryBtnText}>Share Link</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.errorBox}>
                <AlertCircle size={32} color={Colors.warning} />
                <Text style={styles.errorTitle}>Room Not Open Yet</Text>
                <Text style={styles.errorDesc}>{error}</Text>

                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={resolveRoom}
                  activeOpacity={0.85}
                >
                  <RefreshCw size={14} color="#ffffff" />
                  <Text style={styles.retryBtnText}>Retry Connection</Text>
                </TouchableOpacity>

                {cleanFallback ? (
                  <TouchableOpacity
                    style={styles.fallbackBtn}
                    onPress={() => handleOpenInAppBrowser(cleanFallback)}
                    activeOpacity={0.85}
                  >
                    <ExternalLink size={14} color={Colors.oliveDeep} />
                    <Text style={styles.fallbackBtnText}>Open Backup Meet Link</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 18,
    paddingBottom: 30,
    gap: 14,
  },
  schedulePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scheduleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  stateBox: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 26,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  stateDesc: {
    fontSize: 12,
    color: Colors.inkMuted,
    textAlign: 'center',
  },
  readyBox: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    gap: 12,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.successBg,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  readyBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.success,
  },
  tipsBox: {
    backgroundColor: Colors.creamTint,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: Colors.ink,
    lineHeight: 17,
  },
  joinPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.oliveAction,
    borderRadius: 14,
    paddingVertical: 14,
  },
  joinPrimaryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.sagePale,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  errorBox: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  errorDesc: {
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
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    marginTop: 4,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  fallbackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
});

