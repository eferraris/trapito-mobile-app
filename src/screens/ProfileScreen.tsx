import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { colors, fontFamily, radius, shadows, spacing, typography } from '../theme';
import type { AppScreenProps } from '../navigation/types';

type Props = AppScreenProps<'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const initial = (user?.name ?? user?.email ?? '?').trim().charAt(0).toUpperCase();

  // Al cerrar sesión, user pasa a null y el RootNavigator vuelve al login solo.
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
    } catch (e: any) {
      Alert.alert('No pudimos cerrar sesión', e?.message ?? 'Intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* --- Identidad --- */}
        <View style={styles.header}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={1}>
            {user?.name ?? 'Tu cuenta'}
          </Text>
          {user?.email ? (
            <Text style={styles.email} numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}
        </View>

        {/* --- Actividad --- */}
        <Text style={styles.sectionLabel}>Actividad</Text>
        <View style={styles.card}>
          <Pressable
            onPress={() => navigation.navigate('Reservations')}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Mis reservas</Text>
              <Text style={styles.rowSub}>Garages y trapitos que reservaste</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* --- Pie: acción destructiva + versión --- */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleSignOut}
          disabled={loading}
          style={({ pressed }) => [styles.signOut, pressed && styles.rowPressed]}
        >
          {loading ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <Text style={styles.signOutText}>Cerrar sesión</Text>
          )}
        </Pressable>
        <Text style={styles.version}>Trapito · v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'space-between',
  },
  content: { paddingHorizontal: spacing.screenH },

  // --- Header ---
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 8 },
  avatar: { width: 92, height: 92, borderRadius: 46 },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.card,
  },
  avatarInitial: {
    color: colors.onPrimary,
    fontFamily: fontFamily.extraBold,
    fontSize: 38,
    fontWeight: '800',
  },
  name: {
    ...typography.titleLg,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
    marginTop: 16,
  },
  email: { ...typography.small, color: colors.textMuted, marginTop: 4 },

  // --- Sección + card de navegación ---
  sectionLabel: {
    ...typography.small,
    fontSize: 13,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.block,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  rowPressed: { backgroundColor: colors.surfaceWarm },
  rowTexts: { flex: 1 },
  rowTitle: { ...typography.titleMd, fontSize: 16, lineHeight: 21, color: colors.text },
  rowSub: { ...typography.small, fontSize: 13, color: colors.textMuted, marginTop: 3 },
  chevron: { fontSize: 28, color: colors.textTertiary, marginLeft: 12, marginTop: -2 },

  // --- Footer ---
  footer: { paddingHorizontal: spacing.screenH, paddingTop: 8, gap: 16, alignItems: 'center' },
  signOut: {
    width: '100%',
    height: 56,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    ...typography.button,
    fontSize: 17,
    color: colors.danger,
  },
  version: { ...typography.small, fontSize: 12, color: colors.textTertiary },
});
