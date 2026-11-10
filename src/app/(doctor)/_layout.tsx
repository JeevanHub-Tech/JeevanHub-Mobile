// src/app/(doctor)/_layout.tsx
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import {
  CalendarDays,
  Clock,
  LayoutDashboard,
  UserCheck,
  Users,
} from 'lucide-react-native';
import { Colors } from '../../constants/theme';

interface TabIconProps {
  icon: any;
  focused: boolean;
  color?: any;
}

const TabIconWithPill = ({ icon: Icon, focused, color }: TabIconProps) => (
  <View style={[styles.iconPill, focused && styles.iconPillActive]}>
    <Icon
      size={20}
      color={focused ? Colors.oliveDeep : color}
      strokeWidth={focused ? 2.5 : 1.8}
    />
  </View>
);

export default function DoctorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.oliveDeep,
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
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithPill icon={LayoutDashboard} focused={focused} color={color} />
          ),
        }}
      />

      {/* 2. Appointments & Queue */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Consults',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithPill icon={CalendarDays} focused={focused} color={color} />
          ),
        }}
      />

      {/* 3. Slot & Schedule Management */}
      <Tabs.Screen
        name="slots"
        options={{
          title: 'Slots',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithPill icon={Clock} focused={focused} color={color} />
          ),
        }}
      />

      {/* 4. Patients Roster */}
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithPill icon={Users} focused={focused} color={color} />
          ),
        }}
      />

      {/* 5. Doctor Profile & Settings */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithPill icon={UserCheck} focused={focused} color={color} />
          ),
        }}
      />

      {/* ─── Stack-like Sub-screens (Hidden from tab bar) ────────────────── */}
      <Tabs.Screen
        name="patient/[patientId]"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="prescribe/[bookingId]"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="reviews"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="blogs"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="write-blog"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e8ebe2',
    height: Platform.OS === 'ios' ? 90 : 68,
    paddingBottom: Platform.OS === 'ios' ? 26 : 8,
    paddingTop: 6,
    elevation: 10,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  iconPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  iconPillActive: {
    backgroundColor: '#eef3e6', // Soft Ayurvedic herb/sage highlight
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
});
