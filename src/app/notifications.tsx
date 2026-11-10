import { SafeAreaView } from 'react-native-safe-area-context';
// src/app/notifications.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Package,
  Pill,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { notificationApi } from '../api/notification';
import { Colors } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { AppNotification } from '../types/notification';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isDoctor = user?.role === 'doctor';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'appointment' | 'order' | 'diet'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      Alert.alert('Error', 'Unable to mark all notifications as read.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      Alert.alert('Error', 'Unable to delete notification.');
    }
  };

  const handleNotificationPress = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await notificationApi.markSingleRead(notif._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
    }

    // Smart route handling based on notification type
    if (notif.type === 'appointment' || notif.message.toLowerCase().includes('appointment')) {
      router.push(isDoctor ? ('/(doctor)/appointments' as any) : ('/(patient)/appointments' as any));
    } else if (notif.type === 'order' || notif.message.toLowerCase().includes('order')) {
      router.push('/(patient)/orders' as any);
    } else if (notif.type === 'diet' || notif.type === 'diet_plan' || notif.message.toLowerCase().includes('diet')) {
      router.push('/(patient)/wellness' as any);
    } else if (notif.message.toLowerCase().includes('prescription')) {
      router.push('/(patient)/cart' as any);
    }
  };

  const getNotificationIcon = (type: string, message: string) => {
    const msg = message.toLowerCase();
    if (type === 'appointment' || msg.includes('appointment') || msg.includes('consultation')) {
      return <Calendar size={18} color={Colors.oliveDeep} />;
    }
    if (type === 'order' || msg.includes('order') || msg.includes('delivery')) {
      return <Package size={18} color="#1976d2" />;
    }
    if (msg.includes('prescription') || msg.includes('medicine')) {
      return <Pill size={18} color={Colors.oliveAction} />;
    }
    if (type === 'diet' || msg.includes('diet') || msg.includes('yoga')) {
      return <Sparkles size={18} color={Colors.turmericGold} />;
    }
    return <Bell size={18} color={Colors.oliveDeep} />;
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'appointment') {
      return n.type === 'appointment' || n.message.toLowerCase().includes('appointment');
    }
    if (filter === 'order') {
      return n.type === 'order' || n.message.toLowerCase().includes('order');
    }
    if (filter === 'diet') {
      return n.type === 'diet' || n.type === 'diet_plan' || n.message.toLowerCase().includes('diet');
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.oliveDeep} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markReadBtn} activeOpacity={0.7}>
            <CheckCheck size={16} color={Colors.oliveDeep} />
            <Text style={styles.markReadText}>Mark Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersBar}>
        {(['all', 'appointment', 'order', 'diet'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all'
                ? 'All'
                : f === 'appointment'
                ? 'Visits'
                : f === 'order'
                ? 'Orders'
                : 'Diet & Wellness'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.olive} style={{ marginTop: 40 }} />
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell size={44} color={Colors.inkMuted} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyDesc}>
              Updates regarding consultations, prescriptions, and deliveries will show up here.
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notif) => {
            const timeStr = notif.createdAt
              ? new Date(notif.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <TouchableOpacity
                key={notif._id}
                style={[styles.notifCard, !notif.isRead && styles.notifUnread]}
                onPress={() => handleNotificationPress(notif)}
                activeOpacity={0.8}
              >
                <View style={styles.iconWrap}>
                  {getNotificationIcon(notif.type, notif.message)}
                </View>

                <View style={styles.contentWrap}>
                  <Text style={[styles.messageText, !notif.isRead && styles.messageUnread]}>
                    {notif.message}
                  </Text>
                  <Text style={styles.timeText}>{timeStr}</Text>
                </View>

                {!notif.isRead && <View style={styles.unreadDot} />}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(notif._id)}
                  hitSlop={8}
                >
                  <Trash2 size={14} color={Colors.inkMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sagePale,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 4,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  filtersBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  filterTextActive: {
    color: Colors.cream,
  },
  container: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  notifCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  notifUnread: {
    backgroundColor: '#f8fbf5',
    borderColor: '#c8e6c9',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  contentWrap: {
    flex: 1,
    gap: 4,
  },
  messageText: {
    fontSize: 13,
    color: Colors.inkMuted,
    lineHeight: 18,
  },
  messageUnread: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  timeText: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.oliveAction,
    marginTop: 6,
  },
  deleteBtn: {
    padding: 4,
    marginTop: 2,
  },
});
