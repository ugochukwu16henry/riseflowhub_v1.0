import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync } from './src/notifications';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync().catch(() => {});
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
