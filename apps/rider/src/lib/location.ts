/**
 * Background GPS location service for RiderApp
 *
 * Uses @capacitor-community/background-geolocation when available (native),
 * falls back to @capacitor/geolocation foreground watch (web / fallback).
 *
 * Plan rules (R6):
 *  - Send location ONLY while rider is online AND has an active delivery
 *  - Every 5–10 seconds (not 1-metre trigger)
 *  - Send through the socket (not REST)
 *  - Location stored in Redis on server, NOT MongoDB
 */
import { isNative } from './platform';

type LocationCallback = (lat: number, lng: number) => void;

let watchId: string | null = null;
let bgPlugin: any = null;

export async function startLocationTracking(
  orderId: string,
  onLocation: LocationCallback,
): Promise<void> {
  await stopLocationTracking(); // clean up any previous watch

  if (isNative()) {
    try {
      // Try background geolocation first (works with screen off)
      const mod = await import('@capacitor-community/background-geolocation');
      bgPlugin = mod.BackgroundGeolocation;

      await bgPlugin.addListener('location', (loc: { latitude: number; longitude: number }) => {
        onLocation(loc.latitude, loc.longitude);
      });

      await bgPlugin.start();
      console.log('[Location] Background geolocation started');
      return;
    } catch {
      console.warn('[Location] Background geo not available, falling back to foreground');
    }

    // Fallback: foreground watch (works while screen is on)
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const id = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000 },
        (pos) => {
          if (pos) onLocation(pos.coords.latitude, pos.coords.longitude);
        },
      );
      watchId = id;
      return;
    } catch (err) {
      console.error('[Location] Geolocation error:', err);
    }
  } else {
    // Web fallback for development
    if (!navigator.geolocation) {
      console.warn('[Location] Geolocation not supported');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => onLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => console.warn('[Location] Web geo error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
    watchId = String(id);
  }
}

export async function stopLocationTracking(): Promise<void> {
  if (bgPlugin) {
    try {
      await bgPlugin.stop();
      await bgPlugin.removeAllListeners();
    } catch {
      /* ignore */
    }
    bgPlugin = null;
  }

  if (watchId !== null) {
    if (isNative()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        await Geolocation.clearWatch({ id: watchId });
      } catch {
        /* ignore */
      }
    } else {
      navigator.geolocation.clearWatch(Number(watchId));
    }
    watchId = null;
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const perm = await Geolocation.requestPermissions();
      return perm.location === 'granted';
    } catch {
      return false;
    }
  }
  return true; // browser handles its own permission flow
}
