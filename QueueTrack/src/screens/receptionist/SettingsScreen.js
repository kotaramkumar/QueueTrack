import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { useQueue } from '../../context/QueueContext';

export default function SettingsScreen({ route }) {
  const { mode } = route.params;
  const { state, dispatch } = useQueue();

  const isRestaurant = mode === 'restaurant';
  const primaryColor = isRestaurant ? '#E85D04' : '#0077B6';
  const settings = state.settings[mode];

  const [businessName, setBusinessName] = useState(settings?.businessName || '');
  const [avgWait, setAvgWait] = useState(String(settings?.avgWaitMinutes || 15));
  const [availableSeats, setAvailableSeats] = useState(String(settings?.availableSeats || 4));
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState('');

  const saveSettings = () => {
    const updates = {
      businessName: businessName.trim() || (isRestaurant ? 'Our Restaurant' : 'Our Hospital'),
      avgWaitMinutes: Math.max(1, parseInt(avgWait) || 15),
    };
    if (isRestaurant) updates.availableSeats = Math.max(0, parseInt(availableSeats) || 0);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { mode, settings: updates } });
    Alert.alert('Saved', 'Settings updated successfully.');
  };

  const toggleDoctor = (doctor) => {
    dispatch({ type: 'UPDATE_DOCTOR', payload: { id: doctor.id, available: !doctor.available } });
  };

  const addDoctor = () => {
    const name = newDoctorName.trim();
    if (!name) { Alert.alert('Required', 'Please enter a doctor name.'); return; }
    dispatch({ type: 'ADD_DOCTOR', payload: { name, specialty: newDoctorSpecialty.trim() || 'General' } });
    setNewDoctorName('');
    setNewDoctorSpecialty('');
  };

  const removeDoctor = (doctor) => {
    Alert.alert('Remove Doctor', `Remove ${doctor.name} from the list?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => dispatch({ type: 'REMOVE_DOCTOR', payload: { id: doctor.id } }) },
    ]);
  };

  const adjustSeats = (delta) => {
    setAvailableSeats((v) => String(Math.max(0, (parseInt(v) || 0) + delta)));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Section: Business Info */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{isRestaurant ? 'Restaurant Info' : 'Hospital Info'}</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{isRestaurant ? 'Restaurant Name' : 'Hospital Name'}</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder={isRestaurant ? 'My Restaurant' : 'City Hospital'}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={[styles.field, styles.fieldBorder]}>
            <Text style={styles.fieldLabel}>Average Wait Time (per customer)</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity style={styles.counterBtn} onPress={() => setAvgWait(v => String(Math.max(1, parseInt(v) - 1)))}>
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.counterValBox}>
                <Text style={styles.counterVal}>{avgWait}</Text>
                <Text style={styles.counterUnit}>minutes</Text>
              </View>
              <TouchableOpacity style={styles.counterBtn} onPress={() => setAvgWait(v => String(parseInt(v) + 1))}>
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isRestaurant && (
            <View style={[styles.field, styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>Currently Available Seats</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => adjustSeats(-1)}>
                  <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <View style={styles.counterValBox}>
                  <Text style={[styles.counterVal, { color: primaryColor }]}>{availableSeats}</Text>
                  <Text style={styles.counterUnit}>seats free</Text>
                </View>
                <TouchableOpacity style={styles.counterBtn} onPress={() => adjustSeats(1)}>
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: primaryColor }]} onPress={saveSettings}>
            <Text style={styles.saveBtnText}>Save Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Doctor Availability (Hospital) */}
        {!isRestaurant && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Doctor Availability</Text>
              <Text style={styles.sectionHint}>Toggle availability · Swipe to remove</Text>
            </View>
            <View style={styles.card}>
              {settings?.doctors?.map((doctor, index) => (
                <View
                  key={doctor.id}
                  style={[styles.doctorRow, index < (settings?.doctors?.length ?? 0) - 1 && styles.doctorBorder]}
                >
                  <View style={[styles.doctorIcon, { backgroundColor: doctor.available ? '#DCFCE7' : '#F1F5F9' }]}>
                    <Text style={styles.doctorEmoji}>👨‍⚕️</Text>
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    <Text style={styles.doctorSpec}>{doctor.specialty}</Text>
                  </View>
                  <View style={styles.doctorToggleGroup}>
                    <Text style={[styles.availLabel, { color: doctor.available ? '#059669' : '#94A3B8' }]}>
                      {doctor.available ? 'Available' : 'Off Duty'}
                    </Text>
                    <Switch
                      value={doctor.available}
                      onValueChange={() => toggleDoctor(doctor)}
                      trackColor={{ false: '#E2E8F0', true: '#059669' }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#E2E8F0"
                    />
                  </View>
                  <TouchableOpacity style={styles.doctorDeleteBtn} onPress={() => removeDoctor(doctor)}>
                    <Text style={styles.doctorDeleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Doctor Form */}
              <View style={[styles.addDoctorForm, settings?.doctors?.length > 0 && styles.doctorBorder]}>
                <Text style={styles.fieldLabel}>Add New Doctor</Text>
                <TextInput
                  style={styles.input}
                  value={newDoctorName}
                  onChangeText={setNewDoctorName}
                  placeholder="Doctor Name (e.g. Dr. Kumar)"
                  placeholderTextColor="#94A3B8"
                />
                <TextInput
                  style={[styles.input, { marginTop: 10 }]}
                  value={newDoctorSpecialty}
                  onChangeText={setNewDoctorSpecialty}
                  placeholder="Specialty (e.g. Cardiology)"
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity style={[styles.addDoctorBtn, { backgroundColor: primaryColor }]} onPress={addDoctor}>
                  <Text style={styles.addDoctorBtnText}>+ Add Doctor</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* About */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>About</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>Version</Text>
            <Text style={styles.aboutVal}>Queue Track v1.0</Text>
          </View>
          <View style={[styles.aboutRow, styles.fieldBorder]}>
            <Text style={styles.aboutKey}>Platform</Text>
            <Text style={styles.aboutVal}>Expo Go</Text>
          </View>
          <View style={[styles.aboutRow, styles.fieldBorder]}>
            <Text style={styles.aboutKey}>Mode</Text>
            <Text style={styles.aboutVal}>{isRestaurant ? 'Restaurant' : 'Hospital'}</Text>
          </View>
          <Text style={styles.aboutNote}>
            Customers can track their queue by entering their queue number or phone number in the Customer view.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingBottom: 32 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionHint: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  card: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 18,
    elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6,
    overflow: 'hidden',
  },
  field: { paddingHorizontal: 16, paddingVertical: 16 },
  fieldBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0F172A',
  },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  counterBtn: {
    width: 42, height: 42, backgroundColor: '#F1F5F9', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  counterBtnText: { fontSize: 24, fontWeight: '600', color: '#334155', lineHeight: 26 },
  counterValBox: { alignItems: 'center', minWidth: 80 },
  counterVal: { fontSize: 32, fontWeight: '900', color: '#0F172A' },
  counterUnit: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  saveBtn: { margin: 16, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },

  doctorRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  doctorBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  doctorIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  doctorEmoji: { fontSize: 22 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  doctorSpec: { fontSize: 12, color: '#64748B', marginTop: 2 },
  doctorToggleGroup: { alignItems: 'flex-end', gap: 3 },
  availLabel: { fontSize: 11, fontWeight: '600' },
  doctorDeleteBtn: { marginLeft: 8, width: 28, height: 28, borderRadius: 8, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  doctorDeleteText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  addDoctorForm: { padding: 16 },
  addDoctorBtn: { marginTop: 12, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  addDoctorBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  aboutKey: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  aboutVal: { fontSize: 14, color: '#0F172A', fontWeight: '600' },
  aboutNote: { fontSize: 12, color: '#94A3B8', paddingHorizontal: 16, paddingBottom: 16, lineHeight: 18 },
});
