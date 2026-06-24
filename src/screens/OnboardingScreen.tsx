import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';

type Props = {
  /** Cierra el onboarding (lo marca como visto) y deja el login atrás. */
  onClose: () => void;
};

const FEATURES = [
  {
    emoji: '🗺️',
    title: 'Estacionamientos cerca tuyo',
    desc: 'Mirá en el mapa los lugares libres a la redonda de donde estás.',
  },
  {
    emoji: '🔎',
    title: 'Buscá rápido',
    desc: 'Abrí el buscador y encontrá el lugar más cercano en segundos.',
  },
  {
    emoji: '📍',
    title: 'Siempre ubicado',
    desc: 'Centrá el mapa en tu ubicación con un toque.',
  },
];

/**
 * Pantalla de bienvenida (primera apertura). Cuenta de qué se trata Trapito.
 * Se renderiza como overlay full-screen sobre el login; al cerrarse, aparece el login.
 */
export function OnboardingScreen({ onClose }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
        <Text style={styles.closeIcon}>✕</Text>
      </Pressable>

      <View style={styles.hero}>
        <Image
          source={require('../../assets/trapito.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Bienvenido a TRAPITO</Text>
        <Text style={styles.subtitle}>
          La forma más fácil de encontrar estacionamiento cerca tuyo.
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.feature}>
            <Text style={styles.featureEmoji}>{f.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Empezar" icon="🚀" onPress={onClose} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  closeIcon: { fontSize: 18, color: colors.textMuted, fontWeight: '700' },
  hero: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 10,
  },
  logo: { width: 120, height: 120, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    gap: 22,
  },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureEmoji: { fontSize: 30 },
  featureTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  featureDesc: { fontSize: 14, color: colors.textMuted, marginTop: 2, lineHeight: 20 },
  actions: { paddingBottom: 24 },
});
