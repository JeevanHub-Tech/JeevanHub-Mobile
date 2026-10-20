// src/app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const { bootstrap } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.cream },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(patient)" options={{ headerShown: false }} />
        <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
