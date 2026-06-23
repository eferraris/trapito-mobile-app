/**
 * Configuración de entorno.
 *
 * Las variables se leen desde el archivo .env (ver .env.example).
 * Si Supabase no está configurado, la app sigue funcionando en "modo demo"
 * para poder testear las pantallas sin backend / sin login real.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;

/**
 * Expo Go: el login con Google requiere un build nativo (limitación de la
 * librería), así que en Expo Go nunca funciona. Lo detectamos para saltear el
 * login y poder probar la app directamente.
 */
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Modo demo: lo fuerza el script `start:demo` (EXPO_PUBLIC_DEMO_MODE=1) o se
 * activa automáticamente cuando corremos en Expo Go (donde el login con Google
 * no está disponible). Cuando está activo, la app entra directo sin pasar por
 * el login de Google. En un dev build / build real se pide login normalmente.
 */
export const isDemoMode =
  process.env.EXPO_PUBLIC_DEMO_MODE === '1' || isExpoGo;
