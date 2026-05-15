import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator,
  Animated, Dimensions, Alert, ScrollView, PanResponder, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { CropCard } from '../../components/CropCard';
import { Colors } from '../../constants/Colors';
import { getMapHtml } from '../../lib/arcgis-map-html';
import type { LocationFeatures } from '../../utils/cropInsights';

const { height: SCREEN_H } = Dimensions.get('window');
const API_KEY = process.env.EXPO_PUBLIC_ARCGIS_API_KEY ?? '';
const MAP_HTML = getMapHtml(API_KEY);

const DEEP = '#1a4a2e';
const MUTED_G = '#7db88a';
const DIM_G = '#a8c8a0';

const LAYER_CHIPS = [
  { key: 'soilph', label: 'Soil pH' },
  { key: 'elevation', label: 'Elevation' },
  { key: 'rainfall', label: 'Rainfall' },
] as const;

type LayerKey = typeof LAYER_CHIPS[number]['key'];

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
}

interface Suitability { maize: number; beans: number; irish_potato: number; sorghum: number; cassava: number }
interface PredictResult {
  latitude: number;
  longitude: number;
  district: string | null;
  suitability: Suitability;
  features?: LocationFeatures;
}

function FeaturePill({ label, value }: { label: string; value: string }) {
  return (
    <View style={pillStyles.pill}>
      <Text style={pillStyles.label}>{label}</Text>
      <Text style={pillStyles.value}>{value}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: { flex: 1, backgroundColor: Colors.primaryLight, borderRadius: 10, padding: 10, alignItems: 'center' },
  label: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});

function cacheKey(lat: number, lon: number) {
  return `cache:map:${lat.toFixed(4)}:${lon.toFixed(4)}`;
}

const CROP_KEYS: (keyof Suitability)[] = ['maize', 'beans', 'irish_potato', 'sorghum', 'cassava'];

