// src/components/PazYSalvoFirmas.jsx
import React, { useState } from 'react';
import {
    CheckCircle,
    XCircle,
    Clock,
    User,
    MessageSquare,
    AlertTriangle,
    RefreshCw,
    Bell,
    Send
} from 'lucide-react';
import { pazYSalvoAPI } from '../services/api';
import { useNotificationContext } from '../contexts/NotificationContext';
import PazYSalvoSignatureModal from './PazYSalvoSignatureModal';

export default function PazYSalvoFirmas({ pazYSalvo, onRefresh, viewMode = 'default' }) {
    const [loading, setLoading] = useState(false);
    const [showObserveModal, setShowObserveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [selectedFirma, setSelectedFirma] = useState(null);
    const [observeComment, setObserveComment] = useState('');
    const [rejectReason, setRejectReason] = useState('');

    const { alertSuccess, alertError } = useNotificationContext();

    const getFirmaStatusIcon = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'firmado':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'rechazado':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'pendiente':
                return <Clock className="h-5 w-5 text-yellow-600" />;
            default:
                return <Clock className="h-5 w-5 text-gray-400" />;
        }
    };

    const getFirmaStatusColor = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'firmado':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'rechazado':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getFirmaStatusText = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'firmado':
                return 'Firmado';
            case 'rechazado':
                return 'Rechazado';
            case 'pendiente':
                return 'Pendiente';
            default:
                return estado;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleFirmar = (firma) => {
        setSelectedFirma(firma);
        setShowSignatureModal(true);
    };

    const handleSignatureSuccess = () => {
        setShowSignatureModal(false);
        setSelectedFirma(null);
        onRefresh();
    };

    const handleObservar = async () => {
        if (!observeComment.trim()) {
            alertError('Debe ingresar un comentario');
            return;
        }

        try {
            setLoading(true);
            await pazYSalvoAPI.observar(pazYSalvo.id, selectedFirma.id, {
                comentario: observeComment
            });
            alertSuccess('Observación agregada exitosamente');
            setShowObserveModal(false);
            setObserveComment('');
            setSelectedFirma(null);
            onRefresh();
        } catch (error) {
            console.error('Error al agregar observación:', error);
            alertError('Error al agregar observación');
        } finally {
            setLoading(false);
        }
    };

    const handleRechazar = async () => {
        if (!rejectReason.trim()) {
            alertError('Debe ingresar un motivo de rechazo');
            return;
        }

        try {
            setLoading(true);
            await pazYSalvoAPI.rechazar(pazYSalvo.id, selectedFirma.id, {
                motivo: rejectReason
            });
            alertSuccess('Documento rechazado exitosamente');
            setShowRejectModal(false);
            setRejectReason('');
            setSelectedFirma(null);
            onRefresh();
        } catch (error) {
            console.error('Error al rechazar:', error);
            alertError('Error al rechazar el documento');
        } finally {
            setLoading(false);
        }
    };

    const openObserveModal = (firma) => {
        setSelectedFirma(firma);
        setObserveComment('');
        setShowObserveModal(true);
    };

    const openRejectModal = (firma) => {
        setSelectedFirma(firma);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleSolicitarFirma = async (firma) => {
        try {
            setLoading(true);

            // Solicitar firma específica para el rol
            await pazYSalvoAPI.solicitarFirma(pazYSalvo.id, firma.rol);

            alertSuccess(`Notificación de firma enviada a ${firma.rol}`);
            onRefresh();
        } catch (error) {
            console.error('Error al solicitar firma:', error);

            // Si el endpoint específico no existe, usar el fallback
            if (error.response?.status === 404) {
                try {
                    await pazYSalvoAPI.enviarAFirma(pazYSalvo.id);
                    alertSuccess(`Documento enviado a firma. Notificación enviada a ${firma.rol}`);
                    onRefresh();
                } catch (fallbackError) {
                    alertError(`Error al enviar notificación de firma a ${firma.rol}`);
                }
            } else {
                alertError(`Error al enviar notificación de firma a ${firma.rol}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const canSign = (firma) => {
        // Aquí se puede agregar lógica adicional para verificar si el usuario actual puede firmar
        return firma.estado === 'Pendiente';
    };

    // Función para verificar si RRHH puede firmar (cuando todas las demás firmas están completadas)
    const canRRHHSign = (firmaRRHH) => {
        if (firmaRRHH.estado !== 'Pendiente') return false;

        // Verificar que todas las otras firmas (que no sean RRHH) estén firmadas
        const otherFirmas = pazYSalvo.firmas?.filter(f => f.rol !== 'RRHH') || [];
        const allOthersSigned = otherFirmas.every(f => f.estado === 'Firmado');

        return allOthersSigned && otherFirmas.length > 0;
    };

    const canObserve = (firma) => {
        return firma.estado === 'Pendiente';
    };

    const canReject = (firma) => {
        return firma.estado === 'Pendiente';
    };

    if (!pazYSalvo.firmas || pazYSalvo.firmas.length === 0) {
        return (
            <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay firmas configuradas para este documento</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Resumen de firmas */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-green-600">
                            {pazYSalvo.firmas.filter(f => f.estado === 'Firmado').length}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Firmadas</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-yellow-600">
                            {pazYSalvo.firmas.filter(f => f.estado === 'Pendiente').length}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Pendientes</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-red-600">
                            {pazYSalvo.firmas.filter(f => f.estado === 'Rechazado').length}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Rechazadas</div>
                    </div>
                </div>
            </div>

            {/* Lista de firmas en fila horizontal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {pazYSalvo.firmas.map((firma, index) => (
                    <div key={firma.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 min-h-[200px] flex flex-col">
                        {/* Header compacto */}
                        <div className="text-center mb-3">
                            <div className="flex justify-center mb-2">
                                {getFirmaStatusIcon(firma.estado)}
                            </div>
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                                {firma.rol}
                            </h4>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getFirmaStatusColor(firma.estado)}`}>
                                {getFirmaStatusText(firma.estado)}
                            </span>
                        </div>

                        {/* Información de la firma - más compacta */}
                        {firma.selloTiempo && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                <span>Firmado: {formatDate(firma.selloTiempo)}</span>
                            </div>
                        )}

                        {/* Comentarios - más compactos */}
                        {firma.comentario && (
                            <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                                <div className="flex items-start space-x-1">
                                    <MessageSquare className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-gray-600 dark:text-gray-400">{firma.comentario}</p>
                                </div>
                            </div>
                        )}

                        {/* Hash de la firma - más compacto */}
                        {firma.firmaHash && (
                            <div className="mb-3">
                                <p className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 p-1 rounded break-all leading-tight">
                                    {firma.firmaHash.substring(0, 16)}...
                                </p>
                            </div>
                        )}

                        {/* Spacer para empujar botones al fondo */}
                        <div className="flex-1"></div>

                        {/* Acciones */}
                        {firma.estado === 'Pendiente' && (
                            <div className="flex flex-col space-y-2 pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                                {viewMode === 'rrhh' ? (
                                    // Vista RRHH: Lógica condicional
                                    <>
                                        {firma.rol === 'RRHH' && canRRHHSign(firma) ? (
                                            // RRHH puede firmar cuando todas las demás están firmadas
                                            <>
                                                <div className="mb-2 p-1 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
                                                    <p className="text-xs text-green-700 dark:text-green-300 font-medium text-center">
                                                        ✅ Listo
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleFirmar(firma)}
                                                    disabled={loading}
                                                    className="w-full flex items-center justify-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                                                >
                                                    <CheckCircle className="h-3 w-3" />
                                                    <span>Firmar RRHH</span>
                                                </button>
                                            </>
                                        ) : (
                                            // Solicitar firma para otros roles o RRHH cuando no puede firmar aún
                                            <>
                                                {firma.rol === 'RRHH' && (
                                                    <div className="mb-2 p-1 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                                                        <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium text-center">
                                                            ⏳ Esperando
                                                        </p>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleSolicitarFirma(firma)}
                                                    disabled={loading}
                                                    className="w-full flex items-center justify-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                                                >
                                                    <Bell className="h-3 w-3" />
                                                    <span>Solicitar</span>
                                                    {loading && <RefreshCw className="h-3 w-3 animate-spin ml-1" />}
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    // Vista normal: Firmar, observar, rechazar
                                    <div className="flex flex-wrap gap-2">
                                        {canSign(firma) && (
                                            <button
                                                onClick={() => handleFirmar(firma)}
                                                disabled={loading}
                                                className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircle className="h-3 w-3" />
                                                <span>Firmar</span>
                                            </button>
                                        )}
                                        {canObserve(firma) && (
                                            <button
                                                onClick={() => openObserveModal(firma)}
                                                className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
                                            >
                                                <MessageSquare className="h-3 w-3" />
                                                <span>Observar</span>
                                            </button>
                                        )}
                                        {canReject(firma) && (
                                            <button
                                                onClick={() => openRejectModal(firma)}
                                                className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                            >
                                                <XCircle className="h-3 w-3" />
                                                <span>Rechazar</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal de observación */}
            {showObserveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Agregar Observación
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Comentario
                            </label>
                            <textarea
                                value={observeComment}
                                onChange={(e) => setObserveComment(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Ingrese su observación..."
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowObserveModal(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleObservar}
                                disabled={loading}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Agregando...' : 'Agregar Observación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de rechazo */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Rechazar Documento
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Motivo del rechazo
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Ingrese el motivo del rechazo..."
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRechazar}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Rechazando...' : 'Rechazar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de firma */}
            {showSignatureModal && selectedFirma && (
                <PazYSalvoSignatureModal
                    isOpen={showSignatureModal}
                    onClose={() => {
                        setShowSignatureModal(false);
                        setSelectedFirma(null);
                    }}
                    pazYSalvo={pazYSalvo}
                    firma={selectedFirma}
                    onSuccess={handleSignatureSuccess}
                />
            )}
        </div>
    );
}
