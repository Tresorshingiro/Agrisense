import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { SuitabilityBadge } from './SuitabilityBadge';
import { normalizeScore } from '../utils/score';
import { getCropInsights, type LocationFeatures } from '../utils/cropInsights';

const EMOJIS: Record<string, string> = {
  maize: '🌽', beans: '🫘', irish_potato: '🥔', sorghum: '🌾', cassava: '🍠',
};

interface Props {
  cropKey: string;
  score: number;
  features?: LocationFeatures;
}

export function CropCard({ cropKey, score, features }: Props) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(normalizeScore(score));
  const emoji = EMOJIS[cropKey] ?? '🌿';
  const label = cropKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const insights = features ? getCropInsights(cropKey, features) : [];
  const tappable = insights.length > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => tappable && setExpanded((e) => !e)}
      activeOpacity={tappable ? 0.75 : 1}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.info}>
          <View style={styles.row}>
            <Text style={styles.name}>{label}</Text>
            <View style={styles.rightRow}>
              <SuitabilityBadge score={score} />
              {tappable && (
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={Colors.textSecondary}
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%` }]} />
          </View>
          <Text style={styles.pct}>{pct}% suitability</Text>
        </View>
      </View>

      {expanded && insights.length > 0 && (
        <View style={styles.insights}>
          <Text style={styles.insightsTitle}>Why this score?</Text>
          {insights.map((f) => (
            <View key={f.label} style={styles.factor}>
              <Ionicons
                name={f.ok ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={f.ok ? Colors.badgeHigh : Colors.badgeLow}
                style={{ marginTop: 1 }}
              />
              <View style={{ flex: 1 }}>
                <View style={styles.factorHeader}>
                  <Text style={styles.factorLabel}>{f.label}</Text>
                  <Text style={[styles.factorValue, { color: f.ok ? Colors.badgeHigh : Colors.badgeLow }]}>
                    {f.value}
                  </Text>
                </View>
                <Text style={styles.factorReason}>{f.reason}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 28, marginRight: 12 },
  info: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rightRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  barBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  pct: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  insights: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  insightsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  factor: { flexDirection: 'row', gap: 8 },
  factorHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  factorLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  factorValue: { fontSize: 13, fontWeight: '700' },
  factorReason: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
});
