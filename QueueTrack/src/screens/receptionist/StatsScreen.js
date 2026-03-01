import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useQueue } from '../../context/QueueContext';

function BigStatCard({ label, value, color, emoji }) {
  return (
    <View style={[styles.bigCard, { borderLeftColor: color }]}>
      <Text style={styles.bigCardEmoji}>{emoji}</Text>
      <Text style={[styles.bigCardValue, { color }]}>{value}</Text>
      <Text style={styles.bigCardLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function getEfficiency(waiting, served) {
  if (waiting === 0 && served > 0) return { label: 'Excellent', emoji: '🚀', color: '#059669', bg: '#D1FAE5' };
  if (waiting <= 3) return { label: 'Good', emoji: '✅', color: '#0077B6', bg: '#DBEAFE' };
  if (waiting <= 7) return { label: 'Busy', emoji: '⚡', color: '#D97706', bg: '#FEF3C7' };
  return { label: 'Overloaded', emoji: '🔴', color: '#DC2626', bg: '#FEE2E2' };
}

export default function StatsScreen({ route }) {
  const { mode } = route.params;
  const { state } = useQueue();

  const stats = useMemo(() => {
    const queue = state.queues[mode] || [];
    const settings = state.settings[mode] || {};
    const todayStr = new Date().toISOString().slice(0, 10);

    const addedToday = queue.filter((c) => c.addedAt && c.addedAt.slice(0, 10) === todayStr).length;
    const servedToday = queue.filter(
      (c) => c.addedAt && c.addedAt.slice(0, 10) === todayStr && c.status === 'served'
    ).length;
    const waiting = queue.filter((c) => c.status === 'waiting').length;
    const avgWait = settings.avgWaitMinutes || 15;
    const serviceRate = addedToday === 0 ? 0 : Math.round((servedToday / addedToday) * 100);
    const efficiency = getEfficiency(waiting, servedToday);
    const businessName = settings.businessName || (mode === 'restaurant' ? 'Restaurant' : 'Hospital');

    return { addedToday, servedToday, waiting, avgWait, serviceRate, efficiency, businessName };
  }, [state.queues, state.settings, mode]);

  const isRestaurant = mode === 'restaurant';
  const primaryColor = isRestaurant ? '#E85D04' : '#0077B6';
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const waitingColor =
    stats.waiting === 0 ? '#059669' : stats.waiting <= 3 ? '#D97706' : '#DC2626';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerEyebrow}>Daily Stats</Text>
              <Text style={styles.headerName}>{stats.businessName}</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>{todayLabel}</Text>
              </View>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{isRestaurant ? '🍽' : '🏥'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Today's Summary */}
        <View style={styles.section}>
          <SectionHeader title="Today's Summary" />
          <View style={styles.row}>
            <BigStatCard
              label="Added Today"
              value={stats.addedToday}
              color={primaryColor}
              emoji="➕"
            />
            <BigStatCard
              label="Served Today"
              value={stats.servedToday}
              color="#059669"
              emoji="✅"
            />
          </View>
        </View>

        {/* Current Status */}
        <View style={styles.section}>
          <SectionHeader title="Current Status" />
          <View style={styles.row}>
            <BigStatCard
              label="Waiting Now"
              value={stats.waiting}
              color={waitingColor}
              emoji="⏳"
            />
            <BigStatCard
              label="Avg Wait Time"
              value={`${stats.avgWait}m`}
              color="#475569"
              emoji="🕐"
            />
          </View>
        </View>

        {/* Performance */}
        <View style={styles.section}>
          <SectionHeader title="Performance" />
          <View style={styles.perfCard}>
            {/* Service Rate */}
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>Service Rate</Text>
              <Text style={[styles.perfValue, { color: primaryColor }]}>{stats.serviceRate}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${stats.serviceRate}%`, backgroundColor: primaryColor },
                ]}
              />
            </View>

            <View style={styles.divider} />

            {/* Efficiency */}
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>Queue Efficiency</Text>
              <View
                style={[styles.efficiencyBadge, { backgroundColor: stats.efficiency.bg }]}
              >
                <Text style={[styles.efficiencyText, { color: stats.efficiency.color }]}>
                  {stats.efficiency.emoji}  {stats.efficiency.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer note */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️  Avg wait time is the configured value from Settings, not measured from actual service times.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingBottom: 40 },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerEyebrow: {
    fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3,
  },
  headerName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  datePill: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  datePillText: { fontSize: 11, color: '#FFFFFF', fontWeight: '700' },
  headerBadge: {
    width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  headerBadgeText: { fontSize: 22 },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: {
    fontSize: 13, fontWeight: '700', color: '#475569',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 12 },

  bigCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6,
  },
  bigCardEmoji: { fontSize: 24, marginBottom: 8 },
  bigCardValue: { fontSize: 32, fontWeight: '900', marginBottom: 4 },
  bigCardLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },

  perfCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18,
    elevation: 2,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6,
  },
  perfRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  perfLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
  perfValue: { fontSize: 18, fontWeight: '900' },
  progressTrack: {
    height: 8, backgroundColor: '#E2E8F0', borderRadius: 4,
    overflow: 'hidden', marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  efficiencyBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  efficiencyText: { fontSize: 13, fontWeight: '700' },

  infoBox: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14,
    borderLeftWidth: 3, borderLeftColor: '#3B82F6',
  },
  infoText: { fontSize: 12, color: '#1D4ED8', lineHeight: 18 },
});
