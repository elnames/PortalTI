// src/components/PazYSalvoStepWizard.jsx
import React from 'react';
import {
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    FileText,
    Users,
    CheckSquare,
    Archive
} from 'lucide-react';

const stepConfig = {
    'Borrador': {
        icon: FileText,
        color: 'gray',
        label: 'Borrador',
        description: 'Documento creado, pendiente de envío a firma'
    },
    'EnFirma': {
        icon: Users,
        color: 'blue',
        label: 'En Firma',
        description: 'Esperando firmas de los responsables'
    },
    'Aprobado': {
        icon: CheckSquare,
        color: 'green',
        label: 'Aprobado',
        description: 'Todas las firmas completadas'
    },
    'Rechazado': {
        icon: XCircle,
        color: 'red',
        label: 'Rechazado',
        description: 'Documento rechazado por uno de los firmantes'
    },
    'Cerrado': {
        icon: Archive,
        color: 'purple',
        label: 'Cerrado',
        description: 'Proceso completado y archivado'
    }
};

export default function PazYSalvoStepWizard({ pazYSalvo, firmas = [] }) {
    const getStepStatus = (step) => {
        if (!pazYSalvo) return 'pending';

        switch (step) {
            case 'Borrador':
                return pazYSalvo.estado === 'Borrador' ? 'current' : 'completed';
            case 'EnFirma':
                if (pazYSalvo.estado === 'EnFirma') return 'current';
                if (['Aprobado', 'Cerrado'].includes(pazYSalvo.estado)) return 'completed';
                return 'pending';
            case 'Aprobado':
                if (pazYSalvo.estado === 'Aprobado') return 'current';
                if (pazYSalvo.estado === 'Cerrado') return 'completed';
                return 'pending';
            case 'Cerrado':
                return pazYSalvo.estado === 'Cerrado' ? 'completed' : 'pending';
            default:
                return 'pending';
        }
    };

    const getFirmasProgress = () => {
        if (!firmas || firmas.length === 0) return { completed: 0, total: 0 };

        const completed = firmas.filter(f => f.estado === 'Firmado').length;
        const total = firmas.length;

        return { completed, total };
    };

    const getFirmasStatus = () => {
        const { completed, total } = getFirmasProgress();

        if (completed === 0) return 'pending';
        if (completed === total) return 'completed';
        return 'current';
    };

    const steps = [
        { key: 'Borrador', label: 'Creado' },
        { key: 'EnFirma', label: 'En Firma' },
        { key: 'Aprobado', label: 'Aprobado' },
        { key: 'Cerrado', label: 'Cerrado' }
    ];

    const progress = getFirmasProgress();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Progreso del Documento
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Estado actual: <span className="font-medium">{pazYSalvo?.estado || 'N/A'}</span>
                </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const stepInfo = stepConfig[step.key];
                        const status = getStepStatus(step.key);
                        const Icon = stepInfo.icon;

                        return (
                            <div key={step.key} className="flex flex-col items-center">
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors
                                    ${status === 'completed'
                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                        : status === 'current'
                                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                            : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                                    }
                                `}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className={`
                                    text-xs font-medium text-center
                                    ${status === 'completed'
                                        ? 'text-green-600 dark:text-green-400'
                                        : status === 'current'
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-gray-400 dark:text-gray-500'
                                    }
                                `}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Connecting Lines */}
                <div className="flex items-center justify-between -mt-6 px-6">
                    {steps.slice(0, -1).map((_, index) => {
                        const currentStatus = getStepStatus(steps[index].key);
                        const nextStatus = getStepStatus(steps[index + 1].key);
                        const isCompleted = currentStatus === 'completed' || nextStatus === 'completed';

                        return (
                            <div key={index} className={`
                                flex-1 h-0.5 mx-3
                                ${isCompleted
                                    ? 'bg-green-200 dark:bg-green-800'
                                    : 'bg-gray-200 dark:bg-gray-700'
                                }
                            `} />
                        );
                    })}
                </div>
            </div>

            {/* Firmas Progress */}
            {pazYSalvo?.estado === 'EnFirma' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-400">
                            Progreso de Firmas
                        </h4>
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                            {progress.completed} de {progress.total} firmas completadas
                        </span>
                    </div>

                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                        />
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {firmas.map((firma, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                                <div className={`
                                    w-4 h-4 rounded-full flex items-center justify-center
                                    ${firma.estado === 'Firmado'
                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                        : firma.estado === 'Rechazado'
                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                            : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                                    }
                                `}>
                                    {firma.estado === 'Firmado' ? (
                                        <CheckCircle className="w-3 h-3" />
                                    ) : firma.estado === 'Rechazado' ? (
                                        <XCircle className="w-3 h-3" />
                                    ) : (
                                        <Clock className="w-3 h-3" />
                                    )}
                                </div>
                                <span className={`
                                    ${firma.estado === 'Firmado'
                                        ? 'text-green-700 dark:text-green-300'
                                        : firma.estado === 'Rechazado'
                                            ? 'text-red-700 dark:text-red-300'
                                            : 'text-gray-600 dark:text-gray-400'
                                    }
                                `}>
                                    {firma.rol}
                                </span>
                                {firma.firmante && (
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                                        - {firma.firmante.nombre} {firma.firmante.apellido}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Estado Actual */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                    {(() => {
                        const stepInfo = stepConfig[pazYSalvo?.estado] || stepConfig['Borrador'];
                        const Icon = stepInfo.icon;

                        return (
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center
                                ${stepInfo.color === 'green'
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                    : stepInfo.color === 'blue'
                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                        : stepInfo.color === 'red'
                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                            : stepInfo.color === 'purple'
                                                ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }
                            `}>
                                <Icon className="w-4 h-4" />
                            </div>
                        );
                    })()}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {stepConfig[pazYSalvo?.estado]?.label || 'Estado Desconocido'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {stepConfig[pazYSalvo?.estado]?.description || 'Estado no reconocido'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
