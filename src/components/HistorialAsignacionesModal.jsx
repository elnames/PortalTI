import React, { useState, useEffect, useCallback } from 'react';
import { X, User, Calendar, MessageSquare, RotateCcw, FileText, Download } from 'lucide-react';
import { asignacionesAPI } from '../services/api';
import GenerarActaModal from './GenerarActaModal';

export default function HistorialAsignacionesModal({ 
    isOpen, 
    onClose, 
    activo,
    onDevolucionRealizada 
}) {
    const [asignaciones, setAsignaciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showGenerarActaModal, setShowGenerarActaModal] = useState(false);
    const [selectedAsignacion, setSelectedAsignacion] = useState(null);

    const fetchAsignaciones = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await asignacionesAPI.getByActivo(activo.id);
            setAsignaciones(data);
        } catch (err) {
            console.error('Error al cargar asignaciones:', err);
            setError('Error al cargar el historial de asignaciones');
        } finally {
            setLoading(false);
        }
    }, [activo]);

    useEffect(() => {
        if (isOpen && activo) {
            fetchAsignaciones();
        }
    }, [isOpen, activo, fetchAsignaciones]);

    const handleDevolver = async (asignacionId) => {
        if (!window.confirm('¿Estás seguro de que quieres devolver este activo?')) {
            return;
        }

        try {
            await asignacionesAPI.devolver(asignacionId, {
                observaciones: 'Devuelto por el usuario'
            });
            
            onDevolucionRealizada();
            fetchAsignaciones(); // Recargar el historial
        } catch (err) {
            console.error('Error al devolver activo:', err);
            setError('Error al devolver el activo');
        }
    };

    const handleQuitarAsignacion = async (asignacionId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar completamente esta asignación? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await asignacionesAPI.devolver(asignacionId, {
                observaciones: 'Asignación eliminada completamente'
            });
            
            onDevolucionRealizada();
            fetchAsignaciones(); // Recargar el historial
        } catch (err) {
            console.error('Error al eliminar asignación:', err);
            setError('Error al eliminar la asignación');
        }
    };

    const handleGenerarActa = (asignacion) => {
        setSelectedAsignacion(asignacion);
        setShowGenerarActaModal(true);
    };

    const handleCloseGenerarActa = () => {
        setShowGenerarActaModal(false);
        setSelectedAsignacion(null);
    };

    if (!isOpen || !activo) return null;

    return (
        <>
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
                    <div className="mt-3">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Historial de Asignaciones
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {activo.codigo} - {activo.categoria}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Loading */}
                        {loading && (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        )}

                        {/* Lista de asignaciones */}
                        {!loading && (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {asignaciones.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            No hay asignaciones registradas para este activo.
                                        </p>
                                    </div>
                                ) : (
                                    asignaciones.map((asignacion) => (
                                        <div
                                            key={asignacion.id}
                                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {asignacion.usuario?.nombre} {asignacion.usuario?.apellido}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {asignacion.usuario?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        asignacion.estado === 'Activa' 
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                    }`}>
                                                        {asignacion.estado}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                <div>
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <Calendar className="w-4 h-4 text-gray-500" />
                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                            Fecha de Asignación
                                                        </span>
                                                    </div>
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

                                                {asignacion.fechaDevolucion && (
                                                    <div>
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <RotateCcw className="w-4 h-4 text-gray-500" />
                                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                                Fecha de Devolución
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-900 dark:text-white">
                                                            {new Date(asignacion.fechaDevolucion).toLocaleDateString('es-ES', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {asignacion.observaciones && (
                                                <div className="mb-3">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <MessageSquare className="w-4 h-4 text-gray-500" />
                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                            Observaciones
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-900 dark:text-white">
                                                        {asignacion.observaciones}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Acciones */}
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <div className="flex space-x-2">
                                                    {asignacion.estado === 'Activa' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleGenerarActa(asignacion)}
                                                                className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                            >
                                                                <Download className="w-3 h-3 mr-1" />
                                                                Generar Acta
                                                            </button>
                                                            <button
                                                                onClick={() => handleDevolver(asignacion.id)}
                                                                className="inline-flex items-center px-3 py-1 text-xs font-medium text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                                                            >
                                                                <RotateCcw className="w-3 h-3 mr-1" />
                                                                Devolver
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleQuitarAsignacion(asignacion.id)}
                                                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    <X className="w-3 h-3 mr-1" />
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de generar acta */}
            <GenerarActaModal
                isOpen={showGenerarActaModal}
                onClose={handleCloseGenerarActa}
                asignacion={selectedAsignacion}
            />
        </>
    );
} 