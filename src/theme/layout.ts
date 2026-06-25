/**
 * Radios, espaciado y sombras de Trapito.
 *
 * Bordes bien redondeados pero no infantiles, mucho aire y sombras suaves,
 * amplias y elegantes (nada duro ni muy oscuro).
 */
import { ViewStyle } from 'react-native';

/** Redondeos. */
export const radius = {
  input: 14,
  button: 16,
  cardSm: 20,
  bottomSheet: 28, // solo esquinas superiores
  cardLg: 28,
  illustration: 32,
  pill: 999, // chips / badges
} as const;

/** Espaciado y medidas de layout. */
export const spacing = {
  screenH: 24, // margen lateral de pantalla
  block: 32, // separación entre bloques grandes
  titleToDesc: 12, // título → descripción
  descToDots: 28, // descripción → dots
  dotsToButton: 32, // dots → botón
  cardPadding: 20, // padding interno de cards
  buttonPaddingH: 24, // padding horizontal de botón
  buttonHeight: 64, // alto de botón principal
  inputHeight: 56,
  inputPaddingH: 16,
} as const;

/**
 * Sombras suaves. Cada token incluye `elevation` (Android) además de las
 * propiedades `shadow*` (iOS). Las opacidades siguen el criterio: cards 8%,
 * botón principal 28% (en rojo), modales 12%, ilustraciones 10%.
 */
export const shadows: Record<
  'card' | 'button' | 'modal' | 'illustration' | 'floating',
  ViewStyle
> = {
  // Card normal — blur 24, y 12, charcoal 8%
  card: {
    shadowColor: '#151B24',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  // Botón principal — blur 16, y 8, rojo 28%
  button: {
    shadowColor: '#FF2F2F',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  // Modal / bottom sheet — blur 32, y 16, 12%
  modal: {
    shadowColor: '#151B24',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  // Ilustración 3D — blur 30, y 18, gris cálido 10%
  illustration: {
    shadowColor: '#6D727B',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 18 },
    elevation: 4,
  },
  // Elementos flotantes sobre el mapa (search bar, FAB) — charcoal suave
  floating: {
    shadowColor: '#151B24',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
};
