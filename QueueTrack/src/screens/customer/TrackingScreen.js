import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  AppState,
} from 'react-native';
import { useQueue } from '../../context/QueueContext';
import { formatWait, formatTime, statusColor, statusLabel } from '../../utils/helpers';

const STATUS_CONFIG = {
  waiting: { bg: '#FEF3C7', border: '#FDE68A', icon: '⏳', msgColor: '#92400E' },
  called: { bg: '#DCFCE7', border: '#A7F3D0', icon: '📣', msgColor: '#065F46' },
  served: { bg: '#F1F5F9', border: '#E2E8F0', icon: '✅', msgColor: '#475569' },
};

export default function TrackingScreen({ route }) {
  const { mode } = route.params;
  const { state, findByQueueNumber, findByPhone, getQueuePosition, getEstimatedWait, getWaitingQueue } = useQueue();

  const [query, setQuery] = useState('');
  const [resultId, setResultId] = useState(null); // store id only, not snapshot
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);
  const [, setTick] = useState(0);
  const appState = useRef(AppState.currentState);

  // Re-render every 10 seconds so estimated wait time auto-reduces
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // Force refresh when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        setTick((t) => t + 1);
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  const isRestaurant = mode === 'restaurant';
  const primaryColor = isRestaurant ? '#E85D04' : '#0077B6';
  const settings = state.settings[mode];
  const waitingQueue = getWaitingQueue(mode);

  // Auto-search when opened from deep link (queuetrack://track?mode=...&no=R001)
  useEffect(() => {
    const deepLinkNo = route.params?.no;
    if (deepLinkNo) {
      setQuery(deepLinkNo);
      const found = findByQueueNumber(mode, deepLinkNo) || findByPhone(mode, deepLinkNo);
      if (found) { setResultId(found.id); setSearched(true); setNotFound(false); }
      else { setSearched(true); setNotFound(true); }
    }
  }, [route.params?.no]);

  // Always read live from context so status/position update automatically
  const result = resultId
    ? state.queues[mode]?.find((c) => c.id === resultId) || null
    : null;

  const search = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearched(true);
    const found = findByQueueNumber(mode, trimmed) || findByPhone(mode, trimmed);
    if (found) { setResultId(found.id); setNotFound(false); }
    else { setResultId(null); setNotFound(true); }
  };

  const position = result ? getQueuePosition(mode, result.id) : null;
  const estimatedWait = result ? getEstimatedWait(mode, result.id) : null;
  const sConfig = result ? STATUS_CONFIG[result.status] || STATUS_CONFIG.waiting : null;
  const sColor = result ? statusColor(result.status) : '#94A3B8';

  const getStatusMessage = () => {
    if (!result) return '';
    switch (result.status) {
      case 'waiting':
        return position === 1
          ? "🎉 You're next! Get ready to be called."
          : `There ${position - 1 === 1 ? 'is' : 'are'} ${position - 1} person${position - 1 > 1 ? 's' : ''} ahead of you.`;
      case 'called':
        return '📣 You have been called! Please proceed now.';
      case 'served':
        return '✅ You have been served. Thank you for your patience!';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Hero Header */}
        <View style={[styles.hero, { backgroundColor: primaryColor }]}>
          <Text style={styles.heroEmoji}>{isRestaurant ? '🍽' : '🏥'}</Text>
          <Text style={styles.heroTitle}>{settings?.businessName || (isRestaurant ? 'Restaurant' : 'Hospital')}</Text>
          <Text style={styles.heroSub}>Live Queue Tracker</Text>
        </View>

        {/* Search Card */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Track Your Queue</Text>
          <Text style={styles.searchHint}>
            Enter your queue number (e.g. {isRestaurant ? 'R001' : 'H001'}) or the mobile number you registered with.
          </Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder={isRestaurant ? 'R001  or  phone number' : 'H001  or  phone number'}
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={(v) => { setQuery(v); setSearched(false); setNotFound(false); setResultId(null); }}
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={search}
            />
            <TouchableOpacity style={[styles.searchBtn, { backgroundColor: primaryColor }]} onPress={search}>
              <Text style={styles.searchBtnText}>Find</Text>
            </TouchableOpacity>
          </View>
          {notFound && searched && (
            <View style={styles.notFoundBox}>
              <Text style={styles.notFoundText}>
                ❌ No match found. Check your queue number or phone number.
              </Text>
            </View>
          )}
        </View>

        {/* Result Card */}
        {result && (
          <View style={[styles.resultCard, { borderColor: sConfig.border }]}>
            {/* Status Banner */}
            <View style={[styles.resultStatusBar, { backgroundColor: sConfig.bg }]}>
              <Text style={styles.resultStatusIcon}>{sConfig.icon}</Text>
              <Text style={[styles.resultStatusMsg, { color: sConfig.msgColor }]}>
                {getStatusMessage()}
              </Text>
            </View>

            {/* Queue Number + Badge */}
            <View style={styles.resultMain}>
              <View>
                <Text style={styles.resultNumberLabel}>Your Queue No.</Text>
                <Text style={styles.resultNumber}>{result.queueNumber}</Text>
                <Text style={styles.resultName}>{result.name}</Text>
                {result.doctor && <Text style={styles.resultDoctor}>👨‍⚕️ {result.doctor}</Text>}
              </View>
              <View style={[styles.statusPill, { backgroundColor: statusColor(result.status) }]}>
                <Text style={styles.statusPillText}>{statusLabel(result.status)}</Text>
              </View>
            </View>

            {/* Stats Grid */}
            {result.status === 'waiting' && (
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: primaryColor }]}>{position}</Text>
                  <Text style={styles.statKey}>Your Position</Text>
                </View>
                <View style={[styles.statBox, styles.statBorder]}>
                  <Text style={styles.statVal}>{waitingQueue.length}</Text>
                  <Text style={styles.statKey}>Total Waiting</Text>
                </View>
                <View style={[styles.statBox, styles.statBorder]}>
                  <Text style={[styles.statVal, { color: '#D97706' }]}>{formatWait(estimatedWait)}</Text>
                  <Text style={styles.statKey}>Est. Wait</Text>
                </View>
                {isRestaurant && (
                  <View style={[styles.statBox, styles.statBorder]}>
                    <Text style={[styles.statVal, { color: '#059669' }]}>{settings?.availableSeats ?? 0}</Text>
                    <Text style={styles.statKey}>Seats Free</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.joinedAt}>Joined queue at {formatTime(result.addedAt)}</Text>

            {/* People ahead */}
            {result.status === 'waiting' && position > 1 && (
              <View style={styles.aheadBox}>
                <Text style={styles.aheadTitle}>People ahead of you</Text>
                {waitingQueue
                  .filter((c) => c.id !== result.id)
                  .slice(0, position - 1)
                  .map((c, i) => (
                    <View key={c.id} style={styles.aheadRow}>
                      <View style={styles.aheadPosBadge}><Text style={styles.aheadPos}>#{i + 1}</Text></View>
                      <Text style={styles.aheadNum}>{c.queueNumber}</Text>
                      <Text style={styles.aheadName}>{c.name.split(' ')[0]}…</Text>
                      <Text style={styles.aheadWait}>{formatWait(i * (settings?.avgWaitMinutes || 15))}</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}

        {/* Live Status Summary */}
        <View style={styles.liveCard}>
          <View style={styles.liveHeader}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>LIVE STATUS</Text>
          </View>
          <View style={styles.liveSummary}>
            <View style={styles.liveStat}>
              <Text style={[styles.liveVal, { color: '#D97706' }]}>{waitingQueue.length}</Text>
              <Text style={styles.liveKey}>Currently Waiting</Text>
            </View>
            {isRestaurant ? (
              <View style={[styles.liveStat, styles.liveStatBorder]}>
                <Text style={[styles.liveVal, { color: '#059669' }]}>{settings?.availableSeats ?? 0}</Text>
                <Text style={styles.liveKey}>Seats Available</Text>
              </View>
            ) : (
              <View style={[styles.liveStat, styles.liveStatBorder]}>
                <Text style={[styles.liveVal, { color: '#059669' }]}>{settings?.doctors?.filter(d => d.available)?.length ?? 0}</Text>
                <Text style={styles.liveKey}>Doctors On Duty</Text>
              </View>
            )}
            <View style={[styles.liveStat, styles.liveStatBorder]}>
              <Text style={[styles.liveVal, { color: '#7C3AED' }]}>{settings?.avgWaitMinutes ?? 15}m</Text>
              <Text style={styles.liveKey}>Avg Wait</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingBottom: 32 },

  hero: { alignItems: 'center', paddingVertical: 30 },
  heroEmoji: { fontSize: 44, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  searchCard: {
    margin: 16, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18,
    elevation: 3, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8,
  },
  searchTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  searchHint: { fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 17 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0F172A',
  },
  searchBtn: { paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center' },
  searchBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  notFoundBox: { marginTop: 12, backgroundColor: '#FFF5F5', borderRadius: 10, padding: 12 },
  notFoundText: { fontSize: 13, color: '#DC2626', textAlign: 'center' },

  resultCard: {
    marginHorizontal: 16, marginBottom: 14, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 3, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8,
  },
  resultStatusBar: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  resultStatusIcon: { fontSize: 20 },
  resultStatusMsg: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  resultMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingTop: 8 },
  resultNumberLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  resultNumber: { fontSize: 44, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  resultName: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 2 },
  resultDoctor: { fontSize: 12, color: '#64748B', marginTop: 4 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: '#F1F5F9' },
  statVal: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  statKey: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  joinedAt: { textAlign: 'center', fontSize: 11, color: '#CBD5E1', paddingBottom: 14 },

  aheadBox: { margin: 16, marginTop: 0, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14 },
  aheadTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  aheadRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 10 },
  aheadPosBadge: { width: 22, height: 22, backgroundColor: '#E2E8F0', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  aheadPos: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  aheadNum: { width: 52, fontWeight: '800', fontSize: 13, color: '#334155' },
  aheadName: { flex: 1, fontSize: 13, color: '#64748B' },
  aheadWait: { fontSize: 12, fontWeight: '700', color: '#D97706' },

  liveCard: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 18,
    elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6,
    overflow: 'hidden',
  },
  liveHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#059669' },
  liveLabel: { fontSize: 11, fontWeight: '700', color: '#475569', letterSpacing: 1 },
  liveSummary: { flexDirection: 'row' },
  liveStat: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  liveStatBorder: { borderLeftWidth: 1, borderLeftColor: '#F1F5F9' },
  liveVal: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  liveKey: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' },
});
