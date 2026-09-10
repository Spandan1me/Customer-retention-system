import { create } from 'zustand';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'SUPER_ADMIN' | 'SUPERVISOR' | 'TEAM_LEAD' | 'AGENT';
  organization?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string, refresh: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user_info') || 'null'),
  token: localStorage.getItem('access_token'),
  setAuth: (user, token, refresh) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user_info', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    set({ user: null, token: null });
  },
}));
