// src/app/index.tsx
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Leaf } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

export default function EntryScreen() {
  const { token, role, isBootstrapping, bootstrap } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, []);

  if (isBootstrapping) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoBadge}>
          <Leaf size={32} color={Colors.cream} />
        </View>
        <Text style={styles.brandTitle}>JeevanHub</Text>
        <Text style={styles.tagline}>Pure Ayurveda • Modern Healthcare</Text>
        <ActivityIndicator
          size="large"
          color={Colors.olive}
          style={styles.spinner}
        />
      </View>
    );
  }

  // Not logged in -> Auth flow
  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  // Doctor portal
  if (role === 'doctor') {
    return <Redirect href="/(doctor)" />;
  }

  // Patient portal (default)
  return <Redirect href="/(patient)" />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.oliveDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.oliveDeep,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: Colors.inkMuted,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  spinner: {
    marginTop: 36,
  },
});
