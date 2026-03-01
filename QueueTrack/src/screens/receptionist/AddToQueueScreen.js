import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import * as SMS from 'expo-sms';
import { useQueue } from '../../context/QueueContext';
import { buildSmsBody, formatWait } from '../../utils/helpers';

export default function AddToQueueScreen({ route, navigation }) {
  const { mode } = route.params;
  const { state, dispatch, getWaitingQueue } = useQueue();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);

  const isRestaurant = mode === 'restaurant';
  const primaryColor = isRestaurant ? '#E85D04' : '#0077B6';
  const settings = state.settings[mode];
  const waitingQueue = getWaitingQueue(mode);
  const position = waitingQueue.length + 1;
  const estimatedWait = position * (settings?.avgWaitMinutes || 15);
  const availableDoctors = (settings?.doctors || []).filter((d) => d.available);

  const validate = () => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter the customer name.'); return false; }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 7) { Alert.alert('Required', 'Please enter a valid phone number.'); return false; }
    if (!isRestaurant && availableDoctors.length === 0) { Alert.alert('No Doctors Available', 'Please mark at least one doctor as available in Settings before adding patients.'); return false; }
    if (!isRestaurant && !selectedDoctor) { Alert.alert('Required', 'Please select a doctor for this patient.'); return false; }
    return true;
  };

  const addAndSendSms = async () => {
    if (!validate()) return;
    setLoading(true);

    dispatch({
      type: 'ADD_TO_QUEUE',
      payload: { mode, customer: { name: name.trim(), phone: phone.trim(), doctor: selectedDoctor?.name || null } },
    });

    const counter = (state.counters[mode] || 0) + 1;
    const prefix = isRestaurant ? 'R' : 'H';
    const queueNumber = `${prefix}${String(counter).padStart(3, '0')}`;
    const fakeCustomer = { name: name.trim(), phone: phone.trim(), queueNumber, doctor: selectedDoctor?.name || null };
    const smsBody = buildSmsBody(fakeCustomer, mode, position, estimatedWait, settings);

    try {
      const available = await SMS.isAvailableAsync();
      if (available) await SMS.sendSMSAsync([phone.trim()], smsBody);
    } catch (_) {}

    setLoading(false);
    Alert.alert(
      '✅ Added Successfully',
      `${name.trim()} added to queue.\n\nQueue Number: ${queueNumber}\nPosition: #${position}\nEst. Wait: ${formatWait(estimatedWait)}`,
      [{ text: 'Done', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Top Stats Banner */}
          <View style={[styles.banner, { backgroundColor: primaryColor }]}>
            <View style={styles.bannerItem}>
              <Text style={styles.bannerNum}>{position}</Text>
              <Text style={styles.bannerKey}>Position</Text>
            </View>
            <View style={styles.bannerDivider} />
            <View style={styles.bannerItem}>
              <Text style={styles.bannerNum}>{formatWait(estimatedWait)}</Text>
              <Text style={styles.bannerKey}>Est. Wait</Text>
            </View>
            <View style={styles.bannerDivider} />
            <View style={styles.bannerItem}>
              <Text style={styles.bannerNum}>{waitingQueue.length}</Text>
              <Text style={styles.bannerKey}>In Queue</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isRestaurant ? 'Customer Details' : 'Patient Details'}
            </Text>
            <Text style={styles.formHint}>
              Fill in the details below. An SMS will be sent after adding.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 555 000 0000"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>

            {!isRestaurant && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Assign Doctor</Text>
                {availableDoctors.length === 0 ? (
                  <View style={styles.noDocBox}>
                    <Text style={styles.noDocText}>No doctors available right now</Text>
                  </View>
                ) : (
                  <View style={styles.doctorGrid}>
                    {availableDoctors.map((d) => {
                      const selected = selectedDoctor?.id === d.id;
                      return (
                        <TouchableOpacity
                          key={d.id}
                          style={[styles.doctorChip, selected && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                          onPress={() => setSelectedDoctor(d)}
                        >
                          <Text style={[styles.doctorName, selected && { color: '#fff' }]}>
                            👨‍⚕️ {d.name}
                          </Text>
                          <Text style={[styles.doctorSpec, selected && { color: 'rgba(255,255,255,0.8)' }]}>
                            {d.specialty}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]}
              onPress={addAndSendSms}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>
                {loading ? 'Adding to Queue…' : '＋  Add & Send SMS'}
              </Text>
            </TouchableOpacity>

            <View style={styles.smsNote}>
              <Text style={styles.smsNoteText}>
                📱 An SMS from <Text style={styles.smsNoteName}>{settings?.businessName || (isRestaurant ? 'Our Restaurant' : 'Our Hospital')}</Text> with queue details will be sent to the customer's phone.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingBottom: 40 },
  banner: { flexDirection: 'row', paddingVertical: 22, paddingHorizontal: 20, justifyContent: 'space-around', alignItems: 'center' },
  bannerItem: { alignItems: 'center' },
  bannerNum: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  bannerKey: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3, fontWeight: '500' },
  bannerDivider: { width: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.25)' },
  formCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  formTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  formHint: { fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 18 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0F172A',
  },
  noDocBox: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, alignItems: 'center' },
  noDocText: { color: '#92400E', fontSize: 13, fontWeight: '500' },
  doctorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  doctorChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  doctorName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  doctorSpec: { fontSize: 11, color: '#94A3B8' },
  submitBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  smsNote: { marginTop: 14, backgroundColor: '#F0F9FF', borderRadius: 10, padding: 12 },
  smsNoteText: { fontSize: 12, color: '#0369A1', lineHeight: 17, textAlign: 'center' },
  smsNoteName: { fontWeight: '700' },
});
