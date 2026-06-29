import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors, fontFamily, radius, shadows, spacing, typography } from '../theme';

type Props = {
  /** Cierra el onboarding (lo marca como visto) y deja el login atrás. */
  onClose: () => void;
};

type Slide = {
  key: string;
  image: ReturnType<typeof require>;
  title: string;
  subtitle: string;
  button: string;
};

const SLIDES: Slide[] = [
  {
    key: 'mapa',
    image: require('../../assets/mapa.png'),
    title: 'Estacioná sin\ndar vueltas',
    subtitle: 'Encontrá cocheras disponibles cerca de tu destino y reservá antes de llegar.',
    button: 'Siguiente',
  },
  {
    key: 'cochera_disponible',
    image: require('../../assets/busca.png'),
    title: 'Elegí cómo\nestacionar',
    subtitle: 'Decinos a dónde vas y elegí la opción que más te convenga.',
    button: 'Siguiente',
  },
  {
    key: 'espacio_publicado',
    image: require('../../assets/espacio_publicado.png'),
    title: 'Ofrecé tu cochera',
    subtitle: 'Si tenés cochera libre, podés ofrecerla y convertirte en trapito.',
    button: 'Empezar',
  },
];

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * Pantalla de bienvenida (primera apertura). Carrusel de 3 pasos que cuenta de
 * qué se trata Trapito. Se renderiza como overlay full-screen sobre el login;
 * al completarse o saltearse, aparece el login.
 */
export function OnboardingScreen({ onClose }: Props) {
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) {
      onClose();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (next !== index) setIndex(next);
  };

  const renderItem = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={styles.slide}>
      <View style={styles.imageWrap}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
      </View>
      <View style={styles.texts}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Pressable
        onPress={onClose}
        hitSlop={10}
        style={[styles.skip, isLast && styles.skipHidden]}
        disabled={isLast}
      >
        <Text style={styles.skipText}>Omitir</Text>
      </Pressable>

      <View style={styles.brand}>
        <Image
          source={require('../../assets/trapito.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>trapito</Text>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        initialNumToRender={SLIDES.length}
        maxToRenderPerBatch={SLIDES.length}
        windowSize={SLIDES.length}
        removeClippedSubviews={false}
        getItemLayout={(_, i) => ({
          length: SCREEN_W,
          offset: SCREEN_W * i,
          index: i,
        })}
      />

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <PrimaryButton title={SLIDES[index].button} onPress={goNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backgroundAlt,
  },
  skip: {
    position: 'absolute',
    top: 52,
    right: spacing.screenH,
    zIndex: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  skipHidden: { opacity: 0 },
  skipText: { ...typography.skip, color: colors.textMuted },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.block,
  },
  brandLogo: { width: 90, height: 90, marginRight: -5 },
  brandName: {
    fontFamily: fontFamily.extraBold,
    fontWeight: '800',
    fontSize: 34,
    color: colors.text,
    letterSpacing: -0.8,
  },
  slide: {
    width: SCREEN_W,
    flex: 1,
    paddingHorizontal: spacing.screenH,
    justifyContent: 'center',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    alignSelf: 'center',
    marginTop: spacing.block,
    borderRadius: radius.illustration,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...shadows.illustration,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 22 },
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: radius.illustration - 4,
  },
  texts: {
    alignItems: 'center',
    gap: spacing.titleToDesc,
    paddingTop: spacing.block,
  },
  title: { ...typography.titleLg, color: colors.text, textAlign: 'center' },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.descToDots,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.primary,
  },
  actions: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.screenH,
    gap: 8,
  },
});
