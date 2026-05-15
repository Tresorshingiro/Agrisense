import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { getScoreLevel, normalizeScore } from '../utils/score';

interface Props { score: number }

const BG: Record<string, string> = {
  HIGH: Colors.badgeHigh,
  MEDIUM: Colors.badgeMedium,
  LOW: Colors.badgeLow,
};

export function SuitabilityBadge({ score }: Props) {
  const level = getScoreLevel(normalizeScore(score));
  return (
    <View style={[styles.pill, { backgroundColor: BG[level] }]}>
      <Text style={styles.text}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  text: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
});
