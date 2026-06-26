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
  /** Precio fijo por hora, solo para garages privados. */
  pricePerHour?: number;
  /** Horario de atención, solo para garages privados (mock). */
  openHours?: string;
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
  { id: '3', reportedBy: 'Cochera Centro', minutesAgo: 1, type: 'garage', address: 'Maipú 320', pricePerHour: 1800, openHours: 'Lun a Vie 7–22 · Sáb 8–14', offsetNorth: 200, offsetEast: -180 },
  { id: '4', reportedBy: 'Diego', minutesAgo: 8, type: 'street', address: 'Lavalle 1500', offsetNorth: -300, offsetEast: -250 },
  { id: '5', reportedBy: 'Sofía', minutesAgo: 3, type: 'street', address: 'Tucumán 980', offsetNorth: 350, offsetEast: 200 },
  { id: '6', reportedBy: 'Garage Premium', minutesAgo: 12, type: 'garage', address: 'Florida 540', pricePerHour: 2400, openHours: 'Todos los días 6–24', offsetNorth: -420, offsetEast: 120 },
  { id: '7', reportedBy: 'Andrés', minutesAgo: 6, type: 'street', address: 'Viamonte 1100', offsetNorth: 620, offsetEast: 300 },
  { id: '8', reportedBy: 'Camila', minutesAgo: 4, type: 'street', address: 'Paraná 770', offsetNorth: -650, offsetEast: -400 },
  { id: '9', reportedBy: 'Cochera Plaza', minutesAgo: 0, type: 'garage', address: 'San Martín 450', pricePerHour: 1600, openHours: 'Lun a Sáb 8–21', offsetNorth: 130, offsetEast: 90 },
  { id: '10', reportedBy: 'Garage 24h', minutesAgo: 0, type: 'garage', address: 'Rivadavia 2100', pricePerHour: 2100, openHours: 'Abierto 24 horas', offsetNorth: -190, offsetEast: -130 },
  { id: '11', reportedBy: 'Estacionamiento Sur', minutesAgo: 0, type: 'garage', address: 'Belgrano 760', pricePerHour: 1500, openHours: 'Lun a Vie 8–20', offsetNorth: 320, offsetEast: 250 },
  { id: '12', reportedBy: 'Cochera Obelisco', minutesAgo: 0, type: 'garage', address: 'Cerrito 240', pricePerHour: 2000, openHours: 'Todos los días 7–23', offsetNorth: -90, offsetEast: 210 },
  { id: '13', reportedBy: 'Garage Libertad', minutesAgo: 0, type: 'garage', address: 'Libertad 410', pricePerHour: 1700, openHours: 'Lun a Vie 7–21 · Sáb 8–18', offsetNorth: 260, offsetEast: -60 },
  { id: '14', reportedBy: 'Parking Catalinas', minutesAgo: 0, type: 'garage', address: 'Av. Madero 900', pricePerHour: 2600, openHours: 'Lun a Vie 6–23', offsetNorth: -250, offsetEast: 330 },
  { id: '15', reportedBy: 'Cochera del Teatro', minutesAgo: 0, type: 'garage', address: 'Talcahuano 350', pricePerHour: 1900, openHours: 'Todos los días 9–24', offsetNorth: 410, offsetEast: -210 },
  { id: '16', reportedBy: 'Estacionamiento Once', minutesAgo: 0, type: 'garage', address: 'Bartolomé Mitre 2700', pricePerHour: 1400, openHours: 'Lun a Sáb 7–20', offsetNorth: -360, offsetEast: -80 },
  { id: '17', reportedBy: 'Garage Retiro', minutesAgo: 0, type: 'garage', address: 'Av. Santa Fe 1200', pricePerHour: 2300, openHours: 'Abierto 24 horas', offsetNorth: 150, offsetEast: 360 },
  { id: '18', reportedBy: 'Cochera Tribunales', minutesAgo: 0, type: 'garage', address: 'Uruguay 480', pricePerHour: 1750, openHours: 'Lun a Vie 8–22', offsetNorth: -150, offsetEast: -300 },
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
