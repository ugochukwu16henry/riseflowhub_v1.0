import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api, type Project } from '../api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type StackParamList = { ChatThread: { projectId: string; projectName: string } };
type Props = NativeStackScreenProps<StackParamList>;

export default function ChatScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!token) return;
    try {
      const list = await api.projects.list(token);
      setProjects(list);
    } catch {
      setProjects([]);
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
      <Text style={styles.hint}>Select a project to open chat</Text>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6366f1']} />}
        ListEmptyComponent={<Text style={styles.empty}>No projects</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => (navigation.getParent() as any)?.getParent()?.navigate('ChatThread', { projectId: item.id, projectName: item.projectName })}
          >
            <Text style={styles.cardTitle}>{item.projectName}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
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
});
