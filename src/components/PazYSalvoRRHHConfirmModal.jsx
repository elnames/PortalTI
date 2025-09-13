import React, { useState } from 'react';
import {
    CheckCircle,
    X,
    AlertTriangle,
    DollarSign,
    FileText
} from 'lucide-react';
import { useNotificationContext } from '../contexts/NotificationContext';
import { API_BASE_URL } from '../config';

export default function PazYSalvoRRHHConfirmModal({
    pazYSalvo,
    isOpen,
    onClose,
    onSuccess
}) {
    const [loading, setLoading] = useState(false);
    const [observations, setObservations] = useState('');
    const { alertSuccess, alertError } = useNotificationContext();

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

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            // Obtener el userId del objeto user almacenado
            const storedUser = localStorage.getItem('user');
            const userId = storedUser ? JSON.parse(storedUser).id : 0;
            
            console.log('Enviando firma RRHH con userId:', userId);
            
            const response = await fetch(`${API_BASE_URL}/pazysalvo/${pazYSalvo.id}/firmas/RRHH/sign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ActorUserId: userId,
                    Comentario: observations.trim() || 'Finiquito aprobado y documento cerrado por RRHH'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al firmar el documento');
            }

            alertSuccess('Paz y Salvo cerrado exitosamente. El finiquito ha sido aprobado.');
            onSuccess();
            
        } catch (error) {
            console.error('Error al firmar RRHH:', error);
            alertError(error.message || 'Error al cerrar el documento');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Confirmar Cierre de Paz y Salvo
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Información del empleado */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-gray-500" />
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
                    </div>
                </div>

                {/* Mensaje de confirmación */}
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start space-x-3">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-2">
                                ✅ Todo está en orden
                            </h3>
                            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                                Todas las firmas principales han sido completadas exitosamente:
                            </p>
                            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                                <li>• Jefe Inmediato: Aprobado</li>
                                <li>• Contabilidad: Aprobado</li>
                                <li>• Informática: Aprobado</li>
                                <li>• Gerencia de Finanzas: Aprobado</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Mensaje de finiquito */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start space-x-3">
                        <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                                💰 Aprobación de Finiquito
                            </h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Al firmar, confirma que está todo correcto y se procede a aprobar el pago del finiquito.
                                El documento pasará a estado "Cerrado" y el proceso estará completo.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Campo de observaciones opcional */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Observaciones (opcional)
                    </label>
                    <textarea
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        rows={3}
                        placeholder="Agregar comentarios adicionales sobre el cierre..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* Botones de acción */}
                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Cerrando...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4" />
                                <span>Confirmar y Cerrar</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
