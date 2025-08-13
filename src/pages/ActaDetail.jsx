import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
    FileText,
    Calendar,
    User,
    HardDrive,
    CheckCircle,
    XCircle,
    Eye,
    FileCheck,
    ArrowLeft,
    Upload,
    Download,
    Trash2,
    Clock,
    Building,
    MapPin,
    Phone,
    Mail,
    ChevronRight
} from 'lucide-react';
import { asignacionesAPI, actasAPI } from '../services/api';
import GenerarActaModal from '../components/GenerarActaModal';
import Tooltip from '../components/Tooltip';

const ActaDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();

    // Estados principales
    const [asignacion, setAsignacion] = useState(null);
    const [acta, setActa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados de modales
    const [showGenerarActaModal, setShowGenerarActaModal] = useState(false);
    const [selectedAsignacion, setSelectedAsignacion] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [observaciones, setObservaciones] = useState('');
    const [selectedAsignacionForUpload, setSelectedAsignacionForUpload] = useState(null);

    // Estados para modal de previsualización personalizada
    const [showPrevisualizacionModal, setShowPrevisualizacionModal] = useState(false);
    const [selectedActaForPreview, setSelectedActaForPreview] = useState(null);
    const [selectedAsignacionForPreview, setSelectedAsignacionForPreview] = useState(null);
    const [incluirFirmaTI, setIncluirFirmaTI] = useState(true);
    const [fechaEntrega, setFechaEntrega] = useState('');

    // Estados para aprobación/rechazo
    const [showAprobarModal, setShowAprobarModal] = useState(false);
    const [showRechazarModal, setShowRechazarModal] = useState(false);
    const [comentariosAprobacion, setComentariosAprobacion] = useState('');
    const [aprobarLoading, setAprobarLoading] = useState(false);

    useEffect(() => {
        fetchActaData();
    }, [id]);

    const fetchActaData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Obtener la asignación
            const asignacionResponse = await asignacionesAPI.getById(id);
            setAsignacion(asignacionResponse.data);

            // Obtener el acta asociado si existe
            try {
                const actaResponse = await actasAPI.getByAsignacionId(id);
                if (actaResponse.data) {
                    setActa(actaResponse.data);
                }
            } catch (actaError) {
                // Si no hay acta, es normal
                console.log('No se encontró acta para esta asignación');
            }
        } catch (error) {
            console.error('Error al cargar datos del acta:', error);
            setError('No se pudo cargar la información del acta');
            showToast('Error', 'No se pudo cargar la información del acta', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Funciones de acciones (copiadas de GestionActas.jsx)
    const handleGenerarActa = (asignacion) => {
        setSelectedAsignacion(asignacion);
        setShowGenerarActaModal(true);
    };

    const handleCloseGenerarActa = () => {
        setShowGenerarActaModal(false);
        setSelectedAsignacion(null);
    };

    const handleGenerarActaSuccess = () => {
        setShowGenerarActaModal(false);
        setSelectedAsignacion(null);
        fetchActaData(); // Recargar datos
        showToast('Éxito', 'Acta generada correctamente', 'success');
    };

    const handleMarcarPendienteFirma = async (asignacionId) => {
        try {
            await actasAPI.marcarPendienteFirma(asignacionId);
            showToast('Éxito', 'Acta marcada como pendiente de firma', 'success');
            fetchActaData(); // Recargar datos
        } catch (error) {
            console.error('Error al marcar como pendiente:', error);
            showToast('Error', 'No se pudo marcar como pendiente', 'error');
        }
    };

    const handleSubirActaUsuario = (asignacion) => {
        setSelectedAsignacionForUpload(asignacion);
        setShowUploadModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUploadActa = async () => {
        if (!selectedFile) {
            showToast('Error', 'Por favor selecciona un archivo', 'error');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('archivo', selectedFile);
            formData.append('asignacionId', selectedAsignacionForUpload.id);
            formData.append('observaciones', observaciones);

            await actasAPI.subirActa(formData);

            setShowUploadModal(false);
            setSelectedFile(null);
            setObservaciones('');
            setSelectedAsignacionForUpload(null);

            showToast('Éxito', 'Acta subida correctamente', 'success');
            fetchActaData(); // Recargar datos
        } catch (error) {
            console.error('Error al subir acta:', error);
            showToast('Error', 'No se pudo subir el acta', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handlePrevisualizarActa = async (acta, asignacionId) => {
        try {
            const response = await actasAPI.previsualizar(acta.id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error al previsualizar:', error);
            showToast('Error', 'No se pudo previsualizar el acta', 'error');
        }
    };

    const handlePrevisualizacionPersonalizada = (acta, asignacion) => {
        setSelectedActaForPreview(acta);
        setSelectedAsignacionForPreview(asignacion);
        setShowPrevisualizacionModal(true);
    };

    const handleConfirmarPrevisualizacion = async () => {
        try {
            const response = await actasAPI.previsualizarPersonalizada({
                asignacionId: selectedAsignacionForPreview.id,
                incluirFirmaTI,
                fechaEntrega: fechaEntrega || new Date().toISOString().split('T')[0]
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');

            setShowPrevisualizacionModal(false);
            setSelectedActaForPreview(null);
            setSelectedAsignacionForPreview(null);
        } catch (error) {
            console.error('Error al previsualizar:', error);
            showToast('Error', 'No se pudo generar la previsualización', 'error');
        }
    };

    const handleAprobarActa = async (actaId, aprobado, comentarios = '') => {
        try {
            setAprobarLoading(true);
            await actasAPI.aprobarActa(actaId, { Aprobar: aprobado, Comentarios: comentarios });

            const mensaje = aprobado ? 'Acta aprobada correctamente' : 'Acta rechazada correctamente';
            showToast('Éxito', mensaje, 'success');

            setShowAprobarModal(false);
            setShowRechazarModal(false);
            setComentariosAprobacion('');

            fetchActaData(); // Recargar datos
        } catch (error) {
            console.error('Error al aprobar/rechazar acta:', error);
            showToast('Error', 'No se pudo procesar la solicitud', 'error');
        } finally {
            setAprobarLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Activa':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Inactiva':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getEstadoActaColor = (estado) => {
        if (!estado) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';

        const estadoLower = estado.toLowerCase();
        switch (estadoLower) {
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'firmada':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'aprobada':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'rechazada':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getCategoriaIcon = (categoria) => {
        switch (categoria?.toLowerCase()) {
            case 'laptop':
                return '💻';
            case 'desktop':
                return '🖥️';
            case 'monitor':
                return '🖥️';
            case 'teclado':
                return '⌨️';
            case 'mouse':
                return '🖱️';
            case 'impresora':
                return '🖨️';
            case 'scanner':
                return '📷';
            case 'tablet':
                return '📱';
            case 'celular':
                return '📱';
            case 'accesorio':
                return '🔌';
            default:
                return '💻';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !asignacion) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Error al cargar el acta
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {error || 'No se encontró la información del acta'}
                            </p>
                            <button
                                onClick={() => navigate('/gestion-actas')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Volver a Gestión de Actas
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/gestion-actas')}
                            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Detalle del Acta
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {asignacion.activo?.codigo} - {asignacion.activo?.categoria}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Información Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Información del Activo */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <span className="text-lg">{getCategoriaIcon(asignacion.activo?.categoria)}</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Información del Activo
                                </h3>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Código</label>
                                <p className="text-sm text-gray-900 dark:text-white">{asignacion.activo?.codigo}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Categoría</label>
                                <p className="text-sm text-gray-900 dark:text-white">{asignacion.activo?.categoria}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</label>
                                <p className="text-sm text-gray-900 dark:text-white">{asignacion.activo?.nombre}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(asignacion.estado)}`}>
                                    {asignacion.estado}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Información del Usuario */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Información del Usuario
                                </h3>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</label>
                                <p className="text-sm text-gray-900 dark:text-white">
                                    {asignacion.usuario?.nombre} {asignacion.usuario?.apellido}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                                <p className="text-sm text-gray-900 dark:text-white">{asignacion.usuario?.email}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</label>
                                <p className="text-sm text-gray-900 dark:text-white">{asignacion.usuario?.empresa || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ubicación</label>
                                <p className="text-sm text-gray-900 dark:text-white">{asignacion.usuario?.ubicacion || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Estado del Acta */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Estado del Acta
                                </h3>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {acta ? (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoActaColor(acta.estado)}`}>
                                            📄 {acta.estado}
                                        </span>
                                    </div>
                                    {acta.metodoFirma && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Método de Firma</label>
                                            <p className="text-sm text-gray-900 dark:text-white">{acta.metodoFirma}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Creación</label>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {new Date(acta.fechaCreacion).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin acta generada</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Acciones Disponibles
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {asignacion.estado === 'Activa' && (
                            <>
                                {/* Generar Acta */}
                                {!acta && (
                                    <button
                                        onClick={() => handleGenerarActa(asignacion)}
                                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <FileCheck className="w-4 h-4" />
                                        <span>Generar Acta</span>
                                    </button>
                                )}

                                {/* Marcar Pendiente */}
                                {!acta && (
                                    <button
                                        onClick={() => handleMarcarPendienteFirma(asignacion.id)}
                                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                    >
                                        <Clock className="w-4 h-4" />
                                        <span>Marcar Pendiente</span>
                                    </button>
                                )}

                                {/* Subir Acta */}
                                <button
                                    onClick={() => handleSubirActaUsuario(asignacion)}
                                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>Subir Acta</span>
                                </button>

                                {/* Previsualizar */}
                                <button
                                    onClick={() => {
                                        if (!acta || acta.estado?.toLowerCase() === 'pendiente') {
                                            handlePrevisualizacionPersonalizada(acta, asignacion);
                                        } else {
                                            handlePrevisualizarActa(acta, asignacion.id);
                                        }
                                    }}
                                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>Previsualizar</span>
                                </button>

                                {/* Aprobar */}
                                {acta && acta.estado?.toLowerCase() !== 'pendiente' && (
                                    <button
                                        onClick={() => setShowAprobarModal(true)}
                                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Aprobar</span>
                                    </button>
                                )}

                                {/* Rechazar */}
                                {acta && acta.estado?.toLowerCase() !== 'pendiente' && (
                                    <button
                                        onClick={() => setShowRechazarModal(true)}
                                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span>Rechazar</span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Información Adicional */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Información Adicional
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Asignación</label>
                            <p className="text-sm text-gray-900 dark:text-white">
                                {new Date(asignacion.fechaAsignacion).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>

                        {acta && (
                            <>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Archivo del Acta</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{acta.nombreArchivo}</p>
                                </div>
                                {acta.fechaSubida && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Subida</label>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {new Date(acta.fechaSubida).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modales */}
            {showGenerarActaModal && (
                <GenerarActaModal
                    isOpen={showGenerarActaModal}
                    onClose={handleCloseGenerarActa}
                    asignacion={selectedAsignacion}
                    onSuccess={handleGenerarActaSuccess}
                />
            )}

            {/* Modal de Upload */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Subir Acta Firmada
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Archivo PDF
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Observaciones
                                </label>
                                <textarea
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Observaciones adicionales..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setSelectedFile(null);
                                    setObservaciones('');
                                    setSelectedAsignacionForUpload(null);
                                }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUploadActa}
                                disabled={uploading || !selectedFile}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {uploading ? 'Subiendo...' : 'Subir Acta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Previsualización Personalizada */}
            {showPrevisualizacionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Previsualización Personalizada
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={incluirFirmaTI}
                                        onChange={(e) => setIncluirFirmaTI(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Incluir firma de TI
                                    </span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Fecha de Entrega
                                </label>
                                <input
                                    type="date"
                                    value={fechaEntrega}
                                    onChange={(e) => setFechaEntrega(e.target.value)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowPrevisualizacionModal(false);
                                    setSelectedActaForPreview(null);
                                    setSelectedAsignacionForPreview(null);
                                }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmarPrevisualizacion}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                            >
                                Generar Previsualización
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Aprobar */}
            {showAprobarModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Aprobar Acta
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Comentarios (opcional)
                                </label>
                                <textarea
                                    value={comentariosAprobacion}
                                    onChange={(e) => setComentariosAprobacion(e.target.value)}
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Comentarios adicionales..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAprobarModal(false);
                                    setComentariosAprobacion('');
                                }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleAprobarActa(acta.id, true, comentariosAprobacion)}
                                disabled={aprobarLoading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {aprobarLoading ? 'Procesando...' : 'Aprobar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Rechazar */}
            {showRechazarModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Rechazar Acta
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Comentarios (requerido)
                                </label>
                                <textarea
                                    value={comentariosAprobacion}
                                    onChange={(e) => setComentariosAprobacion(e.target.value)}
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Motivo del rechazo..."
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowRechazarModal(false);
                                    setComentariosAprobacion('');
                                }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleAprobarActa(acta.id, false, comentariosAprobacion)}
                                disabled={aprobarLoading || !comentariosAprobacion.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {aprobarLoading ? 'Procesando...' : 'Rechazar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActaDetail;
