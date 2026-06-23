import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import type { AppScreenProps } from '../navigation/types';

type Props = AppScreenProps<'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'Hola';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>¡Hola, {firstName}!</Text>
          <Text style={styles.greetingSub}>¿Qué querés hacer hoy?</Text>
        </View>
        <Pressable onPress={signOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Salir</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.cards}>
        <Pressable
          style={({ pressed }) => [
            styles.card,
            styles.cardLeave,
            pressed && styles.cardPressed,
          ]}
          onPress={() => navigation.navigate('LeaveSpot')}
        >
          <Text style={styles.cardEmoji}>🚗💨</Text>
          <Text style={styles.cardTitle}>Estoy sacando mi auto</Text>
          <Text style={styles.cardDesc}>
            Avisá que dejás libre tu lugar. Confirmás la ubicación en el mapa y,
            si querés, sumás una foto.
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            styles.cardFind,
            pressed && styles.cardPressed,
          ]}
          onPress={() => navigation.navigate('FindParking')}
        >
          <Text style={styles.cardEmoji}>🔎🅿️</Text>
          <Text style={styles.cardTitle}>Buscar estacionamiento</Text>
          <Text style={styles.cardDesc}>
            Mirá los lugares disponibles a 500 metros a la redonda de donde estás.
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  greetingSub: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 2,
  },
  signOut: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  signOutText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  cards: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 18,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    minHeight: 180,
    justifyContent: 'flex-end',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardLeave: {
    backgroundColor: colors.primary,
  },
  cardFind: {
    backgroundColor: colors.accent,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardEmoji: {
    fontSize: 40,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
  },
  cardDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 20,
  },
});
