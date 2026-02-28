import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
  Linking,
} from 'react-native';
import { useQueue } from '../../context/QueueContext';
import { formatTime, statusColor, statusLabel, formatWait, buildCallSmsBody } from '../../utils/helpers';
import * as SMS from 'expo-sms';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'called', label: 'Called' },
  { key: 'served', label: 'Served' },
];

const STATUS_BG = {
  waiting: '#FEF3C7',
  called: '#DCFCE7',
  served: '#F1F5F9',
};

export default function QueueListScreen({ route }) {
  const { mode } = route.params;
  const { state, dispatch, getWaitingQueue } = useQueue();
  const [filter, setFilter] = useState('all');

  const isRestaurant = mode === 'restaurant';
  const primaryColor = isRestaurant ? '#E85D04' : '#0077B6';
  const avgWait = state.settings[mode]?.avgWaitMinutes || 15;

  const allQueue = state.queues[mode] || [];
  const waitingQueue = getWaitingQueue(mode);

  const filteredQueue = filter === 'all' ? allQueue : allQueue.filter((c) => c.status === filter);

  const getCount = (key) =>
    key === 'all' ? allQueue.length : allQueue.filter((c) => c.status === key).length;

  const getPosition = (customer) => {
    if (customer.status !== 'waiting') return null;
    const idx = waitingQueue.findIndex((c) => c.id === customer.id);
    return idx === -1 ? null : idx + 1;
  };

  const deleteEntry = (customer) => {
    Alert.alert(
      'Remove from Queue',
      `Remove ${customer.name} (${customer.queueNumber}) from the queue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => dispatch({ type: 'REMOVE_FROM_QUEUE', payload: { mode, id: customer.id } }),
        },
      ]
    );
  };

  const callOnPhone = (customer) => {
    const phone = customer.phone.replace(/\s/g, '');
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Error', 'Unable to open the phone dialer.')
    );
  };

  const handleAction = (customer) => {
    const actions = [];
    if (customer.status === 'waiting') {
      actions.push({
        text: '📣 Call This Customer',
        onPress: async () => {
          dispatch({ type: 'CALL_SPECIFIC', payload: { mode, id: customer.id } });
          try {
            const available = await SMS.isAvailableAsync();
            if (available) {
              const smsBody = buildCallSmsBody(customer, mode, state.settings[mode]);
              await SMS.sendSMSAsync([customer.phone], smsBody);
            }
          } catch (_) {}
        },
      });
      if (waitingQueue.length > 1) {
        const currentPos = getPosition(customer);
        actions.push({
          text: '↕️ Change Position',
          onPress: () => {
            const posOptions = [];
            for (let i = 1; i <= waitingQueue.length; i++) {
              if (i !== currentPos) {
                posOptions.push({
                  text: `Move to Position #${i}`,
                  onPress: () => dispatch({ type: 'REORDER_QUEUE', payload: { mode, id: customer.id, newPosition: i } }),
                });
              }
            }
            posOptions.push({ text: 'Cancel', style: 'cancel' });
            setTimeout(() => {
              Alert.alert('Change Position', `${customer.name} is at Position #${currentPos}`, posOptions);
            }, 500);
          },
        });
      }
    }
    if (customer.status === 'called') {
      actions.push({
        text: '✅ Mark as Served',
        onPress: () => dispatch({ type: 'MARK_SERVED', payload: { mode, id: customer.id } }),
      });
    }
    actions.push({
      text: '📞 Call on Phone',
      onPress: () => callOnPhone(customer),
    });
    actions.push({
      text: '🗑 Remove from Queue',
      style: 'destructive',
      onPress: () => deleteEntry(customer),
    });
    actions.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(customer.name, `Queue no. ${customer.queueNumber}`, actions);
  };

  const renderItem = ({ item }) => {
    const pos = getPosition(item);
    const wait = pos !== null ? (pos - 1) * avgWait : null;
    const sColor = statusColor(item.status);
    const sBg = STATUS_BG[item.status] || '#F1F5F9';

    return (
      <View style={styles.card}>
        {/* Main row — tap for actions */}
        <TouchableOpacity
          style={styles.cardInner}
          onPress={() => handleAction(item)}
          activeOpacity={0.85}
        >
          <View style={[styles.numBadge, { backgroundColor: sColor }]}>
            <Text style={styles.numText}>{item.queueNumber}</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.customerName}>{item.name}</Text>
            <Text style={styles.customerPhone}>📱 {item.phone}</Text>
            {item.doctor && <Text style={styles.customerDoctor}>👨‍⚕️ {item.doctor}</Text>}
            <Text style={styles.addedAt}>Added at {formatTime(item.addedAt)}</Text>
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.statusBadge, { backgroundColor: sBg }]}>
              <Text style={[styles.statusText, { color: sColor }]}>{statusLabel(item.status)}</Text>
            </View>
            {pos !== null && <Text style={styles.posText}>Position #{pos}</Text>}
            {wait !== null && (
              <View style={styles.waitBadge}>
                <Text style={styles.waitText}>{formatWait(wait)}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Delete button — always visible */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteEntry(item)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.deleteBtnText}>🗑  Remove from Queue</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />

      {/* Header summary */}
      <View style={[styles.summaryBar, { backgroundColor: primaryColor }]}>
        <Text style={styles.summaryText}>
          {allQueue.length} total  ·  {waitingQueue.length} waiting  ·  {allQueue.filter(c => c.status === 'served').length} served
        </Text>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterBar}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = getCount(f.key);
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, active && { backgroundColor: primaryColor }]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, active && { color: '#FFFFFF' }]}>
                {f.label}
              </Text>
              <View style={[styles.filterCount, active && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Text style={[styles.filterCountText, active && { color: '#FFFFFF' }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredQueue}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No entries here</Text>
            <Text style={styles.emptyHint}>
              {filter === 'all' ? 'Add customers to the queue from the Dashboard.' : `No customers with "${filter}" status.`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  summaryBar: { paddingVertical: 10, paddingHorizontal: 16 },
  summaryText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },

  filterBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  filterCount: { backgroundColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  filterCountText: { fontSize: 10, fontWeight: '700', color: '#64748B' },

  list: { padding: 12, gap: 10, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6,
    overflow: 'hidden',
  },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 10 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#FEE2E2',
    backgroundColor: '#FFF5F5',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '600', color: '#EF4444' },
  numBadge: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  numText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13, textAlign: 'center' },
  cardBody: { flex: 1, gap: 2 },
  customerName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  customerPhone: { fontSize: 12, color: '#64748B' },
  customerDoctor: { fontSize: 12, color: '#475569' },
  addedAt: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  posText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  waitBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  waitText: { fontSize: 11, fontWeight: '700', color: '#D97706' },

  emptyState: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptyHint: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19 },
});
