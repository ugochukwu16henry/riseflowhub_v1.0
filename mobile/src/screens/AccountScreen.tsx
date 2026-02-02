import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function AccountScreen() {
  const { user, logout } = useAuth();

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{user?.role?.replace('_', ' ')}</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e5e7eb' },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 4, marginTop: 12 },
  value: { fontSize: 16, color: '#111827' },
  logoutButton: { backgroundColor: '#dc2626', padding: 14, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600' },
});
