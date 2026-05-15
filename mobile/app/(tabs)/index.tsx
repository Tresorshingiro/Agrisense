import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { HistoryCard } from '../../components/HistoryCard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useHistory, FertilizerItem, YieldItem, MapItem } from '../../hooks/useHistory';
import { getCurrentSeason } from '../../utils/season';

// Design tokens matching the reference mockup
const DEEP       = '#1a4a2e';
const MUTED_G    = '#7db88a';
const DIM_G      = '#c8dfc9';
const STATS_LBL  = '#7a9a7f';
const DIVIDER_C  = '#e8ede6';
const LIGHT_ACT  = '#e8f5c8';
const LIGHT_BDR  = '#c8e08a';
const LIGHT_TXT  = '#27500a';
const LIGHT_SUB  = '#639922';
const ICON_BG    = '#eaf3de';
const ICON_CLR   = '#3b6d11';
const CARD_BDR   = '#e2e8df';
const BG         = '#f5f7f2';

type AnyItem = (FertilizerItem | YieldItem | MapItem) & { _type: 'fertilizer' | 'yield' | 'map' };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const SEASON_RANGE: Record<string, string> = {
  A: 'Sep – Jan · Season A',
  B: 'Mar – Jun · Season B',
  C: 'Jul – Aug · Season C',
};
const SEASON_CROPS: Record<string, string> = {
  A: 'Ideal for maize and Irish potato',
  B: 'Ideal for beans, sorghum & maize',
  C: 'Focus on irrigation crops',
};
const SEASON_LABEL: Record<string, string> = {
  A: 'Season A', B: 'Season B', C: 'Season C',
};


