// src/app/(patient)/index.tsx
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  HeartPulse,
  Leaf,
  LogOut,
  MessageSquare,
  Salad,
  Sparkles,
  Stethoscope,
  User,
} from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function PatientHomeScreen() {
  const { user, logout } = useAuthStore();
  const firstName = user?.firstName || 'Friend';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <User size={22} color={Colors.cream} />
            </View>
            <View>
              <Text style={styles.greeting}>Namaste,</Text>
              <Text style={styles.userName}>{firstName}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={logout}
            style={styles.logoutBtn}
            activeOpacity={0.7}
          >
            <LogOut size={18} color={Colors.oliveDeep} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Prakriti Banner */}
        <View style={styles.prakritiCard}>
          <View style={styles.prakritiIconWrap}>
            <Sparkles size={24} color={Colors.turmericGold} />
          </View>
          <View style={styles.prakritiContent}>
            <Text style={styles.prakritiTitle}>Ayurvedic Dosha Profile</Text>
            <Text style={styles.prakritiDesc}>
              Discover your unique constitution (Vata, Pitta, Kapha) for tailored wellness.
            </Text>
          </View>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionHeader}>Healthcare & Wellness</Text>

        {/* Grid of Action Cards */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.serviceCard} activeOpacity={0.8}>
            <View style={[styles.serviceIcon, { backgroundColor: '#eef2e3' }]}>
              <Stethoscope size={24} color={Colors.olive} />
            </View>
            <Text style={styles.serviceTitle}>Consult Doctors</Text>
            <Text style={styles.serviceDesc}>
              Book video consultations with verified Ayurvedic practitioners
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.serviceCard} activeOpacity={0.8}>
            <View style={[styles.serviceIcon, { backgroundColor: '#fff3e0' }]}>
              <Calendar size={24} color={Colors.turmericGold} />
            </View>
            <Text style={styles.serviceTitle}>My Appointments</Text>
            <Text style={styles.serviceDesc}>
              View scheduled appointments, join calls, and check status
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.serviceCard} activeOpacity={0.8}>
            <View style={[styles.serviceIcon, { backgroundColor: '#e8f5e9' }]}>
              <Salad size={24} color={Colors.success} />
            </View>
            <Text style={styles.serviceTitle}>Diet & Meal Plan</Text>
            <Text style={styles.serviceDesc}>
              Dosha-specific weekly meal schedules and nutrition tips
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.serviceCard} activeOpacity={0.8}>
            <View style={[styles.serviceIcon, { backgroundColor: '#f3e5f5' }]}>
              <HeartPulse size={24} color="#7b1fa2" />
            </View>
            <Text style={styles.serviceTitle}>Prescription Vault</Text>
            <Text style={styles.serviceDesc}>
              Upload medical records, view OCR transcriptions & doctor reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sanjeevani AI Teaser */}
        <TouchableOpacity style={styles.chatbotCard} activeOpacity={0.8}>
          <View style={styles.chatbotHeader}>
            <View style={styles.aiBadge}>
              <MessageSquare size={18} color={Colors.cream} />
            </View>
            <Text style={styles.chatbotTitle}>Sanjeevani AI Assistant</Text>
          </View>
          <Text style={styles.chatbotDesc}>
            Have an Ayurvedic health query? Ask Sanjeevani for instant herbal remedies, doctor recommendations, and wellness tips.
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  container: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 12,
    color: Colors.inkMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sagePale,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.oliveDeep,
  },
  prakritiCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  prakritiIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#fff8e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prakritiContent: {
    flex: 1,
  },
  prakritiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 2,
  },
  prakritiDesc: {
    fontSize: 12,
    color: Colors.inkMuted,
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 11,
    color: Colors.inkMuted,
    lineHeight: 15,
  },
  chatbotCard: {
    backgroundColor: Colors.oliveDeep,
    borderRadius: 20,
    padding: 18,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  chatbotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  aiBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatbotTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.cream,
  },
  chatbotDesc: {
    fontSize: 12,
    color: Colors.sagePale,
    lineHeight: 17,
  },
});
