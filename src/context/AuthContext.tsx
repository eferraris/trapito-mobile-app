import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

import { supabase } from '../lib/supabase';
import { isSupabaseConfigured, isDemoMode } from '../config/env';

const DEMO_USER: AppUser = {
  id: 'demo-user',
  email: 'demo@estacionate.app',
  name: 'Usuario Demo',
  isDemo: true,
};

// Necesario para que el navegador in-app pueda cerrar la sesión de auth correctamente.
WebBrowser.maybeCompleteAuthSession();

export type AppUser = {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  isDemo: boolean;
};

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  supabaseConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInDemo: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// A dónde vuelve el login. Sin pasar "scheme", makeRedirectUri se adapta al entorno:
// - En Expo Go usa exp://<host>/--/auth-callback (Expo Go sí lo puede abrir).
// - En dev build / app nativa usa estacionate://auth-callback (scheme de app.json).
const redirectTo = makeRedirectUri({ path: 'auth-callback' });
// eslint-disable-next-line no-console
console.log('[auth] redirectTo =', redirectTo);

/** Extrae tokens / code de la URL de redirect (query o fragment). */
function parseRedirectUrl(url: string) {
  const hashPart = url.includes('#') ? url.split('#')[1] : '';
  const queryPart = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const params = new URLSearchParams(hashPart || queryPart);
  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    code: params.get('code'),
    error: params.get('error_description') ?? params.get('error'),
  };
}

function mapSupabaseUser(sbUser: any): AppUser {
  const meta = sbUser?.user_metadata ?? {};
  return {
    id: sbUser.id,
    email: sbUser.email,
    name: meta.full_name ?? meta.name,
    avatarUrl: meta.avatar_url ?? meta.picture,
    isDemo: false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaura la sesión persistida y escucha cambios de auth de Supabase.
  useEffect(() => {
    // Modo demo (inyectado por el script `start`): entramos directo, sin login.
    if (isDemoMode) {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser(mapSupabaseUser(data.session.user));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const createSessionFromUrl = useCallback(async (url: string) => {
    if (!supabase) return;
    const { access_token, refresh_token, code, error } = parseRedirectUrl(url);
    if (error) throw new Error(error);

    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
      return;
    }

    if (access_token && refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError) throw sessionError;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase no está configurado. Usá el modo demo o completá el .env.');
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('No se pudo iniciar el login con Google.');

    // eslint-disable-next-line no-console
    console.log('[auth] opening auth url =', data.url);
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    // eslint-disable-next-line no-console
    console.log('[auth] openAuthSession result =', result.type, (result as any).url ?? '');
    if (result.type === 'success' && result.url) {
      await createSessionFromUrl(result.url);
    }
  }, [createSessionFromUrl]);

  const signInDemo = useCallback(() => {
    setUser(DEMO_USER);
  }, []);

  const signOut = useCallback(async () => {
    if (supabase && !user?.isDemo) {
      await supabase.auth.signOut();
    }
    setUser(null);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      supabaseConfigured: isSupabaseConfigured,
      signInWithGoogle,
      signInDemo,
      signOut,
    }),
    [user, loading, signInWithGoogle, signInDemo, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
