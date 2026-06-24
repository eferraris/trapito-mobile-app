import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'trapito:onboarding-seen';

/**
 * Recuerda si el usuario ya vio la pantalla de onboarding (primera apertura).
 * `loading` evita mostrar el onboarding hasta saber si ya se vio.
 */
export function useOnboarding() {
  const [loading, setLoading] = useState(true);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => setSeen(value === '1'))
      .catch(() => setSeen(false))
      .finally(() => setLoading(false));
  }, []);

  const markSeen = useCallback(() => {
    setSeen(true);
    AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => {});
  }, []);

  return { loading, seen, markSeen };
}
