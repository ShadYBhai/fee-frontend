import { api } from '@/lib/axios';
import type { DashboardData, ThisMonthData } from '@/types/dashboard';

export const getDashboard = (month: number, year: number) =>
  api.get<{ data: DashboardData }>('/dashboard', { params: { month, year } }).then((r) => r.data.data);

export const getThisMonth = () =>
  api.get<{ data: ThisMonthData }>('/dashboard/this-month').then((r) => r.data.data);
