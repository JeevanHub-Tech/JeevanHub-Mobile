// src/app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.cream,
        },
        headerTintColor: Colors.oliveDeep,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors.cream,
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register-patient"
        options={{
          title: 'Register as Patient',
          headerBackTitle: 'Login',
        }}
      />
      <Stack.Screen
        name="register-doctor"
        options={{
          title: 'Doctor Registration',
          headerBackTitle: 'Login',
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'Reset Password',
          headerBackTitle: 'Login',
        }}
      />
    </Stack>
  );
}
