import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fastfood.customer',
  appName: 'FastFood',
  webDir: 'dist',
  // Production: set server.url to your deployed API
  // For local dev with a real phone on same wifi, set server.url to your machine IP
  // e.g. server: { url: 'http://192.168.1.x:5173', cleartext: true }
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f97316',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Geolocation: {
      permissions: ['location'],
    },
  },
  android: {
    allowMixedContent: false,  // HTTPS only in production
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true only for debug builds
  },
};

export default config;
