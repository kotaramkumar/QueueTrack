import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  StatusBar,
  Linking,
} from 'react-native';
import { useQueue } from '../../context/QueueContext';
import { formatWait, buildCallSmsBody } from '../../utils/helpers';
import * as SMS from 'expo-sms';

function StatCard({ label, value, color, emoji, sub }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

export default function DashboardScreen({ route, navigation }) {
  const { mode } = route.params;
  const { state, dispatch, getWaitingQueue, getActiveQueue } = useQueue();

  const settings = state.settings[mode];
  const waitingQueue = getWaitingQueue(mode);
  const calledCustomer = state.queues[mode]?.find((c) => c.status === 'called');
  const servedToday = state.queues[mode]?.filter((c) => c.status === 'served').length ?? 0;
  const avgWait = settings?.avgWaitMinutes || 15;
  const isRestaurant = mode === 'restaurant';
  const primaryColor = isRestaurant ? '#E85D04' : '#0077B6';
  const businessName = settings?.businessName || (isRestaurant ? 'Restaurant' : 'Hospital');

  const callOnPhone = (customer) => {
    const phone = customer.phone.replace(/\s/g, '');
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Error', 'Unable to open the phone dialer.')
    );
  };

  const callNext = async () => {
    if (waitingQueue.length === 0) {
      Alert.alert('Queue Empty', 'No customers are waiting right now.');
      return;
    }
    const nextCustomer = waitingQueue[0];
    dispatch({ type: 'CALL_NEXT', payload: { mode } });
    try {
      const available = await SMS.isAvailableAsync();
      if (available) {
        const smsBody = buildCallSmsBody(nextCustomer, mode, settings);
        await SMS.sendSMSAsync([nextCustomer.phone], smsBody);
      }
    } catch (_) {}
    Alert.alert(
      `📣 Calling ${nextCustomer.name}`,
      `Queue No: ${nextCustomer.queueNumber}\n📱 ${nextCustomer.phone}`,
      [
        { text: '📞 Call on Phone', onPress: () => callOnPhone(nextCustomer) },
        { text: 'Done', style: 'cancel' },
      ]
    );
  };

  const markServed = () => {
    if (!calledCustomer) return;
    dispatch({ type: 'MARK_SERVED', payload: { mode, id: calledCustomer.id } });
  };

  const resetQueue = () => {
    Alert.alert('Reset Queue', 'Clear all served entries and reset counters?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => dispatch({ type: 'RESET_QUEUE', payload: { mode } }),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Colored Header */}
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>Reception Dashboard</Text>
              <Text style={styles.headerName}>{businessName}</Text>
            </View>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{isRestaurant ? '🍽' : '🏥'}</Text>
            </View>
          </View>

          {/* Inline stats in header */}
          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatVal}>{waitingQueue.length}</Text>
              <Text style={styles.headerStatKey}>Waiting</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatVal}>{servedToday}</Text>
              <Text style={styles.headerStatKey}>Served Today</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatVal}>{`${avgWait}m`}</Text>
              <Text style={styles.headerStatKey}>Avg Wait</Text>
            </View>
          </View>
        </View>

        {/* Stat Cards */}
        <View style={styles.statsRow}>
          {isRestaurant ? (
            <StatCard
              label="Available Seats"
              value={settings?.availableSeats ?? 0}
              color="#059669"
              emoji="💺"
              sub={`of ${settings?.totalCapacity ?? '—'} total`}
            />
          ) : (
            <StatCard
              label="Doctors In"
              value={settings?.doctors?.filter((d) => d.available).length ?? 0}
              color="#059669"
              emoji="👨‍⚕️"
              sub={`of ${settings?.doctors?.length ?? 0} total`}
            />
          )}
          <StatCard
            label="In Queue"
            value={(state.queues[mode] || []).filter((c) => c.status !== 'served').length}
            color="#D97706"
            emoji="⏳"
            sub="active entries"
          />
        </View>

        {/* Now Serving / Idle Banner */}
        {calledCustomer ? (
          <View style={styles.servingCard}>
            <View style={styles.servingTop}>
              <View style={styles.servingDot} />
              <Text style={styles.servingLive}>NOW SERVING</Text>
            </View>
            <Text style={styles.servingNumber}>{calledCustomer.queueNumber}</Text>
            <Text style={styles.servingName}>{calledCustomer.name}</Text>
            {calledCustomer.doctor && (
              <Text style={styles.servingDoctor}>→ {calledCustomer.doctor}</Text>
            )}
            <TouchableOpacity style={styles.doneBtn} onPress={markServed}>
              <Text style={styles.doneBtnText}>✓  Mark as Served</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.idleCard}>
            <Text style={styles.idleEmoji}>{waitingQueue.length > 0 ? '👋' : '✅'}</Text>
            <Text style={styles.idleTitle}>
              {waitingQueue.length > 0 ? 'Ready for next customer' : 'Queue is clear'}
            </Text>
            <Text style={styles.idleHint}>
              {waitingQueue.length > 0
                ? `${waitingQueue.length} customer${waitingQueue.length > 1 ? 's' : ''} waiting`
                : 'No customers in queue right now'}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: primaryColor }]}
            onPress={() => navigation.navigate('AddToQueue', { mode })}
          >
            <Text style={styles.btnPrimaryText}>＋  Add to Queue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnOutline,
              { borderColor: primaryColor, opacity: waitingQueue.length === 0 ? 0.4 : 1 },
            ]}
            onPress={callNext}
            disabled={waitingQueue.length === 0}
          >
            <Text style={[styles.btnOutlineText, { color: primaryColor }]}>
              📣  Call Next  ·  {waitingQueue.length} waiting
            </Text>
          </TouchableOpacity>
        </View>

        {/* Queue Preview */}
        {waitingQueue.length > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>NEXT IN LINE</Text>
            {waitingQueue.slice(0, 4).map((c, i) => (
              <View key={c.id} style={styles.previewRow}>
                <View style={styles.previewPosBadge}>
                  <Text style={styles.previewPos}>#{i + 1}</Text>
                </View>
                <Text style={styles.previewNum}>{c.queueNumber}</Text>
                <Text style={styles.previewName} numberOfLines={1}>{c.name}</Text>
                <View style={styles.previewWaitBadge}>
                  <Text style={styles.previewWait}>{formatWait(i * avgWait)}</Text>
                </View>
              </View>
            ))}
            {waitingQueue.length > 4 && (
              <Text style={styles.previewMore}>
                + {waitingQueue.length - 4} more customer{waitingQueue.length - 4 > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        )}

        {/* Danger zone */}
        <TouchableOpacity style={styles.resetBtn} onPress={resetQueue}>
          <Text style={styles.resetText}>🗑  Clear Served & Reset Counter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingBottom: 32 },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 0 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  headerName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerBadge: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerBadgeText: { fontSize: 22 },
  headerStats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 16, padding: 16, marginBottom: 0 },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatVal: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  headerStatKey: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },
  headerStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },

  statsRow: { flexDirection: 'row', gap: 12, margin: 16, marginBottom: 0 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    borderLeftWidth: 4,
    elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  statEmoji: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 26, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  statSub: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

  servingCard: {
    margin: 16, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#A7F3D0',
    elevation: 3, shadowColor: '#059669', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8,
  },
  servingTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  servingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669' },
  servingLive: { fontSize: 11, fontWeight: '800', color: '#059669', letterSpacing: 1.2 },
  servingNumber: { fontSize: 52, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  servingName: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 2 },
  servingDoctor: { fontSize: 13, color: '#64748B', marginTop: 4 },
  doneBtn: { marginTop: 16, backgroundColor: '#059669', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 30 },
  doneBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  idleCard: {
    margin: 16, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
    elevation: 1, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  idleEmoji: { fontSize: 36, marginBottom: 10 },
  idleTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  idleHint: { fontSize: 13, color: '#94A3B8' },

  actions: { paddingHorizontal: 16, gap: 10, marginTop: 16 },
  btnPrimary: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', elevation: 3, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  btnOutline: { borderRadius: 16, paddingVertical: 15, alignItems: 'center', borderWidth: 2, backgroundColor: '#FFFFFF' },
  btnOutlineText: { fontWeight: '700', fontSize: 15 },

  previewCard: {
    margin: 16, marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6,
  },
  previewTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 14 },
  previewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 10 },
  previewPosBadge: { width: 24, height: 24, backgroundColor: '#F1F5F9', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  previewPos: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  previewNum: { width: 58, fontSize: 14, fontWeight: '800', color: '#0F172A' },
  previewName: { flex: 1, fontSize: 14, color: '#475569' },
  previewWaitBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  previewWait: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  previewMore: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 12 },

  resetBtn: { marginHorizontal: 16, marginTop: 12, padding: 13, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF5F5' },
  resetText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
});
