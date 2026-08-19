import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api
        .get('/auth/me/')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    const me = await api.get('/auth/me/');
    setUser(me.data);
    return me.data;
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register/', {
      username,
      email,
      password,
    });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } catch (e) {
      console.error("Logout blacklist failed:", e);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const loginWithOAuth = async (provider, tokenOrCode, extraData = {}) => {
    const endpoint = provider === 'google' ? '/auth/oauth2/google/' : '/auth/oauth2/github/';
    const redirectUri = `${window.location.origin}/oauth2/callback/${provider}`;
    const payload = provider === 'google' 
      ? { code: tokenOrCode, redirect_uri: redirectUri, ...extraData } 
      : { code: tokenOrCode, ...extraData };
    
    const { data } = await api.post(endpoint, payload);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    
    const me = await api.get('/auth/me/');
    setUser(me.data);
    return me.data;
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, loginWithOAuth }}>
      {children}
    </AuthContext.Provider>
  );

}

export const useAuth = () => useContext(AuthContext);
