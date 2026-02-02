import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function AIScreen() {
  const { token } = useAuth();
  const [ideaInput, setIdeaInput] = useState('');
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [mode, setMode] = useState<'idea' | 'insights'>('idea');

  async function evaluateIdea() {
    if (!token || !ideaInput.trim()) {
      Alert.alert('Required', 'Enter an idea to evaluate.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.ai.evaluateIdea({ ideaDescription: ideaInput.trim(), industry: undefined }, token);
      setResult(
        `Feasibility: ${res.feasibilityScore}%\nRisk: ${res.riskLevel}\nMarket: ${res.marketPotential}\n\n${res.summary}`
      );
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function getProjectInsights() {
    if (!token) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.ai.projectInsights({ projectId: projectId.trim() || undefined }, token);
      setResult(
        `Health: ${res.overallHealth}\n\nSuggestions:\n${res.suggestions.map((s) => `• ${s}`).join('\n')}\n\nRisks: ${res.riskAreas.join(', ')}\n\n${res.summary}`
      );
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, mode === 'idea' && styles.tabActive]} onPress={() => { setMode('idea'); setResult(null); }}>
          <Text style={[styles.tabText, mode === 'idea' && styles.tabTextActive]}>Evaluate idea</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, mode === 'insights' && styles.tabActive]} onPress={() => { setMode('insights'); setResult(null); }}>
          <Text style={[styles.tabText, mode === 'insights' && styles.tabTextActive]}>Project insights</Text>
        </TouchableOpacity>
      </View>

      {mode === 'idea' ? (
        <>
          <Text style={styles.label}>Describe your idea</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. A mobile app for farmers to sell produce directly..."
            value={ideaInput}
            onChangeText={setIdeaInput}
            multiline
            numberOfLines={4}
            editable={!loading}
          />
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={evaluateIdea} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get AI evaluation</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Project ID (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Leave empty for general insights"
            value={projectId}
            onChangeText={setProjectId}
            editable={!loading}
          />
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={getProjectInsights} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get project insights</Text>}
          </TouchableOpacity>
        </>
      )}

      {result ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Result</Text>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  tabs: { flexDirection: 'row', marginBottom: 20, gap: 8 },
  tab: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#fff' },
  label: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, backgroundColor: '#fff' },
  textArea: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, minHeight: 100, textAlignVertical: 'top', backgroundColor: '#fff' },
  button: { backgroundColor: '#6366f1', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 24 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600' },
  resultBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  resultLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
  resultText: { fontSize: 15, color: '#111827', lineHeight: 22 },
});
