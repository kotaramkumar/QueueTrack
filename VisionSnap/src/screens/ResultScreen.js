import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORY_META = {
  leaf:             { icon: '🍃', color: '#4CAF50', label: 'Leaf' },
  tree:             { icon: '🌳', color: '#2E7D32', label: 'Tree' },
  vegetable:        { icon: '🥦', color: '#8BC34A', label: 'Vegetable' },
  food:             { icon: '🍽️', color: '#FF9800', label: 'Food' },
  public_figure:    { icon: '👤', color: '#2196F3', label: 'Public Figure' },
  historical_place: { icon: '🏛️', color: '#9C27B0', label: 'Historical Place' },
  country_flag:     { icon: '🚩', color: '#F44336', label: 'Country' },
  world_map:        { icon: '🗺️', color: '#00BCD4', label: 'Map Region' },
  animal:           { icon: '🐾', color: '#FF7043', label: 'Animal' },
  car:              { icon: '🚗', color: '#42A5F5', label: 'Vehicle' },
  object:           { icon: '📦', color: '#607D8B', label: 'Object' },
};

export default function ResultScreen({ route, navigation }) {
  const { result, imageUri } = route.params;
  const meta = CATEGORY_META[result?.category] || CATEGORY_META.object;
  const { data } = result;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Scan Result</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Image */}
        {!!imageUri && (
          <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" />
        )}

        {/* Category badge */}
        <View style={[styles.badge, { backgroundColor: meta.color + '22', borderColor: meta.color + '66' }]}>
          <Text style={styles.badgeIcon}>{meta.icon}</Text>
          <Text style={[styles.badgeLabel, { color: meta.color }]}>{meta.label}</Text>
          <Text style={styles.badgeSep}>·</Text>
          <Text style={[styles.badgeConf, { color: meta.color + 'BB' }]}>
            {result.confidence} confidence
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.resultTitle}>{result.title}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Category-specific data */}
        {renderCategoryData(result.category, data)}

      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Rendering helpers ─────────────────────────── */

function renderCategoryData(category, data) {
  if (!data) return null;
  switch (category) {
    case 'leaf':
      return <>
        <InfoRow icon="🌿" label="Plant Name" value={data.plant_name} />
        <InfoRow icon="📋" label="Leaf Type" value={data.leaf_type} />
        <ListCard icon="✨" label="Characteristics" items={data.characteristics} />
        <ListCard icon="💊" label="Medicinal Uses" items={data.medicinal_uses} />
        <InfoRow icon="🌍" label="Ecological Importance" value={data.ecological_importance} multiline />
      </>;

    case 'tree':
      return <>
        <InfoRow icon="🌲" label="Tree Name" value={data.tree_name} />
        <InfoRow icon="🔬" label="Scientific Name" value={data.scientific_name} italic />
        <InfoRow icon="📏" label="Average Height" value={data.average_height} />
        <InfoRow icon="🌍" label="Geographic Origin" value={data.geographic_origin} />
        <InfoRow icon="⏳" label="Lifespan" value={data.lifespan} />
        <InfoRow icon="♻️" label="Environmental Importance" value={data.environmental_importance} multiline />
        <ListCard icon="🔧" label="Uses" items={data.uses} />
      </>;

    case 'vegetable':
      return <>
        <InfoRow icon="🌿" label="Vegetable" value={data.name} />
        <InfoRow icon="🔬" label="Scientific Name" value={data.scientific_name} italic />
        <InfoRow icon="📊" label="Nutritional Value" value={data.nutritional_value} multiline />
        <InfoRow icon="🔥" label="Calories per 100g" value={data.calories_per_100g} />
        <ListCard icon="💪" label="Health Benefits" items={data.health_benefits} />
        <ListCard icon="👨‍🍳" label="Common Uses" items={data.common_uses} />
        <InfoRow icon="🧊" label="Storage Tips" value={data.storage_tips} multiline />
      </>;

    case 'food':
      return <>
        <InfoRow icon="📝" label="Description" value={data.description} multiline />
        <InfoRow icon="🔥" label="Estimated Calories" value={data.estimated_calories} />
        <NutritionCard data={data.nutritional_breakdown} />
        <ListCard icon="💚" label="Health Benefits" items={data.health_benefits} />
        <InfoRow icon="⚖️" label="Suggested Portion" value={data.suggested_portion_size} />
      </>;

    case 'public_figure':
      return <>
        <InfoRow icon="💼" label="Profession" value={data.profession} />
        <InfoRow icon="🌍" label="Nationality" value={data.nationality} />
        <InfoRow icon="🎂" label="Born" value={data.born} />
        {!!data.died && <InfoRow icon="🕊️" label="Died" value={data.died} />}
        <InfoRow icon="⭐" label="Known For" value={data.known_for} multiline />
        <ListCard icon="🏆" label="Achievements" items={data.achievements} />
        <InfoRow icon="📖" label="Biography" value={data.biography_summary} multiline />
        {!!data.note && <NoteCard text={data.note} />}
      </>;

    case 'historical_place':
      return <>
        <InfoRow icon="📍" label="Location" value={data.location} />
        <InfoRow icon="🏗️" label="Built" value={data.built} />
        {!!data.architectural_style && (
          <InfoRow icon="🎨" label="Architectural Style" value={data.architectural_style} />
        )}
        <InfoRow icon="⭐" label="Significance" value={data.significance} multiline />
        <ListCard icon="📜" label="Historical Facts" items={data.historical_facts} />
        {!!data.visitor_info && (
          <InfoRow icon="🎫" label="Visitor Info" value={data.visitor_info} multiline />
        )}
      </>;

    case 'country_flag':
      return <>
        <InfoRow icon="🏛️" label="Capital" value={data.capital} />
        <InfoRow icon="👥" label="Population" value={data.population} />
        <InfoRow icon="📐" label="Area" value={data.area} />
        <InfoRow icon="💰" label="Currency" value={data.currency} />
        <InfoRow
          icon="🗣️"
          label="Official Language(s)"
          value={Array.isArray(data.official_language) ? data.official_language.join(', ') : data.official_language}
        />
        <InfoRow icon="🚩" label="Flag Symbolism" value={data.flag_symbolism} multiline />
        <ListCard icon="💡" label="Interesting Facts" items={data.interesting_facts} />
      </>;

    case 'world_map':
      return <>
        <InfoRow icon="🗺️" label="Region" value={data.region} />
        <ListCard icon="🌍" label="Countries Visible" items={data.countries_visible} />
        <ListCard icon="⛰️" label="Geographic Features" items={data.geographic_features} />
        <ListCard icon="💡" label="Interesting Facts" items={data.interesting_facts} />
      </>;

    case 'animal':
      return <>
        <InfoRow icon="🐾" label="Common Name" value={data.common_name} />
        <InfoRow icon="🔬" label="Scientific Name" value={data.scientific_name} italic />
        <InfoRow icon="🦁" label="Animal Type" value={data.animal_type} />
        <InfoRow icon="🌿" label="Habitat" value={data.habitat} multiline />
        <InfoRow icon="🍖" label="Diet" value={data.diet} />
        <InfoRow icon="⏳" label="Lifespan" value={data.lifespan} />
        <InfoRow icon="🛡️" label="Conservation Status" value={data.conservation_status} />
        <ListCard icon="💡" label="Fun Facts" items={data.fun_facts} />
      </>;

    case 'car':
      return <>
        <InfoRow icon="🏭" label="Make" value={data.make} />
        <InfoRow icon="🚗" label="Model" value={data.model} />
        <InfoRow icon="📅" label="Year" value={data.year} />
        <InfoRow icon="🚙" label="Body Type" value={data.body_type} />
        <InfoRow icon="⚙️" label="Engine Type" value={data.engine_type} />
        <InfoRow icon="🌍" label="Country of Origin" value={data.country_of_origin} />
        <ListCard icon="⭐" label="Notable Features" items={data.notable_features} />
        <ListCard icon="💡" label="Fun Facts" items={data.fun_facts} />
      </>;

    default: // object
      return <>
        <InfoRow icon="📝" label="Description" value={data.description} multiline />
        {!!data.category_detail && <InfoRow icon="🏷️" label="Category" value={data.category_detail} />}
        <ListCard icon="🔧" label="Uses" items={data.uses} />
        <ListCard icon="💡" label="Interesting Facts" items={data.interesting_facts} />
      </>;
  }
}

