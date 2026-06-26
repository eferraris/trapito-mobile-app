import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  /** Radio máximo de las ondas, en píxeles (debe coincidir con el círculo de caminata). */
  pixelRadius: number;
};

const RING_COUNT = 3;
const WAVE_DURATION_MS = 2600;
const WAVE_INTERVAL_MS = 2000;
const WAVE_LOOP_MS = RING_COUNT * WAVE_INTERVAL_MS;

/**
 * Efecto visual del modo "buscando estacionamiento": un pin central que titila
 * y ondas concéntricas que salen desde el pin y se expanden hasta `pixelRadius`
 * (la distancia que el usuario está dispuesto a caminar), luego se desvanecen.
 *
 * Se dibuja en espacio de pantalla, centrado. Funciona porque en modo búsqueda
 * el mapa queda bloqueado y centrado en el destino, así que el centro de la
 * pantalla coincide con el pin del destino. Evita animar <Marker> (poco fiable
 * en Android). pointerEvents="none" para no bloquear el botón de cancelar.
 */
export function SearchPulse({ pixelRadius }: Props) {
  const rings = useRef(
    Array.from({ length: RING_COUNT }, () => new Animated.Value(0))
  ).current;
  const pinPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations = rings.map((value, i) =>
      Animated.sequence([
        Animated.delay(WAVE_INTERVAL_MS * i),
        Animated.loop(
          Animated.sequence([
            Animated.timing(value, {
              toValue: 1,
              duration: WAVE_DURATION_MS,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.delay(Math.max(0, WAVE_LOOP_MS - WAVE_DURATION_MS)),
          ])
        ),
      ])
    );
    const pin = Animated.loop(
      Animated.sequence([
        Animated.timing(pinPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pinPulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animations.forEach((a) => a.start());
    pin.start();
    return () => {
      animations.forEach((a) => a.stop());
      pin.stop();
    };
  }, [rings, pinPulse]);

  const size = pixelRadius * 2;
  const pinScale = pinPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });

  return (
    <View pointerEvents="none" style={styles.container}>
      {rings.map((value, i) => (
        <Animated.View
          key={i}
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: pixelRadius,
              opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
              transform: [
                { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.04, 1] }) },
              ],
            },
          ]}
        />
      ))}

      <Animated.View style={[styles.pinGlow, { transform: [{ scale: pinScale }] }]} />
      <View style={styles.pin}>
        <View style={styles.pinDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'rgba(255,47,47,0.08)',
  },
  pinGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,47,47,0.22)',
  },
  pin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  pinDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.white,
  },
});
