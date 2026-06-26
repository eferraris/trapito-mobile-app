/**
 * Búsqueda de direcciones con Google Places (servicio web REST).
 *
 * Es independiente del mapa: en iOS usamos Apple Maps para dibujar, pero la
 * búsqueda de "¿A dónde vamos?" usa Places en ambas plataformas. Llamamos a la
 * API por fetch (en vez de la librería con UI propia) para integrarla con el
 * diseño de la app y no sumar dependencias.
 *
 * La key viaja en el bundle JS (EXPO_PUBLIC_GOOGLE_PLACES_KEY), por eso debe
 * estar restringida solo a Places API en Google Cloud. Ver env.ts / .env.example.
 *
 * Costo: Places cobra por "sesión". Una sesión = N llamadas de autocomplete +
 * 1 de details, agrupadas por un `sessiontoken`. Generamos un token al abrir el
 * buscador y lo descartamos al elegir un lugar (ver newSessionToken()).
 */
import { GOOGLE_PLACES_KEY } from '../config/env';
import type { Coords } from '../utils/distance';

const AUTOCOMPLETE_URL =
  'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

export type PlacePrediction = {
  placeId: string;
  /** Línea principal (ej: "Av. Corrientes 1234"). */
  mainText: string;
  /** Línea secundaria (ej: "Buenos Aires, Argentina"). */
  secondaryText: string;
};

export type PlaceDetails = {
  coords: Coords;
  label: string;
};

/** Genera un token de sesión (UUID v4 simple) para agrupar el costo de Places. */
export function newSessionToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Autocompletado: dado lo que el usuario escribe, devuelve sugerencias.
 * `near` (opcional) sesga los resultados alrededor de la ubicación actual.
 */
export async function searchPlaces(
  input: string,
  sessionToken: string,
  near?: Coords | null
): Promise<PlacePrediction[]> {
  const trimmed = input.trim();
  if (!trimmed || !GOOGLE_PLACES_KEY) return [];

  const params = new URLSearchParams({
    input: trimmed,
    key: GOOGLE_PLACES_KEY,
    sessiontoken: sessionToken,
    language: 'es',
    components: 'country:ar',
  });
  if (near) {
    params.set('location', `${near.latitude},${near.longitude}`);
    params.set('radius', '30000');
  }

  try {
    const res = await fetch(`${AUTOCOMPLETE_URL}?${params.toString()}`);
    const json = await res.json();
    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      console.warn('Places autocomplete error:', json.status, json.error_message);
      return [];
    }
    return (json.predictions ?? []).map((p: any) => ({
      placeId: p.place_id,
      mainText: p.structured_formatting?.main_text ?? p.description,
      secondaryText: p.structured_formatting?.secondary_text ?? '',
    }));
  } catch (e) {
    console.warn('Places autocomplete fetch failed:', e);
    return [];
  }
}

/**
 * Resuelve un place_id a coordenadas. Se llama al elegir una sugerencia y
 * cierra la sesión de Places (mismo sessionToken que el autocomplete).
 */
export async function getPlaceDetails(
  placeId: string,
  sessionToken: string
): Promise<PlaceDetails | null> {
  if (!GOOGLE_PLACES_KEY) return null;

  const params = new URLSearchParams({
    place_id: placeId,
    key: GOOGLE_PLACES_KEY,
    sessiontoken: sessionToken,
    language: 'es',
    fields: 'geometry,name,formatted_address',
  });

  try {
    const res = await fetch(`${DETAILS_URL}?${params.toString()}`);
    const json = await res.json();
    if (json.status !== 'OK') {
      console.warn('Places details error:', json.status, json.error_message);
      return null;
    }
    const loc = json.result?.geometry?.location;
    if (!loc) return null;
    return {
      coords: { latitude: loc.lat, longitude: loc.lng },
      label: json.result?.name ?? json.result?.formatted_address ?? '',
    };
  } catch (e) {
    console.warn('Places details fetch failed:', e);
    return null;
  }
}
