// src/app/(patient)/_layout.tsx
import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function PatientLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.cream },
        headerTintColor: Colors.oliveDeep,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.cream },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
