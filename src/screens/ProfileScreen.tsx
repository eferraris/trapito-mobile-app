import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import type { AppScreenProps } from '../navigation/types';

type Props = AppScreenProps<'Profile'>;

export function ProfileScreen(_props: Props) {
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
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarInitial: { color: colors.white, fontSize: 40, fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  email: { fontSize: 15, color: colors.textMuted },
  actions: { padding: 24 },
});
