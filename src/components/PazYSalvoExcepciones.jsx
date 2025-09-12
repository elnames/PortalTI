// src/components/PazYSalvoExcepciones.jsx
import React, { useState } from 'react';
import {
    AlertTriangle,
    Plus,
    User,
    Calendar,
    MessageSquare,
    X,
    CheckCircle
} from 'lucide-react';
import { pazYSalvoAPI } from '../services/api';
import { useNotificationContext } from '../contexts/NotificationContext';

export default function PazYSalvoExcepciones({ pazYSalvo, onRefresh }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [excepcionMotivo, setExcepcionMotivo] = useState('');
    const [loading, setLoading] = useState(false);

    const { alertSuccess, alertError } = useNotificationContext();

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCreateExcepcion = async () => {
        if (!excepcionMotivo.trim()) {
            alertError('Debe ingresar un motivo para la excepción');
            return;
        }

        try {
            setLoading(true);
            await pazYSalvoAPI.crearExcepcion(pazYSalvo.id, {
                motivo: excepcionMotivo
            });

            alertSuccess('Excepción creada exitosamente');
            setShowCreateModal(false);
            setExcepcionMotivo('');
            onRefresh();
        } catch (error) {
            console.error('Error al crear excepción:', error);
            alertError('Error al crear la excepción');
        } finally {
            setLoading(false);
        }
    };

    const canCreateExcepcion = () => {
        // Solo se pueden crear excepciones si el documento está en estado Aprobado
        // y hay activos pendientes
        const activosPendientes = pazYSalvo.activosSnapshot?.filter(a => a.estadoActivo === 'Pendiente').length || 0;
        return pazYSalvo.estado === 'Aprobado' && activosPendientes > 0;
    };

    if (!pazYSalvo.excepciones || pazYSalvo.excepciones.length === 0) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {canCreateExcepcion()
                        ? 'No hay excepciones registradas'
                        : 'No se pueden crear excepciones en el estado actual'
                    }
                </p>
                {canCreateExcepcion() && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center space-x-2 mx-auto px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Crear excepción</span>
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                    Excepciones Aprobadas
                </h4>
                {canCreateExcepcion() && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Crear excepción</span>
                    </button>
                )}
            </div>

            {/* Resumen de excepciones */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <h5 className="font-medium text-orange-800 dark:text-orange-400">
                        Resumen de Excepciones
                    </h5>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                    Se han aprobado {pazYSalvo.excepciones.length} excepción(es) para este documento.
                    Estas excepciones permiten cerrar el Paz y Salvo con activos pendientes de devolución.
                </p>
            </div>

            {/* Lista de excepciones */}
            <div className="space-y-3">
                {pazYSalvo.excepciones.map((excepcion, index) => (
                    <div key={excepcion.id || index} className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/10">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="h-5 w-5 text-orange-600" />
                                <div>
                                    <h5 className="font-medium text-gray-900 dark:text-white">
                                        Excepción #{excepcion.id}
                                    </h5>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Aprobada por {excepcion.aprobadaPor?.nombre} {excepcion.aprobadaPor?.apellido}
                                    </p>
                                </div>
                            </div>
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded-full text-xs font-medium">
                                Aprobada
                            </span>
                        </div>

                        {/* Motivo de la excepción */}
                        <div className="mb-3">
                            <div className="flex items-start space-x-2">
                                <MessageSquare className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivo:</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{excepcion.motivo}</p>
                                </div>
                            </div>
                        </div>

                        {/* Información adicional */}
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-2">
                                <User className="h-3 w-3" />
                                <span>Aprobada por: {excepcion.aprobadaPor?.nombre} {excepcion.aprobadaPor?.apellido}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-3 w-3" />
                                <span>Fecha: {formatDate(excepcion.fecha)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Información adicional */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h5 className="font-medium text-blue-800 dark:text-blue-400 mb-1">
                            Información sobre Excepciones
                        </h5>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Las excepciones permiten cerrar un Paz y Salvo cuando hay activos que no pueden ser devueltos
                            por razones justificadas. Cada excepción debe ser aprobada por un usuario autorizado y
                            debe incluir un motivo detallado.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal de creación */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Crear Excepción
                            </h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <div className="flex items-start space-x-2">
                                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-orange-800 dark:text-orange-400">
                                            Información importante
                                        </p>
                                        <p className="text-xs text-orange-700 dark:text-orange-300">
                                            Esta excepción permitirá cerrar el Paz y Salvo con activos pendientes.
                                            Asegúrate de que el motivo sea justificado y detallado.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Motivo de la excepción *
                                </label>
                                <textarea
                                    value={excepcionMotivo}
                                    onChange={(e) => setExcepcionMotivo(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Describe detalladamente el motivo por el cual se aprueba esta excepción..."
                                />
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
                                onClick={handleCreateExcepcion}
                                disabled={!excepcionMotivo.trim() || loading}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creando...' : 'Crear Excepción'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
