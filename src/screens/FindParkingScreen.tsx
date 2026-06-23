import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// En Android usamos Google Maps; en iOS dejamos Apple Maps (funciona en Expo Go sin key).
const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
import * as Location from 'expo-location';

import { colors } from '../theme/colors';
import { buildMockParkings, ParkingSpotWithCoords } from '../data/mockParkings';
import { distanceInMeters, formatDistance, Coords } from '../utils/distance';
import type { AppScreenProps } from '../navigation/types';

type Props = AppScreenProps<'FindParking'>;

const RADIUS_METERS = 500;
const FALLBACK: Coords = { latitude: -34.6037, longitude: -58.3816 };

type SpotWithDistance = ParkingSpotWithCoords & { distance: number };

export function FindParkingScreen(_props: Props) {
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<Coords | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setCenter(FALLBACK);
          Alert.alert(
            'Permiso de ubicación',
            'Sin tu ubicación mostramos lugares cerca de una posición por defecto.'
          );
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCenter({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch {
        setCenter(FALLBACK);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const nearby: SpotWithDistance[] = useMemo(() => {
    if (!center) return [];
    return buildMockParkings(center)
      .map((spot) => ({ ...spot, distance: distanceInMeters(center, spot.coords) }))
      .filter((spot) => spot.distance <= RADIUS_METERS)
      .sort((a, b) => a.distance - b.distance);
  }, [center]);

  if (loading || !center) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Buscando lugares cerca tuyo…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.mapWrap}>
        <MapView
          style={StyleSheet.absoluteFill}
          provider={MAP_PROVIDER}
          initialRegion={{
            ...center,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          }}
          showsUserLocation
        >
          <Circle
            center={center}
            radius={RADIUS_METERS}
            strokeColor={colors.primary}
            fillColor="rgba(14,165,233,0.12)"
          />
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
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {nearby.length} lugar{nearby.length === 1 ? '' : 'es'} a {RADIUS_METERS} m
        </Text>
        <Text style={styles.listSub}>Ordenados por cercanía</Text>
      </View>

      <FlatList
        data={nearby}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No hay lugares disponibles en este momento dentro de los 500 metros.
          </Text>
        }
        renderItem={({ item }) => <ParkingRow spot={item} />}
      />
    </SafeAreaView>
  );
}

function ParkingRow({ spot }: { spot: SpotWithDistance }) {
  const isGarage = spot.type === 'garage';
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: isGarage ? '#FEF3C7' : '#DCFCE7' },
        ]}
      >
        <Text style={styles.rowEmoji}>{isGarage ? '🏢' : '🚙'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{spot.address}</Text>
        <Text style={styles.rowSub}>
          {isGarage ? 'Cochera' : `Liberado por ${spot.reportedBy}`} · hace{' '}
          {spot.minutesAgo} min
        </Text>
      </View>
      <View style={styles.distancePill}>
        <Text style={styles.distanceText}>{formatDistance(spot.distance)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.textMuted, fontSize: 15 },
  mapWrap: { height: '40%' },
  listHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  listTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  listSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmoji: { fontSize: 22 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  distancePill: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  distanceText: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
