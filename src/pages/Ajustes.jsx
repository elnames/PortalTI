// src/pages/Ajustes.jsx
import React, { useState } from 'react';
import {
    ArrowLeft,
    Bell,
    Download,
    RotateCcw,
    Check,
    Table,
    Search,
    Lock,
    Palette,
    Database,
    Trash2,
    Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useSearch } from '../contexts/SearchContext';

export default function Ajustes() {
    const navigate = useNavigate();
    const { darkMode, setDarkMode } = useTheme();
    const { settings, updateSetting, updateNestedSetting, resetSettings } = useSettings();
    const { clearSearchHistory } = useSearch();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');



    const handleSettingChange = (key, value) => {
        updateSetting(key, value);
        setMessage('Configuración guardada');
        setTimeout(() => setMessage(''), 2000);
    };

    const handleNestedSettingChange = (section, key, value) => {
        updateNestedSetting(section, key, value);
        setMessage('Configuración guardada');
        setTimeout(() => setMessage(''), 2000);
    };

    const handleNotificationTypeChange = (type, value) => {
        updateNestedSetting('notificationTypes', type, value);
        setMessage('Configuración de notificaciones actualizada');
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
            resetSettings();
            setDarkMode(false); // Resetear también el modo oscuro
            setMessage('Configuración restablecida correctamente');
        }
    };

    const handleClearSearchHistory = () => {
        if (window.confirm('¿Estás seguro de que quieres borrar el historial de búsquedas?')) {
            clearSearchHistory();
            setMessage('Historial de búsquedas borrado');
            setTimeout(() => setMessage(''), 2000);
        }
    };

    const handleClearCache = () => {
        if (window.confirm('¿Estás seguro de que quieres limpiar la caché de la aplicación?')) {
            // Limpiar localStorage excepto configuraciones
            const settings = localStorage.getItem('userSettings');
            const theme = localStorage.getItem('darkMode');
            localStorage.clear();
            if (settings) localStorage.setItem('userSettings', settings);
            if (theme) localStorage.setItem('darkMode', theme);

            setMessage('Caché limpiada correctamente');
            setTimeout(() => setMessage(''), 2000);
        }
    };

    const handleExportSettings = () => {
        const settingsData = {
            settings,
            darkMode,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ajustes_portal_it_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setMessage('Configuración exportada correctamente');
        setTimeout(() => setMessage(''), 2000);
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
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${message.includes('Error')
                    ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900 dark:text-red-200'
                    : 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-200'
                    }`}>
                    <Check className="w-4 h-4" />
                    <span>{message}</span>
                </div>
            )}

            {/* Configuraciones */}
            <div className="max-w-4xl space-y-6">
                {/* Notificaciones */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Bell className="w-6 h-6 text-blue-600" />
                        <h2 className="text-lg font-medium dark:text-white">Notificaciones</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Notificaciones del sistema</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Recibe alertas sobre actualizaciones</p>
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
                                <p className="text-sm text-gray-600 dark:text-gray-400">Reportes diarios por correo</p>
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
                                <p className="text-sm text-gray-600 dark:text-gray-400">Reproduce sonidos al recibir alertas</p>
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

                    {/* Tipos de notificaciones */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <h3 className="font-medium mb-3 dark:text-white">Tipos de notificaciones</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(settings.notificationTypes).map(([type, enabled]) => (
                                <div key={type} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`notif-${type}`}
                                        checked={enabled}
                                        onChange={(e) => handleNotificationTypeChange(type, e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor={`notif-${type}`} className="text-sm font-medium dark:text-white capitalize">
                                        {type}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Configuración de Tabla */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Table className="w-6 h-6 text-green-600" />
                        <h2 className="text-lg font-medium dark:text-white">Configuración de Tabla</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-white mb-2">
                                Elementos por página
                            </label>
                            <select
                                value={settings.tableSettings.itemsPerPage}
                                onChange={(e) => handleNestedSettingChange('tableSettings', 'itemsPerPage', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium dark:text-white mb-2">
                                Intervalo de actualización (segundos)
                            </label>
                            <select
                                value={settings.tableSettings.refreshInterval}
                                onChange={(e) => handleNestedSettingChange('tableSettings', 'refreshInterval', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value={15}>15 segundos</option>
                                <option value={30}>30 segundos</option>
                                <option value={60}>1 minuto</option>
                                <option value={300}>5 minutos</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Mostrar acciones</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Botones de editar, eliminar, etc.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.tableSettings.showActions}
                                    onChange={(e) => handleNestedSettingChange('tableSettings', 'showActions', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Modo compacto</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Reduce el espaciado en tablas</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.tableSettings.compactMode}
                                    onChange={(e) => handleNestedSettingChange('tableSettings', 'compactMode', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Auto-refresh</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Actualiza datos automáticamente</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.tableSettings.autoRefresh}
                                    onChange={(e) => handleNestedSettingChange('tableSettings', 'autoRefresh', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Configuración de Búsqueda */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Search className="w-6 h-6 text-purple-600" />
                        <h2 className="text-lg font-medium dark:text-white">Configuración de Búsqueda</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Guardar historial</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Mantener búsquedas recientes</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.searchSettings.saveHistory}
                                    onChange={(e) => handleNestedSettingChange('searchSettings', 'saveHistory', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium dark:text-white mb-2">
                                Máximo elementos en historial
                            </label>
                            <select
                                value={settings.searchSettings.maxHistoryItems}
                                onChange={(e) => handleNestedSettingChange('searchSettings', 'maxHistoryItems', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value={5}>5 elementos</option>
                                <option value={10}>10 elementos</option>
                                <option value={20}>20 elementos</option>
                                <option value={50}>50 elementos</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Filtros avanzados</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Habilitar filtros complejos</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.searchSettings.enableFilters}
                                    onChange={(e) => handleNestedSettingChange('searchSettings', 'enableFilters', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Búsqueda rápida</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Búsqueda instantánea</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.searchSettings.quickSearch}
                                    onChange={(e) => handleNestedSettingChange('searchSettings', 'quickSearch', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Configuración de Interfaz */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Palette className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-lg font-medium dark:text-white">Configuración de Interfaz</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Mostrar tooltips</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Información al pasar el mouse</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.interfaceSettings.showTooltips}
                                    onChange={(e) => handleNestedSettingChange('interfaceSettings', 'showTooltips', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Animaciones</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Transiciones suaves</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.interfaceSettings.showAnimations}
                                    onChange={(e) => handleNestedSettingChange('interfaceSettings', 'showAnimations', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Sidebar compacto</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Menú lateral reducido</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.interfaceSettings.compactSidebar}
                                    onChange={(e) => handleNestedSettingChange('interfaceSettings', 'compactSidebar', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Configuración de Seguridad */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Lock className="w-6 h-6 text-red-600" />
                        <h2 className="text-lg font-medium dark:text-white">Configuración de Seguridad</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-white mb-2">
                                Tiempo de sesión (minutos)
                            </label>
                            <select
                                value={settings.securitySettings.sessionTimeout}
                                onChange={(e) => handleNestedSettingChange('securitySettings', 'sessionTimeout', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value={15}>15 minutos</option>
                                <option value={30}>30 minutos</option>
                                <option value={60}>1 hora</option>
                                <option value={120}>2 horas</option>
                                <option value={480}>8 horas</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Mostrar último login</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Información de seguridad</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.securitySettings.showLastLogin}
                                    onChange={(e) => handleNestedSettingChange('securitySettings', 'showLastLogin', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium dark:text-white">Registro de auditoría</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Registrar actividades del usuario</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.securitySettings.enableAuditLog}
                                    onChange={(e) => handleNestedSettingChange('securitySettings', 'enableAuditLog', e.target.checked)}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                            onClick={handleExportData}
                            disabled={loading}
                            className="text-left px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            <div className="flex items-center space-x-3">
                                <Download className="w-5 h-5 text-blue-600" />
                                <div>
                                    <div className="font-medium dark:text-white">
                                        {loading ? 'Exportando...' : 'Exportar datos'}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Descarga datos en CSV</div>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={handleExportSettings}
                            className="text-left px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <Save className="w-5 h-5 text-green-600" />
                                <div>
                                    <div className="font-medium dark:text-white">Exportar configuración</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Guarda tu configuración</div>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={handleClearSearchHistory}
                            className="text-left px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <Trash2 className="w-5 h-5 text-red-600" />
                                <div>
                                    <div className="font-medium dark:text-white">Limpiar historial</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Borrar búsquedas recientes</div>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={handleClearCache}
                            className="text-left px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <Database className="w-5 h-5 text-purple-600" />
                                <div>
                                    <div className="font-medium dark:text-white">Limpiar caché</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Liberar espacio local</div>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={handleResetSettings}
                            className="text-left px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <RotateCcw className="w-5 h-5 text-orange-600" />
                                <div>
                                    <div className="font-medium dark:text-white">Restablecer todo</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Configuración por defecto</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 