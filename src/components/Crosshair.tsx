import React from 'react';
import { View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  size?: number;
  color?: string;
  thickness?: number;
};

/**
 * Ícono "crosshair" de centrar-en-mi-ubicación, dibujado con Views (sin libs de
 * íconos): un anillo, un punto central y 4 marcas que sobresalen N/S/E/O.
 */
export function Crosshair({ size = 24, color = colors.primary, thickness = 2 }: Props) {
  const ring = size * 0.66;
  const ringOffset = (size - ring) / 2;
  const dot = size * 0.17;
  const dotOffset = (size - dot) / 2;
  const tick = size * 0.18;
  const tickPos = (size - thickness) / 2;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: thickness,
          borderColor: color,
          top: ringOffset,
          left: ringOffset,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: color,
          top: dotOffset,
          left: dotOffset,
        }}
      />
      <View style={{ position: 'absolute', width: thickness, height: tick, backgroundColor: color, top: 0, left: tickPos }} />
      <View style={{ position: 'absolute', width: thickness, height: tick, backgroundColor: color, bottom: 0, left: tickPos }} />
      <View style={{ position: 'absolute', width: tick, height: thickness, backgroundColor: color, left: 0, top: tickPos }} />
      <View style={{ position: 'absolute', width: tick, height: thickness, backgroundColor: color, right: 0, top: tickPos }} />
    </View>
  );
}
