// src/components/PazYSalvoCard.jsx
import React from 'react';
import {
    Eye,
    Download,
    Calendar,
    User,
    Package,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle
} from 'lucide-react';

export default function PazYSalvoCard({
    pazYSalvo,
    onViewDetail,
    onDownloadPdf,
    getStatusIcon,
    getStatusColor,
    getStatusText
}) {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFirmasPendientes = () => {
        return pazYSalvo.firmasPendientes || 0;
    };

    const getFirmasCompletadas = () => {
        const total = pazYSalvo.firmasTotales || 0;
        const pendientes = pazYSalvo.firmasPendientes || 0;
        return total - pendientes;
    };

    const getTotalFirmas = () => {
        return pazYSalvo.firmasTotales || 0;
    };

    const getActivosPendientes = () => {
        if (!pazYSalvo.activosSnapshot) return 0;
        return pazYSalvo.activosSnapshot.filter(activo => activo.estadoActivo === 'Pendiente').length;
    };

    const getActivosDevueltos = () => {
        if (!pazYSalvo.activosSnapshot) return 0;
        return pazYSalvo.activosSnapshot.filter(activo => activo.estadoActivo === 'Devuelto').length;
    };

    const getTotalActivos = () => {
        if (!pazYSalvo.activosSnapshot) return 0;
        return pazYSalvo.activosSnapshot.length;
    };

    const canDownload = pazYSalvo.estado === 'Cerrado' && pazYSalvo.pdfFinalPath;

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                    {getStatusIcon(pazYSalvo.estado)}
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                            {pazYSalvo.usuarioNombre || 'Usuario no especificado'}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            RUT: {pazYSalvo.usuarioRut || 'N/A'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pazYSalvo.estado)}`}>
                        {getStatusText(pazYSalvo.estado)}
                    </span>
                    {/* Espacio reservado para el botón de eliminar */}
                    <div className="w-8 h-8"></div>
                </div>
            </div>

            {/* Información del empleado */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400">Fecha de salida:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {formatDate(pazYSalvo.fechaSalida)}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400">Motivo:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {pazYSalvo.motivoSalida || 'N/A'}
                    </span>
                </div>
            </div>

            {/* Estado de firmas */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Estado de firmas:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {getFirmasCompletadas()}/{getTotalFirmas()}
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getTotalFirmas() > 0 ? (getFirmasCompletadas() / getTotalFirmas()) * 100 : 0}%` }}
                    ></div>
                </div>
                {getFirmasPendientes() > 0 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        {getFirmasPendientes()} firma(s) pendiente(s)
                    </p>
                )}
            </div>

            {/* Estado de activos */}
            {getTotalActivos() > 0 && (
                <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500 dark:text-gray-400">Estado de activos:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {getActivosDevueltos()}/{getTotalActivos()}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getTotalActivos() > 0 ? (getActivosDevueltos() / getTotalActivos()) * 100 : 0}%` }}
                        ></div>
                    </div>
                    {getActivosPendientes() > 0 && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            {getActivosPendientes()} activo(s) pendiente(s)
                        </p>
                    )}
                </div>
            )}

            {/* Fechas importantes */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <div>
                    <span className="block">Creado:</span>
                    <span className="font-medium">{formatDate(pazYSalvo.fechaCreacion)}</span>
                </div>
                {pazYSalvo.fechaEnvioFirma && (
                    <div>
                        <span className="block">Enviado a firma:</span>
                        <span className="font-medium">{formatDate(pazYSalvo.fechaEnvioFirma)}</span>
                    </div>
                )}
                {pazYSalvo.fechaAprobacion && (
                    <div>
                        <span className="block">Aprobado:</span>
                        <span className="font-medium">{formatDate(pazYSalvo.fechaAprobacion)}</span>
                    </div>
                )}
                {pazYSalvo.fechaCierre && (
                    <div>
                        <span className="block">Cerrado:</span>
                        <span className="font-medium">{formatDate(pazYSalvo.fechaCierre)}</span>
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => onViewDetail(pazYSalvo.id)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        <Eye className="h-4 w-4" />
                        <span>Ver detalles</span>
                    </button>
                    {canDownload && (
                        <button
                            onClick={() => onDownloadPdf(pazYSalvo.id)}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                            <Download className="h-4 w-4" />
                            <span>Descargar PDF</span>
                        </button>
                    )}
                </div>

                {/* Indicadores de estado */}
                <div className="flex items-center space-x-2">
                    {pazYSalvo.estado === 'EnFirma' && getFirmasPendientes() > 0 && (
                        <div className="flex items-center space-x-1 text-yellow-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs">En proceso</span>
                        </div>
                    )}
                    {pazYSalvo.estado === 'Aprobado' && (
                        <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs">Aprobado</span>
                        </div>
                    )}
                    {pazYSalvo.estado === 'Rechazado' && (
                        <div className="flex items-center space-x-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs">Rechazado</span>
                        </div>
                    )}
                    {pazYSalvo.estado === 'Cerrado' && (
                        <div className="flex items-center space-x-1 text-blue-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs">Cerrado</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
