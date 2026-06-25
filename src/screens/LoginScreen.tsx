import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme';

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
          source={require('../../assets/trapito.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>trapito</Text>
        <Text style={styles.subtitle}>
          Encontrá estacionamiento cerca tuyo.
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
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenH,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.titleToDesc,
  },
  logo: {
    width: 180,
    height: 180,
    // El PNG tiene aire propio abajo; lo compensamos con margen negativo para
    // acercar el isotipo al nombre sin tocar la separación título↔subtítulo.
    marginBottom: -25,
  },
  title: {
    ...typography.titleLg,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  actions: {
    paddingBottom: spacing.screenH,
  },
  terms: {
    ...typography.small,
    marginTop: 20,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
