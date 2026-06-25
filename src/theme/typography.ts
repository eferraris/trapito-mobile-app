/**
 * Tipografía de Trapito.
 *
 * Fuente: Inter (vía @expo-google-fonts/inter). Pesos pesados y redondeados para
 * los títulos, con letter-spacing levemente negativo para que se vean premium y
 * compactos. El body queda en Regular para máxima legibilidad.
 *
 * Los `fontFamily` deben coincidir con las claves que se cargan en App.tsx con
 * `useFonts`. Si las fuentes no cargaron todavía, RN cae al sistema con un peso
 * aproximado, así que igual conviene dejar `fontWeight` como respaldo.
 */
import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

type Variant =
  | 'onboardingTitle'
  | 'titleLg'
  | 'titleMd'
  | 'bodyLg'
  | 'body'
  | 'button'
  | 'small'
  | 'skip';

export const typography: Record<Variant, TextStyle> = {
  // Título principal de onboarding — 42 / 48, 800, tracking -1.2
  onboardingTitle: {
    fontFamily: fontFamily.extraBold,
    fontWeight: '800',
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1.2,
  },
  // Título secundario — 32 / 38, 800, tracking -0.8
  titleLg: {
    fontFamily: fontFamily.extraBold,
    fontWeight: '800',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  // Título mediano (cards / secciones) — tracking -0.8
  titleMd: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 21,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  // Texto descriptivo grande — 21 / 30, 400
  bodyLg: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 21,
    lineHeight: 30,
  },
  // Texto normal — 18 / 26, 400
  body: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 18,
    lineHeight: 26,
  },
  // Botón principal — 20 / 24, 700
  button: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
  },
  // Texto chico / labels — 15 / 20, 500
  small: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 15,
    lineHeight: 20,
  },
  // Skip / "Omitir" — 17 / 22, 400
  skip: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 22,
  },
};
