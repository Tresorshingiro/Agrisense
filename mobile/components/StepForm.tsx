import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface Props {
  steps: React.ReactNode[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  loading?: boolean;
}

export function StepForm({ steps, currentStep, onNext, onBack, onSubmit, loading }: Props) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const pct = ((currentStep + 1) / steps.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.stepLabel}>Step {currentStep + 1} of {steps.length}</Text>
      <View style={styles.content}>{steps[currentStep]}</View>
      <View style={styles.nav}>
        {!isFirst && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, isFirst && styles.grow]}
          onPress={isLast ? onSubmit : onNext}
          disabled={loading}
        >
          <Text style={styles.nextText}>{isLast ? (loading ? 'Submitting…' : 'Submit') : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 6 },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  stepLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginBottom: 20 },
  content: { flex: 1 },
  nav: { flexDirection: 'row', gap: 12, paddingTop: 16 },
  backBtn: { flex: 1, height: 48, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  backText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
  nextBtn: { flex: 2, height: 48, borderRadius: 8, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  grow: { flex: 1 },
  nextText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
