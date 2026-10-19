/**
 * Platform detection helpers for Capacitor + web
 *
 * Use these instead of checking `navigator.userAgent` directly.
 * They work both in Capacitor (native) and plain browser.
 */

let _isNative: boolean | null = null;

export function isNative(): boolean {
  if (_isNative !== null) return _isNative;
  try {
    // Capacitor sets window.Capacitor when running inside a native app
    _isNative = !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    _isNative = false;
  }
  return _isNative;
}

export function isAndroid(): boolean {
  if (!isNative()) return false;
  try {
    return (window as any).Capacitor?.getPlatform?.() === 'android';
  } catch {
    return false;
  }
}

export function isWeb(): boolean {
  return !isNative();
}

/** Open a URL — uses @capacitor/browser on native, window.open on web */
export async function openUrl(url: string): Promise<void> {
  if (isNative()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
      return;
    } catch {
      // fallback
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Open Google Maps directions (Rider → Restaurant or Restaurant → Customer) */
export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
