// src/components/PazYSalvoManager.jsx
import React, { useState, useEffect } from 'react';
import {
    FileText,
    Plus,
    Eye,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Users,
    Calendar,
    Package,
    Search,
    Filter,
    RefreshCw,
    Trash2
} from 'lucide-react';
import { useNotificationContext } from '../contexts/NotificationContext';
import { usePazYSalvoNotifications } from '../hooks/usePazYSalvoNotifications';
import { useAuth } from '../contexts/AuthContext';
import { pazYSalvoAPI, usuariosAPI } from '../services/api';
import { API_BASE_URL } from '../config';
import PazYSalvoCard from './PazYSalvoCard';
import PazYSalvoDetail from './PazYSalvoDetail';
import PazYSalvoCreate from './PazYSalvoCreate';
import PazYSalvoFilters from './PazYSalvoFilters';
import PazYSalvoDeleteModal from './PazYSalvoDeleteModal';

export default function PazYSalvoManager() {
    const [pazYSalvoList, setPazYSalvoList] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPazYSalvo, setSelectedPazYSalvo] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pazYSalvoToDelete, setPazYSalvoToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [filters, setFilters] = useState({
        estado: '',
        usuario: '',
        fechaDesde: '',
        fechaHasta: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0
    });

    const { alertSuccess, alertError } = useNotificationContext();
    const { user } = useAuth();
    usePazYSalvoNotifications(); // Suscribirse automáticamente a notificaciones

    // Verificar si el usuario puede crear documentos (RRHH o Admin)
    console.log('DEBUG PazYSalvoManager - Usuario actual:', user);
    console.log('DEBUG PazYSalvoManager - Rol del usuario:', user?.role);
    console.log('DEBUG PazYSalvoManager - Subroles del usuario:', user?.subroles);
    console.log('DEBUG PazYSalvoManager - Empresa del usuario:', user?.empresa);
    
    // Permitir crear si es admin, rrhh, o tiene subrol RRHH
    const hasRRHHSubrole = user?.subroles?.some(subrole => subrole.rol === 'RRHH');
    const canCreate = user?.role === 'rrhh' || user?.role === 'admin' || hasRRHHSubrole;
    const canDelete = user?.role === 'rrhh' || user?.role === 'admin' || hasRRHHSubrole;
    console.log('DEBUG PazYSalvoManager - hasRRHHSubrole:', hasRRHHSubrole);
    console.log('DEBUG PazYSalvoManager - canCreate:', canCreate);
    console.log('DEBUG PazYSalvoManager - canDelete:', canDelete);

    useEffect(() => {
        loadPazYSalvoData();
        loadUsuarios();
    }, [filters, pagination.page, pagination.pageSize]);

    const loadPazYSalvoData = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                pageSize: pagination.pageSize,
                estado: filters.estado || undefined,
                search: filters.search || undefined
            };

            const response = await pazYSalvoAPI.getAll(params);
            setPazYSalvoList(response.data.items || response.data);
            setPagination(prev => ({
                ...prev,
                total: response.data.totalCount || response.data.length
            }));
        } catch (error) {
            console.error('Error al cargar Paz y Salvo:', error);
            alertError('Error al cargar los documentos de Paz y Salvo');
        } finally {
            setLoading(false);
        }
    };

    const loadUsuarios = async () => {
        try {
            console.log('Cargando usuarios...');
            const response = await fetch(`${API_BASE_URL}/pazysalvoroles/users`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Usuarios cargados:', data);
            
            // Eliminar duplicados por ID, manteniendo el primero
            const uniqueUsers = data?.filter((user, index, arr) => 
                arr.findIndex(u => u.id === user.id) === index
            ) || [];
            
            console.log('Usuarios únicos:', uniqueUsers.length);
            console.log('Usuarios con AuthUser:', uniqueUsers.filter(u => u.hasAuthUser).length);
            console.log('Usuarios sin AuthUser:', uniqueUsers.filter(u => !u.hasAuthUser).length);
            
            setUsuarios(uniqueUsers);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            setUsuarios([]); // Inicializar con array vacío en caso de error
        }
    };

    const handleCreate = async (data) => {
        try {
            console.log('DEBUG: Datos a enviar al crear Paz y Salvo:', data);
            const response = await pazYSalvoAPI.create(data);
            console.log('DEBUG: Respuesta del servidor:', response);
            alertSuccess('Paz y Salvo creado exitosamente');
            setShowCreateModal(false);
            loadPazYSalvoData();
        } catch (error) {
            console.error('Error al crear Paz y Salvo:', error);
            console.error('Error details:', error.response?.data);
            alertError(`Error al crear el documento de Paz y Salvo: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleViewDetail = async (id) => {
        try {
            const response = await pazYSalvoAPI.getById(id);
            setSelectedPazYSalvo(response.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error al cargar detalles:', error);
            alertError('Error al cargar los detalles del documento');
        }
    };

    const handleDownloadPdf = async (id) => {
        try {
            const response = await pazYSalvoAPI.descargarPdf(id);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `paz-y-salvo-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            alertSuccess('PDF descargado exitosamente');
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            alertError('Error al descargar el PDF');
        }
    };

    const handleRefresh = () => {
        loadPazYSalvoData();
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleDeleteClick = (pazYSalvo) => {
        setPazYSalvoToDelete(pazYSalvo);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!pazYSalvoToDelete) return;

        setDeleteLoading(true);
        try {
            await pazYSalvoAPI.eliminar(pazYSalvoToDelete.id);
            alertSuccess('Paz y Salvo eliminado exitosamente');
            setShowDeleteModal(false);
            setPazYSalvoToDelete(null);
            loadPazYSalvoData(); // Recargar la lista
        } catch (error) {
            console.error('Error al eliminar Paz y Salvo:', error);
            alertError('Error al eliminar el Paz y Salvo');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setPazYSalvoToDelete(null);
    };

    const getStatusIcon = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'borrador':
                return <FileText className="h-5 w-5 text-gray-600" />;
            case 'en_firma':
                return <Clock className="h-5 w-5 text-yellow-600" />;
            case 'aprobado':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'rechazado':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'cerrado':
                return <CheckCircle className="h-5 w-5 text-blue-600" />;
            default:
                return <FileText className="h-5 w-5 text-gray-600" />;
        }
    };

    const getStatusColor = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'borrador':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case 'en_firma':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'aprobado':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'rechazado':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 'cerrado':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getStatusText = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'borrador':
                return 'Borrador';
            case 'en_firma':
                return 'En Firma';
            case 'aprobado':
                return 'Aprobado';
            case 'rechazado':
                return 'Rechazado';
            case 'cerrado':
                return 'Cerrado';
            default:
                return estado;
        }
    };

    if (loading && pazYSalvoList.length === 0) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <FileText className="h-6 w-6 mr-2 text-blue-600" />
                        Paz y Salvo
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Gestión de documentos de paz y salvo con flujo de firmas
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Actualizar</span>
                    </button>
                    {canCreate && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Nuevo Paz y Salvo</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filtros */}
            <PazYSalvoFilters
                filters={filters}
                usuarios={usuarios}
                onFilterChange={handleFilterChange}
            />

            {/* Lista de Paz y Salvo */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Documentos ({pagination.total})
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>Página {pagination.page} de {Math.ceil(pagination.total / pagination.pageSize)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    {pazYSalvoList.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                                No hay documentos de Paz y Salvo
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm">
                                Crea un nuevo documento para comenzar
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pazYSalvoList.map((pazYSalvo) => (
                                <div key={pazYSalvo.id} className="relative">
                                    <PazYSalvoCard
                                        pazYSalvo={pazYSalvo}
                                        onViewDetail={handleViewDetail}
                                        onDownloadPdf={handleDownloadPdf}
                                        getStatusIcon={getStatusIcon}
                                        getStatusColor={getStatusColor}
                                        getStatusText={getStatusText}
                                    />
                                    {/* Botón de eliminar para RRHH y Admin */}
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDeleteClick(pazYSalvo)}
                                            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 transition-colors bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg z-10"
                                            title="Eliminar Paz y Salvo"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Paginación */}
                {pagination.total > pagination.pageSize && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} resultados
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                                className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modales */}
            {showCreateModal && canCreate && (
                <PazYSalvoCreate
                    usuarios={usuarios}
                    onCreate={handleCreate}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {showDetailModal && selectedPazYSalvo && (
                <PazYSalvoDetail
                    pazYSalvo={selectedPazYSalvo}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedPazYSalvo(null);
                    }}
                    onRefresh={loadPazYSalvoData}
                />
            )}

            {/* Modal de eliminación */}
            <PazYSalvoDeleteModal
                isOpen={showDeleteModal}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                pazYSalvo={pazYSalvoToDelete}
                loading={deleteLoading}
            />
        </div>
    );
}