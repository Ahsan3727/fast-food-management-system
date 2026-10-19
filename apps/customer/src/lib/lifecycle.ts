/**
 * App resume + network reconnect handler for CustomerApp (Capacitor)
 *
 * On native Android:
 *  - App pause/resume → reconnect socket and refetch active data
 *  - Network offline/online → reconnect socket
 *
 * Register once in App.tsx after the socket is ready.
 */
import { isNative } from './platform';

export function registerAppLifecycle(
  reconnectSocket: () => void,
  refetchActiveOrder: () => void,
): () => void {
  const cleanups: Array<() => void> = [];

  if (!isNative()) return () => {};

  // App state change (foreground/background)
  import('@capacitor/app').then(({ App }) => {
    const listener = App.addListener('appStateChange', (state) => {
      if (state.isActive) {
        // App came to foreground — reconnect socket + refetch current state
        reconnectSocket();
        refetchActiveOrder();
      }
    });
    listener.then((handle) => cleanups.push(() => handle.remove()));
  });

  // Network status change
  import('@capacitor/network').then(({ Network }) => {
    const listener = Network.addListener('networkStatusChange', (status) => {
      if (status.connected) {
        reconnectSocket();
      }
    });
    listener.then((handle) => cleanups.push(() => handle.remove()));
  });

  return () => cleanups.forEach((fn) => fn());
}
