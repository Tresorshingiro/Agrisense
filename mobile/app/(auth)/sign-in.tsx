import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

const DEEP      = '#1a4a2e';
const MUTED_G   = '#7db88a';
const STATS_LBL = '#7a9a7f';
const BG        = '#f5f7f2';
const CARD_BDR  = '#c8d4c4';

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => { WebBrowser.coolDownAsync(); };
  }, []);

  const handleSignIn = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      await setActive({ session: result.createdSessionId });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.errors?.[0]?.longMessage ?? e.errors?.[0]?.message ?? 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { createdSessionId, setActive: sa } = await startSSOFlow({ strategy: 'oauth_google' });
      if (createdSessionId && sa) {
        await sa({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/onboarding')}>
            <Ionicons name="arrow-back" size={18} color={DEEP} />
          </TouchableOpacity>

          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoBox}>
              <Ionicons name="leaf" size={22} color={MUTED_G} />
            </View>
            <Text style={styles.logoText}>AgriSense</Text>
          </View>

          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to your account.</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.fieldLabel}>Email address</Text>
          <View style={styles.inputCard}>
            <Ionicons name="mail-outline" size={16} color={STATS_LBL} />
            <TextInput
              style={styles.inputText}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#b0c4b0"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputCard}>
            <Ionicons name="lock-closed-outline" size={16} color={STATS_LBL} />
            <TextInput
              style={styles.inputText}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#b0c4b0"
              secureTextEntry={!showPw}
              autoComplete="password"
            />
            <TouchableOpacity onPress={() => setShowPw(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={16} color={STATS_LBL} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Sign in</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, googleLoading && styles.disabled]}
            onPress={handleGoogle}
            disabled={googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading
              ? <ActivityIndicator color={DEEP} size="small" />
              : <Ionicons name="logo-google" size={18} color="#4285F4" />}
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
              <Text style={styles.link}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 0.5, borderColor: CARD_BDR,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 32, alignSelf: 'flex-start',
  },

  brand: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28,
  },
  logoBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: DEEP,
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { fontSize: 18, fontWeight: '500', color: DEEP, letterSpacing: 0.3 },

  heading: { fontSize: 24, fontWeight: '500', color: DEEP, marginBottom: 5 },
  sub: { fontSize: 14, color: STATS_LBL, marginBottom: 28, lineHeight: 21 },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#B91C1C', fontSize: 13, flex: 1, lineHeight: 18 },

  fieldLabel: {
    fontSize: 11, fontWeight: '500', color: STATS_LBL,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7,
  },
  inputCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: CARD_BDR,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16,
  },
  inputText: { flex: 1, fontSize: 14, color: DEEP, padding: 0 },

  primaryBtn: {
    backgroundColor: DEEP, borderRadius: 14, paddingVertical: 15,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 4, marginBottom: 20,
  },
  disabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: CARD_BDR },
  dividerText: { fontSize: 12, color: STATS_LBL },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: CARD_BDR,
    borderRadius: 14, paddingVertical: 14, marginBottom: 28,
  },
  googleBtnText: { fontSize: 14, fontWeight: '500', color: DEEP },

  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, color: STATS_LBL },
  link: { fontSize: 14, color: DEEP, fontWeight: '600' },
});
