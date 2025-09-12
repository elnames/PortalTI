// src/components/PazYSalvoActivos.jsx
import React from 'react';
import {
    Package,
    CheckCircle,
    Clock,
    AlertTriangle,
    FileText
} from 'lucide-react';

export default function PazYSalvoActivos({ pazYSalvo }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getActivoStatusIcon = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'devuelto':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'pendiente':
                return <Clock className="h-5 w-5 text-yellow-600" />;
            case 'excepcion':
                return <AlertTriangle className="h-5 w-5 text-orange-600" />;
            default:
                return <Package className="h-5 w-5 text-gray-400" />;
        }
    };

    const getActivoStatusColor = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'devuelto':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'excepcion':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getActivoStatusText = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'devuelto':
                return 'Devuelto';
            case 'pendiente':
                return 'Pendiente';
            case 'excepcion':
                return 'Excepción';
            default:
                return estado;
        }
    };

    if (!pazYSalvo.activosSnapshot || pazYSalvo.activosSnapshot.length === 0) {
        return (
            <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay activos asociados a este documento</p>
            </div>
        );
    }

    const activosPendientes = pazYSalvo.activosSnapshot.filter(a => a.estadoActivo === 'Pendiente').length;
    const activosDevueltos = pazYSalvo.activosSnapshot.filter(a => a.estadoActivo === 'Devuelto').length;
    const activosExcepcion = pazYSalvo.activosSnapshot.filter(a => a.estadoActivo === 'Excepcion').length;
    const totalActivos = pazYSalvo.activosSnapshot.length;

    return (
        <div className="space-y-4">
            {/* Resumen de activos */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Resumen de Activos
                </h4>
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-gray-600">{totalActivos}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-600">{activosDevueltos}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Devueltos</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-yellow-600">{activosPendientes}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Pendientes</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-orange-600">{activosExcepcion}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Excepciones</div>
                    </div>
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Progreso de devolución</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {activosDevueltos}/{totalActivos}
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${totalActivos > 0 ? (activosDevueltos / totalActivos) * 100 : 0}%` }}
                    ></div>
                </div>
            </div>

            {/* Lista de activos */}
            <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Detalle de Activos
                </h4>
                {pazYSalvo.activosSnapshot.map((activo, index) => (
                    <div key={activo.id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                {getActivoStatusIcon(activo.estadoActivo)}
                                <div>
                                    <h5 className="font-medium text-gray-900 dark:text-white">
                                        {activo.descripcion}
                                    </h5>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        ID: {activo.activoId}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivoStatusColor(activo.estadoActivo)}`}>
                                {getActivoStatusText(activo.estadoActivo)}
                            </span>
                        </div>

                        {/* Información del activo */}
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                    {getActivoStatusText(activo.estadoActivo)}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Fecha de corte:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                    {formatDate(activo.fechaCorte)}
                                </span>
                            </div>
                        </div>

                        {/* Observaciones */}
                        {activo.observacion && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-start space-x-2">
                                    <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Observación:</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{activo.observacion}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Indicadores especiales */}
                        {activo.estadoActivo === 'Pendiente' && (
                            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                    <span className="text-sm text-yellow-800 dark:text-yellow-400">
                                        Este activo aún no ha sido devuelto
                                    </span>
                                </div>
                            </div>
                        )}

                        {activo.estadoActivo === 'Excepcion' && (
                            <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm text-orange-800 dark:text-orange-400">
                                        Este activo tiene una excepción aprobada
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Información adicional */}
            {activosPendientes > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h5 className="font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                                Activos Pendientes
                            </h5>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Hay {activosPendientes} activo(s) pendiente(s) de devolución.
                                {activosExcepcion > 0 && ` Se han aprobado ${activosExcepcion} excepción(es).`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activosPendientes === 0 && activosExcepcion === 0 && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h5 className="font-medium text-green-800 dark:text-green-400 mb-1">
                                Todos los Activos Devueltos
                            </h5>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                Todos los activos han sido devueltos correctamente.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
