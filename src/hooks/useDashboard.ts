import { useQuery } from '@tanstack/react-query';
import { getDashboard, getThisMonth } from '@/api/dashboard.api';

export function useDashboard(month: number, year: number) {
  return useQuery({
    queryKey: ['dashboard', { month, year }],
    queryFn: () => getDashboard(month, year),
    staleTime: 1000 * 60 * 2,
  });
}

export function useThisMonth() {
  return useQuery({
    queryKey: ['dashboard', 'this-month'],
    queryFn: getThisMonth,
    staleTime: 1000 * 60 * 2,
  });
}
