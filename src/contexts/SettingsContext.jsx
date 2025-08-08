// src/contexts/SettingsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings debe ser usado dentro de un SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        // Notificaciones
        notifications: true,
        emailNotifications: false,
        soundEnabled: true,
        notificationTypes: {
            tickets: true,
            activos: true,
            usuarios: true,
            actas: true
        },

        // Tabla
        tableSettings: {
            itemsPerPage: 20,
            showActions: true,
            showStatus: true,
            compactMode: false,
            autoRefresh: true,
            refreshInterval: 30
        },

        // Búsqueda
        searchSettings: {
            saveHistory: true,
            maxHistoryItems: 10,
            enableFilters: true,
            quickSearch: true
        },

        // Interfaz
        interfaceSettings: {
            showTooltips: true,
            showAnimations: true,
            compactSidebar: false,
            showBreadcrumbs: true,
            showProgressBars: true
        },

        // Exportación
        exportSettings: {
            defaultFormat: 'csv',
            includeHeaders: true,
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h'
        },

        // Seguridad
        securitySettings: {
            sessionTimeout: 30,
            requirePasswordChange: false,
            showLastLogin: true,
            enableAuditLog: true
        }
    });

    // Cargar configuración guardada al iniciar
    useEffect(() => {
        if (user) {
            const savedSettings = localStorage.getItem(`userSettings_${user.id}`);
            if (savedSettings) {
                try {
                    const parsedSettings = JSON.parse(savedSettings);
                    setSettings(prev => ({ ...prev, ...parsedSettings }));
                } catch (error) {
                    console.error('Error al cargar configuración:', error);
                }
            }
        }
    }, [user]);

    // Guardar configuración cuando cambie
    useEffect(() => {
        if (user) {
            localStorage.setItem(`userSettings_${user.id}`, JSON.stringify(settings));
        }
    }, [settings, user]);

    const updateSetting = (section, key, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    const updateNestedSetting = (section, subsection, key, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [subsection]: {
                    ...prev[section]?.[subsection],
                    [key]: value
                }
            }
        }));
    };

    const resetSettings = () => {
        const defaultSettings = {
            notifications: true,
            emailNotifications: false,
            soundEnabled: true,
            notificationTypes: {
                tickets: true,
                activos: true,
                usuarios: true,
                actas: true
            },
            tableSettings: {
                itemsPerPage: 20,
                showActions: true,
                showStatus: true,
                compactMode: false,
                autoRefresh: true,
                refreshInterval: 30
            },
            searchSettings: {
                saveHistory: true,
                maxHistoryItems: 10,
                enableFilters: true,
                quickSearch: true
            },
            interfaceSettings: {
                showTooltips: true,
                showAnimations: true,
                compactSidebar: false,
                showBreadcrumbs: true,
                showProgressBars: true
            },
            exportSettings: {
                defaultFormat: 'csv',
                includeHeaders: true,
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '24h'
            },
            securitySettings: {
                sessionTimeout: 30,
                requirePasswordChange: false,
                showLastLogin: true,
                enableAuditLog: true
            }
        };
        setSettings(defaultSettings);
    };

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSetting,
            updateNestedSetting,
            resetSettings
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
