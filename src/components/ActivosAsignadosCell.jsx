import React, { useState } from 'react';
import { HardDrive, User, Eye } from 'lucide-react';
import ActivosAsignadosModal from './ActivosAsignadosModal';

export default function ActivosAsignadosCell({ activosAsignados, usuario }) {
    const [showModal, setShowModal] = useState(false);

    if (!activosAsignados || activosAsignados.length === 0) {
        return (
            <div
                className="flex items-center text-gray-500 dark:text-gray-400"
                onClick={(e) => e.stopPropagation()} // Prevenir propagación incluso cuando no hay activos
            >
                <User className="w-4 h-4 mr-1" />
                <span className="text-sm">Sin activos asignados</span>
            </div>
        );
    }

    return (
        <>
            <div
                className="flex items-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-2 py-1 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                onClick={(e) => {
                    e.stopPropagation(); // Prevenir que el clic se propague a la fila
                    setShowModal(true);
                }}
                title="Hacer clic para ver los activos asignados"
            >
                <HardDrive className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {activosAsignados.length} activo{activosAsignados.length !== 1 ? 's' : ''} asignado{activosAsignados.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 ml-2 font-medium">
                    (Click para ver)
                </span>
                <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-1" />
            </div>

            <ActivosAsignadosModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                usuario={usuario}
                activosAsignados={activosAsignados}
            />
        </>
    );
} 