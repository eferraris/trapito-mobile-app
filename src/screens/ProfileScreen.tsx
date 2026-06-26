import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors, fontFamily, radius, spacing, typography } from '../theme';
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
      <View style={styles.header}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <Text style={styles.name}>{user?.name ?? 'Tu cuenta'}</Text>
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => navigation.navigate('Reservations')}
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
        >
          <Text style={styles.menuIcon}>🅿️</Text>
          <View style={styles.menuTexts}>
            <Text style={styles.menuTitle}>Mis reservas</Text>
            <Text style={styles.menuSub}>Garages y trapitos que reservaste</Text>
          </View>
          <Text style={styles.menuChevron}>›</Text>
        </Pressable>

        <PrimaryButton
          title="Cerrar sesión"
          icon="🚪"
          variant="danger"
          onPress={handleSignOut}
          loading={loading}
        />
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
  header: {
    alignItems: 'center',
    gap: spacing.titleToDesc,
    paddingTop: 40,
    paddingHorizontal: spacing.screenH,
  },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarInitial: {
    color: colors.onPrimary,
    fontFamily: fontFamily.extraBold,
    fontSize: 40,
    fontWeight: '800',
  },
  name: { ...typography.titleLg, fontSize: 24, lineHeight: 30, color: colors.text },
  email: { ...typography.small, color: colors.textMuted },
  actions: { padding: spacing.screenH, gap: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  menuItemPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  menuIcon: { fontSize: 22 },
  menuTexts: { flex: 1 },
  menuTitle: { ...typography.titleMd, fontSize: 16, lineHeight: 21, color: colors.text },
  menuSub: { ...typography.small, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  menuChevron: { fontSize: 26, color: colors.textTertiary, marginTop: -2 },
});
