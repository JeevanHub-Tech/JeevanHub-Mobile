// src/app/(doctor)/analytics.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Filter,
  PieChart as PieIcon,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Utensils,
  Wallet,
} from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

type AnalyticsTab = 'payments' | 'gender' | 'age' | 'monthly' | 'ratings';

export default function DoctorAnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('payments');
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters for Payments tab
  const [searchDate, setSearchDate] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'all' | 'consultation' | 'diet'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const fetchData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const doctorBookings = await doctorApi.getDoctorBookings(user.id);
      setBookings(doctorBookings || []);

      if (user.email) {
        const docReviews = await doctorApi.getDoctorReviews(user.email);
        setReviews(docReviews || []);
      }
    } catch (err) {
      console.warn('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ─── Metrics Calculations (Parity with DoctorAnalytics.jsx) ────────────────
  const acceptedBookings = bookings.filter((b) => b.requestAccept === 'accepted' || b.status === 'confirmed' || b.status === 'completed');
  const completedBookings = acceptedBookings.filter((b) => {
    const apptDate = new Date(b.dateOfAppointment || b.date);
    return !isNaN(apptDate.getTime()) && apptDate <= new Date();
  });

  const totalRevenue = acceptedBookings.reduce((sum, b) => {
    const fee = Number(b.amountPaid || b.fee || user?.price || 500);
    return sum + (b.paymentStatus === 'Paid' || b.isPaid ? fee : 0);
  }, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthRevenue = acceptedBookings.reduce((sum, b) => {
    const d = new Date(b.dateOfAppointment || b.date);
    if (!isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      const fee = Number(b.amountPaid || b.fee || user?.price || 500);
      return sum + (b.paymentStatus === 'Paid' || b.isPaid ? fee : 0);
    }
    return sum;
  }, 0);

  // Demographics: Gender
  const completedOrAll = completedBookings.length > 0 ? completedBookings : acceptedBookings;
  const maleCount = completedOrAll.filter((b) => (b.patientGender || b.gender || '').toLowerCase() === 'male').length;
  const femaleCount = completedOrAll.filter((b) => (b.patientGender || b.gender || '').toLowerCase() === 'female').length;
  const otherGenderCount = completedOrAll.length - maleCount - femaleCount;
  const genderTotal = completedOrAll.length || 1;

  // Demographics: Age
  const ageGroups = [
    { label: '0 - 10 yrs', count: 0 },
    { label: '11 - 20 yrs', count: 0 },
    { label: '21 - 30 yrs', count: 0 },
    { label: '31 - 40 yrs', count: 0 },
    { label: '41 - 50 yrs', count: 0 },
    { label: '51+ yrs', count: 0 },
  ];

  completedOrAll.forEach((b) => {
    const age = Number(b.patientAge || b.age || 0);
    if (age > 0 && age <= 10) ageGroups[0].count++;
    else if (age <= 20) ageGroups[1].count++;
    else if (age <= 30) ageGroups[2].count++;
    else if (age <= 40) ageGroups[3].count++;
    else if (age <= 50) ageGroups[4].count++;
    else if (age > 50) ageGroups[5].count++;
  });

  // Monthly Appointments for the year
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyCounts = monthNames.map((name, idx) => {
    const count = bookings.filter((b) => {
      const d = new Date(b.dateOfAppointment || b.date);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === idx;
    }).length;
    return { name, count };
  });

  const maxMonthCount = Math.max(...monthlyCounts.map((m) => m.count), 1);

  // Rates
  const totalRaw = bookings.length || 1;
  const completedRate = Math.round((completedBookings.length / totalRaw) * 100);
  const cancelledRate = Math.round((bookings.filter((b) => b.requestAccept === 'denied' || b.status === 'cancelled').length / totalRaw) * 100);

  // Filtered Payments List
  const filteredPayments = acceptedBookings.filter((b) => {
    if (searchDate && !(b.dateOfAppointment || b.date || '').includes(searchDate)) return false;
    if (serviceFilter === 'diet' && !b.dietPlanRequested) return false;
    if (serviceFilter === 'consultation' && b.dietPlanRequested) return false;
    if (paymentStatusFilter === 'paid' && b.paymentStatus !== 'Paid' && !b.isPaid) return false;
    if (paymentStatusFilter === 'pending' && (b.paymentStatus === 'Paid' || b.isPaid)) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.oliveDeep} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Practice Analytics</Text>
          <Text style={styles.headerSubtitle}>Performance, payments & patient statistics</Text>
        </View>
      </View>

      {/* Segmented Control Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'payments' && styles.tabChipActive]}
            onPress={() => setActiveTab('payments')}
          >
            <Wallet size={14} color={activeTab === 'payments' ? Colors.cream : Colors.inkMuted} />
            <Text style={[styles.tabChipText, activeTab === 'payments' && styles.tabChipTextActive]}>
              Payments & Earnings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'gender' && styles.tabChipActive]}
            onPress={() => setActiveTab('gender')}
          >
            <Users size={14} color={activeTab === 'gender' ? Colors.cream : Colors.inkMuted} />
            <Text style={[styles.tabChipText, activeTab === 'gender' && styles.tabChipTextActive]}>
              Gender Distribution
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'age' && styles.tabChipActive]}
            onPress={() => setActiveTab('age')}
          >
            <UserCheck size={14} color={activeTab === 'age' ? Colors.cream : Colors.inkMuted} />
            <Text style={[styles.tabChipText, activeTab === 'age' && styles.tabChipTextActive]}>
              Age Groups
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'monthly' && styles.tabChipActive]}
            onPress={() => setActiveTab('monthly')}
          >
            <CalendarDays size={14} color={activeTab === 'monthly' ? Colors.cream : Colors.inkMuted} />
            <Text style={[styles.tabChipText, activeTab === 'monthly' && styles.tabChipTextActive]}>
              Monthly Volume
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'ratings' && styles.tabChipActive]}
            onPress={() => setActiveTab('ratings')}
          >
            <Star size={14} color={activeTab === 'ratings' ? Colors.cream : Colors.inkMuted} />
            <Text style={[styles.tabChipText, activeTab === 'ratings' && styles.tabChipTextActive]}>
              Patient Ratings
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.olive} />
            <Text style={styles.loadingText}>Analyzing practice records...</Text>
          </View>
        ) : (
          <>
            {/* ─── TAB 1: PAYMENTS & EARNINGS ─────────────────────────────── */}
            {activeTab === 'payments' && (
              <View style={styles.tabSection}>
                {/* Revenue Overview Cards */}
                <View style={styles.kpiRow}>
                  <View style={[styles.kpiCard, { backgroundColor: '#f0fdf4' }]}>
                    <Text style={styles.kpiLabel}>Total Revenue</Text>
                    <Text style={[styles.kpiValue, { color: Colors.success }]}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
                    <Text style={styles.kpiSub}>Lifetime consultations</Text>
                  </View>

                  <View style={[styles.kpiCard, { backgroundColor: '#fffbeb' }]}>
                    <Text style={styles.kpiLabel}>This Month ({monthNames[currentMonth]})</Text>
                    <Text style={[styles.kpiValue, { color: '#b45309' }]}>₹{thisMonthRevenue.toLocaleString('en-IN')}</Text>
                    <Text style={styles.kpiSub}>Current earnings</Text>
                  </View>
                </View>

                {/* Filters Row */}
                <View style={styles.cardBox}>
                  <Text style={styles.cardHeaderTitle}>Payment History & Payouts</Text>
                  <Text style={styles.cardHeaderDesc}>Direct patient settlements to your configured UPI ID</Text>

                  <View style={styles.searchRow}>
                    <View style={styles.searchWrap}>
                      <Search size={14} color={Colors.inkMuted} />
                      <TextInput
                        style={styles.searchInput}
                        value={searchDate}
                        onChangeText={setSearchDate}
                        placeholder="Search date (YYYY-MM-DD)..."
                        placeholderTextColor={Colors.inkMuted}
                      />
                    </View>
                  </View>

                  <View style={styles.filterChipRow}>
                    <TouchableOpacity
                      style={[styles.smallFilterChip, serviceFilter === 'all' && styles.smallFilterChipActive]}
                      onPress={() => setServiceFilter('all')}
                    >
                      <Text style={[styles.smallFilterChipText, serviceFilter === 'all' && styles.smallFilterChipTextActive]}>
                        All Services
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.smallFilterChip, serviceFilter === 'consultation' && styles.smallFilterChipActive]}
                      onPress={() => setServiceFilter('consultation')}
                    >
                      <Text style={[styles.smallFilterChipText, serviceFilter === 'consultation' && styles.smallFilterChipTextActive]}>
                        Consultation
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.smallFilterChip, serviceFilter === 'diet' && styles.smallFilterChipActive]}
                      onPress={() => setServiceFilter('diet')}
                    >
                      <Text style={[styles.smallFilterChipText, serviceFilter === 'diet' && styles.smallFilterChipTextActive]}>
                        Diet Plan
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Payment List */}
                  {filteredPayments.length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <Wallet size={36} color={Colors.inkLight} />
                      <Text style={styles.emptyTitle}>No payments found</Text>
                      <Text style={styles.emptyDesc}>No transaction records match the selected filters.</Text>
                    </View>
                  ) : (
                    filteredPayments.map((item, idx) => {
                      const isPaid = item.paymentStatus === 'Paid' || item.isPaid;
                      const fee = Number(item.amountPaid || item.fee || user?.price || 500);
                      return (
                        <View key={item._id || idx} style={styles.paymentItem}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.patientName}>{item.patientName || 'Ayurvedic Patient'}</Text>
                            <Text style={styles.paymentMeta}>
                              📅 {item.dateOfAppointment || item.date || 'Scheduled Date'} • {item.dietPlanRequested ? 'Diet Plan + Visit' : 'Video Consult'}
                            </Text>
                          </View>

                          <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            <Text style={styles.paymentAmount}>₹{fee}</Text>
                            <View style={[styles.statusPill, isPaid ? styles.paidPill : styles.pendingPill]}>
                              <Text style={[styles.statusPillText, isPaid ? styles.paidPillText : styles.pendingPillText]}>
                                {isPaid ? 'Settled' : 'Pending'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            )}

            {/* ─── TAB 2: GENDER DISTRIBUTION ─────────────────────────────── */}
            {activeTab === 'gender' && (
              <View style={styles.cardBox}>
                <Text style={styles.cardHeaderTitle}>Patient Gender Breakdown</Text>
                <Text style={styles.cardHeaderDesc}>Demographic distribution of patients consulted ({completedOrAll.length} total visits)</Text>

                <View style={styles.genderStatsWrap}>
                  {/* Female Bar */}
                  <View style={styles.demographicRow}>
                    <View style={styles.demographicLabelRow}>
                      <Text style={styles.demoLabel}>Female Patients</Text>
                      <Text style={styles.demoValue}>{femaleCount} ({Math.round((femaleCount / genderTotal) * 100)}%)</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.round((femaleCount / genderTotal) * 100)}%`, backgroundColor: '#ec4899' }]} />
                    </View>
                  </View>

                  {/* Male Bar */}
                  <View style={styles.demographicRow}>
                    <View style={styles.demographicLabelRow}>
                      <Text style={styles.demoLabel}>Male Patients</Text>
                      <Text style={styles.demoValue}>{maleCount} ({Math.round((maleCount / genderTotal) * 100)}%)</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.round((maleCount / genderTotal) * 100)}%`, backgroundColor: '#3b82f6' }]} />
                    </View>
                  </View>

                  {/* Other Bar */}
                  <View style={styles.demographicRow}>
                    <View style={styles.demographicLabelRow}>
                      <Text style={styles.demoLabel}>Other / Unspecified</Text>
                      <Text style={styles.demoValue}>{otherGenderCount} ({Math.round((otherGenderCount / genderTotal) * 100)}%)</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.round((otherGenderCount / genderTotal) * 100)}%`, backgroundColor: Colors.turmericGold }]} />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ─── TAB 3: AGE GROUPS ───────────────────────────────────────── */}
            {activeTab === 'age' && (
              <View style={styles.cardBox}>
                <Text style={styles.cardHeaderTitle}>Age Group Demographics</Text>
                <Text style={styles.cardHeaderDesc}>Consultation distribution across patient age brackets</Text>

                <View style={styles.genderStatsWrap}>
                  {ageGroups.map((group, idx) => {
                    const pct = Math.round((group.count / genderTotal) * 100);
                    return (
                      <View key={idx} style={styles.demographicRow}>
                        <View style={styles.demographicLabelRow}>
                          <Text style={styles.demoLabel}>{group.label}</Text>
                          <Text style={styles.demoValue}>{group.count} ({pct}%)</Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: Colors.oliveAction }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ─── TAB 4: MONTHLY APPOINTMENTS ─────────────────────────────── */}
            {activeTab === 'monthly' && (
              <View style={styles.tabSection}>
                <View style={styles.cardBox}>
                  <Text style={styles.cardHeaderTitle}>Monthly Appointments ({currentYear})</Text>
                  <Text style={styles.cardHeaderDesc}>Patient consult volume month-by-month</Text>

                  {/* Horizontal Bar Chart for 12 months */}
                  <View style={styles.monthBarsList}>
                    {monthlyCounts.map((m, idx) => {
                      const barPct = Math.round((m.count / maxMonthCount) * 100);
                      const isCurrent = idx === currentMonth;
                      return (
                        <View key={m.name} style={styles.monthBarRow}>
                          <Text style={[styles.monthName, isCurrent && styles.monthNameCurrent]}>
                            {m.name}
                          </Text>
                          <View style={styles.monthBarTrack}>
                            <View
                              style={[
                                styles.monthBarFill,
                                {
                                  width: `${Math.max(barPct, 4)}%`,
                                  backgroundColor: isCurrent ? Colors.oliveAction : '#cbd5e1',
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.monthCount}>{m.count}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Practice Health KPI Row */}
                <View style={styles.kpiRow}>
                  <View style={[styles.kpiCard, { backgroundColor: '#f0fdf4' }]}>
                    <Text style={styles.kpiLabel}>Completion Rate</Text>
                    <Text style={[styles.kpiValue, { color: Colors.success }]}>{completedRate}%</Text>
                    <Text style={styles.kpiSub}>Completed consultations</Text>
                  </View>

                  <View style={[styles.kpiCard, { backgroundColor: '#fef2f2' }]}>
                    <Text style={styles.kpiLabel}>Cancellation Rate</Text>
                    <Text style={[styles.kpiValue, { color: Colors.error }]}>{cancelledRate}%</Text>
                    <Text style={styles.kpiSub}>Rescheduled or denied</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ─── TAB 5: PATIENT RATINGS ─────────────────────────────────── */}
            {activeTab === 'ratings' && (
              <View style={styles.tabSection}>
                <View style={styles.cardBox}>
                  <Text style={styles.cardHeaderTitle}>Overall Rating & Patient Feedback</Text>
                  <Text style={styles.cardHeaderDesc}>Evaluations submitted following clinical consultations</Text>

                  <View style={styles.ratingHeroRow}>
                    <View style={styles.ratingBigBox}>
                      <Text style={styles.ratingBigNumber}>{user?.rating || '4.9'}</Text>
                      <View style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={16} color={Colors.turmericGold} fill={Colors.turmericGold} />
                        ))}
                      </View>
                      <Text style={styles.totalReviewsCount}>{reviews.length || 24} patient ratings</Text>
                    </View>

                    <View style={styles.starsBreakdownCol}>
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = reviews.filter((r) => Math.round(r.rating || r.stars || 5) === stars).length;
                        const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : stars === 5 ? 85 : 10;
                        return (
                          <View key={stars} style={styles.starBreakdownRow}>
                            <Text style={styles.starNumLabel}>{stars} ★</Text>
                            <View style={styles.starBarTrack}>
                              <View style={[styles.starBarFill, { width: `${pct}%` }]} />
                            </View>
                            <Text style={styles.starPctText}>{pct}%</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.viewAllReviewsBtn}
                    onPress={() => router.push('/(doctor)/reviews' as any)}
                  >
                    <Text style={styles.viewAllReviewsBtnText}>Read All Patient Reviews</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabsScroll: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabChipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  tabChipTextActive: {
    color: Colors.cream,
  },
  content: {
    padding: 14,
    paddingBottom: 40,
    gap: 14,
  },
  tabSection: {
    gap: 14,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  cardBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  cardHeaderDesc: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: -8,
    marginBottom: 4,
  },
  searchRow: {
    marginBottom: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.cream,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.inkStrong,
    padding: 0,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  smallFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  smallFilterChipActive: {
    backgroundColor: Colors.oliveDeep,
    borderColor: Colors.oliveDeep,
  },
  smallFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  smallFilterChipTextActive: {
    color: Colors.cream,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  patientName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  paymentMeta: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  paidPill: {
    backgroundColor: '#dcfce7',
  },
  paidPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
  },
  pendingPill: {
    backgroundColor: '#fef3c7',
  },
  pendingPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
  },
  emptyWrap: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  emptyDesc: {
    fontSize: 11,
    color: Colors.inkMuted,
    textAlign: 'center',
  },
  genderStatsWrap: {
    gap: 12,
    marginTop: 4,
  },
  demographicRow: {
    gap: 6,
  },
  demographicLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  demoValue: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.cream,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  monthBarsList: {
    gap: 8,
    marginTop: 6,
  },
  monthBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthName: {
    width: 32,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  monthNameCurrent: {
    color: Colors.oliveAction,
    fontWeight: '800',
  },
  monthBarTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.cream,
    overflow: 'hidden',
  },
  monthBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  monthCount: {
    width: 24,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkStrong,
    textAlign: 'right',
  },
  ratingHeroRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  ratingBigBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream,
    borderRadius: 14,
    padding: 14,
    width: 110,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ratingBigNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.oliveDeep,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  totalReviewsCount: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  starsBreakdownCol: {
    flex: 1,
    gap: 6,
  },
  starBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starNumLabel: {
    width: 24,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  starBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.cream,
    overflow: 'hidden',
  },
  starBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.turmericGold,
  },
  starPctText: {
    width: 30,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.inkMuted,
    textAlign: 'right',
  },
  viewAllReviewsBtn: {
    backgroundColor: Colors.oliveAction,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  viewAllReviewsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.cream,
  },
});
