import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');
const HERO_H = Math.round(H * 0.50);

const DEEP    = '#1a4a2e';
const MUTED_G = '#7db88a';

// Star positions as fractions of width + fixed y offsets
const STARS = [
  { xf: 0.118, y: 30, s: 2 },
  { xf: 0.353, y: 18, s: 2.4 },
  { xf: 0.588, y: 40, s: 1.6 },
  { xf: 0.853, y: 22, s: 2 },
  { xf: 0.912, y: 55, s: 1.4 },
  { xf: 0.176, y: 70, s: 1.6 },
  { xf: 0.47,  y: 60, s: 1.2 },
  { xf: 0.72,  y: 80, s: 1.8 },
];

async function markOnboarded() {
  await AsyncStorage.setItem('onboarded', 'true');
}

export default function Onboarding() {
  const insets = useSafeAreaInsets();

  const handleGetStarted = async () => {
    await markOnboarded();
    router.replace('/(auth)/sign-up');
  };

  const handleSignIn = async () => {
    await markOnboarded();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP} />

      {/* ── Hero illustration ── */}
      <View style={[styles.hero, { height: HERO_H }]}>

        {/* Stars */}
        {STARS.map((s, i) => (
          <View
            key={i}
            style={[styles.star, {
              left: s.xf * W,
              top: s.y + insets.top,
              width: s.s,
              height: s.s,
              borderRadius: s.s / 2,
            }]}
          />
        ))}

        {/* Moon crescent (two overlapping circles) */}
        <View style={[styles.moonOuter, { top: insets.top + 32 }]} />
        <View style={[styles.moonInner, { top: insets.top + 26 }]} />

        {/* Rolling hills — back to front */}
        <View style={styles.hillBack} />
        <View style={styles.hillMid} />
        <View style={styles.hillFore}>
          {/* Crop field rows */}
          {[0, 1, 2, 3].map((i) => (
            <View key={`rl-${i}`} style={[styles.cropLine, { top: 18 + i * 9, left: 10, width: '43%', opacity: 0.7 - i * 0.1 }]} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <View key={`rr-${i}`} style={[styles.cropLine, { top: 14 + i * 9, left: '54%', width: '40%', opacity: 0.7 - i * 0.1 }]} />
          ))}
          {/* Maize plant stems */}
          {[0.23, 0.41, 0.59, 0.77].map((xf, i) => (
            <View key={`p-${i}`} style={[styles.plantStem, { left: xf * W - 1 }]} />
          ))}
        </View>

        {/* Logo — top center */}
        <View style={[styles.logoRow, { top: insets.top + 20 }]}>
          <View style={styles.logoBox}>
            <Ionicons name="leaf" size={17} color={MUTED_G} />
          </View>
          <Text style={styles.logoText}>AgriSense</Text>
        </View>

        {/* Floating data card — bottom-left of hero */}
        <View style={styles.dataCard}>
          <Text style={styles.dataCardSeason}>SEASON B ACTIVE</Text>
          <Text style={styles.dataCardCrop}>Maize · Loamy</Text>
          <Text style={styles.dataCardDistrict}>Ruhango District</Text>
        </View>
      </View>

      {/* ── Bottom sheet ── */}
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}>

        {/* Heading */}
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>Smart farming starts with{'\n'}the right data</Text>
          <Text style={styles.subheading}>
            ML-powered crop advisory for Rwanda's{'\n'}farmers, agronomists, and planners.
          </Text>
        </View>

        {/* Feature pills */}
        <View style={styles.pillsRow}>
          {[
            { icon: 'flask' as const,      label: 'Fertilizer AI' },
            { icon: 'trending-up' as const, label: 'Yield prediction' },
            { icon: 'map' as const,         label: 'Crop mapping' },
          ].map(({ icon, label }) => (
            <View key={label} style={styles.pill}>
              <Ionicons name={icon} size={13} color="#3b6d11" />
              <Text style={styles.pillText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* CTA buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleGetStarted} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Get started</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleSignIn} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>Sign in</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.powered}>Powered by Rwanda Agri-Tech Initiative</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DEEP },

  // Hero
  hero: { width: '100%', backgroundColor: DEEP, overflow: 'hidden' },

  star: { position: 'absolute', backgroundColor: MUTED_G, opacity: 0.55 },

  // Moon crescent
  moonOuter: {
    position: 'absolute', right: W * 0.12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#2d6e47', opacity: 0.5,
  },
  moonInner: {
    position: 'absolute', right: W * 0.12 - 10,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: DEEP,
  },

  // Hills
  hillBack: {
    position: 'absolute', bottom: 56, left: -20, right: -20,
    height: 140,
    borderTopLeftRadius: W * 0.55, borderTopRightRadius: W * 0.45,
    backgroundColor: '#0d3318', opacity: 0.85,
  },
  hillMid: {
    position: 'absolute', bottom: 34, left: -10, right: -10,
    height: 115,
    borderTopLeftRadius: W * 0.45, borderTopRightRadius: W * 0.6,
    backgroundColor: '#143d24',
  },
  hillFore: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 82,
    borderTopLeftRadius: W * 0.28, borderTopRightRadius: W * 0.38,
    backgroundColor: DEEP, overflow: 'hidden',
  },

  // Crop field rows (inside hillFore)
  cropLine: {
    position: 'absolute', height: 1.5,
    backgroundColor: '#2d6e47', borderRadius: 1,
  },

  // Maize plant stems (inside hillFore)
  plantStem: {
    position: 'absolute', bottom: 18,
    width: 2, height: 28,
    backgroundColor: '#3b8a50', borderRadius: 1, opacity: 0.85,
  },

  // Logo
  logoRow: {
    position: 'absolute', alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  logoBox: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 0.5, borderColor: 'rgba(125,184,138,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { fontSize: 15, fontWeight: '500', color: '#fff', letterSpacing: 0.3 },

  // Floating data card
  dataCard: {
    position: 'absolute', bottom: 44, left: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    width: 140,
  },
  dataCardSeason: { fontSize: 9, color: MUTED_G, fontWeight: '500', letterSpacing: 0.5, marginBottom: 3 },
  dataCardCrop: { fontSize: 13, color: '#fff', fontWeight: '500', marginBottom: 2 },
  dataCardDistrict: { fontSize: 9, color: '#a8c8a0' },

  // Bottom sheet
  sheet: {
    flex: 1, backgroundColor: '#f5f7f2',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 24, paddingTop: 28,
  },

  headingBlock: { alignItems: 'center', marginBottom: 24 },
  heading: {
    fontSize: 24, fontWeight: '500', color: DEEP,
    textAlign: 'center', lineHeight: 33, marginBottom: 10,
  },
  subheading: {
    fontSize: 14, color: '#5f7a5f',
    textAlign: 'center', lineHeight: 22,
  },

  // Feature pills
  pillsRow: {
    flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap',
    gap: 8, marginBottom: 28,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#eaf3de', borderWidth: 0.5, borderColor: '#c0da90',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  pillText: { fontSize: 11, fontWeight: '500', color: '#27500a' },

  // Buttons
  buttons: { gap: 10, marginBottom: 16 },
  primaryBtn: {
    backgroundColor: DEEP, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  primaryBtnText: { fontSize: 15, fontWeight: '500', color: '#fff' },
  secondaryBtn: {
    borderWidth: 1, borderColor: '#c8d4c4', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '500', color: DEEP },

  powered: {
    fontSize: 10, color: '#a0b8a0', textAlign: 'center',
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
});
