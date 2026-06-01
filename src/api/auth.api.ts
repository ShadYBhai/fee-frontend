import { api } from '@/lib/axios';
import type { Owner } from '@/stores/auth.store';

export const sendOtp = (mobile: string) =>
  api.post('/auth/send-otp', { mobile }).then((r) => r.data);

export const verifyOtp = (mobile: string, otp: string) =>
  api.post<{ data: { accessToken: string; refreshToken: string; isNewOwner: boolean } }>(
    '/auth/verify-otp',
    { mobile, otp },
  ).then((r) => r.data.data);

export const getMe = () =>
  api.get<{ data: Owner }>('/auth/me').then((r) => r.data.data);

export const updateProfile = (data: { name: string; institute_name: string; upi_id?: string }) =>
  api.patch<{ data: Owner }>('/auth/profile', data).then((r) => r.data.data);

export const uploadLogo = (file: File) => {
  const form = new FormData();
  form.append('logo', file);
  return api.post<{ data: { id: string; logo_url: string } }>(
    '/auth/logo',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  ).then((r) => r.data.data);
};
