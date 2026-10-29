// src/app/(patient)/doctor/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Star,
  User,
} from 'lucide-react-native';
import { patientApi } from '../../../api/patient';
import { Button } from '../../../components/ui/Button';
import { Colors } from '../../../constants/theme';
import { DoctorProfile } from '../../../types/patient';

export default function DoctorDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadDoctorProfile(id);
    }
  }, [id]);

  const loadDoctorProfile = async (doctorId: string) => {
    try {
      const data = await patientApi.getDoctorById(doctorId);
      setDoctor(data);
    } catch (err) {
      console.error('Failed to load doctor profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.olive} />
          <Text style={styles.loadingText}>Loading doctor credentials...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Doctor profile could not be found.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={16} color={Colors.oliveDeep} />
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName || ''}`.trim();
  const fee = doctor.price || 500;
  const rating = doctor.rating || 4.9;
  const reviewCount = doctor.reviewCount || 34;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.inkStrong} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Doctor Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <User size={38} color={Colors.cream} />
          </View>
          <View style={styles.nameBadgeRow}>
            <Text style={styles.doctorName}>{doctorName}</Text>
            <CheckCircle2 size={18} color={Colors.success} />
          </View>
          <Text style={styles.designation}>
            {doctor.designation || 'Senior Ayurvedic Physician'}
          </Text>

          {/* Specialization Chips */}
          <View style={styles.specChipsRow}>
            {doctor.specialization && doctor.specialization.map((spec, i) => (
              <View key={i} style={styles.specChip}>
                <Text style={styles.specChipText}>{spec}</Text>
              </View>
            ))}
          </View>

          {/* Key Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statIconVal}>
                <Star size={14} color={Colors.turmericGold} fill={Colors.turmericGold} />
                <Text style={styles.statVal}>{rating}</Text>
              </View>
              <Text style={styles.statLbl}>{reviewCount} reviews</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <View style={styles.statIconVal}>
                <Award size={14} color={Colors.olive} />
                <Text style={styles.statVal}>{doctor.experience || 10}+</Text>
              </View>
              <Text style={styles.statLbl}>Years Exp</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <View style={styles.statIconVal}>
                <ShieldCheck size={14} color={Colors.success} />
                <Text style={styles.statVal}>AYUSH</Text>
              </View>
              <Text style={styles.statLbl}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Education & Qualifications */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <GraduationCap size={18} color={Colors.olive} />
            <Text style={styles.sectionTitle}>Qualifications & Degrees</Text>
          </View>
          <Text style={styles.degreeText}>{doctor.education || 'BAMS, MD (Ayurveda)'}</Text>
          {doctor.college && (
            <Text style={styles.collegeText}>Institution: {doctor.college}</Text>
          )}
        </View>

        {/* Clinical About & Bio */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <BookOpen size={18} color={Colors.olive} />
            <Text style={styles.sectionTitle}>About Doctor</Text>
          </View>
          <Text style={styles.aboutText}>
            {doctor.introduction ||
              `${doctorName} is a certified Ayurvedic specialist with over ${doctor.experience || 10} years of clinical expertise treating chronic conditions, digestive imbalances, metabolic disorders, and stress-related ailments through classical Ayurvedic formulations, dietetics, and Panchakarma therapies.`}
          </Text>
        </View>

        {/* Clinic Location & Languages */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color={Colors.olive} />
            <Text style={styles.sectionTitle}>Clinic & Languages</Text>
          </View>
          <Text style={styles.addressText}>
            📍 {doctor.address || 'Ayur Clinic & Wellness Center, New Delhi'}
          </Text>
          <View style={styles.langRow}>
            <Globe size={14} color={Colors.inkMuted} />
            <Text style={styles.langText}>
              Languages: {(doctor.languages && doctor.languages.join(', ')) || 'Hindi, English, Sanskrit'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Booking Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.barFeeLbl}>Consultation Fee</Text>
          <Text style={styles.barFeeVal}>₹{fee}</Text>
        </View>
        <Button
          title="Book Appointment"
          onPress={() => router.push(`/(patient)/book/${doctor._id}` as any)}
          size="md"
          style={styles.bookCta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cream,
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  content: {
    padding: 20,
    paddingBottom: 110,
    gap: 14,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 30,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  designation: {
    fontSize: 13,
    color: Colors.olive,
    fontWeight: '600',
    marginBottom: 12,
  },
  specChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 18,
  },
  specChip: {
    backgroundColor: Colors.sagePale,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  specChipText: {
    fontSize: 11,
    color: Colors.oliveDeep,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: Colors.sagePale,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconVal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  statLbl: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderStrong,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  degreeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.oliveDeep,
    marginBottom: 2,
  },
  collegeText: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  aboutText: {
    fontSize: 13,
    color: Colors.inkMuted,
    lineHeight: 19,
  },
  addressText: {
    fontSize: 13,
    color: Colors.inkStrong,
    marginBottom: 8,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langText: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 24 : 14,
    elevation: 10,
  },
  barFeeLbl: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  barFeeVal: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  bookCta: {
    paddingHorizontal: 24,
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
  errorText: {
    fontSize: 15,
    color: Colors.error,
    marginBottom: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
});
