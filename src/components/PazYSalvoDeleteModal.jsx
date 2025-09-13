// src/components/PazYSalvoDeleteModal.jsx
import React from 'react';
import { AlertTriangle, FileText, X, User, Calendar } from 'lucide-react';

export default function PazYSalvoDeleteModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    pazYSalvo,
    loading = false
}) {
    if (!isOpen || !pazYSalvo) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20 mr-3">
                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Eliminar Paz y Salvo
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            ¿Estás seguro de que deseas eliminar este Paz y Salvo? Esta acción no se puede deshacer.
                        </p>

                        {/* Información del Paz y Salvo */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                            <div className="flex items-center mb-3">
                                <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                    Detalles del documento
                                </h4>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center">
                                    <User className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                                    <span className="text-gray-600 dark:text-gray-300">
                                        <strong>Empleado:</strong> {pazYSalvo.usuarioNombre}
                                    </span>
                                </div>
                                
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                                    <span className="text-gray-600 dark:text-gray-300">
                                        <strong>Fecha de salida:</strong> {formatDate(pazYSalvo.fechaSalida)}
                                    </span>
                                </div>
                                
                                <div className="text-gray-600 dark:text-gray-300">
                                    <strong>Motivo:</strong> {pazYSalvo.motivoSalida}
                                </div>
                                
                                <div className="text-gray-600 dark:text-gray-300">
                                    <strong>Estado:</strong> 
                                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                        pazYSalvo.estado === 'Cerrado' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                            : pazYSalvo.estado === 'EnFirma'
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                    }`}>
                                        {pazYSalvo.estado}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Advertencia */}
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-start">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                                        ⚠️ Advertencia
                                    </h4>
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        Esta acción eliminará permanentemente el documento y todos sus datos asociados, 
                                        incluyendo firmas, historial y archivos adjuntos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                        {loading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        <span>{loading ? 'Eliminando...' : 'Eliminar'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
