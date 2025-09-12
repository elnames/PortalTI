// src/components/PazYSalvoFilters.jsx
import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

export default function PazYSalvoFilters({ filters, usuarios, onFilterChange }) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleFilterChange = (key, value) => {
        onFilterChange({
            ...filters,
            [key]: value
        });
    };

    const clearFilters = () => {
        onFilterChange({
            estado: '',
            usuario: '',
            fechaDesde: '',
            fechaHasta: '',
            search: ''
        });
    };

    const hasActiveFilters = Object.values(filters).some(value => value !== '');

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Filter className="h-5 w-5 mr-2 text-blue-600" />
                    Filtros
                </h3>
                <div className="flex items-center space-x-2">
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <X className="h-4 w-4" />
                            <span>Limpiar</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        {showAdvanced ? 'Ocultar' : 'Mostrar'} filtros avanzados
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {/* Búsqueda rápida */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, RUT o motivo..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* Filtros básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Estado
                        </label>
                        <select
                            value={filters.estado}
                            onChange={(e) => handleFilterChange('estado', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Todos los estados</option>
                            <option value="Borrador">Borrador</option>
                            <option value="EnFirma">En Firma</option>
                            <option value="Aprobado">Aprobado</option>
                            <option value="Rechazado">Rechazado</option>
                            <option value="Cerrado">Cerrado</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Usuario
                        </label>
                        <select
                            value={filters.usuario}
                            onChange={(e) => handleFilterChange('usuario', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Todos los usuarios</option>
                            {usuarios.map(usuario => (
                                <option key={usuario.id} value={usuario.id}>
                                    {usuario.nombre} {usuario.apellido} ({usuario.rut})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Filtros avanzados */}
                {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fecha desde
                            </label>
                            <input
                                type="date"
                                value={filters.fechaDesde}
                                onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fecha hasta
                            </label>
                            <input
                                type="date"
                                value={filters.fechaHasta}
                                onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                )}

                {/* Resumen de filtros activos */}
                {hasActiveFilters && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap gap-2">
                            {filters.estado && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                    Estado: {filters.estado}
                                </span>
                            )}
                            {filters.usuario && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                    Usuario: {usuarios.find(u => u.id === parseInt(filters.usuario))?.nombre} {usuarios.find(u => u.id === parseInt(filters.usuario))?.apellido}
                                </span>
                            )}
                            {filters.fechaDesde && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                    Desde: {new Date(filters.fechaDesde).toLocaleDateString('es-ES')}
                                </span>
                            )}
                            {filters.fechaHasta && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                    Hasta: {new Date(filters.fechaHasta).toLocaleDateString('es-ES')}
                                </span>
                            )}
                            {filters.search && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                    Búsqueda: "{filters.search}"
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
