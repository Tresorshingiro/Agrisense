import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface Props { icon: React.ReactNode; value: number | string; label: string; accent?: string }

export function StatCard({ icon, value, label, accent }: Props) {
  return (
    <View style={[styles.card, accent ? { borderTopColor: accent, borderTopWidth: 3 } : null]}>
      <View style={[styles.iconBox, accent ? { backgroundColor: accent + '18' } : null]}>
        {icon}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: Colors.primaryLight,
  },
  value: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  label: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
});
