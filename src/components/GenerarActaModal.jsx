import React, { useState } from 'react';
import { X, Download, FileText, Calendar, User } from 'lucide-react';
import { asignacionesAPI, actasAPI } from '../services/api';

export default function GenerarActaModal({ isOpen, onClose, asignacion }) {
    const [loading, setLoading] = useState(false);
    const [includeSignature, setIncludeSignature] = useState(false);
    const [fechaEntrega, setFechaEntrega] = useState('');
    const [observaciones, setObservaciones] = useState('');

    if (!isOpen || !asignacion) return null;

    const handleGenerarActa = async () => {
        setLoading(true);
        try {
            const payload = {
                AsignacionId: asignacion.id,
                IncluirFirmaTI: includeSignature,
                FechaEntrega: fechaEntrega || null,
                Observaciones: observaciones || null
            };

            console.log('FRONTEND - Previsualizando acta temporal con payload:', payload);
            console.log('FRONTEND - IncluirFirmaTI:', includeSignature);
            console.log('FRONTEND - AsignacionId:', asignacion.id);

            // Usar el nuevo endpoint de previsualización temporal (no guarda en Storage)
            const response = await actasAPI.previsualizarActaTemporal(payload);

            // Abrir previsualización en el navegador
            const url = window.URL.createObjectURL(response.data);
            window.open(url, '_blank');
            
            onClose();
        } catch (error) {
            console.error('Error al previsualizar acta:', error);
            alert('Error al previsualizar la acta. Por favor, inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Generar Acta de Entrega
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {asignacion.activo?.codigo} → {asignacion.usuario?.nombre} {asignacion.usuario?.apellido}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Información de la asignación */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Usuario:</strong> {asignacion.usuario?.nombre} {asignacion.usuario?.apellido}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Activo:</strong> {asignacion.activo?.codigo} - {asignacion.activo?.categoria}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Fecha de asignación:</strong> {new Date(asignacion.fechaAsignacion).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Opciones */}
                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={includeSignature}
                                    onChange={(e) => setIncludeSignature(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Incluir firma digital del admin/soporte actual
                                    </span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Se incluirá tu firma digital en la sección "Firma TI" del documento
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fecha de entrega (opcional)
                            </label>
                            <input
                                type="date"
                                value={fechaEntrega}
                                onChange={(e) => setFechaEntrega(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Si no se especifica, se usará la fecha actual
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Observaciones (opcional)
                            </label>
                            <textarea
                                rows={3}
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGenerarActa}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Generando...</span>
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4" />
                                    <span>Previsualizar para Imprimir</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 