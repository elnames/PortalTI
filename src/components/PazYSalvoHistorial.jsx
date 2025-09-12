// src/components/PazYSalvoHistorial.jsx
import React from 'react';
import {
    Clock,
    User,
    FileText,
    CheckCircle,
    XCircle,
    AlertTriangle,
    MessageSquare,
    Upload,
    Download
} from 'lucide-react';

export default function PazYSalvoHistorial({ pazYSalvo }) {
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

    const getActionIcon = (accion) => {
        const accionLower = accion?.toLowerCase() || '';

        if (accionLower.includes('crear') || accionLower.includes('creado')) {
            return <FileText className="h-4 w-4 text-blue-600" />;
        }
        if (accionLower.includes('firmar') || accionLower.includes('firmado')) {
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        }
        if (accionLower.includes('rechazar') || accionLower.includes('rechazado')) {
            return <XCircle className="h-4 w-4 text-red-600" />;
        }
        if (accionLower.includes('observar') || accionLower.includes('observación')) {
            return <MessageSquare className="h-4 w-4 text-yellow-600" />;
        }
        if (accionLower.includes('enviar') || accionLower.includes('enviado')) {
            return <Upload className="h-4 w-4 text-purple-600" />;
        }
        if (accionLower.includes('aprobar') || accionLower.includes('aprobado')) {
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        }
        if (accionLower.includes('cerrar') || accionLower.includes('cerrado')) {
            return <Download className="h-4 w-4 text-blue-600" />;
        }
        if (accionLower.includes('excepción') || accionLower.includes('excepcion')) {
            return <AlertTriangle className="h-4 w-4 text-orange-600" />;
        }

        return <Clock className="h-4 w-4 text-gray-600" />;
    };

    const getActionColor = (accion) => {
        const accionLower = accion?.toLowerCase() || '';

        if (accionLower.includes('crear') || accionLower.includes('creado')) {
            return 'text-blue-600 dark:text-blue-400';
        }
        if (accionLower.includes('firmar') || accionLower.includes('firmado')) {
            return 'text-green-600 dark:text-green-400';
        }
        if (accionLower.includes('rechazar') || accionLower.includes('rechazado')) {
            return 'text-red-600 dark:text-red-400';
        }
        if (accionLower.includes('observar') || accionLower.includes('observación')) {
            return 'text-yellow-600 dark:text-yellow-400';
        }
        if (accionLower.includes('enviar') || accionLower.includes('enviado')) {
            return 'text-purple-600 dark:text-purple-400';
        }
        if (accionLower.includes('aprobar') || accionLower.includes('aprobado')) {
            return 'text-green-600 dark:text-green-400';
        }
        if (accionLower.includes('cerrar') || accionLower.includes('cerrado')) {
            return 'text-blue-600 dark:text-blue-400';
        }
        if (accionLower.includes('excepción') || accionLower.includes('excepcion')) {
            return 'text-orange-600 dark:text-orange-400';
        }

        return 'text-gray-600 dark:text-gray-400';
    };

    const getStateChangeColor = (estadoDesde, estadoHasta) => {
        if (estadoDesde === estadoHasta) {
            return 'text-gray-500 dark:text-gray-400';
        }

        const estadosProgresivos = ['Borrador', 'EnFirma', 'Aprobado', 'Cerrado'];
        const desdeIndex = estadosProgresivos.indexOf(estadoDesde);
        const hastaIndex = estadosProgresivos.indexOf(estadoHasta);

        if (hastaIndex > desdeIndex) {
            return 'text-green-600 dark:text-green-400';
        } else {
            return 'text-red-600 dark:text-red-400';
        }
    };

    if (!pazYSalvo.historial || pazYSalvo.historial.length === 0) {
        return (
            <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay historial disponible para este documento</p>
            </div>
        );
    }

    // Ordenar historial por fecha (más reciente primero)
    const historialOrdenado = [...pazYSalvo.historial].sort((a, b) =>
        new Date(b.fechaAccion) - new Date(a.fechaAccion)
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Historial de Actividades
                </h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {historialOrdenado.length} actividad(es)
                </span>
            </div>

            <div className="space-y-4">
                {historialOrdenado.map((item, index) => (
                    <div key={item.id || index} className="relative">
                        {/* Línea conectora */}
                        {index < historialOrdenado.length - 1 && (
                            <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-200 dark:bg-gray-700"></div>
                        )}

                        <div className="flex items-start space-x-4">
                            {/* Icono */}
                            <div className="flex-shrink-0 w-8 h-8 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                {getActionIcon(item.accion)}
                            </div>

                            {/* Contenido */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h5 className={`text-sm font-medium ${getActionColor(item.accion)}`}>
                                        {item.accion}
                                    </h5>
                                    <time className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(item.fechaAccion)}
                                    </time>
                                </div>

                                <div className="mt-1 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                    <User className="h-3 w-3" />
                                    <span>{item.actor?.nombre} {item.actor?.apellido}</span>
                                </div>

                                {/* Cambio de estado */}
                                {item.estadoDesde !== item.estadoHasta && (
                                    <div className="mt-2 flex items-center space-x-2 text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                            {item.estadoDesde}
                                        </span>
                                        <span className="text-gray-400">→</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStateChangeColor(item.estadoDesde, item.estadoHasta)}`}>
                                            {item.estadoHasta}
                                        </span>
                                    </div>
                                )}

                                {/* Nota */}
                                {item.nota && (
                                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex items-start space-x-2">
                                            <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nota:</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{item.nota}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Resumen del historial */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Resumen del Proceso
                </h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Primera actividad:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                            {historialOrdenado.length > 0 ? formatDate(historialOrdenado[historialOrdenado.length - 1].fechaAccion) : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Última actividad:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                            {historialOrdenado.length > 0 ? formatDate(historialOrdenado[0].fechaAccion) : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
