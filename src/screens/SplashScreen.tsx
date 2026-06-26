import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text } from 'react-native';

import { colors, fontFamily } from '../theme';

type Props = {
  /** true cuando la app ya está lista para mostrarse (sesión resuelta). */
  ready: boolean;
  /** Se llama cuando terminó el fade out y el splash puede desmontarse. */
  onFinish: () => void;
};

// El splash se ve al menos este tiempo, aunque la sesión cargue antes.
const MIN_SPLASH_MS = 3000;
const FADE_MS = 700;

/**
 * Pantalla inicial / de carga (overlay sobre la app). Isotipo + "TRAPITO" en negro.
 * Cuando la app está lista y pasó el tiempo mínimo, se desvanece (fade out).
 */
export function SplashScreen({ ready, onFinish }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready && minElapsed) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => onFinish());
    }
  }, [ready, minElapsed, opacity, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Image
        source={require('../../assets/trapito.png')}
        style={styles.logo}
        resizeMode="contain"
        // Sin fade-in: en Android Image hace fade por defecto al decodificar.
        fadeDuration={0}
      />
      <Text style={styles.name}>trapito</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 220, height: 220 },
  name: {
    fontFamily: fontFamily.extraBold,
    fontSize: 44,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1.2,
    marginTop: -40,
  },
});
