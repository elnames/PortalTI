import React, { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function EvidencePermissionsManager() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const checkPermissions = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get('/securefile/check-permissions');
            setStatus(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al verificar permisos');
        } finally {
            setLoading(false);
        }
    };

    const fixPermissions = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/securefile/fix-permissions');
            setStatus({ ...status, message: response.data.message });
            // Verificar permisos después de corregirlos
            setTimeout(checkPermissions, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al corregir permisos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Gestión de Permisos de Evidencias
            </h3>

            <div className="space-y-4">
                {/* Botones de acción */}
                <div className="flex space-x-3">
                    <button
                        onClick={checkPermissions}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Verificar Permisos</span>
                    </button>

                    <button
                        onClick={fixPermissions}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        <span>Corregir Permisos</span>
                    </button>
                </div>

                {/* Estado de permisos */}
                {status && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Estado Actual:</h4>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                                {status.exists ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span>Carpeta existe: {status.exists ? 'Sí' : 'No'}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                {status.canRead ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span>Puede leer: {status.canRead ? 'Sí' : 'No'}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                {status.canWrite ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span>Puede escribir: {status.canWrite ? 'Sí' : 'No'}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Archivos: {status.files?.length || 0}
                                </span>
                            </div>
                        </div>

                        {status.path && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <strong>Ruta:</strong> {status.path}
                            </div>
                        )}

                        {status.files && status.files.length > 0 && (
                            <div className="mt-2">
                                <strong className="text-sm text-gray-700 dark:text-gray-300">Archivos encontrados:</strong>
                                <ul className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    {status.files.map((file, index) => (
                                        <li key={index} className="truncate">
                                            {file.split('\\').pop()}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {status.error && (
                            <div className="mt-2 flex items-center space-x-2 text-red-600 dark:text-red-400">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm">{status.error}</span>
                            </div>
                        )}

                        {status.message && (
                            <div className="mt-2 text-green-600 dark:text-green-400 text-sm">
                                {status.message}
                            </div>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                            <XCircle className="w-4 h-4" />
                            <span className="font-medium">Error:</span>
                        </div>
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
