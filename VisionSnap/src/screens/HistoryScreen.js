import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';

const CATEGORY_ICONS = {
  leaf: '🍃',
  tree: '🌳',
  vegetable: '🥦',
  food: '🍔',
  public_figure: '👤',
  historical_place: '🏛️',
  country_flag: '🚩',
  world_map: '🗺️',
  object: '📦',
};

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function HistoryItem({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.75}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbIcon}>{CATEGORY_ICONS[item.category] || '📦'}</Text>
        </View>
      )}
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title || 'Unknown'}</Text>
        <Text style={styles.itemCategory}>
          {CATEGORY_ICONS[item.category] || '📦'}{' '}
          {(item.category || 'object').replace(/_/g, ' ')}
        </Text>
        <Text style={styles.itemDate}>{formatDate(item.timestamp)}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const { state } = useApp();
  const navigation = useNavigation();

  const handlePress = (item) => {
    navigation.navigate('Scan', {
      screen: 'Result',
      params: { result: item.data, imageUri: item.imageUri },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.count}>{state.scanHistory.length} scans</Text>
      </View>

      {state.scanHistory.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyText}>
            Your scan history will appear here.{'\n'}Go to Scan tab to analyze your first image!
          </Text>
        </View>
      ) : (
        <FlatList
          data={state.scanHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryItem item={item} onPress={() => handlePress(item)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const BG = '#0D0D1A';
const CARD = '#1A1A2E';
const BORDER = '#2A2A4A';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  count: { color: '#555577', fontSize: 13, marginTop: 2 },

  list: { padding: 16, gap: 10, paddingBottom: 32 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 12,
  },
  thumb: { width: 64, height: 64, borderRadius: 10 },
  thumbPlaceholder: {
    backgroundColor: '#252540',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 30 },
  itemContent: { flex: 1 },
  itemTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 3 },
  itemCategory: {
    color: '#7777AA',
    fontSize: 13,
    textTransform: 'capitalize',
    marginBottom: 3,
  },
  itemDate: { color: '#444466', fontSize: 12 },
  chevron: { color: '#444466', fontSize: 22 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 72, marginBottom: 20 },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  emptyText: { color: '#555577', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
