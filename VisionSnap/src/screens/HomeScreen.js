import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { analyzeImage } from '../services/claudeService';
import { useApp } from '../context/AppContext';

const SCAN_CATEGORIES = [
  { icon: '🍃', label: 'Leaves' },
  { icon: '🌳', label: 'Trees' },
  { icon: '🥦', label: 'Vegetables' },
  { icon: '🍔', label: 'Food' },
  { icon: '👤', label: 'People' },
  { icon: '🏛️', label: 'Places' },
  { icon: '🚩', label: 'Flags' },
  { icon: '🗺️', label: 'Maps' },
  { icon: '🐾', label: 'Animals' },
  { icon: '🚗', label: 'Cars' },
];

export default function HomeScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [previewUri, setPreviewUri] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const checkApiKey = () => {
    if (!state.apiKey) {
      Alert.alert(
        'API Key Required',
        'Add your Anthropic API key in Settings to start scanning.',
        [
          { text: 'Go to Settings', onPress: () => navigation.navigate('Settings') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return false;
    }
    return true;
  };

  const processImage = async (uri) => {
    setPreviewUri(uri);
    setIsAnalyzing(true);
    try {
      const result = await analyzeImage(uri, state.apiKey);
      const scan = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        imageUri: uri,
        category: result.category,
        title: result.title,
        data: result,
      };
      dispatch({ type: 'ADD_SCAN', payload: scan });
      navigation.navigate('Result', { result, imageUri: uri });
    } catch (error) {
      Alert.alert(
        'Analysis Failed',
        error.message || 'Could not analyze the image. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalyzing(false);
      setPreviewUri(null);
    }
  };

  const handleCamera = async () => {
    if (!checkApiKey()) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    if (!checkApiKey()) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access is needed to pick images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoEmoji}>👁️</Text>
          <Text style={styles.appName}>VisionSnap AI</Text>
          <Text style={styles.tagline}>Intelligent Image Recognition</Text>
        </View>

        {/* Viewfinder / Preview */}
        <View style={styles.viewfinderWrapper}>
          {isAnalyzing && previewUri ? (
            <View style={styles.analyzingBox}>
              <Image source={{ uri: previewUri }} style={styles.previewImage} />
              <View style={styles.analyzeOverlay}>
                <ActivityIndicator size="large" color="#6C63FF" />
                <Text style={styles.analyzingTitle}>Analyzing…</Text>
                <Text style={styles.analyzingSubtitle}>Claude AI is processing your image</Text>
              </View>
            </View>
          ) : (
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <Text style={styles.viewfinderIcon}>📸</Text>
              <Text style={styles.viewfinderText}>Scan anything around you</Text>
              <Text style={styles.viewfinderHint}>
                Leaves · Trees · Food · Veggies{'\n'}People · Places · Flags · Maps · Animals · Cars
              </Text>
            </View>
          )}
        </View>

        {/* Scan Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleCamera}
            disabled={isAnalyzing}
            activeOpacity={0.8}
          >
            <Text style={styles.btnIcon}>📷</Text>
            <Text style={styles.btnLabel}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={handleGallery}
            disabled={isAnalyzing}
            activeOpacity={0.8}
          >
            <Text style={styles.btnIcon}>🖼️</Text>
            <Text style={styles.btnLabel}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {!state.apiKey && (
          <TouchableOpacity
            style={styles.apiKeyBanner}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.apiKeyBannerText}>
              ⚠️ No API key set — tap to configure in Settings
            </Text>
          </TouchableOpacity>
        )}

        {/* Category chips */}
        <Text style={styles.sectionLabel}>Supported Categories</Text>
        <View style={styles.chipsRow}>
          {SCAN_CATEGORIES.map((c) => (
            <View key={c.label} style={styles.chip}>
              <Text style={styles.chipIcon}>{c.icon}</Text>
              <Text style={styles.chipLabel}>{c.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const PURPLE = '#6C63FF';
const BG = '#0D0D1A';
const CARD = '#1A1A2E';
const BORDER = '#2A2A4A';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 32 },

  header: { alignItems: 'center', marginBottom: 28 },
  logoEmoji: { fontSize: 52, marginBottom: 8 },
  appName: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: '#7777AA', marginTop: 4 },

  viewfinderWrapper: { marginBottom: 20 },
  viewfinder: {
    height: 230,
    backgroundColor: CARD,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: PURPLE,
  },
  cornerTL: { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  cornerTR: { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  cornerBL: { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  viewfinderIcon: { fontSize: 52, marginBottom: 12 },
  viewfinderText: { color: '#CCCCEE', fontSize: 16, fontWeight: '600' },
  viewfinderHint: { color: '#555577', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  analyzingBox: { height: 230, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  analyzeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,5,20,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzingTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  analyzingSubtitle: { color: '#AAAACC', fontSize: 13 },

  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  btnPrimary: { backgroundColor: PURPLE },
  btnSecondary: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  btnIcon: { fontSize: 20 },
  btnLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  apiKeyBanner: {
    backgroundColor: '#2A1A0A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#6A3A0A',
    marginBottom: 20,
    alignItems: 'center',
  },
  apiKeyBannerText: { color: '#FFAA44', fontSize: 13 },

  sectionLabel: {
    color: '#555577',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipIcon: { fontSize: 15 },
  chipLabel: { color: '#9999BB', fontSize: 13, fontWeight: '500' },
});
