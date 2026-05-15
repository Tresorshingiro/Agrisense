import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { HistoryCard } from '../../components/HistoryCard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useApi } from '../../hooks/useApi';
import { useHistory } from '../../hooks/useHistory';
import { getCurrentSeason, getSeasonLabel } from '../../utils/season';

const CROPS = ['Maize', 'Sorghum', 'Cassava', 'Wheat', 'Potatoes', 'Sweet potatoes', 'Soybeans', 'Yams'];

const NATIONAL_AVG: Record<string, number> = {
  Maize: 2000, Sorghum: 1200, Cassava: 9000, Wheat: 1500,
  Potatoes: 8000, 'Sweet potatoes': 7000, Soybeans: 1800, Yams: 6000,
};

const DEEP      = '#1a4a2e';
const MUTED_G   = '#7db88a';
const STATS_LBL = '#7a9a7f';
const BG        = '#f5f7f2';
const CARD_BDR  = '#c8d4c4';

type Tab = 'predict' | 'history';

export default function YieldScreen() {
  const [tab, setTab] = useState<Tab>('predict');
  const api = useApi();
  const history = useHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [crop, setCrop] = useState(CROPS[0]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [rainfall, setRainfall] = useState(1000);
  const [avgTemp, setAvgTemp] = useState(22);
  const [pesticides, setPesticides] = useState('');
  const [cropModalVisible, setCropModalVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => { if (tab === 'history') history.load(true); }, [tab]);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const { data } = await api.post<{ yield_kg_ha: number }>('/api/yield', {
        year: Number(year) || new Date().getFullYear(),
        rainfall_mm: rainfall,
        pesticides_tonnes: Number(pesticides) || 0,
        avg_temp: avgTemp,
        area: 'Rwanda',
        crop,
      });
      setResult(data.yield_kg_ha);
    } catch (e: any) {
      // show inline error instead of Alert
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const nationalAvg = NATIONAL_AVG[crop] ?? 2000;
  const ratio = result ? Math.min(result / (nationalAvg * 1.5), 1) : 0;
  const pctVsAvg = result ? (((result - nationalAvg) / nationalAvg) * 100).toFixed(0) : '0';
  const above = result ? result >= nationalAvg : false;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Unified dark green header + tabs */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Ionicons name="trending-up" size={20} color={MUTED_G} />
          <Text style={styles.headerTitleText}>Yield prediction</Text>
        </View>
        <View style={styles.tabRow}>
          <TouchableOpacity style={styles.tab} onPress={() => setTab('predict')}>
            <Text style={[styles.tabText, tab === 'predict' && styles.tabTextActive]}>Predict</Text>
            <View style={[styles.tabUnderline, tab === 'predict' && styles.tabUnderlineActive]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => setTab('history')}>
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History</Text>
            <View style={[styles.tabUnderline, tab === 'history' && styles.tabUnderlineActive]} />
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'predict' ? (
        <ScrollView
          style={{ backgroundColor: BG }}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          {result !== null ? (
            /* ── Result card ── */
            <View>
              <View style={styles.resultCard}>
                <View style={styles.resultBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={DEEP} />
                  <Text style={styles.resultBadgeText}>Prediction complete</Text>
                </View>
                <Text style={styles.resultCrop}>{crop}</Text>
                <Text style={styles.resultValue}>{result.toLocaleString()}</Text>
                <Text style={styles.resultUnit}>kg / ha</Text>
                <Text style={styles.resultTonnes}>{(result / 1000).toFixed(2)} tonnes/ha</Text>

                <View style={styles.avgRow}>
                  <Text style={styles.avgLabel}>vs Rwanda avg ({nationalAvg.toLocaleString()} kg/ha)</Text>
                  <Text style={[styles.avgBadge, { color: above ? '#2d7a3a' : '#c0392b' }]}>
                    {above ? '+' : ''}{pctVsAvg}%
                  </Text>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${ratio * 100}%` as any, backgroundColor: above ? '#2d7a3a' : '#c0392b' }]} />
                </View>

                <View style={styles.seasonPill}>
                  <Ionicons name="leaf-outline" size={12} color={MUTED_G} />
                  <Text style={styles.seasonText}>{getSeasonLabel(getCurrentSeason())}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => { setResult(null); setPesticides(''); }}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={18} color={DEEP} />
                <Text style={styles.resetBtnText}>New prediction</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Form ── */
            <>
              {/* Crop */}
              <Text style={styles.sectionLabel}>Crop</Text>
              <TouchableOpacity
                style={styles.selectCard}
                onPress={() => setCropModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectValue}>{crop}</Text>
                <Ionicons name="chevron-down" size={16} color={STATS_LBL} />
              </TouchableOpacity>

              {/* Year */}
              <Text style={styles.sectionLabel}>Year</Text>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.inputCardText}
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                  placeholder={String(new Date().getFullYear())}
                  placeholderTextColor="#b0c4b0"
                />
              </View>

              {/* Rainfall slider */}
              <View style={styles.sliderHeader}>
                <Text style={styles.sectionLabel}>Rainfall</Text>
                <View style={styles.sliderValueRow}>
                  <Text style={styles.sliderNum}>{rainfall}</Text>
                  <Text style={styles.sliderUnit}>mm/year</Text>
                </View>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={500}
                maximumValue={2000}
                step={10}
                value={rainfall}
                onValueChange={setRainfall}
                minimumTrackTintColor={DEEP}
                maximumTrackTintColor="#dde8d8"
                thumbTintColor={DEEP}
              />

              {/* Avg temperature slider */}
              <View style={[styles.sliderHeader, { marginTop: 6 }]}>
                <Text style={styles.sectionLabel}>Avg temperature</Text>
                <View style={styles.sliderValueRow}>
                  <Text style={styles.sliderNum}>{avgTemp}</Text>
                  <Text style={styles.sliderUnit}>°C</Text>
                </View>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={15}
                maximumValue={30}
                step={0.5}
                value={avgTemp}
                onValueChange={setAvgTemp}
                minimumTrackTintColor={DEEP}
                maximumTrackTintColor="#dde8d8"
                thumbTintColor={DEEP}
              />

              {/* Pesticides */}
              <Text style={[styles.sectionLabel, { marginTop: 6 }]}>Pesticides</Text>
              <View style={styles.inputCardRow}>
                <TextInput
                  style={[styles.inputCardText, { flex: 1 }]}
                  value={pesticides}
                  onChangeText={setPesticides}
                  keyboardType="numeric"
                  placeholder="Enter amount…"
                  placeholderTextColor="#b0c4b0"
                />
                <Text style={styles.inputSuffix}>tonnes</Text>
              </View>

              {/* Area (readonly) */}
              <Text style={styles.sectionLabel}>Area</Text>
              <View style={styles.areaCard}>
                <Text style={styles.areaName}>Rwanda</Text>
                <View style={styles.areaDetected}>
                  <Ionicons name="locate" size={14} color="#3b6d11" />
                  <Text style={styles.areaDetectedText}>Auto-detected</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabled]}
                onPress={handlePredict}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Predict yield</Text>
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
            : history.yields.length === 0
            ? (
              <View style={styles.emptyBox}>
                <Ionicons name="trending-up-outline" size={44} color="#c8dfc9" />
                <Text style={styles.emptyText}>No yield predictions yet.</Text>
                <Text style={styles.emptyHint}>Run your first prediction to see results here.</Text>
              </View>
            )
            : history.yields.map((item) => (
              <HistoryCard
                key={item.id}
                type="yield"
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              />
            ))
          }
        </ScrollView>
      )}

      {/* Crop picker modal */}
      <Modal visible={cropModalVisible} transparent animationType="slide" onRequestClose={() => setCropModalVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setCropModalVisible(false)} activeOpacity={1}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select crop</Text>
            {CROPS.map((c) => (
              <TouchableOpacity
                key={c}
                style={styles.modalOption}
                onPress={() => { setCrop(c); setResult(null); setCropModalVisible(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalOptionText, c === crop && styles.modalOptionActive]}>{c}</Text>
                {c === crop && <Ionicons name="checkmark" size={16} color={DEEP} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DEEP },

  // Unified header + tabs
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
  sectionLabel: { fontSize: 11, fontWeight: '500', color: STATS_LBL, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 7 },

  // Crop selector card
  selectCard: {
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: CARD_BDR,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
  },
  selectValue: { fontSize: 14, fontWeight: '500', color: DEEP },

  // Text input card
  inputCard: {
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: CARD_BDR,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 14,
  },
  inputCardRow: {
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: CARD_BDR,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    flexDirection: 'row', alignItems: 'baseline', gap: 6,
    marginBottom: 14,
  },
  inputCardText: { fontSize: 14, fontWeight: '500', color: DEEP, padding: 0 },
  inputSuffix: { fontSize: 11, color: STATS_LBL },

  // Sliders
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  sliderValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  sliderNum: { fontSize: 16, fontWeight: '500', color: DEEP },
  sliderUnit: { fontSize: 11, color: STATS_LBL },
  slider: { width: '100%', height: 32, marginBottom: 4, marginHorizontal: -2 },

  // Area card
  areaCard: {
    backgroundColor: '#eaf3de', borderWidth: 0.5, borderColor: '#c0da90',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  areaName: { fontSize: 14, fontWeight: '500', color: '#27500a' },
  areaDetected: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  areaDetectedText: { fontSize: 11, color: '#3b6d11' },

  // Submit button
  submitBtn: {
    backgroundColor: DEEP, borderRadius: 14, paddingVertical: 13,
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
  resultCrop: { fontSize: 12, fontWeight: '500', color: STATS_LBL, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  resultValue: { fontSize: 40, fontWeight: '700', color: DEEP, lineHeight: 44 },
  resultUnit: { fontSize: 14, color: STATS_LBL, marginBottom: 2 },
  resultTonnes: { fontSize: 13, color: STATS_LBL, marginBottom: 16 },
  avgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  avgLabel: { fontSize: 12, color: STATS_LBL, flex: 1 },
  avgBadge: { fontSize: 14, fontWeight: '700' },
  barBg: { height: 4, backgroundColor: '#dde8d8', borderRadius: 2, overflow: 'hidden', marginBottom: 14 },
  barFill: { height: 4, borderRadius: 2 },
  seasonPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: DEEP, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  seasonText: { fontSize: 11, fontWeight: '500', color: '#fff' },

  // Reset button
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

  // Crop picker modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e2e8df', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: DEEP, marginBottom: 12 },
  modalOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: '#e8ede6',
  },
  modalOptionText: { fontSize: 14, color: '#5f7a5f' },
  modalOptionActive: { color: DEEP, fontWeight: '600' },
});
