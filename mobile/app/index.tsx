import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../constants/Colors';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarded').then((v) => setOnboarded(v === 'true'));
  }, []);

  if (!isLoaded || onboarded === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (isSignedIn) return <Redirect href="/(tabs)" />;
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(auth)/sign-in" />;
}
