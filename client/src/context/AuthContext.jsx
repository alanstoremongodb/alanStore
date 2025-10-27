import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { BASE_URL } from '../lib/api';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // al montar: si no hay token, intento refresh; si hay token, pido /auth/me
  useEffect(() => {
    (async () => {
      try {
        let token = localStorage.getItem('accessToken');
        if (!token) {
          const r = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
          token = r.data?.accessToken;
          if (token) localStorage.setItem('accessToken', token);
        }
        if (token) {
          const me = await api.get('/auth/me');
          setUser(me.data.user);
        }
      } catch {
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const login = async ({ usuario, password }) => {
    const payload = { usuario: (usuario || '').trim().toLowerCase(), password };
    const r = await axios.post(`${BASE_URL}/auth/login`, payload, { withCredentials: true });
    const token = r.data?.accessToken;
    if (token) localStorage.setItem('accessToken', token);
    setUser(r.data.user);
  };

  const logout = async () => {
    try {
      await axios.post(`${BASE_URL}/auth/logout`, {}, { withCredentials: true });
    } catch {}
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout, booting }), [user, booting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
