import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useHistory } from '../../hooks/useHistory';
import { getCurrentSeason, getSeasonLabel } from '../../utils/season';

const DEEP      = '#1a4a2e';
const MUTED_G   = '#7db88a';
const STATS_LBL = '#7a9a7f';
const BG        = '#f5f7f2';
const CARD_BDR  = '#e2e8de';

const SEASON_RANGE: Record<string, string> = {
  A: 'Sep–Jan', B: 'Mar–Jun', C: 'Jul–Aug',
};

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { fertilizer, yields, map, load } = useHistory();
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      setUploadingPhoto(true);
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      await user?.setProfileImage({ file: blob });
    } catch {
      Alert.alert('Upload failed', 'Could not update profile photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  useFocusEffect(useCallback(() => { load(true); }, []));

  const name    = user?.firstName ?? user?.fullName ?? 'User';
  const email   = user?.primaryEmailAddress?.emailAddress ?? '—';
  const role    = (user?.unsafeMetadata?.role as string | undefined) ?? 'User';
  const season  = getCurrentSeason();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const total   = fertilizer.length + yields.length + map.length;

  const seasonLabel = `${getSeasonLabel(season)} · ${SEASON_RANGE[season] ?? ''}`;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* Unified dark green header with avatar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto} activeOpacity={0.8}>
          <View style={styles.avatar}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.cameraBtn}>
            {uploadingPhoto
              ? <ActivityIndicator size={10} color="#fff" />
              : <Ionicons name="camera" size={11} color="#fff" />}
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{role}</Text>
            </View>
            <Text style={styles.seasonText}>{seasonLabel}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ backgroundColor: BG }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Activity */}
        <Text style={styles.sectionLabel}>Activity</Text>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Predictions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{fertilizer.length}</Text>
            <Text style={styles.statLabel}>Fertilizer</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{yields.length}</Text>
            <Text style={styles.statLabel}>Yield</Text>
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="mail-outline" size={16} color={STATS_LBL} />
              <Text style={styles.rowLabel}>Email</Text>
            </View>
            <Text style={styles.rowValue} numberOfLines={1}>{email}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <View style={styles.rowLeft}>
              <Ionicons name="shield-outline" size={16} color={STATS_LBL} />
              <Text style={styles.rowLabel}>Role</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{role}</Text>
            </View>
          </View>
        </View>

        {/* App */}
        <Text style={styles.sectionLabel}>App</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="pricetag-outline" size={16} color={STATS_LBL} />
              <Text style={styles.rowLabel}>Version</Text>
            </View>
            <Text style={styles.rowValue}>{version}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <View style={styles.rowLeft}>
              <Ionicons name="information-circle-outline" size={16} color={STATS_LBL} />
              <Text style={styles.rowLabel}>About</Text>
            </View>
            <Text style={styles.rowValue}>Rwanda AgriSense</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} disabled={signingOut} activeOpacity={0.8}>
          {signingOut ? (
            <ActivityIndicator color="#a32d2d" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={16} color="#a32d2d" />
              <Text style={styles.signOutText}>Sign out</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DEEP },

  // Header
  header: {
    backgroundColor: DEEP, paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 24,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#2d6e47',
    borderWidth: 2, borderColor: MUTED_G,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 54, height: 54, borderRadius: 27 },
  avatarText: { fontSize: 20, fontWeight: '500', color: '#fff' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: DEEP, borderWidth: 1.5, borderColor: MUTED_G,
    justifyContent: 'center', alignItems: 'center',
  },
  name: { fontSize: 18, fontWeight: '500', color: '#fff', marginBottom: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rolePill: {
    backgroundColor: 'rgba(125,184,138,0.15)',
    borderWidth: 0.5, borderColor: 'rgba(125,184,138,0.3)',
    borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3,
  },
  rolePillText: { fontSize: 11, color: MUTED_G },
  seasonText: { fontSize: 11, color: MUTED_G },

  // Content
  scroll: { padding: 16, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 11, fontWeight: '500', color: STATS_LBL,
    letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 10,
  },

  // Stats card (same pattern as dashboard)
  statsCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 0.5, borderColor: CARD_BDR, marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: CARD_BDR, marginVertical: 4 },
  statValue: { fontSize: 22, fontWeight: '500', color: DEEP, marginBottom: 3 },
  statLabel: { fontSize: 11, color: STATS_LBL },

  // Info cards
  card: {
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: CARD_BDR,
    borderRadius: 14, overflow: 'hidden', marginBottom: 16,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: CARD_BDR,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { fontSize: 13, color: '#5f7a5f' },
  rowValue: { fontSize: 12, color: DEEP, maxWidth: '58%', textAlign: 'right' },
  roleBadge: {
    backgroundColor: '#eaf3de', borderWidth: 0.5, borderColor: '#c0da90',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
  },
  roleBadgeText: { fontSize: 12, color: '#27500a', textTransform: 'capitalize' },

  // Sign out
  signOutBtn: {
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#e8c4c4',
    borderRadius: 14, paddingVertical: 13,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  signOutText: { fontSize: 14, fontWeight: '500', color: '#a32d2d' },
});
