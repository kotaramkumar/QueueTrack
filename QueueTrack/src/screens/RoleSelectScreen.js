import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const ROLES = [
  {
    key: 'receptionist',
    emoji: '👩‍💼',
    label: 'Staff / Receptionist',
    description: 'Add customers, manage the live queue, and track availability',
    bullets: ['Add & manage queue entries', 'Call next & mark served', 'Adjust settings'],
    color: '#7C3AED',
    lightColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  {
    key: 'customer',
    emoji: '🙋',
    label: 'Customer / Patient',
    description: 'Check your live position, estimated wait time, and status',
    bullets: ['View queue position', 'See estimated wait', 'Track availability'],
    color: '#059669',
    lightColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
];

export default function RoleSelectScreen({ navigation, route }) {
  const { mode } = route.params;
  const isRestaurant = mode === 'restaurant';
  const modeColor = isRestaurant ? '#E85D04' : '#0077B6';
  const modeLabel = isRestaurant ? '🍽  Restaurant' : '🏥  Hospital';

  const selectRole = (role) => {
    if (role === 'receptionist') {
      navigation.navigate('ReceptionistTabs', { mode });
    } else {
      navigation.navigate('CustomerTracking', { mode });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>

        {/* Mode Badge */}
        <View style={[styles.modeBadge, { backgroundColor: modeColor + '15', borderColor: modeColor + '40' }]}>
          <Text style={[styles.modeBadgeText, { color: modeColor }]}>{modeLabel}</Text>
        </View>

        <Text style={styles.title}>How are you{'\n'}using Queue Track?</Text>
        <Text style={styles.subtitle}>Select your role to get the right view</Text>

        <View style={styles.cardsContainer}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.card, { borderColor: r.borderColor }]}
              onPress={() => selectRole(r.key)}
              activeOpacity={0.88}
            >
              <View style={[styles.cardHeader, { backgroundColor: r.lightColor }]}>
                <View style={[styles.iconWrap, { backgroundColor: r.color + '20' }]}>
                  <Text style={styles.emoji}>{r.emoji}</Text>
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardLabel}>{r.label}</Text>
                  <Text style={styles.cardDesc}>{r.description}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                {r.bullets.map((b) => (
                  <View key={b} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: r.color }]} />
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
                <View style={[styles.selectBtn, { backgroundColor: r.color }]}>
                  <Text style={styles.selectBtnText}>Select  ›</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  modeBadgeText: { fontSize: 13, fontWeight: '700' },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 34,
    marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 28 },
  cardsContainer: { gap: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  cardHeaderText: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  cardDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  cardBody: { padding: 16, paddingTop: 12, gap: 7 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3 },
  bulletText: { fontSize: 13, color: '#475569' },
  selectBtn: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  selectBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, letterSpacing: 0.3 },
});
