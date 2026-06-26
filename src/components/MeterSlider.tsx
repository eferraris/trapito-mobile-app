import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  value: number;
  min: number;
  max: number;
  step: number;
  /** Se dispara en cada movimiento (para actualizar el círculo en vivo). */
  onChange: (v: number) => void;
  /** Se dispara al soltar (para reencuadrar el mapa una sola vez). */
  onComplete?: (v: number) => void;
};

const THUMB = 28;
const TRACK_H = 6;

/**
 * Slider en JS puro (sin módulo nativo, así no requiere recompilar el dev build).
 *
 * Usa coordenadas ABSOLUTAS del gesto (gestureState.moveX) menos la posición real
 * del track (measureInWindow). No usamos `locationX` porque al tocar el thumb (un
 * hijo) viene relativo al thumb y el slider saltaba.
 */
export function MeterSlider({ value, min, max, step, onChange, onComplete }: Props) {
  const [width, setWidth] = useState(0);
  const containerRef = useRef<View>(null);

  // Config mutable accesible desde el PanResponder (creado una sola vez).
  const cfg = useRef({ min, max, step, left: 0, width: 0, onChange, onComplete, last: value });
  cfg.current.min = min;
  cfg.current.max = max;
  cfg.current.step = step;
  cfg.current.onChange = onChange;
  cfg.current.onComplete = onComplete;

  const applyAbsolute = (absX: number) => {
    const c = cfg.current;
    if (c.width <= 0) return;
    const x = absX - c.left;
    const ratio = Math.max(0, Math.min(1, x / c.width));
    const raw = c.min + ratio * (c.max - c.min);
    const snapped = Math.round(raw / c.step) * c.step;
    const clamped = Math.max(c.min, Math.min(c.max, snapped));
    c.last = clamped;
    c.onChange(clamped);
  };

  const remeasure = (then: () => void) => {
    const node = containerRef.current;
    if (!node) return then();
    node.measureInWindow((x, _y, w) => {
      cfg.current.left = x;
      if (w > 0) cfg.current.width = w;
      then();
    });
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (_e, g) => remeasure(() => applyAbsolute(g.x0)),
      onPanResponderMove: (_e, g) => applyAbsolute(g.moveX),
      onPanResponderRelease: () => cfg.current.onComplete?.(cfg.current.last),
      onPanResponderTerminate: () => cfg.current.onComplete?.(cfg.current.last),
    })
  ).current;

  const ratio = max > min ? (value - min) / (max - min) : 0;
  const filled = ratio * width;

  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        setWidth(w);
        cfg.current.width = w;
      }}
      {...responder.panHandlers}
    >
      <View pointerEvents="none" style={styles.track} />
      <View pointerEvents="none" style={[styles.fill, { width: filled }]} />
      <View
        pointerEvents="none"
        style={[styles.thumb, { left: Math.max(0, Math.min(width - THUMB, filled - THUMB / 2)) }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: THUMB + 12,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    backgroundColor: colors.border,
  },
  fill: {
    position: 'absolute',
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: '#151B24',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
