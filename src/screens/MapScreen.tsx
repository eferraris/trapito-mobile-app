import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { MapPressEvent, MarkerDragStartEndEvent, PoiClickEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';

import { Crosshair } from '../components/Crosshair';
import { SearchPulse } from '../components/SearchPulse';
import { MeterSlider } from '../components/MeterSlider';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { buildMockParkings, type ParkingSpotWithCoords } from '../data/mockParkings';
import { distanceInMeters, formatDistance, Coords } from '../utils/distance';
import {
  getPlaceDetails,
  newSessionToken,
  PlacePrediction,
  searchPlaces,
} from '../lib/places';
import {
  addRecentSearch,
  loadRecentSearches,
  RecentSearch,
} from '../lib/recentSearches';
import { addReservation } from '../lib/reservations';
import type { AppScreenProps } from '../navigation/types';

// En Android usamos Google Maps; en iOS dejamos Apple Maps.
const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

type Props = AppScreenProps<'Map'>;

/** Paso del flujo de búsqueda. */
type Step = 'idle' | 'place' | 'range' | 'mode' | 'garages' | 'trapito' | 'broadcasting';

type Destination = { coords: Coords; label: string };
type Garage = ParkingSpotWithCoords & { distance: number };

const FALLBACK: Coords = { latitude: -34.6037, longitude: -58.3816 }; // Obelisco, BA
const GARAGE_BLUE = '#2563EB';
const DEST_PIN_SIZE = 26;

// Caminata: rango del slider, en metros.
const WALK_MIN_M = 100;
const WALK_MAX_M = 1500;
const WALK_STEP_M = 50;
const DEFAULT_WALK_M = 400;

// Trapito: tiempo de estadía y sugerencia de precio.
const HOUR_OPTIONS = [1, 2, 4, 8];
const BASE_PER_HOUR = 1500; // ARS por hora (mock) para la sugerencia
const PRICE_STEP = 500;
const DEFAULT_HOURS = 2;

// El círculo de caminata ocupa esta fracción del ancho de pantalla al encuadrar.
const CIRCLE_FRACTION = 0.34;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PULSE_PIXEL_RADIUS = CIRCLE_FRACTION * SCREEN_W;

const METERS_PER_DEG_LAT = 111_320;

/** Encuadra el mapa para que un círculo de `meters` ocupe ~CIRCLE_FRACTION del ancho. */
function regionForRadius(c: Coords, meters: number, mapHeight = SCREEN_H): Region {
  const metersPerDegLon = METERS_PER_DEG_LAT * Math.cos((c.latitude * Math.PI) / 180);
  // ancho del mapa en metros para que el radio sea CIRCLE_FRACTION * ancho
  const mapWidthMeters = meters / CIRCLE_FRACTION;
  const longitudeDelta = mapWidthMeters / metersPerDegLon;
  const latitudeDelta = longitudeDelta * (mapHeight / SCREEN_W);
  return { latitude: c.latitude, longitude: c.longitude, latitudeDelta, longitudeDelta };
}

function toRegion(c: Coords, delta = 0.012): Region {
  return { latitude: c.latitude, longitude: c.longitude, latitudeDelta: delta, longitudeDelta: delta };
}

/** Formatea un número como pesos con separador de miles ("1.500"). */
function formatArs(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Genera horarios de inicio en tramos de 30 min, desde la próxima media hora.
 * Devuelve etiquetas "HH:mm" (la primera es "Ahora") para elegir el horario de reserva.
 */
function buildTimeSlots(count = 16): string[] {
  const start = new Date();
  start.setSeconds(0, 0);
  const min = start.getMinutes();
  start.setMinutes(min === 0 ? 0 : min <= 30 ? 30 : 60);
  const slots: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start.getTime() + i * 30 * 60_000);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

/** Arma una dirección legible a partir del resultado de reverseGeocodeAsync. */
function formatGeocode(a?: Location.LocationGeocodedAddress): string {
  if (!a) return 'Punto en el mapa';
  const line = [a.street ?? a.name, a.streetNumber].filter(Boolean).join(' ');
  const area = a.city ?? a.subregion ?? a.region;
  return [line, area].filter(Boolean).join(', ') || 'Punto en el mapa';
}

export function MapScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<Coords | null>(null);

  // --- Flujo de búsqueda ---
  const [step, setStep] = useState<Step>('idle');
  const [destination, setDestination] = useState<Destination | null>(null);
  const [walkMeters, setWalkMeters] = useState(DEFAULT_WALK_M);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [price, setPrice] = useState(BASE_PER_HOUR * DEFAULT_HOURS);
  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null);

  // Horario de reserva (compartido por garage y trapito). Tramos de 30 min.
  const timeSlots = useMemo(() => buildTimeSlots(), []);
  const [startTime, setStartTime] = useState(timeSlots[0]);

  // --- Buscador de destino (Places) ---
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [recents, setRecents] = useState<RecentSearch[]>([]);
  const [moving, setMoving] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [measuredSheetStep, setMeasuredSheetStep] = useState<Step>('idle');
  const sessionToken = useRef<string>('');

  // --- Fijar el punto exacto (step 'place') ---
  const [pinCoords, setPinCoords] = useState<Coords | null>(null);
  const [pinAddress, setPinAddress] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const isLocked = step === 'broadcasting';
  const activeSheetHeight = step === 'idle' ? 0 : sheetHeight;
  const visibleMapHeight = Math.max(1, SCREEN_H - activeSheetHeight);

  const animateToRegionAfterRender = (region: Region, duration: number) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mapRef.current?.animateToRegion(region, duration);
      });
    });
  };

  // Pide la ubicación y, si `animate`, mueve la cámara hacia ella.
  const fetchLocation = async (animate = false) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCenter((prev) => prev ?? FALLBACK);
        if (!animate) {
          Alert.alert(
            'Permiso de ubicación',
            'Sin tu ubicación mostramos el mapa en una posición por defecto.'
          );
        }
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCenter(coords);
      if (animate) mapRef.current?.animateToRegion(toRegion(coords), 600);
    } catch {
      setCenter((prev) => prev ?? FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
    loadRecentSearches().then(setRecents);
  }, []);

  // Autocompletado con debounce (300 ms) mientras se escribe el destino.
  useEffect(() => {
    if (!searchOpen) return;
    const q = query.trim();
    if (q.length < 3) {
      setPredictions([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const results = await searchPlaces(q, sessionToken.current, center);
      setPredictions(results);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, searchOpen, center]);

  // Garages privados dentro del radio de caminata, alrededor del destino.
  const garages = useMemo<Garage[]>(() => {
    if (!destination) return [];
    return buildMockParkings(destination.coords)
      .filter((s) => s.type === 'garage')
      .map((s) => ({ ...s, distance: distanceInMeters(destination.coords, s.coords) }))
      .filter((s) => s.distance <= walkMeters)
      .sort((a, b) => a.distance - b.distance);
  }, [destination, walkMeters]);
  const selectedGarage = garages.find((garage) => garage.id === selectedGarageId) ?? null;

  const openSearch = () => {
    sessionToken.current = newSessionToken();
    setQuery('');
    setPredictions([]);
    setSearchOpen(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
    setPredictions([]);
  };

  // Elige un destino del autocompletado: resuelve coords y arranca el flujo.
  const pickPrediction = async (p: PlacePrediction) => {
    setSearching(true);
    const details = await getPlaceDetails(p.placeId, sessionToken.current);
    setSearching(false);
    if (!details) {
      Alert.alert('Ups', 'No pudimos ubicar ese lugar. Probá con otro.');
      return;
    }
    closeSearch();
    startFlowAt(details);
    addRecentSearch(details).then(setRecents);
  };

  // Arranca el flujo con el marcador puesto en el lugar elegido y mueve la cámara ahí.
  const startFlowAt = (dest: Destination) => {
    setDestination(null);
    setPinCoords(dest.coords);
    setPinAddress(dest.label);
    setStep('place');
    animateToRegionAfterRender(toRegion(dest.coords, 0.005), 700);
  };

  // Dirección del marcador. Usa el geocoder del SO.
  const reverseGeocode = async (c: Coords) => {
    setGeocoding(true);
    try {
      const [res] = await Location.reverseGeocodeAsync(c);
      setPinAddress(formatGeocode(res));
    } catch {
      setPinAddress(null);
    } finally {
      setGeocoding(false);
    }
  };

  const updatePinLocation = (coords: Coords, label?: string) => {
    setMoving(false);
    setPinCoords(coords);
    if (label) {
      setPinAddress(label);
    } else {
      reverseGeocode(coords);
    }
  };

  const handleMapPress = (event: MapPressEvent) => {
    if (step !== 'place' || event.nativeEvent.action === 'marker-press') return;
    updatePinLocation(event.nativeEvent.coordinate);
  };

  const handlePoiClick = (event: PoiClickEvent) => {
    if (step !== 'place') return;
    updatePinLocation(event.nativeEvent.coordinate, event.nativeEvent.name);
  };

  const handlePinDragEnd = (event: MarkerDragStartEndEvent) => {
    updatePinLocation(event.nativeEvent.coordinate);
  };

  // Confirma el punto fijado y pasa al rango de caminata.
  const confirmPlace = () => {
    if (!pinCoords) return;
    setDestination({ coords: pinCoords, label: pinAddress ?? 'Punto en el mapa' });
    setWalkMeters(DEFAULT_WALK_M);
    setStep('range');
  };

  // Vuelve del rango a la selección fina del punto (no a idle).
  const backToPlace = () => {
    if (!destination) return resetSearch();
    setPinCoords(destination.coords);
    setPinAddress(destination.label);
    setDestination(null);
    setStep('place');
    mapRef.current?.animateToRegion(toRegion(destination.coords, 0.005), 500);
  };

  const pickRecent = (r: RecentSearch) => {
    closeSearch();
    startFlowAt(r);
    addRecentSearch(r).then(setRecents);
  };

  // Arranca el flujo en la ubicación actual del usuario y refina la dirección.
  const useMyLocation = () => {
    if (!center) return;
    closeSearch();
    startFlowAt({ coords: center, label: 'Mi ubicación actual' });
    reverseGeocode(center);
  };

  // Reencuadra el mapa al soltar el slider (en vivo solo crece el círculo).
  const reframeWalk = (meters: number) => {
    if (destination) {
      mapRef.current?.animateToRegion(regionForRadius(destination.coords, meters, visibleMapHeight), 300);
    }
  };

  const chooseHours = (h: number) => {
    setHours(h);
    setPrice(BASE_PER_HOUR * h); // re-sugerimos el precio al cambiar el tiempo
  };

  const startBroadcasting = () => {
    if (destination) {
      mapRef.current?.animateToRegion(
        regionForRadius(destination.coords, walkMeters, visibleMapHeight),
        500
      );
      // El pedido de trapito queda guardado como reserva con su horario.
      addReservation({
        id: `${Date.now()}`,
        kind: 'trapito',
        title: destination.label,
        address: destination.label,
        startTime,
        hours,
        price,
        createdAt: Date.now(),
      });
    }
    setStep('broadcasting');
  };

  const selectGarage = (garage: Garage) => {
    setSelectedGarageId(garage.id);
    // Reseteamos los datos de reserva al abrir el detalle del garage.
    setHours(DEFAULT_HOURS);
    setStartTime(timeSlots[0]);
    mapRef.current?.animateToRegion(toRegion(garage.coords, 0.004), 350);
  };

  // Confirma la reserva del garage, la guarda y vuelve a la pantalla inicial.
  const confirmGarageReservation = async () => {
    if (!selectedGarage) return;
    await addReservation({
      id: `${Date.now()}`,
      kind: 'garage',
      title: selectedGarage.reportedBy,
      address: selectedGarage.address,
      startTime,
      hours,
      price: (selectedGarage.pricePerHour ?? 0) * hours,
      createdAt: Date.now(),
    });
    Alert.alert(
      'Reserva confirmada',
      `Te esperamos en ${selectedGarage.reportedBy} a las ${startTime}.`
    );
    resetSearch();
  };

  const openGarageList = () => {
    setSelectedGarageId(null);
    setStep('garages');
  };

  const backFromGarages = () => {
    if (selectedGarageId) {
      setSelectedGarageId(null);
      // Volvemos a encuadrar el círculo del área de caminata.
      if (destination) {
        mapRef.current?.animateToRegion(
          regionForRadius(destination.coords, walkMeters, visibleMapHeight),
          350
        );
      }
      return;
    }
    setStep('mode');
  };

  // Vuelve al estado inicial (cancelar / cerrar el flujo).
  const resetSearch = () => {
    setStep('idle');
    setDestination(null);
    setPinCoords(null);
    setPinAddress(null);
    setSelectedGarageId(null);
    setWalkMeters(DEFAULT_WALK_M);
    setHours(DEFAULT_HOURS);
    setPrice(BASE_PER_HOUR * DEFAULT_HOURS);
    setStartTime(timeSlots[0]);
    if (center) mapRef.current?.animateToRegion(toRegion(center), 500);
  };

  useEffect(() => {
    if (step !== 'range' || !destination || measuredSheetStep !== 'range') return;
    animateToRegionAfterRender(
      regionForRadius(destination.coords, walkMeters, visibleMapHeight),
      600
    );
  }, [step, destination, measuredSheetStep, visibleMapHeight]);

  if (loading || !center) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando el mapa…</Text>
      </View>
    );
  }

  const initial = (user?.name ?? user?.email ?? '?').trim().charAt(0).toUpperCase();
  const avatar = user?.avatarUrl ? (
    <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
  ) : (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );

  const showCircle = !!destination && step !== 'idle';
  const sheetProps = {
    insetBottom: insets.bottom,
    onHeightChange: (height: number) => {
      setSheetHeight(height);
      setMeasuredSheetStep(step);
    },
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={[StyleSheet.absoluteFill, { bottom: activeSheetHeight }]}
        provider={MAP_PROVIDER}
        initialRegion={toRegion(center)}
        showsUserLocation
        showsMyLocationButton={false}
        scrollEnabled={!isLocked}
        zoomEnabled={!isLocked}
        rotateEnabled={!isLocked}
        pitchEnabled={!isLocked}
        onRegionChange={() => {
          if (step !== 'place') setMoving(true);
        }}
        onRegionChangeComplete={() => setMoving(false)}
        onPress={handleMapPress}
        onPoiClick={handlePoiClick}
      >
        {showCircle && destination && (
          <Circle
            center={destination.coords}
            radius={walkMeters}
            strokeColor={colors.primary}
            strokeWidth={2}
            fillColor="rgba(255,47,47,0.08)"
          />
        )}

        {/* Pin del destino (en broadcasting lo dibuja SearchPulse). */}
        {destination && step !== 'broadcasting' && (
          <FrozenMarker coordinate={destination.coords} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.destPin}>
              <View style={styles.destPinDot} />
            </View>
          </FrozenMarker>
        )}

        {pinCoords && step === 'place' && (
          <Marker
            coordinate={pinCoords}
            anchor={{ x: 0.5, y: 0.5 }}
            draggable
            onDragStart={() => setMoving(true)}
            onDragEnd={handlePinDragEnd}
          >
            <View style={styles.destPin}>
              <View style={styles.destPinDot} />
            </View>
          </Marker>
        )}

        {/* Garages privados: "E" blanca sobre fondo azul. */}
        {step === 'garages' &&
          garages.map((g) => {
            const selected = selectedGarageId === g.id;
            return (
              <FrozenMarker
                key={`${g.id}-${selected ? 'selected' : 'normal'}`}
                coordinate={g.coords}
                anchor={{ x: 0.5, y: 0.5 }}
                title={g.address}
                description={`Garage privado · ${formatDistance(g.distance)} · $${formatArs(
                  g.pricePerHour ?? 0
                )}/h`}
                onPress={() => selectGarage(g)}
              >
                <View style={[styles.garageBadge, selected && styles.garageBadgeSelected]}>
                  <Text style={styles.garageE}>E</Text>
                </View>
              </FrozenMarker>
            );
          })}
      </MapView>

      {/* Animación de búsqueda activa (alineada con el destino, sobre el panel). */}
      {step === 'broadcasting' && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { bottom: activeSheetHeight }]}>
          <SearchPulse pixelRadius={PULSE_PIXEL_RADIUS} />
        </View>
      )}

      {/* Barra superior: solo en idle. */}
      {step === 'idle' && (
        <View style={[styles.topBar, { top: insets.top + 12 }]}>
          <Pressable
            onPress={openSearch}
            style={({ pressed }) => [styles.searchBar, pressed && styles.pressed]}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>¿A dónde vamos?</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Profile')}
            style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
            hitSlop={8}
          >
            {avatar}
          </Pressable>
        </View>
      )}

      {/* Botón flotante: centrar en mi ubicación. */}
      {step === 'idle' && (
        <Pressable
          onPress={() => fetchLocation(true)}
          style={({ pressed }) => [
            styles.locateButton,
            { bottom: insets.bottom + 24 },
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <Crosshair size={26} />
        </Pressable>
      )}

      {/* --- Bottom sheets por paso --- */}
      {step === 'place' && (
        <Sheet onBack={resetSearch} {...sheetProps}>
          <Text style={styles.sheetEyebrow}>Elegí tu destino</Text>
          <Text style={styles.placeAddress} numberOfLines={2}>
            {moving || geocoding ? 'Ajustando ubicación…' : pinAddress ?? 'Sin dirección'}
          </Text>
          <Text style={styles.sheetBody}>Arrastrá el marcador para ajustar el punto exacto.</Text>
          <PrimaryButton
            title="Confirmar"
            onPress={confirmPlace}
            disabled={moving || geocoding || !pinCoords}
          />
        </Sheet>
      )}

      {step === 'range' && destination && (
        <Sheet onBack={backToPlace} {...sheetProps}>
          <Text style={styles.sheetEyebrow}>{destination.label}</Text>
          <Text style={styles.sheetTitle}>¿Cuánto estás{'\n'}dispuesto a caminar?</Text>
          <View style={styles.walkValueRow}>
            <Text style={styles.walkValue}>{formatDistance(walkMeters)}</Text>
            <Text style={styles.walkValueSub}>a la redonda</Text>
          </View>
          <MeterSlider
            value={walkMeters}
            min={WALK_MIN_M}
            max={WALK_MAX_M}
            step={WALK_STEP_M}
            onChange={setWalkMeters}
            onComplete={reframeWalk}
          />
          <View style={styles.walkRangeLabels}>
            <Text style={styles.walkRangeText}>{formatDistance(WALK_MIN_M)}</Text>
            <Text style={styles.walkRangeText}>{formatDistance(WALK_MAX_M)}</Text>
          </View>
          <PrimaryButton title="Aceptar" onPress={() => setStep('mode')} />
        </Sheet>
      )}

      {step === 'mode' && (
        <Sheet onBack={() => setStep('range')} {...sheetProps}>
          <Text style={styles.sheetTitle}>¿Qué estás buscando?</Text>
          <View style={styles.modeOptions}>
            <Pressable
              onPress={openGarageList}
              style={({ pressed }) => [styles.modeOption, pressed && styles.pressed]}
            >
              <View style={[styles.modeRail, { backgroundColor: GARAGE_BLUE }]} />
              <View style={styles.modeContent}>
                <Text style={styles.modeOverline}>Cocheras disponibles</Text>
                <Text style={styles.modeTitle}>Garage privado</Text>
                <Text style={styles.modeSub}>
                  Ver lugares publicados dentro del rango que marcaste.
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => {
                chooseHours(DEFAULT_HOURS);
                setStartTime(timeSlots[0]);
                setStep('trapito');
              }}
              style={({ pressed }) => [styles.modeOption, pressed && styles.pressed]}
            >
              <View style={[styles.modeRail, { backgroundColor: colors.primary }]} />
              <View style={styles.modeContent}>
                <Text style={styles.modeOverline}>Pedido a la zona</Text>
                <Text style={styles.modeTitle}>Trapito</Text>
                <Text style={styles.modeSub}>Avisar a personas cerca de tu destino.</Text>
              </View>
            </Pressable>
          </View>
        </Sheet>
      )}

      {step === 'garages' && (
        <Sheet onBack={backFromGarages} {...sheetProps}>
          {selectedGarage ? (
            <View style={styles.garageDetail}>
              <Text style={styles.sheetEyebrow} numberOfLines={1}>
                {selectedGarage.address}
              </Text>
              <Text style={styles.garageDetailTitle}>{selectedGarage.reportedBy}</Text>
              <View style={styles.garageDetailInfo}>
                <Text style={styles.garageDetailMetaText}>
                  🚶 {formatDistance(selectedGarage.distance)}
                </Text>
                {selectedGarage.openHours && (
                  <Text style={styles.garageDetailMetaText}>🕒 {selectedGarage.openHours}</Text>
                )}
              </View>

              <Text style={styles.fieldLabel}>¿A qué hora llegás?</Text>
              <TimeChips options={timeSlots} value={startTime} onChange={setStartTime} />

              <Text style={styles.fieldLabel}>¿Cuánto tiempo?</Text>
              <ChipRow
                options={HOUR_OPTIONS}
                value={hours}
                onChange={setHours}
                format={(h) => `${h} h`}
              />

              <View style={styles.garageTotalRow}>
                <Text style={styles.garageTotalLabel}>Total estimado</Text>
                <Text style={styles.garageTotalValue}>
                  ${formatArs((selectedGarage.pricePerHour ?? 0) * hours)}
                </Text>
              </View>
              <PrimaryButton title="Reservar garage" onPress={confirmGarageReservation} />
            </View>
          ) : (
            <>
              <Text style={styles.sheetTitle}>
                {garages.length} garage{garages.length === 1 ? '' : 's'} cerca
              </Text>
              {garages.length > 0 ? (
                <ScrollView
                  style={styles.garageScroll}
                  contentContainerStyle={styles.garageList}
                  showsVerticalScrollIndicator={false}
                >
                  {garages.map((garage) => (
                    <Pressable
                      key={garage.id}
                      onPress={() => selectGarage(garage)}
                      style={({ pressed }) => [styles.garageRow, pressed && styles.pressed]}
                    >
                      <View style={styles.garageRowMain}>
                        <Text style={styles.garageRowTitle}>{garage.reportedBy}</Text>
                        <Text style={styles.garageRowSub}>
                          {garage.address} · {formatDistance(garage.distance)}
                        </Text>
                        {garage.openHours && (
                          <Text style={styles.garageRowHours}>🕒 {garage.openHours}</Text>
                        )}
                      </View>
                      <View style={styles.garageRowPrice}>
                        <Text style={styles.garageRowPriceText}>
                          ${formatArs(garage.pricePerHour ?? 0)}
                        </Text>
                        <Text style={styles.garageRowPriceSub}>/ h</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.sheetBody}>
                  No hay garages dentro de tu zona. Probá ampliar cuánto caminás.
                </Text>
              )}
            </>
          )}
        </Sheet>
      )}

      {step === 'trapito' && (
        <Sheet onBack={() => setStep('mode')} {...sheetProps}>
          <Text style={styles.sheetTitle}>Armá tu pedido</Text>

          <Text style={styles.fieldLabel}>¿A qué hora llegás?</Text>
          <TimeChips options={timeSlots} value={startTime} onChange={setStartTime} />

          <Text style={styles.fieldLabel}>¿Cuánto tiempo te quedás?</Text>
          <ChipRow
            options={HOUR_OPTIONS}
            value={hours}
            onChange={chooseHours}
            format={(h) => `${h} h`}
          />

          <Text style={styles.fieldLabel}>¿Cuánto querés pagar?</Text>
          <View style={styles.priceRow}>
            <Pressable
              onPress={() => setPrice((p) => Math.max(0, p - PRICE_STEP))}
              style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <View style={styles.priceValue}>
              <Text style={styles.priceText}>
                {price === 0 ? 'Gratis' : `$${formatArs(price)}`}
              </Text>
              <Text style={styles.priceHint}>Sugerido ${formatArs(BASE_PER_HOUR * hours)}</Text>
            </View>
            <Pressable
              onPress={() => setPrice((p) => p + PRICE_STEP)}
              style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>

          {price !== 0 && (
            <Pressable onPress={() => setPrice(0)} hitSlop={8} style={styles.freeLink}>
              <Text style={styles.freeLinkText}>Pedir estacionar gratis</Text>
            </Pressable>
          )}

          <PrimaryButton title="Buscar estacionamiento" onPress={startBroadcasting} />
        </Sheet>
      )}

      {step === 'broadcasting' && destination && (
        <Sheet {...sheetProps}>
          <View style={styles.broadcastHeader}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.broadcastTitle}>Buscando estacionamiento…</Text>
          </View>
          <Text style={styles.sheetBody}>
            Avisamos a los trapitos cerca de {destination.label}. Te quedás {hours} h ·{' '}
            {price === 0 ? 'gratis' : `$${formatArs(price)}`}.
          </Text>
          <PrimaryButton title="Cancelar búsqueda" variant="secondary" onPress={resetSearch} />
        </Sheet>
      )}

      {/* Buscador de destino (Places autocomplete). */}
      {searchOpen && (
        <View style={StyleSheet.absoluteFill}>
          <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
            <View style={styles.searchHeader}>
              <Pressable onPress={closeSearch} hitSlop={10} style={styles.backButton}>
                <Text style={styles.backArrow}>←</Text>
              </Pressable>
              <TextInput
                style={styles.searchInput}
                placeholder="¿A dónde vamos?"
                placeholderTextColor={colors.textTertiary}
                value={query}
                onChangeText={setQuery}
                autoFocus
                returnKeyType="search"
              />
            </View>

            {query.trim().length < 3 ? (
              <FlatList
                data={recents}
                keyExtractor={(item, i) => `${item.label}-${i}`}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                  <>
                    <Pressable
                      onPress={useMyLocation}
                      style={({ pressed }) => [styles.locationRow, pressed && styles.pressed]}
                    >
                      <View style={styles.locationIcon}>
                        <Crosshair size={18} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.placeMain}>Usar mi ubicación actual</Text>
                        <Text style={styles.placeSecondary}>
                          Buscar estacionamiento cerca tuyo
                        </Text>
                      </View>
                    </Pressable>
                    {recents.length ? (
                      <Text style={styles.listHeader}>Búsquedas recientes</Text>
                    ) : null}
                  </>
                }
                ListEmptyComponent={
                  <Text style={styles.empty}>
                    Escribí una dirección o un lugar para buscar.
                  </Text>
                }
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => pickRecent(item)}
                    style={({ pressed }) => [styles.placeRow, pressed && styles.pressed]}
                  >
                    <Text style={styles.placePin}>🕘</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.placeMain} numberOfLines={1}>
                        {item.label}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            ) : (
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.placeId}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                  searching ? (
                    <View style={styles.searchHint}>
                      <ActivityIndicator color={colors.primary} />
                    </View>
                  ) : (
                    <Text style={styles.empty}>
                      No encontramos ese lugar. Probá con otra dirección.
                    </Text>
                  )
                }
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => pickPrediction(item)}
                    style={({ pressed }) => [styles.placeRow, pressed && styles.pressed]}
                  >
                    <Text style={styles.placePin}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.placeMain} numberOfLines={1}>
                        {item.mainText}
                      </Text>
                      {!!item.secondaryText && (
                        <Text style={styles.placeSecondary} numberOfLines={1}>
                          {item.secondaryText}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                )}
              />
            )}
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

