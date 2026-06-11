import { create } from 'zustand';
import { authenticate } from '../auth/users';

const STORAGE_KEY = 'sp-auth-user';

interface AuthState {
  currentUser: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: localStorage.getItem(STORAGE_KEY),

  login: (username, password) => {
    const user = authenticate(username, password);
    if (!user) return false;
    localStorage.setItem(STORAGE_KEY, user.username);
    set({ currentUser: user.username });
    return true;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ currentUser: null });
  }
}));
