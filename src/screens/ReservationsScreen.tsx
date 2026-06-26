import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '../theme';
import { loadReservations, type Reservation } from '../lib/reservations';
import type { AppScreenProps } from '../navigation/types';

type Props = AppScreenProps<'Reservations'>;

const GARAGE_BLUE = '#2563EB';

/** Formatea un número como pesos con separador de miles ("1.500"). */
function formatArs(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatCreatedAt(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return '';
  }
}

export function ReservationsScreen(_props: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Recargamos cada vez que la pantalla recibe foco (al volver del mapa).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadReservations().then((list) => {
        if (active) setReservations(list);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Todavía no tenés reservas</Text>
            <Text style={styles.emptyBody}>
              Cuando reserves un garage o pidas un trapito, lo vas a ver acá.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isGarage = item.kind === 'garage';
          const accent = isGarage ? GARAGE_BLUE : colors.primary;
          return (
            <View style={styles.card}>
              <View style={[styles.cardRail, { backgroundColor: accent }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTag, { color: accent }]}>
                    {isGarage ? 'Garage privado' : 'Trapito'}
                  </Text>
                  <Text style={styles.cardDate}>{formatCreatedAt(item.createdAt)}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.address}</Text>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMeta}>🕒 {item.startTime}</Text>
                  <Text style={styles.cardMeta}>⏱ {item.hours} h</Text>
                  <Text style={styles.cardMeta}>
                    {item.price && item.price > 0 ? `$${formatArs(item.price)}` : 'Gratis'}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  list: { padding: spacing.screenH, gap: 12, flexGrow: 1 },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardRail: { width: 5 },
  cardBody: { flex: 1, padding: 16 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTag: { ...typography.small, fontSize: 12, fontWeight: '700' },
  cardDate: { ...typography.small, fontSize: 12, color: colors.textTertiary },
  cardTitle: {
    ...typography.titleMd,
    fontSize: 18,
    lineHeight: 23,
    color: colors.text,
    marginTop: 4,
  },
  cardSub: { ...typography.small, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  cardMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 },
  cardMeta: { ...typography.small, fontSize: 13, color: colors.text },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 8 },
  emptyTitle: { ...typography.titleMd, fontSize: 18, color: colors.text, textAlign: 'center' },
  emptyBody: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
