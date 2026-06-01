import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Owner {
  id: string;
  name: string | null;
  mobile: string;
  institute_name: string | null;
  logo_url: string | null;
  upi_id: string | null;
  plan: 'TRIAL' | 'STARTER' | 'GROWTH';
  plan_expiry: string | null;
  created_at: string;
}

interface AuthState {
  token: string | null;
  owner: Owner | null;
  setAuth: (token: string, owner: Owner) => void;
  updateOwner: (owner: Owner) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      owner: null,
      setAuth: (token, owner) => set({ token, owner }),
      updateOwner: (owner) => set({ owner }),
      clearAuth: () => set({ token: null, owner: null }),
    }),
    {
      name: 'feeflow-auth',
    },
  ),
);