export default function Dashboard() {
  const { user } = useUser();
  const history = useHistory();
  const [expanded, setExpanded] = useState<string | null>(null);
  const season = getCurrentSeason();

  useFocusEffect(
    useCallback(() => {
      history.load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const recent: AnyItem[] = [
    ...history.fertilizer.map((i) => ({ ...i, _type: 'fertilizer' as const })),
    ...history.yields.map((i) => ({ ...i, _type: 'yield' as const })),
    ...history.map.map((i) => ({ ...i, _type: 'map' as const })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const total = history.fertilizer.length + history.yields.length + history.map.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={history.loading} onRefresh={() => history.load(true)} tintColor={MUTED_G} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Unified dark green header ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreetLabel}>{getGreeting().toUpperCase()}</Text>
              <Text style={styles.headerName}>{user?.firstName ?? 'Farmer'}</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.seasonPill}>
                <Ionicons name="leaf-outline" size={12} color={MUTED_G} />
                <Text style={styles.seasonPillText}>{SEASON_LABEL[season] ?? 'Season B'}</Text>
              </View>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.firstName?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tipRow}>
            <Ionicons name="calendar-outline" size={16} color={MUTED_G} style={{ flexShrink: 0 }} />
            <View>
              <Text style={styles.tipRange}>{SEASON_RANGE[season]}</Text>
              <Text style={styles.tipCrops}>{SEASON_CROPS[season]}</Text>
            </View>
          </View>
        </View>

        {/* ── Offline banner ── */}
        {history.isOffline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={14} color="#92400E" />
            <Text style={styles.offlineText}>
              Offline — last synced {history.lastUpdated ? new Date(history.lastUpdated).toLocaleTimeString() : 'unknown'}
            </Text>
          </View>
        )}

        {/* ── Main content ── */}
        <View style={styles.content}>

          {/* Stats — single unified card */}
          {history.loading ? (
            <LoadingSkeleton width="100%" height={70} borderRadius={16} style={{ marginBottom: 20 }} />
          ) : (
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{total}</Text>
                <Text style={styles.statLabel}>Predictions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{history.fertilizer.length}</Text>
                <Text style={styles.statLabel}>Fertilizer</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{history.yields.length}</Text>
                <Text style={styles.statLabel}>Yield</Text>
              </View>
            </View>
          )}

          {/* Quick actions label */}
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

          {/* Action cards — symmetric */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionCard, styles.actionDark]} onPress={() => router.push('/(tabs)/fertilizer')} activeOpacity={0.85}>
              <View style={styles.actionIconBoxDark}>
                <Ionicons name="flask" size={18} color={MUTED_G} />
              </View>
              <Text style={styles.actionTitleDark}>Fertilizer</Text>
              <Text style={styles.actionSubDark}>Get recommendations</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, styles.actionLight]} onPress={() => router.push('/(tabs)/yield')} activeOpacity={0.85}>
              <View style={styles.actionIconBoxLight}>
                <Ionicons name="trending-up" size={18} color={ICON_CLR} />
              </View>
              <Text style={styles.actionTitleLight}>Predict Yield</Text>
              <Text style={styles.actionSubLight}>Estimate harvest</Text>
            </TouchableOpacity>
          </View>

          {/* Map CTA — flat list row */}
          <TouchableOpacity style={styles.mapRow} onPress={() => router.push('/(tabs)/map')} activeOpacity={0.8}>
            <View style={styles.mapIconBox}>
              <Ionicons name="map-outline" size={17} color={ICON_CLR} />
            </View>
            <Text style={styles.mapRowText}>Analyze crop suitability</Text>
            <Ionicons name="chevron-forward" size={16} color={STATS_LBL} />
          </TouchableOpacity>

          {/* Recent activity */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/fertilizer')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {history.loading ? (
            [0, 1, 2].map((i) => (
              <LoadingSkeleton key={i} width="100%" height={64} borderRadius={14} style={{ marginBottom: 8 }} />
            ))
          ) : recent.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="leaf-outline" size={36} color={DIVIDER_C} />
              <Text style={styles.emptyTitle}>No predictions yet</Text>
              <Text style={styles.emptyText}>Use the Fertilizer Guide or Map to get started.</Text>
            </View>
          ) : (
            recent.map((item) => (
              <HistoryCard
                key={item.id}
                type={item._type}
                item={item}
                expanded={expanded === item.id}
                onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DEEP },
  scroll: { flexGrow: 1, backgroundColor: BG, paddingBottom: 40 },

  // Header
  header: { backgroundColor: DEEP, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerGreetLabel: { fontSize: 11, color: MUTED_G, letterSpacing: 0.5, fontWeight: '500', marginBottom: 2 },
  headerName: { fontSize: 22, fontWeight: '500', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seasonPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  seasonPillText: { fontSize: 11, color: DIM_G, fontWeight: '500' },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '500', color: '#fff' },
  tipRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  tipRange: { fontSize: 11, color: MUTED_G, fontWeight: '500', marginBottom: 1 },
  tipCrops: { fontSize: 12, color: DIM_G },

  // Offline
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 10,
  },
  offlineText: { color: '#92400E', fontSize: 12, flex: 1 },

  // Content wrapper
  content: { paddingHorizontal: 16, paddingTop: 14 },

  // Stats
  statsCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 0.5, borderColor: CARD_BDR, marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: DIVIDER_C, marginVertical: 4 },
  statValue: { fontSize: 22, fontWeight: '500', color: DEEP, marginBottom: 2 },
  statLabel: { fontSize: 11, color: STATS_LBL, letterSpacing: 0.3 },

  // Section labels
  sectionLabel: {
    fontSize: 11, fontWeight: '500', color: STATS_LBL,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  seeAll: { fontSize: 11, color: LIGHT_SUB, fontWeight: '500' },

  // Action cards
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  actionCard: { flex: 1, borderRadius: 16, padding: 16 },
  actionDark: { backgroundColor: DEEP },
  actionLight: { backgroundColor: LIGHT_ACT, borderWidth: 0.5, borderColor: LIGHT_BDR },
  actionIconBoxDark: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  actionIconBoxLight: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(90,140,20,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  actionTitleDark: { fontSize: 13, fontWeight: '500', color: '#fff', marginBottom: 2 },
  actionSubDark: { fontSize: 11, color: MUTED_G },
  actionTitleLight: { fontSize: 13, fontWeight: '500', color: LIGHT_TXT, marginBottom: 2 },
  actionSubLight: { fontSize: 11, color: LIGHT_SUB },

  // Map row
  mapRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 0.5, borderColor: CARD_BDR, marginBottom: 20,
  },
  mapIconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: ICON_BG, justifyContent: 'center', alignItems: 'center',
  },
  mapRowText: { flex: 1, fontSize: 13, fontWeight: '500', color: DEEP },

  // Empty state
  emptyBox: { paddingVertical: 40, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: STATS_LBL },
  emptyText: { color: STATS_LBL, fontSize: 12, textAlign: 'center', maxWidth: 220 },
});
