import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';

import { Crosshair } from '../components/Crosshair';
import { useAuth } from '../context/AuthContext';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { buildMockParkings, ParkingSpotWithCoords } from '../data/mockParkings';
import { distanceInMeters, formatDistance, Coords } from '../utils/distance';
import type { AppScreenProps } from '../navigation/types';

// En Android usamos Google Maps; en iOS dejamos Apple Maps.
const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

type Props = AppScreenProps<'Map'>;
type SpotWithDistance = ParkingSpotWithCoords & { distance: number };

const RADIUS_METERS = 500;
const FALLBACK: Coords = { latitude: -34.6037, longitude: -58.3816 }; // Obelisco, BA

function toRegion(c: Coords, delta = 0.012): Region {
  return {
    latitude: c.latitude,
    longitude: c.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export function MapScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<Coords | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Pide la ubicación y, si `animate`, mueve la cámara hacia ella.
  // `animate` también distingue la carga inicial (silenciosa) del botón de centrar.
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
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
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
  }, []);

  const nearby: SpotWithDistance[] = useMemo(() => {
    if (!center) return [];
    return buildMockParkings(center)
      .map((spot) => ({ ...spot, distance: distanceInMeters(center, spot.coords) }))
      .filter((spot) => spot.distance <= RADIUS_METERS)
      .sort((a, b) => a.distance - b.distance);
  }, [center]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nearby;
    return nearby.filter(
      (s) =>
        s.address.toLowerCase().includes(q) || s.reportedBy.toLowerCase().includes(q)
    );
  }, [nearby, query]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
  };

  // Centra el mapa en un estacionamiento elegido de la lista y cierra el buscador.
  const goToSpot = (spot: SpotWithDistance) => {
    closeSearch();
    mapRef.current?.animateToRegion(toRegion(spot.coords, 0.006), 600);
  };

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

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={MAP_PROVIDER}
        initialRegion={toRegion(center)}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {nearby.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={spot.coords}
            title={spot.address}
            description={`${spot.type === 'garage' ? 'Cochera' : 'Lugar en la calle'} · ${formatDistance(
              spot.distance
            )}`}
            pinColor={spot.type === 'garage' ? colors.accent : colors.success}
          />
        ))}
      </MapView>

      {/* Barra superior: buscador + perfil */}
      <View style={[styles.topBar, { top: insets.top + 12 }]}>
        <Pressable
          onPress={() => setSearchOpen(true)}
          style={({ pressed }) => [styles.searchBar, pressed && styles.pressed]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Buscar estacionamientos cerca</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
          hitSlop={8}
        >
          {avatar}
        </Pressable>
      </View>

      {/* Botón flotante: centrar en mi ubicación */}
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

      {/* Buscador abierto: lista de estacionamientos cercanos */}
      {searchOpen && (
        <View style={StyleSheet.absoluteFill}>
          <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
            <View style={styles.searchHeader}>
              <Pressable onPress={closeSearch} hitSlop={10} style={styles.backButton}>
                <Text style={styles.backArrow}>←</Text>
              </Pressable>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por dirección o quién lo liberó…"
                placeholderTextColor={colors.textTertiary}
                value={query}
                onChangeText={setQuery}
                autoFocus
                returnKeyType="search"
              />
            </View>

            <Text style={styles.resultsHeader}>
              {filtered.length} lugar{filtered.length === 1 ? '' : 'es'} dentro de{' '}
              {RADIUS_METERS} m
            </Text>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  No hay estacionamientos que coincidan con tu búsqueda.
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => goToSpot(item)}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <ParkingRow spot={item} />
                </Pressable>
              )}
            />
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

function ParkingRow({ spot }: { spot: SpotWithDistance }) {
  const isGarage = spot.type === 'garage';
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: isGarage ? colors.chipWarm : colors.alertSoft }]}>
        <Text style={styles.rowEmoji}>{isGarage ? '🏢' : '🚙'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{spot.address}</Text>
        <Text style={styles.rowSub}>
          {isGarage ? 'Cochera' : `Liberado por ${spot.reportedBy}`} · hace {spot.minutesAgo} min
        </Text>
      </View>
      <View style={styles.distancePill}>
        <Text style={styles.distanceText}>{formatDistance(spot.distance)}</Text>
      </View>
    </View>
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
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
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
  resultsHeader: {
    ...typography.small,
    paddingHorizontal: spacing.screenH,
    paddingBottom: 8,
    color: colors.textMuted,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  empty: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmoji: { fontSize: 22 },
  rowTitle: { ...typography.titleMd, fontSize: 15, lineHeight: 20, color: colors.text },
  rowSub: { ...typography.small, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  distancePill: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  distanceText: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
