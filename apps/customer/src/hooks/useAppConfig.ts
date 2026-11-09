import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { QK } from '@/api/queryKeys';

/** Shape of GET /app-config (only what the customer app reads). */
export interface AppConfig {
  maintenanceMode?: boolean;
  minVersion?: string;
  deliveryFeePaisa?: number | null;
  freeDeliveryOverPaisa?: number | null;
}

/**
 * The one /app-config query. App.tsx, CartScreen and the menu all call this, so
 * they share a single cache entry and a single request. Before, the key was
 * typed inline in two files.
 */
export function useAppConfig() {
  return useQuery<AppConfig>({
    queryKey: QK.appConfig,
    queryFn:  () => api.get('/app-config').then(r => r.data),
    staleTime: 5 * 60_000,
  });
}
