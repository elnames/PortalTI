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
    Upload
} from 'lucide-react';
import api from '../services/api';
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

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/auth');
            setUsers(data);
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivityLogs = async () => {
        setLogsLoading(true);
        try {
            const { data } = await api.get('/auth/activity-log');
            setActivityLogs(data.logs || []);
        } catch (err) {
            console.error('Error al cargar log de actividades:', err);
        } finally {
            setLogsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser && currentUser.role === 'admin') {
            fetchUsers();
            if (activeTab === 'activity') {
                fetchActivityLogs();
            }
        }
    }, [activeTab, currentUser]);

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
                                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                                    activeTab === tab.id
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
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                            Log de Actividades
                        </h2>
                        <button
                            onClick={fetchActivityLogs}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                        >
                            <Activity className="w-4 h-4" />
                            <span>Actualizar</span>
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
                                                    {log.ipAddress || 'N/A'}
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
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Configuración del Sistema
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                        Logo del Sistema
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nombre del Sistema
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue="Portal IT"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
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
                                    <input type="checkbox" defaultChecked className="rounded" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Notificaciones por email
                                    </span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" defaultChecked className="rounded" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Notificaciones push
                                    </span>
                                </label>
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
                                        defaultValue="60"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" defaultChecked className="rounded" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Forzar cambio de contraseña
                                    </span>
                                </label>
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
                                <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2">
                                    <Download className="w-4 h-4" />
                                    <span>Exportar Datos</span>
                                </button>
                                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
                                    <Upload className="w-4 h-4" />
                                    <span>Importar Datos</span>
                                </button>
                            </div>
                        </div>
                    </div>
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