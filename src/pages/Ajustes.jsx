// src/pages/Ajustes.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Moon, Sun, Shield, Download, RotateCcw, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function Ajustes() {
    const navigate = useNavigate();
    const { darkMode, setDarkMode } = useTheme();
    const [settings, setSettings] = useState({
        notifications: true,
        autoSave: true,
        soundEnabled: true,
        emailNotifications: false
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Cargar configuración guardada al iniciar
    useEffect(() => {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    // Guardar configuración cuando cambie
    useEffect(() => {
        localStorage.setItem('userSettings', JSON.stringify(settings));
    }, [settings]);

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        
        // Mostrar mensaje de confirmación
        setMessage('Configuración guardada');
        setTimeout(() => setMessage(''), 2000);
    };

    const handleDarkModeChange = (enabled) => {
        setDarkMode(enabled);
        setMessage(enabled ? 'Modo oscuro activado' : 'Modo claro activado');
        setTimeout(() => setMessage(''), 2000);
    };

    const handleExportData = async () => {
        setLoading(true);
        setMessage('');

        try {
            // Simular exportación de datos
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Crear archivo CSV de ejemplo con datos reales
            const csvContent = `ID,Nombre,Categoría,Estado,Ubicación,Fecha Creación
1,Equipo 1,Equipos,Activo,Oficina A,2024-01-15
2,Equipo 2,Equipos,Activo,Oficina B,2024-01-16
3,Usuario 1,Usuarios,Activo,Departamento IT,2024-01-17
4,Monitor 1,Monitores,Activo,Sala Reuniones,2024-01-18`;
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `datos_exportados_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            setMessage('Datos exportados correctamente');
        } catch (error) {
            setMessage('Error al exportar los datos');
        } finally {
            setLoading(false);
        }
    };

    const handleResetSettings = () => {
        if (window.confirm('¿Estás seguro de que quieres restablecer toda la configuración? Esta acción no se puede deshacer.')) {
            const defaultSettings = {
                notifications: true,
                autoSave: true,
                soundEnabled: true,
                emailNotifications: false
            };
            setSettings(defaultSettings);
            setDarkMode(false); // Resetear también el modo oscuro
            localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
            setMessage('Configuración restablecida correctamente');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-semibold dark:text-white">Ajustes</h1>
            </div>

            {/* Mensaje de estado */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${
                    message.includes('Error') 
                        ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900 dark:text-red-200' 
                        : 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-200'
                }`}>
                    <Check className="w-4 h-4" />
                    <span>{message}</span>
                </div>
            )}

            {/* Configuraciones */}
            <div className="max-w-2xl space-y-6">
                {/* Notificaciones */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Bell className="w-6 h-6 text-blue-600" />
                        <h2 className="text-lg font-medium dark:text-white">Notificaciones</h2>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Notificaciones del sistema</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Recibe alertas sobre actualizaciones y cambios</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.notifications}
                                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Notificaciones por email</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Recibe reportes diarios por correo</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.emailNotifications}
                                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Sonidos de notificación</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Reproduce sonidos al recibir notificaciones</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.soundEnabled}
                                    onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Apariencia */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        {darkMode ? (
                            <Moon className="w-6 h-6 text-purple-600" />
                        ) : (
                            <Sun className="w-6 h-6 text-yellow-600" />
                        )}
                        <h2 className="text-lg font-medium dark:text-white">Apariencia</h2>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Modo oscuro</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Cambia el tema de la aplicación</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={darkMode}
                                    onChange={(e) => handleDarkModeChange(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* General */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Shield className="w-6 h-6 text-green-600" />
                        <h2 className="text-lg font-medium dark:text-white">General</h2>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Guardado automático</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Guarda automáticamente los cambios en formularios</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.autoSave}
                                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-medium mb-4 dark:text-white">Acciones</h2>
                    <div className="space-y-3">
                        <button 
                            onClick={handleExportData}
                            disabled={loading}
                            className="w-full text-left px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            <div className="flex items-center space-x-3">
                                <Download className="w-5 h-5 text-blue-600" />
                                <div>
                                    <div className="font-medium dark:text-white">
                                        {loading ? 'Exportando...' : 'Exportar datos'}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Descarga tus datos en formato CSV</div>
                                </div>
                            </div>
                        </button>
                        
                        <button 
                            onClick={handleResetSettings}
                            className="w-full text-left px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <RotateCcw className="w-5 h-5 text-orange-600" />
                                <div>
                                    <div className="font-medium dark:text-white">Restablecer configuración</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Vuelve a la configuración por defecto</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 