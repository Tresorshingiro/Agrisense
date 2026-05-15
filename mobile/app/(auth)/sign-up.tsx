import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignUp, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

const DEEP      = '#1a4a2e';
const MUTED_G   = '#7db88a';
const STATS_LBL = '#7a9a7f';
const BG        = '#f5f7f2';
const CARD_BDR  = '#c8d4c4';

const ROLES: {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  desc: string;
}[] = [
  { id: 'farmer',             icon: 'leaf-outline',      title: 'Farmer',             desc: 'Manage your crops, yields, and soil health monitoring' },
  { id: 'agronomist',         icon: 'analytics-outline', title: 'Agronomist',         desc: 'Provide expert consultation and analyze regional field data' },
  { id: 'government_planner', icon: 'business-outline',  title: 'Government Planner', desc: 'Oversee food security metrics and regional allocation planning' },
];

type Step = 'register' | 'role' | 'verify';

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [step, setStep]               = useState<Step>('register');
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [code, setCode]               = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const otpInputRef = useRef<TextInput>(null);

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => { WebBrowser.coolDownAsync(); };
  }, []);

  useEffect(() => {
    if (code.length === 6) handleVerify(code);
  }, [code]);

  const handleContinue = () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('All fields are required.'); return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.'); return;
    }
    setError('');
    setStep('role');
  };

  const handleRoleSelect = async (role: string) => {
    if (!isLoaded) return;
    setSelectedRole(role);
    setLoading(true);
    setError('');
    try {
      const [firstName, ...rest] = name.trim().split(' ');
      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName,
        lastName: rest.join(' ') || undefined,
        unsafeMetadata: { role },
      });

      if (signUp.status === 'complete' && signUp.createdSessionId) {
        await setActive({ session: signUp.createdSessionId });
        router.replace('/(tabs)');
        return;
      }

      if (signUp.unverifiedFields.includes('email_address')) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setStep('verify');
        return;
      }

      setError('Sign up incomplete. Please try signing in.');
    } catch (e: any) {
      setError(e.errors?.[0]?.longMessage ?? e.errors?.[0]?.message ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (otp: string) => {
    if (!isLoaded || otp.length < 6) return;
    setLoading(true);
    setError('');
    try {
      await signUp.attemptEmailAddressVerification({ code: otp });
      if (signUp.status === 'complete' && signUp.createdSessionId) {
        await setActive({ session: signUp.createdSessionId });
        router.replace('/(tabs)');
      } else {
        setError('Verification failed. Please try again.');
        setCode('');
      }
    } catch (e: any) {
      setError(e.errors?.[0]?.longMessage ?? 'Invalid code. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setError('');
    } catch {
      setError('Could not resend code. Try again.');
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      const { createdSessionId, setActive: sa } = await startSSOFlow({ strategy: 'oauth_google' });
      if (createdSessionId && sa) {
        await sa({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch {
      setError('Google sign-in failed. Please try again.');
    }
  };

  // ── Shared back button ──
  const BackButton = ({ onPress }: { onPress: () => void }) => (
    <TouchableOpacity style={styles.backBtn} onPress={onPress}>
      <Ionicons name="arrow-back" size={18} color={DEEP} />
    </TouchableOpacity>
  );

  // ── Shared brand mark ──
  const Brand = () => (
    <View style={styles.brand}>
      <View style={styles.logoBox}>
        <Ionicons name="leaf" size={22} color={MUTED_G} />
      </View>
      <Text style={styles.logoText}>AgriSense</Text>
    </View>
  );

  // ── Verify step ──
  if (step === 'verify') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton onPress={() => { setStep('role'); setCode(''); setError(''); }} />
          <Brand />

          <View style={styles.verifyIcon}>
            <Ionicons name="mail" size={28} color={DEEP} />
          </View>
          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.sub}>
            We sent a 6-digit code to{'\n'}
            <Text style={{ color: DEEP, fontWeight: '600' }}>{email.trim()}</Text>
          </Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.otpRow} onPress={() => otpInputRef.current?.focus()} activeOpacity={1}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={[
                styles.otpBox,
                code.length === i && styles.otpBoxCursor,
                code[i] !== undefined && styles.otpBoxFilled,
              ]}>
                <Text style={styles.otpDigit}>{code[i] ?? ''}</Text>
              </View>
            ))}
          </TouchableOpacity>
          <TextInput
            ref={otpInputRef}
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            style={styles.hiddenInput}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, (loading || code.length < 6) && styles.disabled]}
            onPress={() => handleVerify(code)}
            disabled={loading || code.length < 6}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Verify email</Text>}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Didn't receive it? </Text>
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.link}>Resend code</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Role step ──
  if (step === 'role') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <BackButton onPress={() => { setStep('register'); setError(''); setSelectedRole(''); }} />
          <Brand />

          <Text style={styles.heading}>Choose your role</Text>
          <Text style={styles.sub}>Select your primary activity on the platform.</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.roleCard, selectedRole === r.id && styles.roleCardActive]}
              onPress={() => handleRoleSelect(r.id)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={[styles.roleIconBox, selectedRole === r.id && styles.roleIconBoxActive]}>
                <Ionicons name={r.icon} size={20} color={selectedRole === r.id ? '#fff' : DEEP} />
              </View>
              <View style={styles.roleInfo}>
                <Text style={[styles.roleTitle, selectedRole === r.id && { color: DEEP }]}>{r.title}</Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </View>
              {loading && selectedRole === r.id
                ? <ActivityIndicator color={DEEP} size="small" />
                : selectedRole === r.id
                  ? <Ionicons name="checkmark-circle" size={20} color={DEEP} />
                  : <Ionicons name="chevron-forward" size={16} color={CARD_BDR} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Register step ──
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton onPress={() => router.replace('/onboarding')} />
          <Brand />

          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.sub}>Join Rwanda's smart farming platform.</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.fieldLabel}>Full name</Text>
          <View style={styles.inputCard}>
            <Ionicons name="person-outline" size={16} color={STATS_LBL} />
            <TextInput style={styles.inputText} value={name} onChangeText={setName}
              placeholder="Jean Habimana" placeholderTextColor="#b0c4b0" autoCapitalize="words" />
          </View>

          <Text style={styles.fieldLabel}>Email address</Text>
          <View style={styles.inputCard}>
            <Ionicons name="mail-outline" size={16} color={STATS_LBL} />
            <TextInput style={styles.inputText} value={email} onChangeText={setEmail}
              placeholder="you@example.com" placeholderTextColor="#b0c4b0"
              keyboardType="email-address" autoCapitalize="none" />
          </View>

          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputCard}>
            <Ionicons name="lock-closed-outline" size={16} color={STATS_LBL} />
            <TextInput style={styles.inputText} value={password} onChangeText={setPassword}
              placeholder="Min. 8 characters" placeholderTextColor="#b0c4b0"
              secureTextEntry={!showPw} />
            <TouchableOpacity onPress={() => setShowPw(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={16} color={STATS_LBL} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} activeOpacity={0.85}>
            <Ionicons name="logo-google" size={18} color="#4285F4" />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
              <Text style={styles.link}>Sign in</Text>
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
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
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

  // Role cards
  roleCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: CARD_BDR,
    borderRadius: 14, padding: 16, marginBottom: 12, gap: 12,
  },
  roleCardActive: { borderColor: DEEP, borderWidth: 1.5, backgroundColor: '#f0f9f2' },
  roleIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#eaf3de', justifyContent: 'center', alignItems: 'center',
  },
  roleIconBoxActive: { backgroundColor: DEEP },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 3 },
  roleDesc: { fontSize: 12, color: STATS_LBL, lineHeight: 17 },

  // OTP verify
  verifyIcon: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: '#eaf3de', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 28, marginTop: 8 },
  otpBox: {
    width: 46, height: 56, borderRadius: 12,
    borderWidth: 1.5, borderColor: CARD_BDR, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  otpBoxCursor: { borderColor: DEEP, borderWidth: 2 },
  otpBoxFilled: { borderColor: DEEP, backgroundColor: '#f0f9f2' },
  otpDigit: { fontSize: 22, fontWeight: '600', color: DEEP },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
