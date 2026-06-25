import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        {/* El SplashScreen del RootNavigator se mantiene hasta que la sesión y
            las fuentes Inter estén listas, evitando un flash con la tipografía
            del sistema. */}
        <RootNavigator fontsReady={fontsLoaded} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
