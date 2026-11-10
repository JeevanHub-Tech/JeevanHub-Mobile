// src/app/(patient)/notifications.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  ExternalLink,
  FileText,
  Package,
  Sparkles,
  Trash2,
  Utensils,
} from 'lucide-react-native';
import { patientApi } from '../../api/patient';
import { Colors, Shadows } from '../../constants/theme';
import { AppNotification } from '../../types/patient';

type FilterTab = 'all' | 'appointments' | 'diet-yoga' | 'orders' | 'system';

const FILTER_TABS: Array<{ id: FilterTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'diet-yoga', label: 'Diet & Yoga' },
  { id: 'orders', label: 'Orders' },
  { id: 'system', label: 'Prescriptions' },
];

const getTypeMeta = (type?: string) => {
  switch (type) {
    case 'appointment':
      return {
        label: 'Appointment',
        accent: '#2563eb',
        bg: '#eff6ff',
        Icon: Calendar,
      };
    case 'diet':
      return {
        label: 'Diet Plan',
        accent: Colors.oliveAction,
        bg: Colors.sagePale,
        Icon: Utensils,
      };
    case 'yoga':
      return {
        label: 'Yoga Routine',
        accent: Colors.warning,
        bg: Colors.warningBg,
        Icon: Sparkles,
      };
    case 'order':
    case 'delivery':
      return {
        label: 'Order',
        accent: Colors.barkBrown,
        bg: '#fdf4eb',
        Icon: Package,
      };
    case 'payment':
      return {
        label: 'Payment',
        accent: Colors.success,
        bg: Colors.successBg,
        Icon: AlertCircle,
      };
    case 'system':
      return {
        label: 'Prescription',
        accent: Colors.oliveDeep,
        bg: Colors.sagePale,
        Icon: FileText,
      };
    default:
      return {
        label: 'Notification',
        accent: Colors.olive,
        bg: Colors.sagePale,
        Icon: Bell,
      };
  }
};

const extractUrl = (text?: string): string | null => {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
};

const formatNotificationTime = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (date.toDateString() === now.toDateString()) {
    return `Today, ${timePart}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${timePart}`;
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function PatientNotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await patientApi.getNotifications();
      setNotifications(data);
    } catch (err: any) {
      console.error('Error fetching notifications:', err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'appointments') {
      return notifications.filter((n) => n.type === 'appointment');
    }
    if (activeTab === 'diet-yoga') {
      return notifications.filter((n) => n.type === 'diet' || n.type === 'yoga');
    }
    if (activeTab === 'orders') {
      return notifications.filter(
        (n) => n.type === 'order' || n.type === 'payment' || n.type === 'delivery'
      );
    }
    if (activeTab === 'system') {
      return notifications.filter((n) => n.type === 'system');
    }
    return notifications;
  }, [notifications, activeTab]);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    try {
      await patientApi.markNotificationRead(id);
    } catch (err: any) {
      console.error('Failed to mark read:', err?.message || err);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await patientApi.markAllNotificationsRead();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not mark notifications as read.');
      await fetchNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      await patientApi.deleteNotification(id);
    } catch (err: any) {
      setNotifications(previous);
      Alert.alert('Error', err?.message || 'Could not delete notification.');
    }
  };

  const handleOpenNotification = async (item: AppNotification) => {
    if (!item.isRead) {
      handleMarkRead(item._id);
    }

    const url = extractUrl(item.message);
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Unable to open link', url);
      });
      return;
    }

    if (item.type === 'appointment') {
      router.push('/(patient)/appointments');
    } else if (item.type === 'diet' || item.type === 'yoga' || item.type === 'system') {
      router.push('/(patient)/wellness');
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const meta = getTypeMeta(item.type);
    const IconComponent = meta.Icon;
    const linkUrl = extractUrl(item.message);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleOpenNotification(item)}
        style={[
          styles.card,
          { borderLeftColor: meta.accent },
          item.isRead && styles.cardRead,
        ]}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
            <IconComponent size={13} color={meta.accent} />
            <Text style={[styles.typeBadgeText, { color: meta.accent }]}>
              {meta.label}
            </Text>
          </View>
          <View style={styles.timeRow}>
            {!item.isRead ? <View style={styles.unreadDot} /> : null}
            <Text style={styles.timeText}>{formatNotificationTime(item.createdAt)}</Text>
          </View>
        </View>

        {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
        <Text style={styles.cardMessage}>{item.message}</Text>

        <View style={styles.cardActions}>
          {linkUrl ? (
            <View style={styles.linkHint}>
              <ExternalLink size={12} color={Colors.oliveAction} />
              <Text style={styles.linkHintText}>Open link</Text>
            </View>
          ) : (
            <View />
          )}

          <View style={styles.actionBtns}>
            {!item.isRead ? (
              <TouchableOpacity
                onPress={() => handleMarkRead(item._id)}
                style={styles.smallBtn}
                activeOpacity={0.7}
              >
                <Check size={13} color={Colors.oliveDeep} />
                <Text style={styles.smallBtnText}>Mark read</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => handleDelete(item._id)}
              style={styles.deleteBtn}
              activeOpacity={0.7}
              accessibilityLabel="Delete notification"
            >
              <Trash2 size={14} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={Colors.oliveDeep} />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.headerSubtitle}>Updates on bookings, plans & orders</Text>
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markingAll}
            style={styles.markAllBtn}
            activeOpacity={0.75}
          >
            <CheckCheck size={14} color={Colors.oliveDeep} />
            <Text style={styles.markAllText}>Read all</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Pills */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {FILTER_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabPill, active && styles.tabPillActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.centerText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            filteredNotifications.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.olive}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Bell size={28} color={Colors.olive} />
              </View>
              <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
              <Text style={styles.emptyDesc}>
                No notifications in this category yet. Pull down to refresh anytime.
              </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  unreadBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.sagePale,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  tabsWrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.sagePale,
  },
  tabPillActive: {
    backgroundColor: Colors.oliveAction,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  tabTextActive: {
    color: Colors.cream,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    ...Shadows.card,
  },
  cardRead: {
    opacity: 0.72,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.oliveAction,
  },
  timeText: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.ink,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  linkHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveAction,
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.sagePale,
  },
  smallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.errorBg,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centerText: {
    fontSize: 14,
    color: Colors.inkMuted,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
});

