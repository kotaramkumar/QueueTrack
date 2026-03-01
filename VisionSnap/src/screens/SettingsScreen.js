import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { saveApiKey } from '../utils/storage';

const SCAN_TYPES = [
  { icon: '🍃', name: 'Leaves', desc: 'Plant name, leaf type, medicinal uses, ecology' },
  { icon: '🌳', name: 'Trees', desc: 'Species, height, origin, lifespan, uses' },
  { icon: '🥦', name: 'Vegetables', desc: 'Nutrition, calories per 100g, storage tips' },
  { icon: '🍔', name: 'Food', desc: 'Calories, macros (carbs/protein/fats), benefits' },
  { icon: '👤', name: 'Public Figures', desc: 'Bio, profession, achievements, career' },
  { icon: '🏛️', name: 'Historical Places', desc: 'History, significance, visitor info' },
  { icon: '🚩', name: 'Country Flags', desc: 'Country details, symbolism, fun facts' },
  { icon: '🗺️', name: 'World Maps', desc: 'Regions, countries, geographic features' },
  { icon: '🐾', name: 'Animals', desc: 'Species, habitat, diet, conservation status, fun facts' },
  { icon: '🚗', name: 'Cars & Vehicles', desc: 'Make, model, year, engine type, features' },
  { icon: '📦', name: 'Any Object', desc: 'Description, uses, interesting facts' },
];

export default function SettingsScreen() {
  const { state, dispatch } = useApp();
  const [keyInput, setKeyInput] = useState(state.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your API key.');
      return;
    }
    if (!trimmed.startsWith('sk-ant-')) {
      Alert.alert(
        'Unusual Key Format',
        'Anthropic API keys typically start with "sk-ant-". Save anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: () => persist(trimmed) },
        ]
      );
      return;
    }
    await persist(trimmed);
  };

  const persist = async (key) => {
    setSaving(true);
    await saveApiKey(key);
    dispatch({ type: 'SET_API_KEY', payload: key });
    setSaving(false);
    Alert.alert('Saved', 'Your API key has been saved.');
  };

  const handleClear = () => {
    Alert.alert('Remove API Key', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await saveApiKey('');
          dispatch({ type: 'SET_API_KEY', payload: '' });
          setKeyInput('');
        },
      },
    ]);
  };

  const keyConfigured = !!state.apiKey;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.pageTitle}>Settings</Text>

        {/* API Key */}
        <Section title="🔑 Anthropic API Key">
          <Text style={styles.desc}>
            Required to analyze images. Your key is stored only on this device.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="sk-ant-api03-…"
              placeholderTextColor="#3A3A6A"
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKey((v) => !v)}>
              <Text style={styles.eyeIcon}>{showKey ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.saveBtn, saving && styles.disabledBtn]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Key'}</Text>
            </TouchableOpacity>
            {keyConfigured && (
              <TouchableOpacity style={[styles.actionBtn, styles.clearBtn]} onPress={handleClear}>
                <Text style={styles.clearBtnText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.statusRow, keyConfigured ? styles.statusOk : styles.statusWarn]}>
            <Text style={styles.statusDot}>{keyConfigured ? '🟢' : '🔴'}</Text>
            <Text style={[styles.statusText, { color: keyConfigured ? '#4CAF50' : '#FF5555' }]}>
              {keyConfigured ? 'API key is configured' : 'No API key configured'}
            </Text>
          </View>
        </Section>

        {/* How to get key */}
        <Section title="📖 How to get an API Key">
          {[
            'Visit console.anthropic.com',
            'Sign in or create a free account',
            'Navigate to → API Keys',
            'Click "Create Key" and copy it',
            'Paste the key in the field above',
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Section>

        {/* Supported types */}
        <Section title="📸 Scan Capabilities">
          {SCAN_TYPES.map((t) => (
            <View key={t.name} style={styles.typeRow}>
              <Text style={styles.typeIcon}>{t.icon}</Text>
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>{t.name}</Text>
                <Text style={styles.typeDesc}>{t.desc}</Text>
              </View>
            </View>
          ))}
        </Section>

        {/* About */}
        <Section title="ℹ️ About">
          <View style={styles.aboutBox}>
            <Text style={styles.aboutName}>VisionSnap AI</Text>
            <Text style={styles.aboutVersion}>v1.0.0</Text>
            <Text style={styles.aboutBody}>
              Powered by Claude Opus (claude-opus-4-6) by Anthropic.{'\n\n'}
              Scan leaves, trees, food, vegetables, animals, cars & vehicles,
              public figures, historical landmarks, country flags, world maps,
              and everyday objects — and receive rich, educational information
              instantly.
            </Text>
          </View>
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const BG = '#0D0D1A';
const CARD = '#1A1A2E';
const BORDER = '#2A2A4A';
const PURPLE = '#6C63FF';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginBottom: 24 },

  section: { marginBottom: 28 },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 14 },

  desc: { color: '#7777AA', fontSize: 13, lineHeight: 20, marginBottom: 14 },

  inputRow: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: '#DDDDFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  eyeBtn: { paddingHorizontal: 14 },
  eyeIcon: { fontSize: 18 },

  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn: {
    paddingVertical: 13,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: { flex: 1, backgroundColor: PURPLE },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  clearBtn: { paddingHorizontal: 20, backgroundColor: '#2A1A1A', borderWidth: 1, borderColor: '#6A2A2A' },
  clearBtnText: { color: '#FF6666', fontSize: 15, fontWeight: '600' },
  disabledBtn: { opacity: 0.5 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusOk: {},
  statusWarn: {},
  statusDot: { fontSize: 12 },
  statusText: { fontSize: 13, fontWeight: '500' },

  // Steps
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 12,
    marginBottom: 8,
  },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  stepText: { color: '#CCCCEE', fontSize: 14, flex: 1 },

  // Scan types
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 12,
    marginBottom: 8,
  },
  typeIcon: { fontSize: 28, width: 36, textAlign: 'center' },
  typeInfo: { flex: 1 },
  typeName: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  typeDesc: { color: '#7777AA', fontSize: 12, marginTop: 2 },

  // About
  aboutBox: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  aboutName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  aboutVersion: { color: '#555577', fontSize: 13, marginBottom: 14 },
  aboutBody: { color: '#9999BB', fontSize: 13, textAlign: 'center', lineHeight: 21 },
});
