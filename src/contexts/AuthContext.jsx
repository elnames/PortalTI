// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

/**
 * Provee:
 *  - user: objeto con datos de usuario o null
 *  - token: JWT o null
 *  - loading: booleano durante login
 *  - login(credentials): fn para autenticar
 *  - logout(): fn para cerrar sesión
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });
  const [loading, setLoading] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      console.log('Intentando login con api.js');
      const response = await authAPI.login(credentials);
      const { user: u, token: t } = response.data;
      setUser(u);
      setToken(t);

      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('token', t);

      // Si rememberMe está activado, guardar en sessionStorage también
      if (credentials.rememberMe) {
        sessionStorage.setItem('user', JSON.stringify(u));
        sessionStorage.setItem('token', t);
        sessionStorage.setItem('rememberMe', 'true');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUserDataLoaded(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('rememberMe');
  };

  // Verificar sesión al cargar la aplicación
  useEffect(() => {
    const checkSession = () => {
      // Primero verificar sessionStorage (para sesiones recordadas)
      const sessionUser = sessionStorage.getItem('user');
      const sessionToken = sessionStorage.getItem('token');
      const rememberMe = sessionStorage.getItem('rememberMe');

      if (sessionUser && sessionToken && rememberMe === 'true') {
        setUser(JSON.parse(sessionUser));
        setToken(sessionToken);
        return;
      }

      // Si no hay sesión recordada, verificar localStorage
      const localUser = localStorage.getItem('user');
      const localToken = localStorage.getItem('token');

      if (localUser && localToken) {
        setUser(JSON.parse(localUser));
        setToken(localToken);
      }
    };

    checkSession();
  }, []);

  // Actualizar datos del usuario cuando hay token
  useEffect(() => {
    const updateUserData = async () => {
      if (token && !userDataLoaded && !user?.nombre) {
        try {
          setUserDataLoaded(true);
          const response = await authAPI.getProfile();
          const userData = response.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          if (sessionStorage.getItem('rememberMe') === 'true') {
            sessionStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (error) {
          console.error('Error al actualizar datos del usuario:', error);
          setUserDataLoaded(false);
        }
      }
    };

    updateUserData();
  }, [token, userDataLoaded, user?.nombre]);

  // Redirección automática después del login
  useEffect(() => {
    if (user && window.location.pathname === '/login') {
      // Redirigir según el rol
      if (user.role === 'admin' || user.role === 'soporte') {
        window.location.href = '/dashboard';
      } else {
        // Usuarios normales van a "Mis Activos" en lugar de Dashboard
        window.location.href = '/mis-activos';
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para consumir más cómodamente
export const useAuth = () => useContext(AuthContext);