/**
 * Marker con vista custom que evita el titileo en Android: arranca con
 * `tracksViewChanges` en true (para que se dibuje la vista) y lo apaga al toque,
 * así deja de redibujarse en loop. El pin sigue moviéndose con el mapa.
 */
function FrozenMarker(props: React.ComponentProps<typeof Marker>) {
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTracks(false), 800);
    return () => clearTimeout(t);
  }, []);
  return <Marker {...props} tracksViewChanges={tracks} />;
}

/** Tarjeta inferior reutilizable para los pasos del flujo. */
function Sheet({
  children,
  onBack,
  insetBottom,
  onHeightChange,
}: {
  children: React.ReactNode;
  onBack?: () => void;
  insetBottom: number;
  onHeightChange?: (height: number) => void;
}) {
  return (
    <View
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}
      style={[styles.sheet, { paddingBottom: insetBottom + 20 }]}
    >
      {onBack && (
        <Pressable onPress={onBack} hitSlop={10} style={styles.sheetBack}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
      )}
      {children}
    </View>
  );
}

/** Fila de chips seleccionables (rango de caminata, tiempo). */
function ChipRow({
  options,
  value,
  onChange,
  format,
}: {
  options: number[];
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {format(opt)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Fila horizontal scrolleable de horarios ("HH:mm"). */
function TimeChips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.timeChipRow}
    >
      {options.map((opt, i) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {i === 0 ? `Ahora · ${opt}` : opt}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const FLOATING_SHADOW = shadows.floating;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { ...typography.small, color: colors.textMuted },

  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 10,
    ...FLOATING_SHADOW,
  },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { ...typography.small, color: colors.textTertiary, flex: 1 },

  profileButton: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...FLOATING_SHADOW,
  },
  avatar: { width: 52, height: 52, borderRadius: radius.pill },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  avatarInitial: { color: colors.onPrimary, fontSize: 20, fontWeight: '800' },

  locateButton: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...FLOATING_SHADOW,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },

  // --- Marcadores ---
  destPin: {
    width: DEST_PIN_SIZE,
    height: DEST_PIN_SIZE,
    borderRadius: DEST_PIN_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    ...shadows.floating,
  },
  destPinDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  garageBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: GARAGE_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.floating,
  },
  garageBadgeSelected: {
    backgroundColor: colors.primary,
  },
  garageE: { color: colors.white, fontWeight: '800', fontSize: 16 },

  // --- Bottom sheet ---
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.screenH,
    paddingTop: 12,
    gap: 14,
    ...shadows.modal,
  },
  sheetBack: { alignSelf: 'flex-start', paddingVertical: 2 },
  sheetEyebrow: { ...typography.small, color: colors.primary },
  sheetTitle: { ...typography.titleLg, fontSize: 26, lineHeight: 30, color: colors.text },
  sheetBody: { ...typography.body, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  placeAddress: { ...typography.titleMd, fontSize: 19, color: colors.text },

  // --- Slider de caminata ---
  walkValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  walkValue: { ...typography.titleLg, fontSize: 30, color: colors.primary },
  walkValueSub: { ...typography.small, color: colors.textMuted },
  walkRangeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  walkRangeText: { ...typography.small, fontSize: 12, color: colors.textTertiary },

  // --- Chips ---
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.small, color: colors.text },
  chipTextActive: { color: colors.onPrimary, fontWeight: '700' },
  timeChipRow: { flexDirection: 'row', gap: 10, paddingRight: 4 },

  // --- Modo: garage / trapito ---
  modeOptions: { gap: 10 },
  modeOption: {
    minHeight: 92,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  modeRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  modeContent: {
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 16,
  },
  modeOverline: { ...typography.small, fontSize: 12, lineHeight: 16, color: colors.textTertiary },
  modeTitle: { ...typography.titleMd, fontSize: 18, lineHeight: 23, color: colors.text, marginTop: 3 },
  modeSub: { ...typography.small, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 4 },

  // --- Garages ---
  garageScroll: { maxHeight: SCREEN_H * 0.42 },
  garageList: { gap: 8, paddingBottom: 4 },
  garageDetail: { gap: 10 },
  garageDetailTitle: { ...typography.titleLg, fontSize: 22, lineHeight: 26, color: colors.text },
  garageDetailInfo: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 2 },
  garageRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
  },
  garageRowMain: { flex: 1 },
  garageRowTitle: {
    ...typography.titleMd,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  garageRowSub: {
    ...typography.small,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 2,
  },
  garageRowHours: {
    ...typography.small,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textTertiary,
    marginTop: 2,
  },
  garageRowPrice: { alignItems: 'flex-end' },
  garageRowPriceText: {
    ...typography.titleMd,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  garageRowPriceSub: {
    ...typography.small,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textTertiary,
  },
  garageDetailMetaText: {
    ...typography.small,
    color: colors.textMuted,
  },
  garageTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  garageTotalLabel: { ...typography.small, color: colors.textMuted },
  garageTotalValue: { ...typography.titleMd, fontSize: 20, color: colors.text },

  // --- Precio ---
  fieldLabel: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.input,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 26, fontWeight: '700', color: colors.text },
  priceValue: { flex: 1, alignItems: 'center' },
  priceText: { ...typography.titleLg, fontSize: 28, color: colors.text },
  priceHint: { ...typography.small, fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  freeLink: { alignSelf: 'center', paddingVertical: 2 },
  freeLinkText: { ...typography.small, color: colors.primary, textDecorationLine: 'underline' },

  // --- Broadcasting ---
  broadcastHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  broadcastTitle: { ...typography.titleMd, fontSize: 19, color: colors.text },

  // --- Overlay buscador ---
  overlay: { flex: 1, backgroundColor: colors.backgroundAlt },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  backArrow: { fontSize: 24, color: colors.text },
  searchInput: {
    flex: 1,
    height: spacing.inputHeight,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.inputPaddingH,
    fontSize: 15,
    color: colors.text,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 4 },
  listHeader: { ...typography.small, color: colors.textMuted, paddingVertical: 8, paddingHorizontal: 4 },
  searchHint: { paddingTop: 32, alignItems: 'center' },
  empty: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  placePin: { fontSize: 18 },
  placeMain: { ...typography.titleMd, fontSize: 15, lineHeight: 20, color: colors.text },
  placeSecondary: { ...typography.small, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.alertSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
