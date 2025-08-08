// src/components/SmartRedirect.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SmartRedirect() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="p-6">Cargando...</div>;
    }

    if (!user) {
        // Si no está logueado, redirigir al login
        return <Navigate to="/login" replace />;
    }

    // Si está logueado, redirigir según el rol
    if (user.role === 'admin' || user.role === 'soporte') {
        return <Navigate to="/dashboard" replace />;
    } else {
        // Para usuarios regulares
        return <Navigate to="/mis-activos" replace />;
    }
} 