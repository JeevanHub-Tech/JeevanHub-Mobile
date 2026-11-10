// src/app/(patient)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function PatientLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.cream },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="prescription-wellness/index" options={{ headerShown: false }} />
      <Stack.Screen name="prescription-wellness/profile-form" options={{ headerShown: false }} />
      <Stack.Screen name="medicines/index" options={{ headerShown: false }} />
      <Stack.Screen name="medicines/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="cart/index" options={{ headerShown: false }} />
      <Stack.Screen name="checkout/index" options={{ headerShown: false }} />
      <Stack.Screen name="orders/index" options={{ headerShown: false }} />
      <Stack.Screen name="treatments/index" options={{ headerShown: false }} />
      <Stack.Screen name="treatments/[category]" options={{ headerShown: false }} />
      <Stack.Screen name="blogs/index" options={{ headerShown: false }} />
      <Stack.Screen name="blogs/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="doctor/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="book/[doctorId]" options={{ headerShown: false }} />
      <Stack.Screen name="feedback/index" options={{ headerShown: false }} />
    </Stack>
  );
}
