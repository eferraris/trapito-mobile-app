# Estacionate 🅿️

App mobile (React Native + Expo) para **avisar que liberás tu lugar** y **buscar
estacionamiento cerca**. Por ahora es un **mockup sin backend**: los datos de
estacionamientos son mockeados y el login real se resuelve con **Supabase** (Google).

Funciona en **Android** e **iOS**.

---

## 🚀 Cómo correrlo

```bash
npm install
npm start          # abre Expo. Escaneá el QR con la app Expo Go
# o directo:
npm run android
npm run ios        # requiere macOS
```

> Sin configurar nada podés tocar **"Entrar en modo demo"** en el login y probar
> toda la app (mapas, pin, foto, listado a 500 m). El login con Google aparece
> siempre, pero recién funciona cuando completás el paso de Supabase de abajo.

---

## 🧩 Qué incluye

- **Login** (`LoginScreen`): botón Google (Supabase OAuth) + modo demo.
- **Home** (`HomeScreen`): dos accesos: "Estoy sacando mi auto" / "Buscar estacionamiento".
- **Sacar auto** (`LeaveSpotScreen`): mapa centrado en tu ubicación real, **pin
  arrastrable** para confirmar, y **foto opcional** con la cámara.
- **Buscar** (`FindParkingScreen`): lista los lugares mockeados **a 500 m a la
  redonda** (filtro real por distancia Haversine), con mapa + radio.

Estructura:

```
src/
  config/env.ts          # lee las variables de entorno
  lib/supabase.ts        # cliente Supabase (o null si no está configurado)
  context/AuthContext.tsx# login Google + demo + persistencia de sesión
  navigation/            # stack de navegación
  screens/               # Login, Home, LeaveSpot, FindParking
  data/mockParkings.ts   # estacionamientos mockeados (offsets en metros)
  utils/distance.ts      # cálculo de distancia y formato
  components/             # UI reutilizable
```

---

## 🔐 Configurar el login con Supabase (paso a paso)

### 1. Crear el proyecto en Supabase
1. Entrá a https://supabase.com → **New project**.
2. Cuando termine, andá a **Project Settings → API** y copiá:
   - **Project URL** → va en `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → va en `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   > Usá SIEMPRE la `anon public`. La `service_role` NUNCA va en la app.

### 2. Crear las credenciales de Google (Google Cloud)
1. Entrá a https://console.cloud.google.com → creá/seleccioná un proyecto.
2. **APIs & Services → OAuth consent screen**: configurá la pantalla (External),
   agregá tu email como test user.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Tipo: **Web application**.
   - En **Authorized redirect URIs** agregá la URL de callback de Supabase:
     ```
     https://TU-PROYECTO.supabase.co/auth/v1/callback
     ```
4. Guardá y copiá el **Client ID** y el **Client secret**.

### 3. Activar Google en Supabase
1. En Supabase: **Authentication → Sign In / Providers → Google** → activalo.
2. Pegá el **Client ID** y **Client secret** del paso anterior. Guardá.

### 4. Configurar los Redirect URLs de la app en Supabase
En **Authentication → URL Configuration → Redirect URLs**, agregá:
```
estacionate://auth-callback
```
(Es el deep link que usa la app; coincide con `"scheme": "estacionate"` en `app.json`.)

### 5. Completar las variables de entorno
```bash
cp .env.example .env
```
Editá `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (tu anon public key)
```
Reiniciá Expo con `npm start -c` (la `-c` limpia la caché para tomar el `.env`).

### Resumen de qué dato sacás y de dónde
| Dato | Dónde lo sacás | Dónde lo ponés |
|------|----------------|----------------|
| Project URL | Supabase → Settings → API | `.env` → `EXPO_PUBLIC_SUPABASE_URL` |
| anon public key | Supabase → Settings → API | `.env` → `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| Client ID / Secret de Google | Google Cloud → Credentials | Supabase → Auth → Provider Google |
| Redirect `estacionate://auth-callback` | (lo definís vos) | Supabase → Auth → URL Configuration |
| Callback `.../auth/v1/callback` | (lo definís vos) | Google Cloud → Authorized redirect URIs |

---

## 🗺️ Google Maps (para builds nativos)

- **En Expo Go**: el mapa funciona sin hacer nada (iOS usa Apple Maps; Android usa
  la key de Expo Go).
- **En un dev build / build de producción Android**: necesitás tu propia
  **Google Maps API key** (habilitá *Maps SDK for Android* / *for iOS* en Google
  Cloud) y reemplazá los placeholders `REEMPLAZAR_CON_TU_..._GOOGLE_MAPS_API_KEY`
  en `app.json`.

> ⚠️ El login con Google por deep link funciona de forma más confiable en un
> **dev build** (`npx expo run:android` / `run:ios` o EAS). En Expo Go puede fallar
> el redirect; para probar la UI usá el **modo demo**.

---

## 🔭 Próximos pasos (cuando tengas backend)
- Reemplazar `data/mockParkings.ts` por llamadas reales (Supabase Postgres + PostGIS
  para la búsqueda por radio, o tu API).
- Persistir el lugar liberado (coords + foto) al confirmar en `LeaveSpotScreen`.
- Subir la foto a Supabase Storage.
