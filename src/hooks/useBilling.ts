import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as billingApi from '@/api/billing.api';
import type { SubscribeInput } from '@/types/billing';

export function useBillingStatus() {
  return useQuery({
    queryKey: ['billing', 'status'],
    queryFn: billingApi.getBillingStatus,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: billingApi.getPlans,
    staleTime: 1000 * 60 * 60, // plans rarely change
  });
}

export function useSubscribe() {
  return useMutation({
    mutationFn: (data: SubscribeInput) => billingApi.subscribeToPlan(data),
    onSuccess: (data) => {
      window.open(data.payment_link, '_blank');
      toast.success('Opening payment page. Complete payment to activate your plan.');
    },
    onError: (err: { displayMessage?: string }) =>
      toast.error(err.displayMessage ?? 'Could not start subscription.'),
  });
}
