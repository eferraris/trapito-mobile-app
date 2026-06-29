import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text } from 'react-native';

import { colors, fontFamily } from '../theme';

type Props = {
  /** true cuando la app ya está lista para mostrarse (sesión resuelta). */
  ready: boolean;
  /** true cuando las fuentes Inter terminaron de cargar. */
  fontsReady?: boolean;
  /** Se llama cuando terminó el fade out y el splash puede desmontarse. */
  onFinish: () => void;
};

// El splash se ve al menos este tiempo, aunque la sesión cargue antes.
const MIN_SPLASH_MS = 3000;
const FADE_MS = 700;
const CONTENT_FADE_MS = 240;

/**
 * Pantalla inicial / de carga (overlay sobre la app). Isotipo + "TRAPITO" en negro.
 * Cuando la app está lista y pasó el tiempo mínimo, se desvanece (fade out).
 *
 * El logo y el texto se revelan juntos (un solo fade-in) recién cuando la imagen
 * ya se decodificó y las fuentes cargaron, así no aparecen desfasados.
 */
export function SplashScreen({ ready, fontsReady = true, onFinish }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const [minElapsed, setMinElapsed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    // Respaldo: si onLoad no llega a dispararse, revelamos igual.
    const imgFallback = setTimeout(() => setImageLoaded(true), 400);
    return () => {
      clearTimeout(timer);
      clearTimeout(imgFallback);
    };
  }, []);

  // Revela logo + texto a la vez cuando ambos están listos.
  useEffect(() => {
    if (imageLoaded && fontsReady) {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: CONTENT_FADE_MS,
        useNativeDriver: true,
      }).start();
    }
  }, [imageLoaded, fontsReady, contentOpacity]);

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
      <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
        <Image
          source={require('../../assets/trapito.png')}
          style={styles.logo}
          resizeMode="contain"
          // Sin fade-in propio: el grupo entero se revela con contentOpacity.
          fadeDuration={0}
          onLoad={() => setImageLoaded(true)}
        />
        <Text style={styles.name}>trapito</Text>
      </Animated.View>
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
  content: { alignItems: 'center', justifyContent: 'center' },
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
