import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_KEY = '@visionsnap:api_key';
const HISTORY_KEY = '@visionsnap:history';

export async function getApiKey() {
  try {
    return await AsyncStorage.getItem(API_KEY_KEY);
  } catch {
    return null;
  }
}

export async function saveApiKey(key) {
  try {
    await AsyncStorage.setItem(API_KEY_KEY, key);
  } catch (e) {
    console.error('Failed to save API key:', e);
  }
}

export async function getScanHistory() {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveScanHistory(history) {
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}
