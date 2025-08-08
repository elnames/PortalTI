// src/components/DeleteConfirmationModal.jsx
import React from 'react';
import { AlertTriangle, User, HardDrive, X } from 'lucide-react';

export default function DeleteConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    usuarios, 
    activosDesasignados 
}) {
    if (!isOpen) return null;

    const isMultiple = usuarios.length > 1;
    const totalActivos = activosDesasignados.reduce((total, user) => 
        total + (user.activosAsignados || 0), 0
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20 mr-3">
                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Confirmar Eliminación
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            ¿Estás seguro de que deseas eliminar {isMultiple ? 'estos usuarios' : 'este usuario'}?
                        </p>

                        {/* Lista de usuarios */}
                        <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                Usuario{isMultiple ? 's' : ''} a eliminar:
                            </h4>
                            <div className="space-y-2">
                                {usuarios.map((usuario, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {usuario.nombre} {usuario.apellido}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                                ({usuario.departamento || 'Sin departamento'})
                                            </span>
                                        </div>
                                        {usuario.activosAsignados > 0 && (
                                            <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                                                {usuario.activosAsignados} activo{usuario.activosAsignados > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Información sobre activos */}
                        {totalActivos > 0 && (
                            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                <div className="flex items-start">
                                    <HardDrive className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                                            ⚠️ Activos que serán desasignados
                                        </h4>
                                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                                            {totalActivos} activo{totalActivos > 1 ? 's' : ''} serán desasignados automáticamente y pasarán a estado "Sin asignar".
                                        </p>
                                        
                                        {/* Detalles de activos por usuario */}
                                        <div className="space-y-2">
                                            {activosDesasignados.map((user, index) => (
                                                user.activosAsignados > 0 && (
                                                    <div key={index} className="text-sm">
                                                        <span className="font-medium text-orange-800 dark:text-orange-200">
                                                            {user.nombre}:
                                                        </span>
                                                        <span className="text-orange-700 dark:text-orange-300 ml-1">
                                                            {user.activosAsignados} activo{user.activosAsignados > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Información sobre historial */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Nota:</strong> El historial de asignaciones se mantendrá para auditoría y trazabilidad.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
} 