// src/app/(doctor)/_layout.tsx
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import {
  CalendarDays,
  Clock,
  LayoutDashboard,
  UserCheck,
  Users,
} from 'lucide-react-native';
import { Colors } from '../../constants/theme';

export default function DoctorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.oliveAction,
        tabBarInactiveTintColor: Colors.inkMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      {/* 1. Dashboard / Overview */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size || 22} color={color} />,
        }}
      />

      {/* 2. Appointments & Queue */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Consults',
          tabBarIcon: ({ color, size }) => <CalendarDays size={size || 22} color={color} />,
        }}
      />

      {/* 3. Slot & Schedule Management */}
      <Tabs.Screen
        name="slots"
        options={{
          title: 'Slots',
          tabBarIcon: ({ color, size }) => <Clock size={size || 22} color={color} />,
        }}
      />

      {/* 4. Patients Roster */}
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, size }) => <Users size={size || 22} color={color} />,
        }}
      />

      {/* 5. Doctor Profile & Settings */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserCheck size={size || 22} color={color} />,
        }}
      />

      {/* ─── Stack-like Sub-screens (Hidden from tab bar) ────────────────── */}
      <Tabs.Screen
        name="patient/[patientId]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="prescribe/[bookingId]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 26 : 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
});
