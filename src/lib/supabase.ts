import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '../config/env';

/**
 * Cliente de Supabase.
 *
 * - Usa AsyncStorage para persistir la sesión en el dispositivo.
 * - autoRefreshToken mantiene la sesión viva.
 * - detectSessionInUrl: false porque en React Native no hay URL del navegador;
 *   el token llega por deep link y lo seteamos manualmente (ver AuthContext).
 *
 * Si todavía no configuraste Supabase, exportamos null y la app entra en modo demo.
 */
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
