import { api } from '@/lib/axios';
import type { BillingStatus, Plan, SubscribeInput } from '@/types/billing';

export const getBillingStatus = () =>
  api.get<{ data: BillingStatus }>('/billing/status').then((r) => r.data.data);

export const getPlans = () =>
  api.get<{ data: Plan[] }>('/billing/plans').then((r) => r.data.data);

export const subscribeToPlan = (data: SubscribeInput) =>
  api.post<{ data: { subscription_id: string; payment_link: string } }>('/billing/subscribe', data).then((r) => r.data.data);
