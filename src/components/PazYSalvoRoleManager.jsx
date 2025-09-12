// src/components/PazYSalvoRoleManager.jsx
import React, { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    CheckCircle,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { useNotificationContext } from '../contexts/NotificationContext';
import UserAutoComplete from './UserAutoComplete';
// Removido usuariosAPI - ahora usamos el endpoint específico de pazysalvoroles
import { API_BASE_URL } from '../config';

export default function PazYSalvoRoleManager({ showHeader = true }) {
    const [assignments, setAssignments] = useState([]);
    const [users, setUsers] = useState([]);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [newAssignment, setNewAssignment] = useState({
        departamento: '',
        rol: '',
        userId: ''
    });

    const { alertSuccess, alertError } = useNotificationContext();

    const roles = [
        'Jefatura Directa',
        'RRHH',
        'TI',
        'Contabilidad',
        'Gerencia Finanzas'
    ];

    const departamentos = [
        'General',
        'IT',
        'Finanzas',
        'RRHH',
        'Operaciones'
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadAssignments(),
                loadUsers(),
                loadConfig()
            ]);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            alertError('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const loadAssignments = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/pazysalvoroles/assignments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    // Si no existe el endpoint, inicializar con array vacío
                    setAssignments([]);
                    return;
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            setAssignments(data);
        } catch (error) {
            console.error('Error al cargar asignaciones:', error);
            setAssignments([]); // Inicializar con array vacío en caso de error
        }
    };

    const loadUsers = async () => {
        try {
            console.log('Cargando usuarios para roles...');
            const response = await fetch(`${API_BASE_URL}/pazysalvoroles/users`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Usuarios cargados para roles:', data);
            setUsers(data || []);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            setUsers([]); // Inicializar con array vacío en caso de error
        }
    };

    const loadConfig = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/pazysalvoroles/config`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    // Si no existe el endpoint, usar configuración por defecto
                    setConfig({
                        nombre: 'Configuración por Defecto',
                        activo: true,
                        permiteDelegacion: true,
                        firmas: [
                            { id: 1, rol: 'Jefatura Directa', orden: 1, obligatorio: true },
                            { id: 2, rol: 'RRHH', orden: 2, obligatorio: true },
                            { id: 3, rol: 'TI', orden: 3, obligatorio: true },
                            { id: 4, rol: 'Contabilidad', orden: 4, obligatorio: true },
                            { id: 5, rol: 'Gerencia Finanzas', orden: 5, obligatorio: true }
                        ]
                    });
                    return;
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            setConfig(data);
        } catch (error) {
            console.error('Error al cargar configuración:', error);
            // Usar configuración por defecto en caso de error
            setConfig({
                nombre: 'Configuración por Defecto',
                activo: true,
                permiteDelegacion: true,
                firmas: [
                    { id: 1, rol: 'Jefatura Directa', orden: 1, obligatorio: true },
                    { id: 2, rol: 'RRHH', orden: 2, obligatorio: true },
                    { id: 3, rol: 'TI', orden: 3, obligatorio: true },
                    { id: 4, rol: 'Contabilidad', orden: 4, obligatorio: true },
                    { id: 5, rol: 'Gerencia Finanzas', orden: 5, obligatorio: true }
                ]
            });
        }
    };

    const handleUsuarioChange = (userId) => {
        console.log('DEBUG: Usuario seleccionado:', userId);
        setNewAssignment(prev => ({
            ...prev,
            userId: userId
        }));

        // Capturar automáticamente el departamento del usuario
        if (userId) {
            const usuario = users.find(u => u.id === userId);
            if (usuario && usuario.departamento) {
                console.log('DEBUG: Departamento capturado:', usuario.departamento);
                setNewAssignment(prev => ({
                    ...prev,
                    departamento: usuario.departamento
                }));
            }
        }
    };

    const handleCreateAssignment = async () => {
        if (!newAssignment.rol || !newAssignment.userId) {
            alertError('Debe seleccionar un rol y un usuario');
            return;
        }

        try {
            // Si el rol es "Jefatura Directa", crear automáticamente el jefe directo
            if (newAssignment.rol === 'Jefatura Directa') {
                try {
                    const jefeResponse = await fetch(`${API_BASE_URL}/pazysalvoroles/create-jefe-directo`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ UsuarioId: newAssignment.userId })
                    });

                    if (jefeResponse.ok) {
                        const jefeData = await jefeResponse.json();
                        console.log('Jefe directo creado/actualizado:', jefeData);
                    }
                } catch (jefeError) {
                    console.warn('Error al crear jefe directo (continuando):', jefeError);
                    // Continuar con la creación de la asignación aunque falle la creación del jefe directo
                }
            }

            const response = await fetch(`${API_BASE_URL}/pazysalvoroles/assignments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newAssignment)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            alertSuccess('Asignación creada exitosamente');
            setShowCreateModal(false);
            setNewAssignment({ departamento: '', rol: '', userId: '' });
            loadAssignments();
        } catch (error) {
            console.error('Error al crear asignación:', error);
            alertError(error.message);
        }
    };

    const handleUpdateAssignment = async (id, updates) => {
        try {
            const response = await fetch(`${API_BASE_URL}/pazysalvoroles/assignments/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            alertSuccess('Asignación actualizada exitosamente');
            setEditingAssignment(null);
            loadAssignments();
        } catch (error) {
            console.error('Error al actualizar asignación:', error);
            alertError(error.message);
        }
    };

    const handleDeleteAssignment = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres desactivar esta asignación?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/pazysalvoroles/assignments/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            alertSuccess('Asignación desactivada exitosamente');
            loadAssignments();
        } catch (error) {
            console.error('Error al desactivar asignación:', error);
            alertError(error.message);
        }
    };

    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.nombre} ${user.apellido}` : 'Usuario no encontrado';
    };

    const getUserRole = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? user.role : 'N/A';
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            {showHeader && (
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Users className="h-6 w-6 mr-2 text-blue-600" />
                            Gestión de Roles de Paz y Salvo
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Configura quién debe firmar cada tipo de documento
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={loadData}
                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>Actualizar</span>
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Nueva Asignación</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Controles cuando no hay header */}
            {!showHeader && (
                <div className="flex justify-end items-center space-x-3">
                    <button
                        onClick={loadData}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Actualizar</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Nueva Asignación</span>
                    </button>
                </div>
            )}

            {/* Configuración de firmas */}
            {config && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-2">
                        Configuración de Firmas
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        {config.nombre} - {config.permiteDelegacion ? 'Permite delegación' : 'No permite delegación'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {config.firmas.map((firma, index) => (
                            <div key={`firma-${index}-${firma.rol}`} className="flex items-center space-x-2 text-sm">
                                <span className="font-medium text-blue-800 dark:text-blue-400">
                                    {firma.orden}.
                                </span>
                                <span className="text-blue-700 dark:text-blue-300">
                                    {firma.rol}
                                </span>
                                {firma.obligatorio && (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lista de asignaciones */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Asignaciones de Roles ({assignments.length})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Departamento
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Rol
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Usuario Asignado
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Rol del Usuario
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {assignments.map((assignment) => (
                                <tr key={assignment.id}>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                        {assignment.departamento}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                        {assignment.rol}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                        {assignment.nombre} {assignment.apellido}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        {assignment.userRole}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${assignment.isActive
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                            }`}>
                                            {assignment.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setEditingAssignment(assignment)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAssignment(assignment.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de creación */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Nueva Asignación de Rol
                            </h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Usuario (Jefe Directo) */}
                            <div>
                                <UserAutoComplete
                                    value={newAssignment.userId}
                                    usuarios={users}
                                    onChange={handleUsuarioChange}
                                    placeholder="Buscar usuario por nombre, departamento o email..."
                                    label="Usuario (Jefe Directo) *"
                                    required={true}
                                />
                            </div>

                            {/* Departamento (capturado automáticamente) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Departamento
                                </label>
                                <input
                                    type="text"
                                    value={newAssignment.departamento}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                                    placeholder="Se capturará automáticamente del usuario seleccionado"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Se captura automáticamente del usuario seleccionado
                                </p>
                            </div>

                            {/* Rol */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Rol *
                                </label>
                                <select
                                    value={newAssignment.rol}
                                    onChange={(e) => setNewAssignment(prev => ({ ...prev, rol: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">Seleccionar rol...</option>
                                    {roles.map(rol => (
                                        <option key={rol} value={rol}>{rol}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateAssignment}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Crear Asignación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
