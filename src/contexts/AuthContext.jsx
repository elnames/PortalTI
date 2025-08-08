// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

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
      // Usa siempre la URL base definida
      const baseUrl = 'http://localhost:5266/api'; // Forzado para evitar problemas de cache
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        const txt = await res.text();
        // Log extra para depurar (puedes dejarlo si tienes problemas)
        console.error('Login failed:', txt);
        throw new Error('Credenciales inválidas');
      }
      const { user: u, token: t } = await res.json();
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
          const baseUrl = 'http://localhost:5266/api';
          const res = await fetch(`${baseUrl}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            if (sessionStorage.getItem('rememberMe') === 'true') {
              sessionStorage.setItem('user', JSON.stringify(userData));
            }
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
