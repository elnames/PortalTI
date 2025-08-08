import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function MisTickets() {
    const { user } = useAuth();
    const [ticketsActivos, setTicketsActivos] = useState([]);
    const [ticketsHistorial, setTicketsHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [activeTab, setActiveTab] = useState('activos'); // 'activos' o 'historial'
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalTickets: 0,
        pageSize: 3
    });
    const [paginationHistorial, setPaginationHistorial] = useState({
        currentPage: 1,
        totalPages: 1,
        totalTickets: 0,
        pageSize: 3
    });
    const [filtros, setFiltros] = useState({
        estado: '',
        prioridad: ''
    });
    const [filtrosHistorial, setFiltrosHistorial] = useState({
        estado: '',
        prioridad: ''
    });

    const cargarTicketsActivos = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const response = await api.get('/tickets/mis-tickets', {
                params: {
                    ...filtros,
                    page,
                    pageSize: pagination.pageSize
                }
            });

            if (response.data.tickets) {
                setTicketsActivos(response.data.tickets);
                setPagination(response.data.pagination);
            } else {
                setTicketsActivos(response.data);
                setPagination({
                    currentPage: 1,
                    totalPages: 1,
                    totalTickets: response.data.length,
                    pageSize: 3
                });
            }
        } catch (error) {
            console.error('Error al cargar tickets activos:', error);
            setTicketsActivos([]);
        } finally {
            setLoading(false);
        }
    }, [filtros, pagination.pageSize]);

    const cargarTicketsHistorial = useCallback(async (page = 1) => {
        try {
            setLoadingHistorial(true);
            const response = await api.get('/tickets/mis-tickets-historial', {
                params: {
                    ...filtrosHistorial,
                    page,
                    pageSize: paginationHistorial.pageSize
                }
            });

            if (response.data.tickets) {
                setTicketsHistorial(response.data.tickets);
                setPaginationHistorial(response.data.pagination);
            } else {
                setTicketsHistorial(response.data);
                setPaginationHistorial({
                    currentPage: 1,
                    totalPages: 1,
                    totalTickets: response.data.length,
                    pageSize: 3
                });
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
            setTicketsHistorial([]);
        } finally {
            setLoadingHistorial(false);
        }
    }, [filtrosHistorial, paginationHistorial.pageSize]);

    useEffect(() => {
        if (user?.role?.toLowerCase() === 'soporte') {
            cargarTicketsActivos();
        }
    }, [cargarTicketsActivos, user]);

    useEffect(() => {
        if (activeTab === 'historial' && user?.role?.toLowerCase() === 'soporte') {
            cargarTicketsHistorial();
        }
    }, [activeTab, cargarTicketsHistorial, user]);

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleFiltroHistorialChange = (campo, valor) => {
        setFiltrosHistorial(prev => ({
            ...prev,
            [campo]: valor
        }));
        setPaginationHistorial(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (page) => {
        if (activeTab === 'activos') {
            cargarTicketsActivos(page);
        } else {
            cargarTicketsHistorial(page);
        }
    };

    const getEstadoColor = (estado) => {
        const colores = {
            'Pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
            'Asignado': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
            'En Proceso': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
            'Resuelto': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
            'Cerrado': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        };
        return colores[estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    };

    const getPrioridadColor = (prioridad) => {
        const colores = {
            'Baja': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
            'Media': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
            'Alta': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
            'Crítica': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
        };
        return colores[prioridad] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    };

    const renderPagination = (currentPagination, onPageChange) => {
        const { currentPage, totalPages } = currentPagination;

        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center justify-center space-x-2 mt-6">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                    Anterior
                </button>

                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => onPageChange(1)}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            1
                        </button>
                        {startPage > 2 && (
                            <span className="px-3 py-2 text-sm text-gray-500">...</span>
                        )}
                    </>
                )}

                {pages.map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${page === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        {page}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && (
                            <span className="px-3 py-2 text-sm text-gray-500">...</span>
                        )}
                        <button
                            onClick={() => onPageChange(totalPages)}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                    Siguiente
                </button>
            </div>
        );
    };

    const renderTicketList = (tickets, loading, pagination, filtros, handleFiltroChange) => (
        <div>
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                    <select
                        value={filtros.estado}
                        onChange={(e) => handleFiltroChange('estado', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Todos</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Asignado">Asignado</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Resuelto">Resuelto</option>
                        <option value="Cerrado">Cerrado</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
                    <select
                        value={filtros.prioridad}
                        onChange={(e) => handleFiltroChange('prioridad', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Todas</option>
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                        <option value="Crítica">Crítica</option>
                    </select>
                </div>
            </div>

            {/* Lista de tickets */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-gray-400 dark:text-gray-500 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                        {activeTab === 'activos' ? 'No tienes tickets activos' : 'No hay tickets en el historial'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {tickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                onClick={() => window.location.href = `/tickets/${ticket.id}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="font-medium text-gray-900 dark:text-white">#{ticket.id}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(ticket.estado)}`}>
                                                {ticket.estado}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadColor(ticket.prioridad)}`}>
                                                {ticket.prioridad}
                                            </span>
                                        </div>
                                        <p className="text-gray-900 dark:text-white font-medium mb-1">{ticket.titulo}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{ticket.descripcion?.substring(0, 100)}...</p>
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span>Solicitante: {ticket.nombreSolicitante}</span>
                                            <span>{ticket.fechaCreacion ? new Date(ticket.fechaCreacion).toLocaleDateString('es-ES') : '—'}</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {renderPagination(pagination, handlePageChange)}
                </>
            )}
        </div>
    );

    if (user?.role?.toLowerCase() !== 'soporte') {
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mis Tickets</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">Tickets asignados a ti</p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {activeTab === 'activos'
                        ? `${pagination.totalTickets} ticket${pagination.totalTickets !== 1 ? 's' : ''} activo${pagination.totalTickets !== 1 ? 's' : ''}`
                        : `${paginationHistorial.totalTickets} ticket${paginationHistorial.totalTickets !== 1 ? 's' : ''} en historial`
                    }
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('activos')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'activos'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        Tickets Activos
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                            {pagination.totalTickets}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('historial')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'historial'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        Historial
                        <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
                            {paginationHistorial.totalTickets}
                        </span>
                    </button>
                </nav>
            </div>

            {/* Contenido de las tabs */}
            {activeTab === 'activos' ? (
                renderTicketList(ticketsActivos, loading, pagination, filtros, handleFiltroChange)
            ) : (
                renderTicketList(ticketsHistorial, loadingHistorial, paginationHistorial, filtrosHistorial, handleFiltroHistorialChange)
            )}
        </div>
    );
} 