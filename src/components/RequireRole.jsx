// src/components/RequireRole.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-6">Verificando permisos…</div>;

  if (!user) {
    // si no está logueado, redirige al login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!roles.includes(user.role)) {
    // si no tiene el rol adecuado, mostrar página de acceso denegado
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
