import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BadgeCheck, ChevronDown, ChevronUp } from 'lucide-react';

export default function PazYSalvoDropdown() {
    const [isOpen, setIsOpen] = useState(false);

    const pazYSalvoOptions = [
        { to: '/pazysalvo-admin', label: 'Gestión Completa', icon: BadgeCheck },
        { to: '/pazysalvo/jefe-directo', label: 'Jefatura Directa', icon: BadgeCheck },
        { to: '/pazysalvo', label: 'RRHH', icon: BadgeCheck },
        { to: '/pazysalvo/ti', label: 'TI', icon: BadgeCheck },
        { to: '/pazysalvo/contabilidad', label: 'Contabilidad', icon: BadgeCheck },
        { to: '/pazysalvo/gerencia-finanzas', label: 'Gerencia Finanzas', icon: BadgeCheck }
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
            >
                <div className="flex items-center">
                    <BadgeCheck className="w-5 h-5 mr-3" />
                    <span>Paz y Salvo</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4" />
                ) : (
                    <ChevronDown className="w-4 h-4" />
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                    <div className="py-1">
                        {pazYSalvoOptions.map((option, index) => (
                            <NavLink
                                key={index}
                                to={option.to}
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                                        isActive ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
                                    }`
                                }
                                onClick={() => setIsOpen(false)}
                            >
                                <option.icon className="w-4 h-4 mr-3" />
                                <span>{option.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
