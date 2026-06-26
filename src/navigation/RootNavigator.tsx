import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../hooks/useOnboarding';
import { colors, fontFamily } from '../theme';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ReservationsScreen } from '../screens/ReservationsScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * Flujo sin sesión: el login es la base y, la primera vez que se abre la app,
 * el onboarding se muestra como overlay encima. Al cerrarlo, queda el login.
 */
function AuthGate() {
  const { loading, seen, markSeen } = useOnboarding();
  return (
    <View style={{ flex: 1 }}>
      <LoginScreen />
      {!loading && !seen && <OnboardingScreen onClose={markSeen} />}
    </View>
  );
}

type Props = {
  /** true cuando las fuentes Inter terminaron de cargar. */
  fontsReady?: boolean;
};

export function RootNavigator({ fontsReady = true }: Props) {
  const { user, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const ready = !loading && fontsReady;

  return (
    <View style={{ flex: 1 }}>
      {ready && (
        <NavigationContainer>
          {user ? (
            <Stack.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.text,
                headerTitleStyle: { fontFamily: fontFamily.extraBold, fontWeight: '800' },
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Mi perfil' }}
              />
              <Stack.Screen
                name="Reservations"
                component={ReservationsScreen}
                options={{ title: 'Mis reservas' }}
              />
            </Stack.Navigator>
          ) : (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login" component={AuthGate} />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      )}

      {!splashDone && (
        <SplashScreen ready={ready} onFinish={() => setSplashDone(true)} />
      )}
    </View>
  );
}
