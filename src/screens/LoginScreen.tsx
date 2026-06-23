import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert('No pudimos iniciar sesión', e?.message ?? 'Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Estacionate</Text>
        <Text style={styles.subtitle}>
          Avisá cuándo liberás tu lugar y encontrá estacionamiento cerca tuyo.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title="Continuar con Google"
          icon="G"
          onPress={handleGoogle}
          loading={loading}
        />

        <Text style={styles.terms}>
          Al continuar aceptás los Términos y la Política de privacidad.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 22,
  },
  actions: {
    paddingBottom: 24,
  },
  terms: {
    marginTop: 20,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
