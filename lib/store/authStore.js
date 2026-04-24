'use client';
import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,

  init: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('medguard_token');
    const user = localStorage.getItem('medguard_user');
    if (token && user) {
      set({ token, user: JSON.parse(user), loading: false });
    } else {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('medguard_token', data.token);
    localStorage.setItem('medguard_user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
    return data;
  },

  register: async (name, email, password, allergies) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, allergies }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('medguard_token', data.token);
    localStorage.setItem('medguard_user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
    return data;
  },

  logout: () => {
    localStorage.removeItem('medguard_token');
    localStorage.removeItem('medguard_user');
    set({ user: null, token: null });
  },

  getAuthHeader: () => {
    const token = get().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
}));

export default useAuthStore;
