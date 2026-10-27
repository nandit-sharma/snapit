import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="student-login" />
      <Stack.Screen name="student-register" />
      <Stack.Screen name="admin-login" />
    </Stack>
  );
}
