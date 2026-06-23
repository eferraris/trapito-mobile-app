// Configuración dinámica de Expo.
//
// Toma toda la config estática de app.json y le inyecta la API key de Google
// Maps (Android) desde una variable de entorno (.env) para no commitearla.
// La key se lee en tiempo de build y queda embebida en el código nativo
// (AndroidManifest.xml), así que después de cambiarla hay que recompilar el
// dev build: `npx expo run:android --device`.
//
// iOS no necesita key: usa Apple Maps (provider undefined en react-native-maps).
//
// Ver .env.example para el nombre de la variable.
const appJson = require('./app.json');

module.exports = () => {
  const config = appJson.expo;

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          ...config.android?.config?.googleMaps,
          apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY,
        },
      },
    },
  };
};
