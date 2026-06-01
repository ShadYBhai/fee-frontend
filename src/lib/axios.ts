import axios from 'axios';
import { toast } from 'sonner';
import { env } from '@/config/env';

export const api = axios.create({
  baseURL: `${env.apiUrl}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token on every request — same pattern as OLA portals
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('feeflow-auth');
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { state?: { token?: string }; token?: string };
      const token = parsed.state?.token ?? parsed.token;
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    } catch {
      // ignore malformed storage
    }
  }
  return config;
});

// Global error handling — simple English messages for non-tech owners
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!error.response) {
      toast.error('No internet. Please check your connection and try again.');
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const code = error.response?.data?.code as string | undefined;
    const message = error.response?.data?.message as string | undefined;

    if (status === 401) {
      // Clear persisted Zustand store so the user is fully logged out
      localStorage.removeItem('feeflow-auth');
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Map error codes to plain English — coaches don't need technical jargon
    const friendlyMessages: Record<string, string> = {
      PLAN_LIMIT_EXCEEDED: 'Student limit reached. Please upgrade your plan.',
      PLAN_EXPIRED: 'Your free trial has expired. Please subscribe to continue.',
      BATCH_HAS_STUDENTS: 'This batch has active students. Move them first.',
      STUDENT_INACTIVE: 'This student is inactive. Activate them first.',
      OTP_INVALID: 'Wrong OTP. Please check and try again.',
      OTP_EXPIRED: 'OTP has expired. Request a new one.',
      CONFLICT: message ?? 'This record already exists.',
    };

    const displayMessage = (code && friendlyMessages[code]) || message || 'Something went wrong. Please try again.';
    error.displayMessage = displayMessage;

    return Promise.reject(error);
  },
);
