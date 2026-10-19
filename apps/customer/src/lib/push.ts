/**
 * FCM Push Notification registration for CustomerApp
 *
 * Call initPush() once after login to register for push notifications.
 * On native (Capacitor), uses @capacitor/push-notifications.
 * On web, silently no-ops.
 */
import { isNative } from './platform';
import api from './api';

export async function initPush(): Promise<void> {
  if (!isNative()) return; // Web doesn't use FCM

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Request permission (Android 13+ requires explicit request)
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== 'granted') {
      console.warn('[Push] Permission not granted');
      return;
    }

    await PushNotifications.register();

    // When we get an FCM token, save it to the server
    PushNotifications.addListener('registration', async (token) => {
      console.log('[Push] FCM token:', token.value.slice(0, 20) + '…');
      try {
        await api.post('/users/me/fcm-token', { fcmToken: token.value, platform: 'android' });
      } catch (err) {
        console.warn('[Push] Failed to save FCM token', err);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push] Registration error:', err);
    });

    // Handle foreground push — show as in-app notification
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Foreground notification:', notification.title);
      // In-app toast handled by the app's own socket events — ignore duplicates
    });

    // Handle tap on push notification — navigate to the right screen
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action.notification.data;
      if (data?.orderId) {
        window.location.hash = `#/orders/${data.orderId}`;
      }
    });
  } catch (err) {
    console.warn('[Push] Failed to initialize:', err);
  }
}

export async function clearPushToken(): Promise<void> {
  if (!isNative()) return;
  try {
    await api.delete('/users/me/fcm-token');
  } catch {
    // Ignore — token cleanup is best-effort
  }
}