function InfoRow({ icon, label, value, multiline, italic }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{icon}  {label}</Text>
      <Text style={[styles.infoValue, italic && styles.italic, multiline && styles.multiline]}>
        {value || '—'}
      </Text>
    </View>
  );
}

function ListCard({ icon, label, items }) {
  if (!items?.length) return null;
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{icon}  {label}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.listRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function NutritionCard({ data }) {
  if (!data) return null;
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>🍽️  Nutritional Breakdown</Text>
      <View style={styles.nutritionRow}>
        <NutriItem label="Carbs" value={data.carbohydrates} color="#FF9800" />
        <NutriItem label="Protein" value={data.protein} color="#2196F3" />
        <NutriItem label="Fats" value={data.fats} color="#F44336" />
      </View>
    </View>
  );
}

function NutriItem({ label, value, color }) {
  return (
    <View style={styles.nutriItem}>
      <View style={[styles.nutriBar, { backgroundColor: color }]} />
      <Text style={[styles.nutriValue, { color }]}>{value || '—'}</Text>
      <Text style={styles.nutriLabel}>{label}</Text>
    </View>
  );
}

function NoteCard({ text }) {
  return (
    <View style={styles.noteCard}>
      <Text style={styles.noteText}>ℹ️  {text}</Text>
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────── */

const BG = '#0D0D1A';
const CARD = '#1A1A2E';
const BORDER = '#2A2A4A';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 16, paddingBottom: 40, gap: 12 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: CARD,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  backArrow: { color: '#FFFFFF', fontSize: 20, lineHeight: 24 },
  topBarTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  badgeIcon: { fontSize: 14 },
  badgeLabel: { fontSize: 13, fontWeight: '700' },
  badgeSep: { color: '#444466', fontSize: 13 },
  badgeConf: { fontSize: 12 },

  resultTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
  },

  divider: { height: 1, backgroundColor: BORDER },

  // Info cards
  infoCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 6,
  },
  infoLabel: {
    color: '#7777AA',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: { color: '#DDDDEE', fontSize: 15 },
  italic: { fontStyle: 'italic' },
  multiline: { lineHeight: 23 },

  // List
  listRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  bullet: { color: '#6C63FF', fontSize: 16, lineHeight: 23 },
  listText: { color: '#CCCCEE', fontSize: 14, lineHeight: 22, flex: 1 },

  // Nutrition
  nutritionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  nutriItem: { alignItems: 'center', gap: 6 },
  nutriBar: { width: 44, height: 6, borderRadius: 3 },
  nutriValue: { fontSize: 14, fontWeight: '700' },
  nutriLabel: { color: '#7777AA', fontSize: 12 },

  // Note
  noteCard: {
    backgroundColor: '#12122A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3A3A6A',
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
  },
  noteText: { color: '#AAAACC', fontSize: 13, lineHeight: 20 },
});
