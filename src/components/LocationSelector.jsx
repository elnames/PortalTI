import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, ChevronUp } from 'lucide-react';

const LocationSelector = ({ value, onChange, placeholder = "Seleccionar ubicación", required = false, className = "" }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isRegionExpanded, setIsRegionExpanded] = useState(false);

    const ubicacionesPrincipales = [
        "B2B - PANAMERICANA NORTE #5151 - CONCHALI",
        "B2B- TB- VICSA  - PUERTO SANTIAGO #259 - PUDAHUEL",
        "TECNOBOGA - AVENIDA DEL VALLE NORTE #765 - HUECHURABA",
        "DPS - CAMINO COQUIMBO 16000 - COLINA",
        "VICSA - AVENIDA DEL VALLE NORTE #787 PISO 5 – HUECHURABA",
        "B2B TIENDA LA FABRICA - SAN JOAQUIN",
        "B2B TIENDA VESPUCIO - CONCHALI"
    ];

    const ubicacionesRegion = [
        "Argentina",
        "Uruguay",
        "Antofagasta",
        "Concepción",
        "Iquique",
        "La serena",
        "Pucón",
        "Temuco"
    ];

    const handleLocationSelect = (location) => {
        if (location && typeof location === 'string') {
            onChange(location);
        }
    };

    const isRegionLocation = ubicacionesRegion.includes(value);

    return (
        <div className={`relative ${className}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ubicación {required && <span className="text-red-500">*</span>}
            </label>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400" />
                </div>

                <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full pl-10 pr-10 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                    <span className={value ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
                        {value || placeholder}
                    </span>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        {isDropdownOpen ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                    </div>
                </button>
            </div>

            {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Ubicaciones Principales */}
                    <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">
                            Ubicaciones Principales
                        </div>
                        {ubicacionesPrincipales.map((location) => (
                            <button
                                key={location}
                                type="button"
                                onClick={() => {
                                    handleLocationSelect(location);
                                    setIsDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 border-b border-gray-100 dark:border-gray-600 ${value === location ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                    <span className="text-sm">{location}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Separador */}
                    <div className="border-t border-gray-200 dark:border-gray-600">
                        <div className="p-2">
                            <button
                                type="button"
                                onClick={() => setIsRegionExpanded(!isRegionExpanded)}
                                className="flex items-center justify-between w-full text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded py-1"
                            >
                                <span>Región</span>
                                {isRegionExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </button>
                            {isRegionExpanded && ubicacionesRegion.map((location) => (
                                <button
                                    key={location}
                                    type="button"
                                    onClick={() => {
                                        handleLocationSelect(location);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${value === location ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="text-sm">{location}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Mostrar indicador si la ubicación seleccionada es de región */}
            {isRegionLocation && (
                <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    Ubicación de región
                </div>
            )}
        </div>
    );
};

export default LocationSelector; 