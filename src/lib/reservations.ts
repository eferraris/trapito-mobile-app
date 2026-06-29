/**
 * Persiste las reservas del usuario (garage privado y trapito) para mostrarlas
 * luego en "Mis reservas" desde el perfil. Usa AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Coords } from '../utils/distance';

const KEY = 'trapito.reservations';
const MAX = 30;

export type ReservationKind = 'garage' | 'trapito';

export type Reservation = {
  id: string;
  kind: ReservationKind;
  /** Nombre del garage o etiqueta del destino. */
  title: string;
  /** Dirección de referencia. */
  address: string;
  /** Coordenadas del destino, cuando la reserva tiene una ubicación navegable. */
  coords?: Coords;
  /** Horario de inicio en formato "HH:mm". */
  startTime: string;
  /** Duración reservada, en horas. */
  hours: number;
  /** Precio total estimado (ARS). 0 = gratis / a convenir. */
  price?: number;
  /** Momento de creación (epoch ms), para ordenar y mostrar. */
  createdAt: number;
};

export async function loadReservations(): Promise<Reservation[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Agrega una reserva al tope (más nuevas primero, máximo 30) y devuelve la lista nueva. */
export async function addReservation(item: Reservation): Promise<Reservation[]> {
  try {
    const current = await loadReservations();
    const next = [item, ...current].slice(0, MAX);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

/** Cancela (elimina) una reserva por id y devuelve la lista actualizada. */
export async function removeReservation(id: string): Promise<Reservation[]> {
  try {
    const current = await loadReservations();
    const next = current.filter((r) => r.id !== id);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}
