/**
 * Paleta de Trapito.
 *
 * Estilo: app premium, blanca, cálida y minimalista. El rojo coral es la acción
 * (CTA, pins principales, estados activos); el blanco es la calma; el charcoal da
 * seriedad y el naranja aporta energía solo como acento.
 *
 * Regla de uso aproximada: 70% blancos/fondos · 15% charcoal/textos · 10% rojo
 * coral · 3% naranja · 2% verdes (solo ilustración/vegetación).
 */
export const colors = {
  // --- Marca / acción ---
  primary: '#FF2F2F', // rojo coral — color de marca y acción
  primaryPressed: '#E82622', // botón principal presionado
  primaryDisabled: '#DADADA', // botón principal deshabilitado
  /** @deprecated usar primaryPressed */
  primaryDark: '#E82622',
  secondary: '#FF8A00', // naranja cálido — solo acento / gradiente / detalle
  accent: '#FF8A00',

  // --- Texto ---
  text: '#151B24', // charcoal — texto principal
  textMuted: '#6D727B', // texto secundario
  textTertiary: '#A6A8AD', // texto terciario / placeholder

  // --- Fondos y superficies ---
  background: '#FFFFFF', // fondo principal (blanco puro cálido)
  backgroundAlt: '#FDFBF9', // fondo alternativo (blanco cálido)
  surface: '#FFFFFF', // superficie de cards
  surfaceWarm: '#F8F4EF', // superficie cálida (cream)

  // --- Líneas ---
  border: '#EEE8DF', // bordes suaves
  divider: '#F1ECE6', // divisores

  // --- Acentos cálidos ---
  chipWarm: '#FFE3C2', // fondo de chip cálido
  alertSoft: '#FFF2E6', // fondo de alerta suave

  // --- Estados ---
  success: '#FF2F2F', // en esta app el éxito refuerza marca (rojo coral)
  warning: '#FF8A00',
  danger: '#E82622',
  error: '#E82622',

  // --- Sobre color / neutros ---
  onPrimary: '#FFFFFF', // texto/íconos sobre botón principal
  white: '#FFFFFF',
} as const;

/** Gradientes recomendados (de inicio → fin). */
export const gradients = {
  /** Logo, íconos importantes, check de éxito, detalles visuales. */
  brand: ['#FF2F2F', '#FF8A00'] as const,
  /** Botones grandes: rojo casi sólido, con apenas profundidad. */
  button: ['#FF2F2F', '#FF3B30'] as const,
};
