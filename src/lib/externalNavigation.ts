import { Alert, Linking, Platform } from 'react-native';

import type { Coords } from '../utils/distance';

type NavigationTarget = {
  coords?: Coords;
  label: string;
  address?: string;
};

function destinationQuery(target: NavigationTarget): string {
  if (target.coords) {
    return `${target.coords.latitude},${target.coords.longitude}`;
  }
  return [target.address, target.label].filter(Boolean).join(', ');
}

function googleMapsUrl(target: NavigationTarget): string {
  const destination = encodeURIComponent(destinationQuery(target));
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
}

function platformNavigationUrl(target: NavigationTarget): string {
  const query = destinationQuery(target);

  if (Platform.OS === 'android') {
    if (target.coords) {
      return `geo:0,0?q=${query}(${encodeURIComponent(target.label)})`;
    }
    return `geo:0,0?q=${encodeURIComponent(query)}`;
  }

  if (Platform.OS === 'ios') {
    return `https://maps.apple.com/?daddr=${encodeURIComponent(query)}&dirflg=d`;
  }

  return googleMapsUrl(target);
}

export async function openInDefaultNavigator(target: NavigationTarget): Promise<void> {
  const primaryUrl = platformNavigationUrl(target);
  const fallbackUrl = googleMapsUrl(target);

  try {
    await Linking.openURL(primaryUrl);
  } catch {
    try {
      await Linking.openURL(fallbackUrl);
    } catch {
      Alert.alert(
        'No pudimos abrir el navegador',
        'Probá de nuevo o buscá la dirección manualmente en tu app de mapas.'
      );
    }
  }
}
