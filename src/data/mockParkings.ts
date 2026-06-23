import { Coords } from '../utils/distance';

export type ParkingSpot = {
  id: string;
  /** Quién avisó que libera el lugar (nombre mock). */
  reportedBy: string;
  /** Hace cuánto se reportó, en minutos. */
  minutesAgo: number;
  /** true = lugar en la calle liberado por otro usuario; false = cochera/garage. */
  type: 'street' | 'garage';
  /** Dirección aproximada (mock). */
  address: string;
  /** Desplazamiento respecto del usuario, en metros (norte/este). Para mockear posiciones. */
  offsetNorth: number;
  offsetEast: number;
};

/**
 * Lugares mockeados, definidos como desplazamientos en metros respecto del usuario.
 * Así, sin backend, siempre aparecen alrededor de la posición real del dispositivo.
 * Algunos quedan dentro de los 500 m y otros fuera, para probar el filtro.
 */
const MOCK_OFFSETS: ParkingSpot[] = [
  { id: '1', reportedBy: 'Martín', minutesAgo: 2, type: 'street', address: 'Av. Corrientes 1234', offsetNorth: 80, offsetEast: 60 },
  { id: '2', reportedBy: 'Lucía', minutesAgo: 5, type: 'street', address: 'Sarmiento 850', offsetNorth: -120, offsetEast: 140 },
  { id: '3', reportedBy: 'Cochera Centro', minutesAgo: 1, type: 'garage', address: 'Maipú 320', offsetNorth: 200, offsetEast: -180 },
  { id: '4', reportedBy: 'Diego', minutesAgo: 8, type: 'street', address: 'Lavalle 1500', offsetNorth: -300, offsetEast: -250 },
  { id: '5', reportedBy: 'Sofía', minutesAgo: 3, type: 'street', address: 'Tucumán 980', offsetNorth: 350, offsetEast: 200 },
  { id: '6', reportedBy: 'Garage Premium', minutesAgo: 12, type: 'garage', address: 'Florida 540', offsetNorth: -420, offsetEast: 120 },
  { id: '7', reportedBy: 'Andrés', minutesAgo: 6, type: 'street', address: 'Viamonte 1100', offsetNorth: 620, offsetEast: 300 },
  { id: '8', reportedBy: 'Camila', minutesAgo: 4, type: 'street', address: 'Paraná 770', offsetNorth: -650, offsetEast: -400 },
];

/** Metros -> grados de latitud. */
const METERS_PER_DEG_LAT = 111_320;

export type ParkingSpotWithCoords = ParkingSpot & { coords: Coords };

/**
 * Convierte los desplazamientos en metros a coordenadas reales alrededor del usuario.
 */
export function buildMockParkings(center: Coords): ParkingSpotWithCoords[] {
  const metersPerDegLon =
    METERS_PER_DEG_LAT * Math.cos((center.latitude * Math.PI) / 180);

  return MOCK_OFFSETS.map((spot) => ({
    ...spot,
    coords: {
      latitude: center.latitude + spot.offsetNorth / METERS_PER_DEG_LAT,
      longitude: center.longitude + spot.offsetEast / metersPerDegLon,
    },
  }));
}
