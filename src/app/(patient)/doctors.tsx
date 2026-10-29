// src/app/(patient)/doctors.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Award,
  ChevronRight,
  Filter,
  MapPin,
  Search,
  Star,
  Stethoscope,
  User,
} from 'lucide-react-native';
import { patientApi } from '../../api/patient';
import { Colors } from '../../constants/theme';
import { DoctorProfile } from '../../types/patient';

const SPECIALIZATIONS = [
  'All',
  'Ayurveda',
  'Panchakarma',
  'Kayachikitsa',
  'Shalya Tantra',
  'Prasuti & Stri Roga',
  'Kaumarbhritya',
];

export default function DoctorsScreen() {
  const router = useRouter();

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');

  const fetchDoctors = async () => {
    try {
      const data = await patientApi.getDoctors();
      setDoctors(data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
  };

  const filteredDoctors = doctors.filter((doc) => {
    const fullName = `${doc.firstName} ${doc.lastName || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      (doc.specialization && doc.specialization.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (doc.education && doc.education.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSpec =
      selectedSpecialization === 'All' ||
      (doc.specialization &&
        doc.specialization.some(
          (s) => s.toLowerCase() === selectedSpecialization.toLowerCase()
        ));

    return matchesSearch && matchesSpec;
  });

  const renderDoctorItem = ({ item }: { item: DoctorProfile }) => {
    const doctorName = `Dr. ${item.firstName} ${item.lastName || ''}`.trim();
    const fee = item.price || 500;
    const experience = item.experience ? `${item.experience} yrs exp` : 'Experienced';
    const rating = item.rating || 4.9;

    return (
      <TouchableOpacity
        style={styles.doctorCard}
        activeOpacity={0.85}
        onPress={() => router.push(`/(patient)/doctor/${item._id}` as any)}
      >
        <View style={styles.cardHeader}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <User size={24} color={Colors.cream} />
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.doctorName}>{doctorName}</Text>
              <View style={styles.ratingBox}>
                <Star size={12} color={Colors.turmericGold} fill={Colors.turmericGold} />
                <Text style={styles.ratingText}>{rating}</Text>
              </View>
            </View>

            <Text style={styles.doctorDegree}>
              {item.education || 'BAMS (Ayurveda)'}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Award size={13} color={Colors.olive} />
                <Text style={styles.metaText}>{experience}</Text>
              </View>
              {item.address && (
                <View style={styles.metaItem}>
                  <MapPin size={13} color={Colors.inkMuted} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.address.split(',')[0]}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Specialization Tags */}
        <View style={styles.tagsRow}>
          {item.specialization && item.specialization.slice(0, 3).map((tag, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Card Footer: Fee & Action */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.feeLabel}>Consultation Fee</Text>
            <Text style={styles.feeValue}>₹{fee}</Text>
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => router.push(`/(patient)/book/${item._id}` as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.bookButtonText}>Book Slot</Text>
            <ChevronRight size={16} color={Colors.cream} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Ayurvedic Doctors</Text>
        <Text style={styles.headerSubtitle}>
          Consult certified Ayurvedic Vaidyas & clinical specialists
        </Text>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.inkMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, specialization, or clinic..."
            placeholderTextColor={Colors.inkMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Specialization Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {SPECIALIZATIONS.map((spec) => {
            const isSelected = selectedSpecialization === spec;
            return (
              <TouchableOpacity
                key={spec}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedSpecialization(spec)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {spec}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Doctor List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Finding Ayurvedic specialists...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          keyExtractor={(item) => item._id}
          renderItem={renderDoctorItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Stethoscope size={36} color={Colors.inkMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Doctors Found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search query or selecting a different specialization filter.
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
    paddingBottom: 14,
    backgroundColor: Colors.cream,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.oliveDeep,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.inkStrong,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.inkMuted,
  },
  filterPillTextActive: {
    color: Colors.cream,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 14,
  },
  doctorCard: {
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
    gap: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
    flex: 1,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  doctorDegree: {
    fontSize: 12,
    color: Colors.olive,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: Colors.oliveDeep,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0ece3',
    paddingTop: 12,
  },
  feeLabel: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  feeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  bookButton: {
    backgroundColor: Colors.oliveAction,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cream,
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
  },
});