export default function MapScreen() {
  const api = useApi();
  const webviewRef = useRef<WebView>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerKey | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);

  // Filter chips visibility (toggled by filter button)
  const [chipsVisible, setChipsVisible] = useState(true);

  const sheetY = useRef(new Animated.Value(SCREEN_H)).current;

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&countrycodes=rw&format=json&limit=5`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'AgriSense/1.0 tresorshingiro26@gmail.com' } });
        const data: NominatimResult[] = await res.json();
        setSearchResults(data);
        setShowResults(data.length > 0);
      } catch {
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelectResult = (item: NominatimResult) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    webviewRef.current?.injectJavaScript(`
      if(typeof view !== 'undefined') {
        view.goTo({ center: [${lon}, ${lat}], zoom: 12 });
      } true;
    `);
    const shortName = item.display_name.split(',')[0];
    setSearchQuery(shortName);
    setShowResults(false);
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) sheetY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy }) => {
        if (dy > 80) {
          hideSheet();
        } else {
          Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
        }
      },
    })
  ).current;

  const showSheet = (res: PredictResult, offline = false) => {
    setResult(res);
    setIsOffline(offline);
    setSheetVisible(true);
    Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  };

  const hideSheet = () => {
    Animated.timing(sheetY, { toValue: SCREEN_H, duration: 250, useNativeDriver: true }).start(() =>
      setSheetVisible(false)
    );
  };

  const handleLayerToggle = (key: LayerKey) => {
    const next = activeLayer === key ? null : key;
    if (activeLayer && activeLayer !== key) {
      webviewRef.current?.injectJavaScript(`window.setLayerVisible(${JSON.stringify(activeLayer)}, false); true;`);
    }
    webviewRef.current?.injectJavaScript(`window.setLayerVisible(${JSON.stringify(key)}, ${next === key}); true;`);
    setActiveLayer(next);
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    const { latitude, longitude } = JSON.parse(event.nativeEvent.data) as { latitude: number; longitude: number };
    setPredicting(true);
    try {
      const { data } = await api.post<PredictResult>('/api/map/predict', { latitude, longitude });
      await AsyncStorage.setItem(cacheKey(latitude, longitude), JSON.stringify({ data, timestamp: Date.now() }));
      showSheet(data);
    } catch {
      const cached = await AsyncStorage.getItem(cacheKey(latitude, longitude));
      if (cached) {
        showSheet(JSON.parse(cached).data, true);
      } else {
        Alert.alert('Error', 'Could not get prediction. Check your connection.');
      }
    } finally {
      setPredicting(false);
    }
  };

  const handleMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission denied', 'Location permission is required.'); return; }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = loc.coords;
    webviewRef.current?.injectJavaScript(`
      if(typeof view !== 'undefined') {
        view.goTo({ center: [${longitude}, ${latitude}], zoom: 12 });
      } true;
    `);
    setPredicting(true);
    try {
      const { data } = await api.post<PredictResult>('/api/map/predict', { latitude, longitude });
      await AsyncStorage.setItem(cacheKey(latitude, longitude), JSON.stringify({ data, timestamp: Date.now() }));
      showSheet(data);
    } catch {
      Alert.alert('Error', 'Could not get prediction for your location.');
    } finally {
      setPredicting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          {searching
            ? <ActivityIndicator size="small" color={MUTED_G} style={{ width: 15 }} />
            : <Ionicons name="search" size={15} color={MUTED_G} />}
          <TextInput
            style={styles.searchInput}
            placeholder="Search district or location…"
            placeholderTextColor={MUTED_G}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            clearButtonMode="never"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={MUTED_G} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, !chipsVisible && styles.filterBtnActive]}
          onPress={() => setChipsVisible(v => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={17} color={chipsVisible ? DIM_G : '#fff'} />
        </TouchableOpacity>
      </View>

      {/* Map + overlays */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webviewRef}
          source={{ html: MAP_HTML }}
          style={{ flex: 1 }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
        />

        {/* Layer filter chips */}
        {chipsVisible && (
          <View style={styles.filterChips}>
            {LAYER_CHIPS.map(({ key, label }) => {
              const active = activeLayer === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => handleLayerToggle(key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Use My Location button */}
        <TouchableOpacity style={styles.locationBtn} onPress={handleMyLocation} activeOpacity={0.85}>
          <Ionicons name="locate" size={16} color={MUTED_G} />
          <Text style={styles.locationBtnText}>Use my location</Text>
        </TouchableOpacity>

        {/* Loading overlay */}
        {predicting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={DEEP} size="large" />
            <Text style={styles.loadingText}>Analyzing location…</Text>
          </View>
        )}

        {/* Search results dropdown */}
        {showResults && (
          <View style={styles.resultsDropdown}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => String(item.place_id)}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.resultDivider} />}
              renderItem={({ item }) => {
                const parts = item.display_name.split(',');
                const title = parts[0].trim();
                const subtitle = parts.slice(1, 3).join(',').trim();
                return (
                  <TouchableOpacity
                    style={styles.resultRow}
                    onPress={() => handleSelectResult(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location-outline" size={16} color={MUTED_G} style={{ marginTop: 1 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultTitle} numberOfLines={1}>{title}</Text>
                      {subtitle.length > 0 && (
                        <Text style={styles.resultSubtitle} numberOfLines={1}>{subtitle}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}
      </View>

      {/* Bottom sheet */}
      {sheetVisible && result && (
        <>
          <TouchableOpacity style={styles.backdrop} onPress={hideSheet} activeOpacity={1} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
            <View style={styles.handleBar} {...panResponder.panHandlers}>
              <View style={styles.sheetHandle} />
            </View>

            <Text style={styles.sheetTitle}>
              {result.district ?? 'Selected Location'}
            </Text>
            <Text style={styles.sheetCoords}>
              {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
            </Text>
            {isOffline && <Text style={styles.offlineNote}>Showing cached result</Text>}

            {result.features && (
              <>
                <Text style={styles.sectionLabel}>SITE CONDITIONS</Text>
                <View style={styles.featuresRow}>
                  <FeaturePill label="Soil pH" value={(result.features.soil_pH / 10).toFixed(1)} />
                  <FeaturePill label="Elevation" value={`${Math.round(result.features.elevation_m)}m`} />
                  <FeaturePill label="Rainfall" value={`${Math.round(result.features.rainfall_mean_mm_month)}mm/mo`} />
                  <FeaturePill label="Org. Carbon" value={`${result.features.soil_organic_carbon} g/kg`} />
                </View>
              </>
            )}

            <Text style={styles.sectionLabel}>CROP SUITABILITY</Text>
            <ScrollView
              style={styles.cropList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              {CROP_KEYS.map((key) => (
                <CropCard key={key} cropKey={key} score={result.suitability[key]} features={result.features} />
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={hideSheet}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DEEP },

  // Search header
  header: {
    backgroundColor: DEEP, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  searchBar: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  searchInput: {
    flex: 1, fontSize: 13, color: '#fff',
    paddingVertical: 0,
  },
  filterBtn: {
    width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: DEEP,
    borderWidth: 1, borderColor: MUTED_G,
  },

  // Map container
  mapContainer: { flex: 1 },

  // Search results dropdown
  resultsDropdown: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    backgroundColor: '#fff', maxHeight: 260,
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  resultTitle: { fontSize: 13, fontWeight: '500', color: '#1a1a1a' },
  resultSubtitle: { fontSize: 11, color: '#7a9a7f', marginTop: 1 },
  resultDivider: { height: 0.5, backgroundColor: '#e8ede6', marginLeft: 42 },

  // Filter chips overlay
  filterChips: {
    position: 'absolute', top: 12, left: 56, right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 24,
    paddingVertical: 7, paddingHorizontal: 12,
    flexDirection: 'row', gap: 8,
    borderWidth: 0.5, borderColor: '#d0d8cc',
  },
  chip: {
    flex: 1, paddingVertical: 5, borderRadius: 16,
    borderWidth: 0.5, borderColor: '#c8d4c4', alignItems: 'center',
  },
  chipActive: { backgroundColor: DEEP, borderColor: DEEP },
  chipText: { fontSize: 12, color: '#5f7a5f' },
  chipTextActive: { fontSize: 12, color: '#fff', fontWeight: '500' },

  // Location button
  locationBtn: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: DEEP, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  locationBtnText: { fontSize: 13, fontWeight: '500', color: '#fff' },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  loadingText: { fontSize: 14, color: Colors.textSecondary },

  // Sheet
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 32, maxHeight: SCREEN_H * 0.80, elevation: 16,
  },
  handleBar: { paddingTop: 10, paddingBottom: 8, alignItems: 'center' },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  sheetCoords: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  offlineNote: { fontSize: 12, color: Colors.accent, marginBottom: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 8 },
  featuresRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  cropList: { flex: 1 },
  closeBtn: {
    height: 48, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  closeBtnText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 15 },
});
