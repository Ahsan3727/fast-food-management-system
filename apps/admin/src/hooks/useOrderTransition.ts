import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { queryKeys } from '@/api/queryKeys';
import { OrderStatus } from '@fastfood/shared-types';

interface TransitionParams {
  orderId: string;
  status: OrderStatus | string;
  note?: string;
}

export function useOrderTransition(options?: {
  onSuccess?: (data: any, variables: TransitionParams) => void;
  onError?: (error: any, variables: TransitionParams) => void;
}) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, note }: TransitionParams) => {
      const res = await api.patch(`/orders/${orderId}/status`, { status, note });
      return res.data;
    },
    onMutate: async ({ orderId, status, note }) => {
      // Cancel outgoing queries
      await qc.cancelQueries({ queryKey: queryKeys.orders.all });

      // Snapshot previous values
      const prevData = qc.getQueryData<any>(queryKeys.orders.detail(orderId));

      // Optimistically update order detail if cached
      if (prevData) {
        qc.setQueryData(queryKeys.orders.detail(orderId), {
          ...prevData,
          status,
          updatedAt: new Date().toISOString(),
        });
      }

      return { prevData, orderId };
    },
    onError: (err: any, variables, context) => {
      if (context?.prevData && context?.orderId) {
        qc.setQueryData(queryKeys.orders.detail(context.orderId), context.prevData);
      }
      const message =
        err?.response?.data?.message || err?.message || 'Failed to update order status';
      toast.error(message);
      options?.onError?.(err, variables);
    },
    onSuccess: (data, variables) => {
      const statusLabel = String(variables.status).replace(/_/g, ' ');
      toast.success(`Order #${data?.orderNumber || ''} moved to ${statusLabel}`);
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      qc.invalidateQueries({ queryKey: queryKeys.stats.overview() });
      qc.invalidateQueries({ queryKey: queryKeys.orders.placedCount });
      options?.onSuccess?.(data, variables);
    },
  });
}
