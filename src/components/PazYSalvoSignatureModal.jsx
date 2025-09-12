import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    FileText,
    AlertTriangle,
    X,
    User,
    Calendar,
    MessageSquare,
    Download
} from 'lucide-react';
import { useNotificationContext } from '../contexts/NotificationContext';
import { API_BASE_URL } from '../config';

export default function PazYSalvoSignatureModal({
    pazYSalvo,
    userRole,
    isOpen,
    onClose,
    onSuccess,
    config
}) {
    const [checklistState, setChecklistState] = useState({});
    const [observations, setObservations] = useState('');
    const [loading, setLoading] = useState(false);
    const [allChecked, setAllChecked] = useState(false);
    const { alertSuccess, alertError } = useNotificationContext();

    // Mapeo de roles del frontend a los roles esperados por el backend
    const mapRoleToBackend = (role) => {
        const mapping = {
            'TI': 'Informatica',
            'Jefatura Directa': 'JefeInmediato',
            'Gerencia Finanzas': 'GerenciaFinanzas',
            'Contabilidad': 'Contabilidad',
            'RRHH': 'RRHH'
        };
        return mapping[role] || role;
    };

    // Inicializar estado del checklist
    useEffect(() => {
        if (config?.checklistItems && isOpen) {
            const initialState = {};
            config.checklistItems.forEach((_, index) => {
                initialState[index] = false;
            });
            setChecklistState(initialState);
            setAllChecked(false);
            setObservations('');
        }
    }, [config, isOpen]);

    // Verificar si todos los items están marcados
    useEffect(() => {
        if (config?.checklistItems) {
            const totalItems = config.checklistItems.length;
            const checkedItems = Object.values(checklistState).filter(Boolean).length;
            setAllChecked(totalItems > 0 && checkedItems === totalItems);
        }
    }, [checklistState, config]);

    const handleChecklistChange = (index, checked) => {
        setChecklistState(prev => ({
            ...prev,
            [index]: checked
        }));
    };

    const handleSign = async () => {
        if (!allChecked) {
            alertError('Debe completar todos los elementos del checklist antes de firmar');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const backendRole = mapRoleToBackend(userRole);
            const response = await fetch(`${API_BASE_URL}/pazysalvo/${pazYSalvo.id}/firmas/${backendRole}/sign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    comentario: observations.trim() || undefined
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al firmar el documento');
            }

            alertSuccess(`Documento firmado exitosamente como ${userRole}`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error al firmar:', error);
            alertError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!observations.trim()) {
            alertError('Debe proporcionar observaciones para rechazar el documento');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const backendRole = mapRoleToBackend(userRole);
            const response = await fetch(`${API_BASE_URL}/pazysalvo/${pazYSalvo.id}/rechazar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rol: backendRole,
                    comentario: observations.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al rechazar el documento');
            }

            alertSuccess(`Documento rechazado como ${userRole}`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error al rechazar:', error);
            alertError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadSignedPdf = async () => {
        try {
            const token = localStorage.getItem('token');
            const backendRole = mapRoleToBackend(userRole);
            const response = await fetch(`${API_BASE_URL}/pazysalvo/${pazYSalvo.id}/pdf`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al generar el PDF firmado');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `PazYSalvo_${pazYSalvo.usuarioNombre}_Firmado_${userRole}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            alertSuccess('PDF firmado descargado exitosamente');
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            alertError('Error al descargar el PDF firmado');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Bloquear scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !pazYSalvo) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-4 pt-8 pb-8">
                <div
                    className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header con gradiente */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <FileText className="h-8 w-8" />
                                <div>
                                    <h2 className="text-2xl font-bold">Firmar Paz y Salvo</h2>
                                    <p className="text-blue-100 mt-1">Como {userRole}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        {/* Información del empleado */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center space-x-2">
                                    <User className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Empleado</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {pazYSalvo.usuarioNombre}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">RUT</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {pazYSalvo.usuarioRut}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Fecha Creación</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {formatDate(pazYSalvo.fechaCreacion)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Checklist obligatorio */}
                        <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-4">
                                <CheckCircle className="h-6 w-6 text-blue-600" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Verificaciones Obligatorias
                                </h3>
                                <span className="text-sm text-red-600 font-medium">*Requerido</span>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                                <div className="flex items-start space-x-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                            Importante: Debe completar todas las verificaciones antes de firmar
                                        </p>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                            Su firma digital certifica que ha completado todos los controles requeridos.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {config?.checklistItems?.map((item, index) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <input
                                            type="checkbox"
                                            id={`checklist-${index}`}
                                            checked={checklistState[index] || false}
                                            onChange={(e) => handleChecklistChange(index, e.target.checked)}
                                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label
                                            htmlFor={`checklist-${index}`}
                                            className="flex-1 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                                        >
                                            {item}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {/* Indicador de progreso */}
                            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Progreso del checklist:
                                    </span>
                                    <span className={`font-medium ${allChecked ? 'text-green-600' : 'text-orange-600'}`}>
                                        {Object.values(checklistState).filter(Boolean).length} / {config?.checklistItems?.length || 0} completado
                                    </span>
                                </div>
                                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${allChecked ? 'bg-green-500' : 'bg-orange-400'}`}
                                        style={{
                                            width: `${config?.checklistItems?.length > 0 ? (Object.values(checklistState).filter(Boolean).length / config.checklistItems.length) * 100 : 0}%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Campo de observaciones */}
                        <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-3">
                                <MessageSquare className="h-5 w-5 text-gray-500" />
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Observaciones (opcional)
                                </label>
                            </div>
                            <textarea
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                placeholder="Agregar comentarios adicionales..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
                            />
                            {observations.trim() && (
                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm">
                                    <span className="text-blue-700 dark:text-blue-300">
                                        <strong>Vista previa:</strong> {observations.trim()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer con acciones */}
                    <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 rounded-b-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                            {/* Botón de descarga PDF firmado */}
                            <button
                                onClick={handleDownloadSignedPdf}
                                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                <span>Descargar PDF Firmado</span>
                            </button>

                            {/* Botones de acción */}
                            <div className="flex space-x-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={loading}
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <XCircle className="h-4 w-4" />
                                    <span>{loading ? 'Rechazando...' : (config?.rejectText || 'Rechazar')}</span>
                                </button>
                                <button
                                    onClick={handleSign}
                                    disabled={loading || !allChecked}
                                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    <span>{loading ? 'Firmando...' : (config?.approvalText || 'Firmar')}</span>
                                </button>
                            </div>
                        </div>

                        {!allChecked && (
                            <div className="mt-3 text-center">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    ⚠️ Complete todas las verificaciones para habilitar la firma
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}