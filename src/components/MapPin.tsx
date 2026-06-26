import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme';

/** Dimensiones del pin y posición de la punta (para anclar / posicionar). */
export const PIN = { width: 36, height: 42, tipY: 41 } as const;

type Props = { color?: string };

/**
 * Marcador clásico tipo "gota": un cuadrado con 3 esquinas redondeadas y una en
 * punta, rotado 45° (la punta queda abajo y marca la coordenada exacta), con un
 * punto blanco al centro. Hecho con Views, sin SVG.
 */
export function MapPin({ color = colors.primary }: Props) {
  return (
    <View style={styles.box}>
      <View style={[styles.head, { backgroundColor: color }]}>
        <View style={styles.core} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: PIN.width, height: PIN.height },
  head: {
    position: 'absolute',
    left: 5,
    top: 10,
    width: 26,
    height: 26,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 1, // esquina en punta → abajo tras rotar 45°
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#151B24',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  core: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.white,
  },
});
