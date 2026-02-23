import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useQueue } from '../context/QueueContext';

const { width } = Dimensions.get('window');

const MODES = [
  {
    key: 'restaurant',
    emoji: '🍽',
    label: 'Restaurant',
    tagline: 'Table queue & walk-in management',
    color: '#E85D04',
    lightColor: '#FFF4EE',
    borderColor: '#FED7AA',
    features: ['Auto queue numbers', 'SMS notifications', 'Seat tracking'],
  },
  {
    key: 'hospital',
    emoji: '🏥',
    label: 'Hospital / Clinic',
    tagline: 'Patient queue & doctor availability',
    color: '#0077B6',
    lightColor: '#EFF8FF',
    borderColor: '#BAE6FD',
    features: ['Doctor assignment', 'Patient tracking', 'SMS notifications'],
  },
];

export default function WelcomeScreen({ navigation }) {
  const { dispatch } = useQueue();

  const selectMode = (mode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
    navigation.navigate('RoleSelect', { mode });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoRing}>
          <Text style={styles.logoEmoji}>📋</Text>
        </View>
        <Text style={styles.appName}>Queue Track</Text>
        <Text style={styles.heroTagline}>
          Smart digital queue management{'\n'}for modern businesses
        </Text>
      </View>

      {/* Cards */}
      <View style={styles.body}>
        <Text style={styles.sectionLabel}>SELECT YOUR BUSINESS TYPE</Text>

        {MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.card, { borderColor: m.borderColor }]}
            onPress={() => selectMode(m.key)}
            activeOpacity={0.88}
          >
            <View style={[styles.cardLeft, { backgroundColor: m.lightColor }]}>
              <Text style={styles.cardEmoji}>{m.emoji}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>{m.label}</Text>
              <Text style={styles.cardTagline}>{m.tagline}</Text>
              <View style={styles.featuresRow}>
                {m.features.map((f) => (
                  <View
                    key={f}
                    style={[styles.featureChip, { backgroundColor: m.lightColor }]}
                  >
                    <Text style={[styles.featureText, { color: m.color }]}>
                      {f}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={[styles.arrowBox, { backgroundColor: m.color }]}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.footer}>Queue Track v1.0  ·  Expo Go</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  hero: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    backgroundColor: '#0F172A',
  },
  logoRing: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoEmoji: { fontSize: 36 },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  heroTagline: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  body: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardLeft: {
    width: 72,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 28 },
  cardContent: { flex: 1, padding: 14 },
  cardLabel: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  cardTagline: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  featureChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featureText: { fontSize: 10, fontWeight: '600' },
  arrowBox: {
    width: 36,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  footer: {
    textAlign: 'center',
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 'auto',
    paddingBottom: 16,
    paddingTop: 8,
  },
});
