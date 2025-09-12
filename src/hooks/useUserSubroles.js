// src/hooks/useUserSubroles.js
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

export const useUserSubroles = () => {
    const { user, token } = useAuth();
    const [subroles, setSubroles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSubroles = async () => {
            if (!user || !token) {
                setSubroles([]);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_BASE_URL}/pazysalvoroles/user-subroles`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setSubroles(data || []);
                } else {
                    // Si no hay subroles o hay error, simplemente no mostrar subroles
                    setSubroles([]);
                }
            } catch (err) {
                console.error('Error al obtener subroles:', err);
                setSubroles([]);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSubroles();
    }, [user, token]);

    // Función para verificar si el usuario tiene un subrole específico
    const hasSubrole = (subroleName) => {
        return subroles.some(subrole =>
            subrole.rol === subroleName && subrole.isActive
        );
    };

    // Función para obtener todos los subroles activos
    const getActiveSubroles = () => {
        return subroles.filter(subrole => subrole.isActive);
    };

    return {
        subroles,
        loading,
        error,
        hasSubrole,
        getActiveSubroles
    };
};
