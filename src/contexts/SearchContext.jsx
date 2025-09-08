// src/contexts/SearchContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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

        // Debounce de 300ms
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);

            try {
                const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
                setSearchResults(response.data);
            } catch (error) {
                console.error('Error en búsqueda:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, []);

    const addToSearchHistory = (query, result = null) => {
        setSearchHistory(prev => {
            let historyItem;
            
            if (result) {
                // Guardar información completa del resultado para navegación directa
                historyItem = {
                    titulo: query,
                    tipo: result.tipo,
                    id: result.id,
                    codigo: result.codigo
                };
            } else {
                // Para búsquedas manuales, solo guardar el texto
                historyItem = query;
            }
            
            const newHistory = [historyItem, ...prev.filter(item => {
                if (typeof item === 'string') {
                    return item !== query;
                } else {
                    return item.titulo !== query;
                }
            })].slice(0, 10);
            
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
        
        // Debug: agregar datos de ejemplo si no hay historial
        const saved = localStorage.getItem('searchHistory');
        if (!saved || JSON.parse(saved).length === 0) {
            const exampleHistory = ['EQUIPO-278', 'Exequiel Valenzuela', 'Ticket 123'];
            setSearchHistory(exampleHistory);
            localStorage.setItem('searchHistory', JSON.stringify(exampleHistory));
            console.log('Historial de ejemplo agregado:', exampleHistory);
        }
    }, []);

    const navigateToResult = useCallback((result) => {
        // Guardar el título real del elemento en el historial con información completa
        if (result.titulo) {
            addToSearchHistory(result.titulo, result);
        }

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
    }, [navigate, clearSearch, addToSearchHistory]);

    const value = {
        searchQuery,
        searchResults,
        isSearching,
        searchHistory,
        handleSearch,
        clearSearch,
        clearSearchHistory,
        navigateToResult,
        setSearchQuery
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
}; 