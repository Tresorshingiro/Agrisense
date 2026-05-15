import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import type { FertilizerItem, YieldItem, MapItem } from '../hooks/useHistory';

type PType = 'fertilizer' | 'yield' | 'map';
type Item = FertilizerItem | YieldItem | MapItem;

interface Props { type: PType; item: Item; expanded: boolean; onToggle: () => void }

function title(type: PType, item: Item): string {
  if (type === 'fertilizer') { const i = item as FertilizerItem; return `${i.cropType} → ${i.result}`; }
  if (type === 'yield') { const i = item as YieldItem; return `${i.crop} · ${i.predictedYield.toFixed(0)} kg/ha`; }
  const i = item as MapItem;
  return i.district ? `Map · ${i.district}` : `Map · ${i.latitude.toFixed(3)}, ${i.longitude.toFixed(3)}`;
}

const ICON: Record<PType, React.ComponentProps<typeof Ionicons>['name']> = {
  fertilizer: 'flask-outline',
  yield: 'trending-up-outline',
  map: 'map-outline',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const SCORE_LABEL = (s: number) => s >= 2 ? 'HIGH' : s >= 1 ? 'MED' : 'LOW';
const SCORE_COLOR = (s: number) => s >= 2 ? Colors.badgeHigh : s >= 1 ? Colors.badgeMedium : Colors.badgeLow;

const HIDDEN_KEYS = new Set(['id', 'userId', 'createdAt', '_type']);

function MapDetails({ item }: { item: MapItem }) {
  const crops: [string, number][] = [
    ['Maize', item.maizeScore],
    ['Beans', item.beansScore],
    ['Irish Potato', item.irishPotatoScore],
    ['Sorghum', item.sorghumScore],
    ['Cassava', item.cassavaScore],
  ];
  return (
    <View style={mapStyles.container}>
      {item.district && (
        <Text style={styles.detail}><Text style={styles.key}>District: </Text>{item.district}</Text>
      )}
      <Text style={styles.detail}>
        <Text style={styles.key}>Location: </Text>
        {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
      </Text>
      <View style={mapStyles.scoreGrid}>
        {crops.map(([label, score]) => (
          <View key={label} style={mapStyles.scoreChip}>
            <Text style={mapStyles.cropName}>{label}</Text>
            <Text style={[mapStyles.badge, { color: SCORE_COLOR(score) }]}>{SCORE_LABEL(score)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function HistoryCard({ type, item, expanded, onToggle }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onToggle} activeOpacity={0.8}>
      <View style={styles.row}>
        <Ionicons name={ICON[type]} size={24} color={Colors.primary} style={styles.icon} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{title(type, item)}</Text>
          <Text style={styles.date}>{fmtDate((item as any).createdAt)}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textSecondary} />
      </View>
      {expanded && (
        <View style={styles.details}>
          {type === 'map' ? (
            <MapDetails item={item as MapItem} />
          ) : (
            (Object.entries(item) as [string, unknown][])
              .filter(([k]) => !HIDDEN_KEYS.has(k))
              .map(([k, v]) => (
                <Text key={k} style={styles.detail}>
                  <Text style={styles.key}>{k}: </Text>{String(v)}
                </Text>
              ))
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 12 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  date: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  details: { marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  detail: { fontSize: 13, color: Colors.textPrimary, marginBottom: 4 },
  key: { fontWeight: '600', color: Colors.textSecondary },
});

const mapStyles = StyleSheet.create({
  container: { gap: 6 },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  scoreChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border },
  cropName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  badge: { fontSize: 11, fontWeight: '700' },
});
