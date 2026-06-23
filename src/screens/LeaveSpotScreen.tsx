import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

// En Android usamos Google Maps; en iOS dejamos Apple Maps (funciona en Expo Go sin key).
const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
import * as Location from 'expo-location';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import type { AppScreenProps } from '../navigation/types';
import type { Coords } from '../utils/distance';

type Props = AppScreenProps<'LeaveSpot'>;

const FALLBACK: Coords = { latitude: -34.6037, longitude: -58.3816 }; // Obelisco, BA

export function LeaveSpotScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [pin, setPin] = useState<Coords>(FALLBACK);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permiso de ubicación',
            'Sin acceso a tu ubicación usamos una posición por defecto. Podés mover el pin igual.'
          );
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setPin(coords);
        mapRef.current?.animateToRegion(toRegion(coords), 600);
      } catch {
        // Nos quedamos con el fallback.
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  const confirm = () => {
    setSubmitting(true);
    // Mockup: sin backend. Simulamos el envío.
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        '¡Lugar publicado! 🎉',
        `Avisamos que estás liberando tu lugar.\n\nUbicación: ${pin.latitude.toFixed(
          5
        )}, ${pin.longitude.toFixed(5)}`,
        [{ text: 'Listo', onPress: () => navigation.goBack() }]
      );
    }, 700);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={MAP_PROVIDER}
          initialRegion={toRegion(pin)}
          showsUserLocation
          onPress={(e) => setPin(e.nativeEvent.coordinate)}
        >
          <Marker
            coordinate={pin}
            draggable
            onDragEnd={(e) => setPin(e.nativeEvent.coordinate)}
            title="Tu auto está acá"
            description="Arrastrá el pin para ajustar"
          />
        </MapView>

        {loadingLocation && (
          <View style={styles.loadingBadge}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Buscando tu ubicación…</Text>
          </View>
        )}
      </View>

      <View style={styles.sheet}>
        <Text style={styles.title}>Confirmá la ubicación</Text>
        <Text style={styles.help}>
          Tocá el mapa o arrastrá el pin para marcar dónde está tu auto.
        </Text>

        <PrimaryButton
          title="Confirmar que libero el lugar"
          icon="✅"
          onPress={confirm}
          loading={submitting}
        />
      </View>
    </SafeAreaView>
  );
}

function toRegion(c: Coords): Region {
  return {
    latitude: c.latitude,
    longitude: c.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  mapWrap: { flex: 1 },
  loadingBadge: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingText: { color: colors.text, fontWeight: '600' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  help: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
});
