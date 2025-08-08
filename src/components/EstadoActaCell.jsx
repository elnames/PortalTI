import React from 'react';
import { Clock, CheckCircle, XCircle, Edit3 } from 'lucide-react';

const EstadoActaCell = ({ acta }) => {
    if (!acta) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                Sin Acta
            </span>
        );
    }

    const getEstadoIcon = (estado) => {
        switch (estado) {
            case 'Pendiente':
                return <Clock className="w-3 h-3" />;
            case 'Firmada':
                return <Edit3 className="w-3 h-3" />;
            case 'Aprobada':
                return <CheckCircle className="w-3 h-3" />;
            case 'Rechazada':
                return <XCircle className="w-3 h-3" />;
            default:
                return <Clock className="w-3 h-3" />;
        }
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'Pendiente':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Firmada':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Aprobada':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Rechazada':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const getMetodoFirmaText = (metodo) => {
        switch (metodo) {
            case 'Digital':
                return 'Digital';
            case 'PDF_Subido':
                return 'PDF';
            case 'Admin_Subida':
                return 'Admin';
            case 'Pendiente':
                return 'Pendiente';
            default:
                return metodo;
        }
    };

    return (
        <div className="flex flex-col space-y-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(acta.estado)}`}>
                {getEstadoIcon(acta.estado)}
                <span className="ml-1">{acta.estado}</span>
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
                {getMetodoFirmaText(acta.metodoFirma)}
            </span>
        </div>
    );
};

export default EstadoActaCell; 