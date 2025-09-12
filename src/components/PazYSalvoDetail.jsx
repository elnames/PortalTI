// src/components/PazYSalvoDetail.jsx
import React, { useState, useEffect } from 'react';
import {
    X,
    Download,
    User,
    Calendar,
    Package,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Eye,
    MessageSquare,
    Upload,
    RefreshCw
} from 'lucide-react';
import { pazYSalvoAPI } from '../services/api';
import PazYSalvoFirmas from './PazYSalvoFirmas';
import PazYSalvoActivos from './PazYSalvoActivos';
import PazYSalvoHistorial from './PazYSalvoHistorial';
import PazYSalvoAdjuntos from './PazYSalvoAdjuntos';
import PazYSalvoExcepciones from './PazYSalvoExcepciones';
import PazYSalvoStepWizard from './PazYSalvoStepWizard';
import { useUserSubroles } from '../hooks/useUserSubroles';

export default function PazYSalvoDetail({ pazYSalvo, onClose, onRefresh }) {
    const [activeTab, setActiveTab] = useState('firmas');
    const [loading, setLoading] = useState(false);
    const { hasSubrole } = useUserSubroles();

    // Manejar el scroll del body cuando el modal esté abierto
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

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

    const getStatusIcon = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'borrador':
                return <FileText className="h-5 w-5 text-gray-600" />;
            case 'en_firma':
                return <Clock className="h-5 w-5 text-yellow-600" />;
            case 'aprobado':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'rechazado':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'cerrado':
                return <CheckCircle className="h-5 w-5 text-blue-600" />;
            default:
                return <FileText className="h-5 w-5 text-gray-600" />;
        }
    };

    const getStatusColor = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'borrador':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case 'en_firma':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'aprobado':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'rechazado':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 'cerrado':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getStatusText = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'borrador':
                return 'Borrador';
            case 'en_firma':
                return 'En Firma';
            case 'aprobado':
                return 'Aprobado';
            case 'rechazado':
                return 'Rechazado';
            case 'cerrado':
                return 'Cerrado';
            default:
                return estado;
        }
    };

    const handleDownloadPdf = async () => {
        try {
            setLoading(true);
            const response = await pazYSalvoAPI.descargarPdf(pazYSalvo.id);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `paz-y-salvo-${pazYSalvo.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al descargar PDF:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'firmas', label: 'Firmas', icon: CheckCircle },
        { id: 'activos', label: 'Activos', icon: Package },
        { id: 'historial', label: 'Historial', icon: Clock },
        { id: 'adjuntos', label: 'Adjuntos', icon: Upload },
        { id: 'excepciones', label: 'Excepciones', icon: AlertTriangle }
    ];

    return (
        <div
            className="fixed bg-black bg-opacity-60 overflow-y-auto"
            style={{
                zIndex: 10000,
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                width: '100vw', height: '100vh'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="p-4 pt-8 pb-8">
                <div
                    className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full mx-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                                {getStatusIcon(pazYSalvo.estado)}
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Paz y Salvo - {pazYSalvo.usuarioNombre}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        RUT: {pazYSalvo.usuarioRut} • ID: {pazYSalvo.id}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pazYSalvo.estado)}`}>
                                    {getStatusText(pazYSalvo.estado)}
                                </span>
                                {pazYSalvo.estado === 'Cerrado' && pazYSalvo.pdfFinalPath && (
                                    <button
                                        onClick={handleDownloadPdf}
                                        disabled={loading}
                                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Download className="h-4 w-4" />
                                        <span>Descargar PDF</span>
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Información básica */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Información del Empleado</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-900 dark:text-white">{pazYSalvo.usuarioNombre}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <FileText className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-900 dark:text-white">{pazYSalvo.usuarioRut}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Fechas Importantes</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-900 dark:text-white">
                                            Salida: {formatDate(pazYSalvo.fechaSalida)}
                                        </span>
                                    </div>
                                    {pazYSalvo.fechaEnvioFirma && (
                                        <div className="flex items-center space-x-2">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                Enviado a firma: {formatDate(pazYSalvo.fechaEnvioFirma)}
                                            </span>
                                        </div>
                                    )}
                                    {pazYSalvo.fechaAprobacion && (
                                        <div className="flex items-center space-x-2">
                                            <CheckCircle className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                Aprobado: {formatDate(pazYSalvo.fechaAprobacion)}
                                            </span>
                                        </div>
                                    )}
                                    {pazYSalvo.fechaCierre && (
                                        <div className="flex items-center space-x-2">
                                            <CheckCircle className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                Cerrado: {formatDate(pazYSalvo.fechaCierre)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Detalles</h4>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Motivo de salida:</span>
                                        <p className="text-sm text-gray-900 dark:text-white">{pazYSalvo.motivoSalida}</p>
                                    </div>
                                    {pazYSalvo.observaciones && (
                                        <div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Observaciones:</span>
                                            <p className="text-sm text-gray-900 dark:text-white">{pazYSalvo.observaciones}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step Wizard */}
                    <div className="px-6 pb-4">
                        <PazYSalvoStepWizard
                            pazYSalvo={pazYSalvo}
                            firmas={pazYSalvo?.firmas || []}
                        />
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex space-x-8 px-6">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Contenido de tabs */}
                    <div className="p-6">
                        {activeTab === 'firmas' && (
                            <PazYSalvoFirmas
                                pazYSalvo={pazYSalvo}
                                onRefresh={onRefresh}
                                viewMode={hasSubrole('RRHH') ? 'rrhh' : 'default'}
                            />
                        )}
                        {activeTab === 'activos' && (
                            <PazYSalvoActivos
                                pazYSalvo={pazYSalvo}
                                onRefresh={onRefresh}
                            />
                        )}
                        {activeTab === 'historial' && (
                            <PazYSalvoHistorial
                                pazYSalvo={pazYSalvo}
                            />
                        )}
                        {activeTab === 'adjuntos' && (
                            <PazYSalvoAdjuntos
                                pazYSalvo={pazYSalvo}
                                onRefresh={onRefresh}
                            />
                        )}
                        {activeTab === 'excepciones' && (
                            <PazYSalvoExcepciones
                                pazYSalvo={pazYSalvo}
                                onRefresh={onRefresh}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
