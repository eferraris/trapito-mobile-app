/**
 * Persiste las últimas búsquedas de destino ("¿A dónde vamos?") para sugerirlas
 * cuando el usuario abre el buscador sin escribir nada. Usa AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Coords } from '../utils/distance';

const KEY = 'trapito.recentSearches';
const MAX = 5;

export type RecentSearch = { label: string; coords: Coords };

export async function loadRecentSearches(): Promise<RecentSearch[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

/** Agrega una búsqueda al tope (dedup por label, máximo 5) y devuelve la lista nueva. */
export async function addRecentSearch(item: RecentSearch): Promise<RecentSearch[]> {
  try {
    const current = await loadRecentSearches();
    const deduped = current.filter((r) => r.label !== item.label);
    const next = [item, ...deduped].slice(0, MAX);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}
