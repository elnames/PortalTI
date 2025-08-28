import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '../components/DataTable';
import EditAuthUserModal from '../components/EditAuthUserModal';
import CreateAuthUserModal from '../components/CreateAuthUserModal';
import {
    Settings,
    Users,
    Activity,
    Shield,
    Edit3,
    Trash2,
    Key,
    UserCheck,
    UserX,
    Calendar,
    Clock,
    Palette,
    Bell,
    Database,
    Download,
    Save,
    AlertTriangle,
    BarChart3,
    RefreshCw
} from 'lucide-react';
import api, { systemConfigAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const columnHelper = createColumnHelper();

export default function ConfiguracionAdmin() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rowSelection, setRowSelection] = useState({});
    const [activeTab, setActiveTab] = useState('users');
    const [activityLogs, setActivityLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Nuevos estados para configuración del sistema
    const [systemConfig, setSystemConfig] = useState(null);
    const [systemStats, setSystemStats] = useState(null);
    const [configLoading, setConfigLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/auth');
            setUsers(data);
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchActivityLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const { data } = await api.get('/auth/activity-log');
            setActivityLogs(data.logs || []);
        } catch (err) {
            console.error('Error al cargar log de actividades:', err);
        } finally {
            setLogsLoading(false);
        }
    }, []);

    const fetchSystemConfig = useCallback(async () => {
        setConfigLoading(true);
        try {
            const { data } = await systemConfigAPI.getConfig();
            setSystemConfig(data);
            setMaintenanceMode(data.System?.MaintenanceMode || false);
            setMaintenanceMessage(data.System?.MaintenanceMessage || '');
        } catch (err) {
            console.error('Error al cargar configuración del sistema:', err);
        } finally {
            setConfigLoading(false);
        }
    }, []);

    const fetchSystemStats = useCallback(async () => {
        try {
            const { data } = await systemConfigAPI.getStats();
            setSystemStats(data);
        } catch (err) {
            console.error('Error al cargar estadísticas del sistema:', err);
        }
    }, []);

    useEffect(() => {
        if (currentUser && currentUser.role === 'admin') {
            fetchUsers();
            if (activeTab === 'activity') {
                fetchActivityLogs();
            } else if (activeTab === 'system') {
                fetchSystemConfig();
                fetchSystemStats();
            }
        }
    }, [activeTab, currentUser, fetchUsers, fetchActivityLogs, fetchSystemConfig, fetchSystemStats]);

    const handleEditUser = useCallback((user) => {
        setSelectedUser(user);
        setShowEditModal(true);
    }, []);

    const handleResetPassword = useCallback(async (user) => {
        if (!window.confirm(`¿Estás seguro de que quieres resetear la contraseña de ${user.username}?`)) {
            return;
        }

        const newPassword = prompt('Ingresa la nueva contraseña:');
        if (!newPassword) return;

        try {
            await api.put(`/auth/${user.id}/reset-password`, {
                newPassword: newPassword
            });
            alert('Contraseña reseteada correctamente');
            fetchUsers();
        } catch (err) {
            console.error('Error al resetear contraseña:', err);
            alert('Error al resetear la contraseña');
        }
    }, [fetchUsers]);

    const handleToggleUserStatus = useCallback(async (user) => {
        const action = user.isActive ? 'desactivar' : 'activar';
        if (!window.confirm(`¿Estás seguro de que quieres ${action} al usuario ${user.username}?`)) {
            return;
        }

        try {
            await api.put(`/auth/${user.id}`, {
                isActive: !user.isActive
            });
            alert(`Usuario ${action}do correctamente`);
            fetchUsers();
        } catch (err) {
            console.error('Error al cambiar estado del usuario:', err);
            alert('Error al cambiar el estado del usuario');
        }
    }, [fetchUsers]);

    const handleDeleteUser = useCallback(async (user) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${user.username}? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            await api.delete(`/auth/${user.id}`);
            alert('Usuario eliminado correctamente');
            fetchUsers();
        } catch (err) {
            console.error('Error al eliminar usuario:', err);
            alert('Error al eliminar el usuario');
        }
    }, [fetchUsers]);

    // Nuevas funciones para configuración del sistema
    const handleSaveConfig = useCallback(async () => {
        setSaving(true);
        try {
            // Preparar datos para enviar al backend
            const configToSend = {
                Appearance: systemConfig?.Appearance || {},
                Notifications: systemConfig?.Notifications || {},
                Security: systemConfig?.Security || {},
                Backup: systemConfig?.Backup || {},
                System: systemConfig?.System || {}
            };

            await systemConfigAPI.updateConfig(configToSend);
            alert('Configuración guardada correctamente');
            
            // Recargar configuración para confirmar cambios
            await fetchSystemConfig();
        } catch (err) {
            console.error('Error al guardar configuración:', err);
            alert('Error al guardar la configuración: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    }, [systemConfig, fetchSystemConfig]);

    const handleCreateBackup = useCallback(async () => {
        if (!window.confirm('¿Estás seguro de que quieres crear un backup del sistema?')) {
            return;
        }

        try {
            const { data } = await systemConfigAPI.createBackup();
            alert(`Backup creado correctamente: ${data.fileName}\nRuta: ${data.path}`);
            fetchSystemStats(); // Actualizar estadísticas
        } catch (err) {
            console.error('Error al crear backup:', err);
            alert('Error al crear el backup: ' + (err.response?.data?.message || err.message));
        }
    }, [fetchSystemStats]);

    const handleToggleMaintenance = useCallback(async () => {
        try {
            await systemConfigAPI.toggleMaintenance(maintenanceMode, maintenanceMessage);
            alert(`Modo mantenimiento ${maintenanceMode ? 'activado' : 'desactivado'} correctamente`);
            
            // Recargar configuración para confirmar cambios
            await fetchSystemConfig();
        } catch (err) {
            console.error('Error al cambiar modo mantenimiento:', err);
            alert('Error al cambiar el modo mantenimiento: ' + (err.response?.data?.message || err.message));
        }
    }, [maintenanceMode, maintenanceMessage, fetchSystemConfig]);

    const handleInitializeConfig = useCallback(async () => {
        if (!window.confirm('¿Estás seguro de que quieres inicializar la configuración por defecto? Esto sobrescribirá cualquier configuración existente.')) {
            return;
        }

        try {
            await systemConfigAPI.initializeConfig();
            alert('Configuración inicializada correctamente');
            
            // Recargar configuración
            await fetchSystemConfig();
        } catch (err) {
            console.error('Error al inicializar configuración:', err);
            alert('Error al inicializar configuración: ' + (err.response?.data?.message || err.message));
        }
    }, [fetchSystemConfig]);

    const handleConfigChange = useCallback((section, key, value) => {
        setSystemConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    }, []);

    const columns = useMemo(() => [
        columnHelper.accessor('username', {
            header: 'Usuario',
            cell: ({ getValue }) => (
                <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{getValue()}</span>
                </div>
            )
        }),
        columnHelper.accessor('role', {
            header: 'Rol',
            cell: ({ getValue }) => {
                const role = getValue();
                const roleColors = {
                    'admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                    'soporte': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                    'usuario': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                };
                return (
                    <span className={`px-2 py-1 text-xs rounded-full ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
                        {role}
                    </span>
                );
            }
        }),
        columnHelper.accessor('isActive', {
            header: 'Estado',
            cell: ({ getValue }) => {
                const isActive = getValue();
                return (
                    <div className="flex items-center space-x-2">
                        {isActive ? (
                            <>
                                <UserCheck className="w-4 h-4 text-green-600" />
                                <span className="text-green-600">Activo</span>
                            </>
                        ) : (
                            <>
                                <UserX className="w-4 h-4 text-red-600" />
                                <span className="text-red-600">Inactivo</span>
                            </>
                        )}
                    </div>
                );
            }
        }),
        columnHelper.accessor('createdAt', {
            header: 'Creado',
            cell: ({ getValue }) => {
                const date = new Date(getValue());
                return (
                    <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className="text-sm">{date.toLocaleDateString('es-ES')}</span>
                    </div>
                );
            }
        }),
        columnHelper.accessor('lastLoginAt', {
            header: 'Último Login',
            cell: ({ getValue }) => {
                const date = getValue();
                if (!date) return <span className="text-gray-400">Nunca</span>;
                return (
                    <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-sm">{new Date(date).toLocaleDateString('es-ES')}</span>
                    </div>
                );
            }
        }),
        columnHelper.accessor('id', {
            id: 'actions',
            header: 'Acciones',
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ getValue, row }) => {
                const user = row.original;
                return (
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => handleEditUser(user)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:hover:text-blue-400"
                            title="Editar usuario"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleResetPassword(user)}
                            className="p-1 text-yellow-600 hover:text-yellow-800 dark:hover:text-yellow-400"
                            title="Resetear contraseña"
                        >
                            <Key className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleToggleUserStatus(user)}
                            className="p-1 text-gray-600 hover:text-gray-800 dark:hover:text-gray-400"
                            title={user.isActive ? "Desactivar usuario" : "Activar usuario"}
                        >
                            {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1 text-red-600 hover:text-red-800 dark:hover:text-red-400"
                            title="Eliminar usuario"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            }
        })
    ], [handleEditUser, handleResetPassword, handleToggleUserStatus, handleDeleteUser]);

    // Verificar si el usuario actual es admin
    if (!currentUser || currentUser.role !== 'admin') {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Acceso Denegado
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        No tienes permisos para acceder a esta sección.
                    </p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'users', name: 'Usuarios Autenticados', icon: Users },
        { id: 'activity', name: 'Log de Actividades', icon: Activity },
        { id: 'system', name: 'Configuración del Sistema', icon: Settings }
    ];

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300">Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold flex items-center text-gray-900 dark:text-white">
                    <Settings className="w-6 h-6 mr-2 text-primary" />
                    Configuración del Sistema
                </h1>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.name}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                            Gestión de Usuarios Autenticados
                        </h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                        >
                            <Users className="w-4 h-4" />
                            <span>Nuevo Usuario</span>
                        </button>
                    </div>

                    <DataTable
                        columns={columns}
                        data={users}
                        enableRowSelection
                        rowSelection={rowSelection}
                        onRowSelectionChange={setRowSelection}
                    />
                </div>
            )}

            {activeTab === 'activity' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                            Log de Actividades
                        </h2>
                        <button
                            onClick={fetchActivityLogs}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Actualizar
                        </button>
                    </div>

                    {logsLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando actividades...</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Usuario
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Acción
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Descripción
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Fecha
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                IP
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {activityLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    <div className="flex items-center space-x-2">
                                                        <UserCheck className="w-4 h-4 text-blue-600" />
                                                        <span>{log.user?.username}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                    {log.description}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(log.timestamp).toLocaleString('es-ES')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${log.ipAddress === 'Local' || log.ipAddress === '127.0.0.1' || log.ipAddress === '::1'
                                                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                            : log.ipAddress === 'Unknown' || !log.ipAddress
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                }`}>
                                                            {log.ipAddress || 'N/A'}
                                                        </span>
                                                        {log.ipAddress && log.ipAddress !== 'Local' && log.ipAddress !== 'Unknown' && (
                                                            <span className="text-xs text-gray-400" title={`IP del cliente: ${log.ipAddress}`}>
                                                                🌐
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'system' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                            Configuración del Sistema
                        </h2>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleInitializeConfig}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Inicializar Config</span>
                            </button>
                            <button
                                onClick={fetchSystemStats}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Actualizar Stats</span>
                            </button>
                            <button
                                onClick={handleSaveConfig}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                            </button>
                        </div>
                    </div>

                    {configLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando configuración...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Estadísticas del Sistema */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <BarChart3 className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Estadísticas del Sistema
                                    </h3>
                                </div>
                                {systemStats && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-blue-600">{systemStats.Users?.Total || 0}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Usuarios Totales</div>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-green-600">{systemStats.Tickets?.Open || 0}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Tickets Abiertos</div>
                                        </div>
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-yellow-600">{systemStats.Activos?.Total || 0}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Activos Totales</div>
                                        </div>
                                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-purple-600">{systemStats.Storage?.TotalSizeMB || 0} MB</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Almacenamiento</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Configuración de Apariencia */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <Palette className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Apariencia
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Nombre del Sistema
                                        </label>
                                        <input
                                            type="text"
                                            value={systemConfig?.Appearance?.SystemName || ''}
                                            onChange={(e) => handleConfigChange('Appearance', 'SystemName', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Color Primario
                                        </label>
                                        <input
                                            type="color"
                                            value={systemConfig?.Appearance?.PrimaryColor || '#3B82F6'}
                                            onChange={(e) => handleConfigChange('Appearance', 'PrimaryColor', e.target.value)}
                                            className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Tema
                                        </label>
                                        <select
                                            value={systemConfig?.Appearance?.Theme || 'light'}
                                            onChange={(e) => handleConfigChange('Appearance', 'Theme', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="light">Claro</option>
                                            <option value="dark">Oscuro</option>
                                            <option value="auto">Automático</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Configuración de Notificaciones */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <Bell className="w-6 h-6 text-green-600" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Notificaciones
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={systemConfig?.Notifications?.EmailEnabled || false}
                                            onChange={(e) => handleConfigChange('Notifications', 'EmailEnabled', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Notificaciones por email
                                        </span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={systemConfig?.Notifications?.PushEnabled || false}
                                            onChange={(e) => handleConfigChange('Notifications', 'PushEnabled', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Notificaciones push
                                        </span>
                                    </label>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Webhook de Slack
                                        </label>
                                        <input
                                            type="text"
                                            value={systemConfig?.Notifications?.SlackWebhook || ''}
                                            onChange={(e) => handleConfigChange('Notifications', 'SlackWebhook', e.target.value)}
                                            placeholder="https://hooks.slack.com/..."
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Configuración de Seguridad */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <Shield className="w-6 h-6 text-red-600" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Seguridad
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Duración de sesión (minutos)
                                        </label>
                                        <input
                                            type="number"
                                            value={systemConfig?.Security?.SessionTimeoutMinutes || 60}
                                            onChange={(e) => handleConfigChange('Security', 'SessionTimeoutMinutes', parseInt(e.target.value))}
                                            min="15"
                                            max="480"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={systemConfig?.Security?.ForcePasswordChange || false}
                                            onChange={(e) => handleConfigChange('Security', 'ForcePasswordChange', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Forzar cambio de contraseña
                                        </span>
                                    </label>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Longitud mínima de contraseña
                                        </label>
                                        <input
                                            type="number"
                                            value={systemConfig?.Security?.PasswordMinLength || 8}
                                            onChange={(e) => handleConfigChange('Security', 'PasswordMinLength', parseInt(e.target.value))}
                                            min="6"
                                            max="20"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Backup y Exportación */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <Database className="w-6 h-6 text-purple-600" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Backup y Exportación
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={handleCreateBackup}
                                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Crear Backup</span>
                                    </button>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={systemConfig?.Backup?.AutoBackupEnabled || false}
                                            onChange={(e) => handleConfigChange('Backup', 'AutoBackupEnabled', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Backup automático
                                        </span>
                                    </label>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Frecuencia de backup
                                        </label>
                                        <select
                                            value={systemConfig?.Backup?.BackupFrequency || 'daily'}
                                            onChange={(e) => handleConfigChange('Backup', 'BackupFrequency', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="daily">Diario</option>
                                            <option value="weekly">Semanal</option>
                                            <option value="monthly">Mensual</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Modo Mantenimiento */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Modo Mantenimiento
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={maintenanceMode}
                                            onChange={(e) => setMaintenanceMode(e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Activar modo mantenimiento
                                        </span>
                                    </label>
                                    {maintenanceMode && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Mensaje de mantenimiento
                                            </label>
                                            <textarea
                                                value={maintenanceMessage}
                                                onChange={(e) => setMaintenanceMessage(e.target.value)}
                                                rows={3}
                                                placeholder="El sistema estará disponible en breve..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    )}
                                    <button
                                        onClick={handleToggleMaintenance}
                                        className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>{maintenanceMode ? 'Desactivar' : 'Activar'} Mantenimiento</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de edición */}
            <EditAuthUserModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                onUserUpdated={fetchUsers}
            />

            {/* Modal de creación */}
            <CreateAuthUserModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onUserCreated={fetchUsers}
            />
        </div>
    );
} 