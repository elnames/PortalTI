// src/contexts/SearchContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchContext = createContext();

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch debe ser usado dentro de un SearchProvider');
    }
    return context;
};

export const SearchProvider = ({ children }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const navigate = useNavigate();
    const searchTimeoutRef = useRef(null);

    const handleSearch = useCallback(async (query) => {
        setSearchQuery(query);

        // Limpiar timeout anterior
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        // Guardar en historial si la búsqueda es válida
        if (query.trim().length > 2) {
            addToSearchHistory(query.trim());
        }

        // Debounce de 300ms
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('No hay token de autenticación');
                    setSearchResults([]);
                    return;
                }

                const response = await fetch(`http://localhost:5266/api/search?q=${encodeURIComponent(query)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    console.error('Error en búsqueda:', response.status);
                    setSearchResults([]);
                    return;
                }

                const data = await response.json();
                setSearchResults(data);
            } catch (error) {
                console.error('Error en búsqueda:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, []);

    const addToSearchHistory = (query) => {
        setSearchHistory(prev => {
            const newHistory = [query, ...prev.filter(item => item !== query)].slice(0, 10);
            localStorage.setItem('searchHistory', JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const clearSearchHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
    };

    const loadSearchHistory = () => {
        const saved = localStorage.getItem('searchHistory');
        if (saved) {
            try {
                setSearchHistory(JSON.parse(saved));
            } catch (error) {
                console.error('Error al cargar historial de búsqueda:', error);
            }
        }
    };

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);

        // Limpiar timeout si existe
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }
    }, []);

    // Cargar historial al inicializar
    useEffect(() => {
        loadSearchHistory();
    }, []);

    const navigateToResult = useCallback((result) => {
        switch (result.tipo) {
            case 'activo':
                // Para activos, usar codigo en lugar de id
                navigate(`/activos/${result.codigo || result.id}`);
                break;
            case 'usuario':
                navigate(`/usuarios/${result.id}`);
                break;
            case 'ticket':
                navigate(`/tickets/${result.id}`);
                break;
            default:
                console.warn('Tipo de resultado no reconocido:', result.tipo);
        }
        clearSearch();
    }, [navigate, clearSearch]);

    const value = {
        searchQuery,
        searchResults,
        isSearching,
        searchHistory,
        handleSearch,
        clearSearch,
        clearSearchHistory,
        navigateToResult
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
}; 