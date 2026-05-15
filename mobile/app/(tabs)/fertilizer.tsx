import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { HistoryCard } from '../../components/HistoryCard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useApi } from '../../hooks/useApi';
import { useHistory } from '../../hooks/useHistory';

const CROPS = ['Maize', 'Wheat', 'Barley', 'Cotton', 'Ground Nuts', 'Millets', 'Oil seeds', 'Paddy', 'Pulses', 'Sugarcane', 'Tobacco'];
const SOILS = ['Loamy', 'Sandy', 'Clayey', 'Black', 'Red'];

const DEEP      = '#1a4a2e';
const MUTED_G   = '#7db88a';
const STATS_LBL = '#7a9a7f';
const BG        = '#f5f7f2';
const CARD_BDR  = '#c8d4c4';

const FERTILIZER_EXPLANATIONS: Record<string, string> = {
  DAP: 'High phosphorus content supports early root development and seedling establishment.',
  Urea: 'High nitrogen content promotes rapid vegetative growth and green leaf development.',
  'NPK 17-17-17': 'Balanced N-P-K ratio supports all-round crop development across growth stages.',
  'NPK 20-10-10': 'Higher nitrogen ratio suited for crops in active vegetative growth phase.',
  MOP: 'High potassium content improves drought resistance and fruit/grain quality.',
  TSP: 'Triple superphosphate accelerates root growth and early crop establishment.',
  CAN: 'Calcium ammonium nitrate provides balanced nitrogen with soil pH buffering.',
  '10-26-26': 'Low nitrogen with high phosphorus and potassium supports root crops and grain filling.',
  '14-35-14': 'High phosphorus formulation ideal for establishing root systems at planting.',
  '28-28': 'Equal nitrogen and phosphorus blend supports balanced early-season growth.',
};

function getExplanation(fertilizer: string): string {
  return FERTILIZER_EXPLANATIONS[fertilizer] ?? `${fertilizer} is recommended based on your soil and crop profile.`;
}

function ChipGrid({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={chipStyles.grid}>
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          style={[chipStyles.chip, value === o && chipStyles.active]}
          onPress={() => onChange(o)}
          activeOpacity={0.75}
        >
          <Text style={[chipStyles.text, value === o && chipStyles.activeText]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 20 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 0.5, borderColor: CARD_BDR, backgroundColor: '#fff',
  },
  active: { backgroundColor: DEEP, borderColor: DEEP },
  text: { fontSize: 12, color: '#5f7a5f' },
  activeText: { color: '#fff', fontWeight: '500' },
});

type Tab = 'new' | 'history';

