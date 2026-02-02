import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api, type AssignedToMe } from '../api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type StackParamList = { AgreementSign: { agreementId: string; title: string } };
type Props = NativeStackScreenProps<StackParamList>;

export default function AgreementsScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [agreements, setAgreements] = useState<AssignedToMe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!token) return;
    try {
      const list = await api.agreements.listAssignedToMe(token);
      setAgreements(list);
    } catch {
      setAgreements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={agreements}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6366f1']} />}
        ListEmptyComponent={<Text style={styles.empty}>No agreements assigned to you</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => item.status === 'Pending' && (navigation.getParent() as any)?.getParent()?.navigate('AgreementSign', { agreementId: item.agreement.id, title: item.agreement.title })}
            disabled={item.status !== 'Pending'}
          >
            <Text style={styles.cardTitle}>{item.agreement.title}</Text>
            <Text style={[styles.cardStatus, item.status === 'Signed' && styles.cardStatusSigned]}>{item.status}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardStatus: { fontSize: 14, color: '#f59e0b', marginTop: 4 },
  cardStatusSigned: { color: '#059669' },
});
