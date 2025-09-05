// src/pages/ActivoDetail.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    HardDrive,
    Edit2,
    User,
    ArrowLeft,
    Cpu,
    Monitor,
    Smartphone,
    Server,
    Calendar,
    MapPin,
    Building,
    Mail,
    FileText,
    History,
    Activity,
    Shield,
    Plus,
    X
} from 'lucide-react'
import api from '../services/api'
import SoftwareSecurityManager from '../components/SoftwareSecurityManager'
import RemoteConnectionManager from '../components/RemoteConnectionManager'
import AsignarActivoModal from '../components/AsignarActivoModal'
import { useNotificationContext } from '../contexts/NotificationContext'

export default function ActivoDetail() {
    const { id: codigo } = useParams()
    const navigate = useNavigate()
    const [activo, setActivo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState('info')
    const [showAsignarModal, setShowAsignarModal] = useState(false)
    const { alertSuccess, alertError } = useNotificationContext()

    const fetchActivo = useCallback(async () => {
        if (!codigo) {
            setError('Código de activo no válido')
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const { data } = await api.get(`/activos/${codigo}`)
            setActivo(data)
        } catch (err) {
            console.error('Error al cargar activo:', err)
            setError('Error al cargar el activo')
        } finally {
            setLoading(false)
        }
    }, [codigo])

    useEffect(() => {
        fetchActivo()
    }, [codigo, fetchActivo])

    const handleAsignacionCreada = () => {
        fetchActivo() // Recargar el activo para mostrar la nueva asignación
    }

    const handleQuitarAsignacion = async () => {
        if (!activo.asignadoA || !activo.asignadoA.asignacionId) {
            console.error('No hay asignación activa para quitar');
            return;
        }

        if (window.confirm('¿Estás seguro de que quieres quitar la asignación de este activo?')) {
            try {
                await api.delete(`/asignaciones/${activo.asignadoA.asignacionId}`);
                alertSuccess('Asignación quitada exitosamente');
                fetchActivo(); // Recargar el activo
            } catch (error) {
                console.error('Error al quitar asignación:', error);
                alertError('Error al quitar la asignación');
            }
        }
    }

    const getStatusColor = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'activo':
            case 'asignado':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'inactivo':
            case 'retirado':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    }

    const getCategoryIcon = (categoria) => {
        switch (categoria?.toLowerCase()) {
            case 'equipos':
            case 'computador':
            case 'laptop':
                return <Cpu className="h-5 w-5" />;
            case 'monitores':
            case 'pantalla':
                return <Monitor className="h-5 w-5" />;
            case 'móviles':
            case 'celular':
            case 'smartphone':
                return <Smartphone className="h-5 w-5" />;
            case 'servidores':
            case 'server':
                return <Server className="h-5 w-5" />;
            default:
                return <HardDrive className="h-5 w-5" />;
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <HardDrive className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error al cargar activo</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    if (!activo) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <HardDrive className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Activo no encontrado</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">El activo que buscas no existe o ha sido eliminado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-blue-600 flex items-center justify-center">
                            {getCategoryIcon(activo.categoria)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                                {activo.nombreEquipo || activo.codigo}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{activo.codigo}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/activos/${activo.codigo}/editar`)}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
                >
                    <Edit2 className="h-4 w-4" />
                    <span>Editar activo</span>
                </button>
            </div>

            {/* Status Badge */}
            <div className="flex items-center space-x-2">
                {activo.asignadoA ? (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        Asignado
                    </span>
                ) : (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activo.estado)}`}>
                        {activo.estado}
                    </span>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto scrollbar-hide">
                    <nav className="-mb-px flex space-x-8 min-w-max px-4">
                        {[
                            { id: 'info', label: 'Información', icon: HardDrive },
                            { id: 'software', label: 'Software & Seguridad', icon: Shield, show: activo?.categoria?.toLowerCase() === 'equipos' },
                            { id: 'conexion', label: 'Conexión Remota', icon: Monitor, show: activo?.categoria?.toLowerCase() === 'equipos' },
                            { id: 'asignacion', label: 'Asignación', icon: User, show: true },
                            { id: 'historial', label: 'Historial', icon: History, show: true }
                        ].filter(tab => tab.show !== false).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4 flex-shrink-0" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Información General */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <HardDrive className="h-5 w-5 mr-2 text-blue-600" />
                                Información General
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <HardDrive className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Código</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{activo.codigo}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Activity className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Categoría</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{activo.categoria}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Ubicación</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{activo.ubicacion}</p>
                                    </div>
                                </div>
                                {activo.nombreEquipo && (
                                    <div className="flex items-center space-x-3">
                                        <HardDrive className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Nombre del Equipo</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{activo.nombreEquipo}</p>
                                        </div>
                                    </div>
                                )}
                                {activo.tipoEquipo && (
                                    <div className="flex items-center space-x-3">
                                        <HardDrive className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de Equipo</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{activo.tipoEquipo}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Especificaciones Técnicas */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Cpu className="h-5 w-5 mr-2 text-blue-600" />
                                Especificaciones Técnicas
                            </h3>
                            <div className="space-y-4">
                                {activo.procesador && (
                                    <div className="flex items-center space-x-3">
                                        <Cpu className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Procesador</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{activo.procesador}</p>
                                        </div>
                                    </div>
                                )}
                                {activo.sistemaOperativo && (
                                    <div className="flex items-center space-x-3">
                                        <Monitor className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Sistema Operativo</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{activo.sistemaOperativo}</p>
                                        </div>
                                    </div>
                                )}
                                {activo.ram && (
                                    <div className="flex items-center space-x-3">
                                        <Activity className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">RAM</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{activo.ram} GB</p>
                                        </div>
                                    </div>
                                )}
                                {activo.marca && (
                                    <div className="flex items-center space-x-3">
                                        <Building className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Marca</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{activo.marca}</p>
                                        </div>
                                    </div>
                                )}
                                {activo.modelo && (
                                    <div className="flex items-center space-x-3">
                                        <HardDrive className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Modelo</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{activo.modelo}</p>
                                        </div>
                                    </div>
                                )}
                                {activo.serie && (
                                    <div className="flex items-center space-x-3">
                                        <FileText className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">N° Serie</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{activo.serie}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'asignacion' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                    <User className="h-5 w-5 mr-2 text-blue-600" />
                                    {activo.asignadoA ? 'Usuario Asignado' : 'Asignación de Activo'}
                                </h3>
                                <div className="flex space-x-2">
                                    {!activo.asignadoA ? (
                                        <button
                                            onClick={() => setShowAsignarModal(true)}
                                            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>Asignar Activo</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleQuitarAsignacion}
                                            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
                                        >
                                            <X className="h-4 w-4" />
                                            <span>Quitar Asignación</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6">
                            {activo.asignadoA ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                    {/* Información del Usuario */}
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Nombre Completo</p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {activo.asignadoA.nombre} {activo.asignadoA.apellido}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{activo.asignadoA.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Building className="h-4 w-4 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Departamento</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{activo.asignadoA.departamento}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información de Asignación */}
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Asignación</p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {formatDate(activo.asignadoA.fechaAsignacion)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Activity className="h-4 w-4 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Estado de Asignación</p>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activo.asignadoA.estado || 'Activa')}`}>
                                                    {activo.asignadoA.estado || 'Activa'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <User className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Activo sin asignar</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Este activo no está asignado a ningún usuario. Haz clic en "Asignar Activo" para asignarlo.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'software' && (
                    <SoftwareSecurityManager activoId={activo.id} activoData={activo} />
                )}

                {activeTab === 'conexion' && (
                    <RemoteConnectionManager activoData={activo} />
                )}

                {activeTab === 'historial' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <History className="h-5 w-5 mr-2 text-blue-600" />
                                Historial del Activo
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="text-center py-8">
                                <History className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Historial no disponible</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    El historial de asignaciones y cambios de estado estará disponible próximamente.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Asignación */}
            {activo && (
                <AsignarActivoModal
                    isOpen={showAsignarModal}
                    onClose={() => setShowAsignarModal(false)}
                    activo={activo}
                    onAsignacionCreada={handleAsignacionCreada}
                />
            )}
        </div>
    )
}
