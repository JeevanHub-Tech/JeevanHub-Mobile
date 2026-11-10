// src/app/(patient)/_layout.tsx
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import {
  Calendar,
  FolderHeart,
  Home,
  Sparkles,
  Stethoscope,
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

export default function PatientLayout() {
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
      {/* 1. Home / Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithPill icon={Home} focused={focused} color={color} />
          ),
        }}
      />

      {/* 2. Doctor Directory & Discovery */}
      <Tabs.Screen
        name="doctors"
        options={{
          title: 'Consult',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithPill icon={Stethoscope} focused={focused} color={color} />
          ),
        }}
      />

      {/* 3. Appointments */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithPill icon={Calendar} focused={focused} color={color} />
          ),
        }}
      />

      {/* 4. Ayurvedic Prakriti & Dosha Wellness */}
      <Tabs.Screen
        name="wellness"
        options={{
          title: 'Wellness',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithPill icon={Sparkles} focused={focused} color={color} />
          ),
        }}
      />

      {/* 5. Medical Vault & OCR Prescriptions */}
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithPill icon={FolderHeart} focused={focused} color={color} />
          ),
        }}
      />

      {/* ─── Stack-like Sub-screens (Hidden from tab bar) ────────────────── */}
      <Tabs.Screen
        name="chat"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="doctor/[id]"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="book/[doctorId]"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="checkout"
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="orders"
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
    backgroundColor: '#eef3e6',
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