export default function FertilizerScreen() {
  const [tab, setTab] = useState<Tab>('new');
  const api = useApi();
  const history = useHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [crop, setCrop] = useState(CROPS[0]);
  const [soil, setSoil] = useState(SOILS[0]);
  const [temp, setTemp] = useState('25');
  const [humidity, setHumidity] = useState('60');
  const [moisture, setMoisture] = useState('40');
  const [nitrogen, setNitrogen] = useState('');
  const [phosphorous, setPhosphorous] = useState('');
  const [potassium, setPotassium] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { if (tab === 'history') history.load(true); }, [tab]);

  const handleSubmit = async () => {
    if (!nitrogen.trim() || !phosphorous.trim() || !potassium.trim()) {
      setError('Please enter values for Nitrogen, Phosphorous, and Potassium.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<{ fertilizer: string }>('/api/fertilizer', {
        temperature: Number(temp) || 25,
        humidity: Number(humidity) || 60,
        moisture: Number(moisture) || 40,
        soil_type: soil,
        crop_type: crop,
        nitrogen: Number(nitrogen),
        phosphorous: Number(phosphorous),
        potassium: Number(potassium),
      });
      setResult(data.fertilizer);
    } catch (e: any) {
      if (!e.response) {
        setError('Cannot reach server. Make sure the backend is running and your IP is correct.');
      } else {
        setError(e.response?.data?.error ?? 'Prediction failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null); setError('');
    setCrop(CROPS[0]); setSoil(SOILS[0]);
    setTemp('25'); setHumidity('60'); setMoisture('40');
    setNitrogen(''); setPhosphorous(''); setPotassium('');
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* Unified dark green header + tabs */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Ionicons name="flask" size={20} color={MUTED_G} />
          <Text style={styles.headerTitleText}>Fertilizer guide</Text>
        </View>
        <View style={styles.tabRow}>
          <TouchableOpacity style={styles.tab} onPress={() => setTab('new')}>
            <Text style={[styles.tabText, tab === 'new' && styles.tabTextActive]}>New analysis</Text>
            <View style={[styles.tabUnderline, tab === 'new' && styles.tabUnderlineActive]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => setTab('history')}>
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History</Text>
            <View style={[styles.tabUnderline, tab === 'history' && styles.tabUnderlineActive]} />
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'new' ? (
        <ScrollView
          style={{ backgroundColor: BG }}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          {result ? (
            <View>
              <View style={styles.resultCard}>
                <View style={styles.resultBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={DEEP} />
                  <Text style={styles.resultBadgeText}>Recommendation Ready</Text>
                </View>
                <Text style={styles.resultName}>{result}</Text>
                <Text style={styles.resultExplanation}>{getExplanation(result)}</Text>
                <View style={styles.npkRow}>
                  {[
                    { label: 'N', val: nitrogen, sub: 'Nitrogen' },
                    { label: 'P', val: phosphorous, sub: 'Phosphorous' },
                    { label: 'K', val: potassium, sub: 'Potassium' },
                  ].map(({ label, val, sub }) => (
                    <View key={label} style={styles.npkChip}>
                      <Text style={styles.npkSymbol}>{label}</Text>
                      <Text style={styles.npkVal}>{val || '—'}</Text>
                      <Text style={styles.npkSub}>{sub}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={styles.resetBtn} onPress={resetForm} activeOpacity={0.8}>
                <Ionicons name="refresh-outline" size={18} color={DEEP} />
                <Text style={styles.resetBtnText}>New Analysis</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {!!error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Crop type */}
              <Text style={styles.sectionLabel}>Crop type</Text>
              <ChipGrid options={CROPS} value={crop} onChange={setCrop} />

              {/* Soil type */}
              <Text style={styles.sectionLabel}>Soil type</Text>
              <ChipGrid options={SOILS} value={soil} onChange={setSoil} />

              {/* Environmental conditions */}
              <Text style={styles.sectionLabel}>Environmental conditions</Text>
              <View style={styles.row3}>
                {[
                  { label: 'Temp', value: temp, setter: setTemp, unit: '°C', placeholder: '25' },
                  { label: 'Humidity', value: humidity, setter: setHumidity, unit: '%', placeholder: '60' },
                  { label: 'Moisture', value: moisture, setter: setMoisture, unit: '%', placeholder: '40' },
                ].map(({ label, value, setter, unit, placeholder }) => (
                  <View key={label} style={styles.col}>
                    <Text style={styles.fieldLabel}>{label}</Text>
                    <View style={styles.numCard}>
                      <TextInput
                        style={styles.numInput}
                        value={value}
                        onChangeText={setter}
                        keyboardType="numeric"
                        placeholder={placeholder}
                        placeholderTextColor="#b0c4b0"
                      />
                      <Text style={styles.numUnit}>{unit}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Soil nutrients */}
              <View style={styles.nutrientHeader}>
                <Text style={styles.sectionLabel}>Soil nutrients</Text>
                <Text style={styles.nutrientUnit}>kg/ha</Text>
              </View>
              <View style={[styles.row3, { marginBottom: 28 }]}>
                {[
                  { label: 'Nitrogen', value: nitrogen, setter: setNitrogen, placeholder: '0 – 140' },
                  { label: 'Phosphorus', value: phosphorous, setter: setPhosphorous, placeholder: '0 – 145' },
                  { label: 'Potassium', value: potassium, setter: setPotassium, placeholder: '0 – 205' },
                ].map(({ label, value, setter, placeholder }) => (
                  <View key={label} style={styles.col}>
                    <Text style={styles.fieldLabel}>{label}</Text>
                    <View style={styles.numCard}>
                      <TextInput
                        style={styles.numInput}
                        value={value}
                        onChangeText={setter}
                        keyboardType="numeric"
                        placeholder={placeholder}
                        placeholderTextColor="#b0c4b0"
                      />
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Get recommendation</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={{ backgroundColor: BG }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {history.loading
            ? [0, 1, 2].map((i) => <LoadingSkeleton key={i} width="100%" height={72} borderRadius={12} style={{ marginBottom: 10 }} />)
            : history.fertilizer.length === 0
            ? (
              <View style={styles.emptyBox}>
                <Ionicons name="flask-outline" size={44} color="#c8dfc9" />
                <Text style={styles.emptyText}>No fertilizer history yet.</Text>
                <Text style={styles.emptyHint}>Run your first analysis to see results here.</Text>
              </View>
            )
            : history.fertilizer.map((item) => (
              <HistoryCard
                key={item.id}
                type="fertilizer"
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              />
            ))
          }
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DEEP },

  // Header + tabs (unified green block)
  header: { backgroundColor: DEEP, paddingHorizontal: 20, paddingTop: 14 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  headerTitleText: { fontSize: 18, fontWeight: '500', color: '#fff' },
  tabRow: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 10 },
  tabText: { fontSize: 13, color: MUTED_G },
  tabTextActive: { color: '#fff', fontWeight: '500' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  tabUnderlineActive: { backgroundColor: MUTED_G },

  // Form
  form: { padding: 16, paddingBottom: 48 },

  // Error
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: '#B91C1C', fontSize: 13, flex: 1, lineHeight: 18 },

  // Section labels
  sectionLabel: { fontSize: 11, fontWeight: '500', color: STATS_LBL, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 10 },

  // 3-column grid
  row3: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  col: { flex: 1 },
  fieldLabel: { fontSize: 10, fontWeight: '500', color: STATS_LBL, marginBottom: 5 },

  // Number card inputs
  numCard: {
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: CARD_BDR,
    borderRadius: 10, padding: 10, alignItems: 'center',
  },
  numInput: {
    fontSize: 18, fontWeight: '500', color: DEEP,
    textAlign: 'center', padding: 0, width: '100%',
  },
  numUnit: { fontSize: 10, color: STATS_LBL, marginTop: 1 },

  // Nutrient section header
  nutrientHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 10 },
  nutrientUnit: { fontSize: 11, color: '#a0b8a0' },

  // Submit
  submitBtn: {
    backgroundColor: DEEP, borderRadius: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  disabled: { opacity: 0.65 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },

  // Result card
  resultCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    borderWidth: 0.5, borderColor: '#e2e8df', marginBottom: 16,
  },
  resultBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  resultBadgeText: { fontSize: 12, fontWeight: '600', color: DEEP, letterSpacing: 0.5 },
  resultName: { fontSize: 30, fontWeight: '700', color: '#1a1a1a', marginBottom: 10 },
  resultExplanation: { fontSize: 13, color: STATS_LBL, lineHeight: 20, marginBottom: 16 },
  npkRow: { flexDirection: 'row', gap: 10 },
  npkChip: { flex: 1, backgroundColor: Colors.primaryLight, borderRadius: 10, padding: 12, alignItems: 'center' },
  npkSymbol: { fontSize: 16, fontWeight: '700', color: DEEP, marginBottom: 2 },
  npkVal: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  npkSub: { fontSize: 10, color: STATS_LBL, marginTop: 2 },
  resetBtn: {
    height: 50, borderRadius: 14, borderWidth: 1, borderColor: CARD_BDR,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8,
    backgroundColor: '#fff',
  },
  resetBtnText: { color: DEEP, fontWeight: '600', fontSize: 14 },

  // Empty state
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: STATS_LBL, fontSize: 15, fontWeight: '600' },
  emptyHint: { color: STATS_LBL, fontSize: 13 },
});
