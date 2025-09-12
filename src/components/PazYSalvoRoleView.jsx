import React, { useState, useEffect } from 'react';
import {
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Calendar,
    AlertTriangle,
    Eye,
    Download,
    UserCheck
} from 'lucide-react';
import { useNotificationContext } from '../contexts/NotificationContext';
import { API_BASE_URL } from '../config';
import PazYSalvoSignatureModal from './PazYSalvoSignatureModal';

export default function PazYSalvoRoleView({ userRole, showHeader = true }) {
    const [pazYSalvos, setPazYSalvos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPazYSalvo, setSelectedPazYSalvo] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [delegations, setDelegations] = useState([]);
    const [showDelegationModal, setShowDelegationModal] = useState(false);
    const [newDelegation, setNewDelegation] = useState({
        usuarioDelegadoId: '',
        motivo: '',
        fechaFin: ''
    });
    const [observations, setObservations] = useState('');
    const { alertSuccess, alertError } = useNotificationContext();

    // Configuración específica por rol
    const roleConfig = {
        'Jefatura Directa': {
            title: 'Paz y Salvo - Jefatura Directa',
            description: 'Revisar y aprobar solicitudes de Paz y Salvo de su equipo',
            canApprove: true,
            canReject: true,
            canView: true,
            canGenerate: false,
            filters: ['Pendiente', 'En Revisión'],
            checklistItems: [
                'Verificar que el empleado haya entregado todas las tareas asignadas',
                'Confirmar que no hay pendientes de trabajo en curso',
                'Revisar que se haya realizado la transición de responsabilidades',
                'Validar que no existan compromisos laborales pendientes'
            ],
            approvalText: 'Aprobar como Jefe Directo',
            rejectText: 'Rechazar - Hay pendientes laborales'
        },
        'RRHH': {
            title: 'Paz y Salvo - Recursos Humanos',
            description: 'Gestionar y generar Paz y Salvo para todos los empleados',
            canApprove: true,
            canReject: true,
            canView: true,
            canGenerate: true,
            filters: ['Todos'],
            checklistItems: [
                'Revisar que todas las áreas hayan firmado',
                'Verificar documentación de nómina completa',
                'Confirmar liquidación de beneficios',
                'Validar entrega de elementos de la empresa'
            ],
            approvalText: 'Generar Paz y Salvo Final',
            rejectText: 'Rechazar - Faltan requisitos'
        },
        'TI': {
            title: 'Paz y Salvo - Tecnología',
            description: 'Revisar activos tecnológicos antes de la aprobación',
            canApprove: true,
            canReject: true,
            canView: true,
            canGenerate: false,
            filters: ['Pendiente', 'En Revisión'],
            checklistItems: [
                'Verificar devolución de equipos asignados (laptop, mouse, teclado)',
                'Confirmar entrega de credenciales y accesos',
                'Revisar que se hayan deshabilitado cuentas de usuario',
                'Validar devolución de licencias de software',
                'Confirmar backup de información importante'
            ],
            approvalText: 'Aprobar - Activos TI Entregados',
            rejectText: 'Rechazar - Faltan Activos TI'
        },
        'Contabilidad': {
            title: 'Paz y Salvo - Contabilidad',
            description: 'Verificar aspectos financieros y contables',
            canApprove: true,
            canReject: true,
            canView: true,
            canGenerate: false,
            filters: ['Pendiente', 'En Revisión'],
            checklistItems: [
                'Verificar liquidación de sueldos y beneficios',
                'Revisar descuentos pendientes (préstamos, anticipos)',
                'Confirmar devolución de viáticos no rendidos',
                'Validar que no hay deudas pendientes con la empresa',
                'Revisar estado de cuentas por cobrar/pagar'
            ],
            approvalText: 'Aprobar - Sin Deudas Pendientes',
            rejectText: 'Rechazar - Hay Deudas Pendientes'
        },
        'Gerencia Finanzas': {
            title: 'Paz y Salvo - Gerencia de Finanzas',
            description: 'Aprobación final de Paz y Salvo',
            canApprove: true,
            canReject: true,
            canView: true,
            canGenerate: false,
            filters: ['Pendiente', 'En Revisión'],
            checklistItems: [
                'Revisar que Contabilidad haya aprobado la liquidación',
                'Verificar que TI haya confirmado devolución de activos',
                'Confirmar que Jefatura Directa aprobó la salida',
                'Validar el cumplimiento de todos los requisitos financieros',
                'Autorizar el cierre definitivo del expediente'
            ],
            approvalText: 'Aprobación Final - Gerencia',
            rejectText: 'Rechazar - Revisar Requisitos'
        }
    };

    const config = roleConfig[userRole] || roleConfig['Jefatura Directa'];

    useEffect(() => {
        loadPazYSalvos();
        loadDelegations();
    }, [userRole]);

    // Manejar el scroll del body cuando el modal esté abierto
    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup function para restaurar el scroll cuando el componente se desmonte
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showModal]);

    const loadPazYSalvos = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/pazysalvo`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // El backend devuelve una estructura paginada con 'items'
            if (data.items && Array.isArray(data.items)) {
                setPazYSalvos(data.items);
            } else if (Array.isArray(data)) {
                setPazYSalvos(data);
            } else {
                console.warn('Estructura de datos inesperada:', data);
                setPazYSalvos([]);
            }
        } catch (error) {
            console.error('Error al cargar Paz y Salvo:', error);
            alertError('Error al cargar los Paz y Salvo');
            setPazYSalvos([]); // Asegurar que sea array vacío en caso de error
        } finally {
            setLoading(false);
        }
    };

    const loadDelegations = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/pazysalvoroles/delegations`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDelegations(data);
            }
        } catch (error) {
            console.error('Error al cargar delegaciones:', error);
        }
    };

    const handleCreateDelegation = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/pazysalvoroles/delegations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...newDelegation,
                    subRole: userRole
                })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            alertSuccess('Delegación creada exitosamente');
            setShowDelegationModal(false);
            setNewDelegation({ usuarioDelegadoId: '', motivo: '', fechaFin: '' });
            loadDelegations();
        } catch (error) {
            console.error('Error al crear delegación:', error);
            alertError('Error al crear la delegación');
        }
    };

    const handleRevokeDelegation = async (delegationId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/pazysalvoroles/delegations/${delegationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            alertSuccess('Delegación revocada exitosamente');
            loadDelegations();
        } catch (error) {
            console.error('Error al revocar delegación:', error);
            alertError('Error al revocar la delegación');
        }
    };



    const getStatusColor = (estado) => {
        switch (estado) {
            case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'En Revisión': return 'bg-blue-100 text-blue-800';
            case 'Aprobado': return 'bg-green-100 text-green-800';
            case 'Rechazado': return 'bg-red-100 text-red-800';
            case 'Completado': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (estado) => {
        switch (estado) {
            case 'Pendiente': return <Clock className="h-4 w-4" />;
            case 'En Revisión': return <Eye className="h-4 w-4" />;
            case 'Aprobado': return <CheckCircle className="h-4 w-4" />;
            case 'Rechazado': return <XCircle className="h-4 w-4" />;
            case 'Completado': return <CheckCircle className="h-4 w-4" />;
            default: return <AlertTriangle className="h-4 w-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Si no hay configuración para el rol, mostrar mensaje de error
    if (!config) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center">
                    <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                    <div>
                        <h3 className="text-lg font-medium text-red-900">
                            Configuración de rol no encontrada
                        </h3>
                        <p className="text-red-700 mt-1">
                            No se encontró configuración para el rol: "{userRole}"
                        </p>
                        <p className="text-red-600 text-sm mt-2">
                            Roles disponibles: {Object.keys(roleConfig).join(', ')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {showHeader && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {config.title}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {config.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Información específica del rol */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0">
                            <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
                                Qué debe revisar como {userRole}:
                            </h3>
                            <ul className="space-y-2">
                                {config.checklistItems.map((item, index) => (
                                    <li key={index} className="flex items-start space-x-2">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                                        </div>
                                        <span className="text-sm text-blue-800 dark:text-blue-200">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                        <button
                            onClick={() => setShowDelegationModal(true)}
                            className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                        >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Gestionar Delegaciones
                        </button>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex flex-wrap gap-2">
                    {config.filters.map((filter) => (
                        <button
                            key={filter}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de Paz y Salvo */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Solicitudes de Paz y Salvo
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Fecha Creación
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Motivo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Progreso Firmas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {pazYSalvos.map((pazYSalvo) => (
                                <tr key={pazYSalvo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <User className="h-5 w-5 text-gray-400 mr-3" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {pazYSalvo.usuarioNombre}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {pazYSalvo.usuarioRut}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pazYSalvo.estado)}`}>
                                            {getStatusIcon(pazYSalvo.estado)}
                                            <span className="ml-1">{pazYSalvo.estado}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                            {new Date(pazYSalvo.fechaCreacion).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                        {pazYSalvo.motivoSalida || 'No especificado'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        <div className="flex flex-wrap gap-1">
                                            {pazYSalvo.estado === 'EnFirma' ? (
                                                <div className="flex flex-col space-y-1">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        🔄 En proceso de firmas
                                                    </span>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                                        {pazYSalvo.firmasTotales - pazYSalvo.firmasPendientes} / {pazYSalvo.firmasTotales} firmas completadas
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                                        <div
                                                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                                            style={{
                                                                width: `${pazYSalvo.firmasTotales > 0 ? ((pazYSalvo.firmasTotales - pazYSalvo.firmasPendientes) / pazYSalvo.firmasTotales) * 100 : 0}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : pazYSalvo.estado === 'Pendiente' ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    ⏳ Pendiente de envío
                                                </span>
                                            ) : pazYSalvo.estado === 'Aprobado' ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    ✅ Aprobado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    📄 {pazYSalvo.estado}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            {config.canView && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedPazYSalvo(pazYSalvo);
                                                        setShowModal(true);
                                                    }}
                                                    className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Ver Detalles
                                                </button>
                                            )}
                                            {pazYSalvo.pdfFinalPath && (
                                                <button
                                                    onClick={() => window.open(pazYSalvo.pdfFinalPath, '_blank')}
                                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                                                >
                                                    <Download className="h-4 w-4 mr-1" />
                                                    PDF
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de firma con checklist */}
            <PazYSalvoSignatureModal
                pazYSalvo={selectedPazYSalvo}
                userRole={userRole}
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedPazYSalvo(null);
                }}
                onSuccess={() => {
                    loadPazYSalvos();
                    setShowModal(false);
                    setSelectedPazYSalvo(null);
                }}
                config={config}
            />

            {/* Modal de delegaciones */}
            {showDelegationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Gestionar Delegaciones - {userRole}
                                </h3>
                                <button
                                    onClick={() => setShowDelegationModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Formulario para crear delegación */}
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="text-md font-medium text-blue-900 dark:text-blue-100 mb-4">
                                    Crear Nueva Delegación
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Usuario a Delegar
                                        </label>
                                        <input
                                            type="email"
                                            value={newDelegation.usuarioDelegadoId}
                                            onChange={(e) => setNewDelegation({ ...newDelegation, usuarioDelegadoId: e.target.value })}
                                            placeholder="email@vicsa.cl"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Motivo de Delegación
                                        </label>
                                        <textarea
                                            value={newDelegation.motivo}
                                            onChange={(e) => setNewDelegation({ ...newDelegation, motivo: e.target.value })}
                                            placeholder="Vacaciones, ausencia temporal, etc."
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Fecha Fin (opcional)
                                        </label>
                                        <input
                                            type="date"
                                            value={newDelegation.fechaFin}
                                            onChange={(e) => setNewDelegation({ ...newDelegation, fechaFin: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <button
                                        onClick={handleCreateDelegation}
                                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                    >
                                        Crear Delegación
                                    </button>
                                </div>
                            </div>

                            {/* Lista de delegaciones activas */}
                            <div>
                                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                                    Delegaciones Activas
                                </h4>
                                {delegations.length > 0 ? (
                                    <div className="space-y-3">
                                        {delegations.map((delegation) => (
                                            <div key={delegation.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {delegation.usuarioDelegado?.nombre} {delegation.usuarioDelegado?.apellido}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {delegation.usuarioDelegado?.email}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                                            {delegation.motivo}
                                                        </p>
                                                        {delegation.fechaFin && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Hasta: {new Date(delegation.fechaFin).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleRevokeDelegation(delegation.id)}
                                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                                    >
                                                        Revocar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                        No hay delegaciones activas
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
