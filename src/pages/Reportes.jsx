import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    BarChart2,
    Users,
    HardDrive,
    TrendingUp,
    Calendar,
    Download,
    Filter,
    PieChart,
    Activity,
    AlertTriangle,
    CheckCircle,
    Building,
    Smartphone,
    Monitor,
    Keyboard,
    Usb,
    Wifi,
    FileText
} from 'lucide-react';
import api, { reportesAPI } from '../services/api';

export default function Reportes() {
    const navigate = useNavigate();
    const { token } = useAuth();

    // Verificar autenticación
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
    }, [token, navigate]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState({
        usuarios: [],
        activos: [],
        asignaciones: [],
        tickets: []
    });
    const [selectedReport, setSelectedReport] = useState('general');
    const [tiPerf, setTiPerf] = useState(null);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [trimestralParams, setTrimestralParams] = useState({
        trimestre: ((new Date().getMonth()) / 3) + 1,
        año: new Date().getFullYear()
    });
    const [generatingTrimestral, setGeneratingTrimestral] = useState(false);
    const [filters, setFilters] = useState({
        categoria: 'all',
        departamento: 'all',
        empresa: 'all',
        estado: 'all'
    });

    // Cargar datos para reportes
    const fetchReportData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [usuariosRes, activosRes, asignacionesRes, ticketsRes] = await Promise.all([
                api.get('/usuarios'),
                api.get('/activos'),
                api.get('/asignaciones'),
                api.get('/tickets')
            ]);

            setReportData({
                usuarios: usuariosRes.data,
                activos: activosRes.data,
                asignaciones: asignacionesRes.data,
                tickets: ticketsRes.data
            });
        } catch (err) {
            console.error('Error al cargar datos para reportes:', err);
            setError('Error al cargar los datos para los reportes.');
        } finally {
            setLoading(false);
        }
    };

    // Generar reporte trimestral
    const generarReporteTrimestral = async () => {
        setGeneratingTrimestral(true);
        try {
            const response = await reportesAPI.getRegistrosTrimestrales(
                Math.floor(trimestralParams.trimestre),
                trimestralParams.año
            );

            // Crear blob y descargar
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Registros_Trimestrales_Q${Math.floor(trimestralParams.trimestre)}_${trimestralParams.año}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error al generar reporte trimestral:', err);
            setError('Error al generar el reporte trimestral.');
        } finally {
            setGeneratingTrimestral(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, []);

    // Cargar rendimiento TI cuando se seleccione el reporte correspondiente o cambie rango
    useEffect(() => {
        const loadTi = async () => {
            if (selectedReport !== 'ti') return;
            try {
                const { data } = await reportesAPI.getTiPerformance({ from: dateRange.start, to: dateRange.end });
                setTiPerf(data);
            } catch (e) {
                console.error('Error TI performance:', e);
            }
        };
        loadTi();
    }, [selectedReport, dateRange]);

    // Estadísticas generales
    const generalStats = useMemo(() => {
        if (!reportData.usuarios.length && !reportData.activos.length) return null;

        const totalUsuarios = reportData.usuarios.length;
        const totalActivos = reportData.activos.length;
        const activosAsignados = reportData.activos.filter(a => a.asignadoA).length;
        const activosDisponibles = totalActivos - activosAsignados;
        const totalTickets = reportData.tickets.length;
        const ticketsAbiertos = reportData.tickets.filter(t => t.estado === 'Abierto').length;
        const ticketsCerrados = totalTickets - ticketsAbiertos;

        // Estadísticas por departamento
        const porDepartamento = reportData.usuarios.reduce((acc, user) => {
            const dept = user.departamento || 'Sin departamento';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
        }, {});

        // Estadísticas por empresa
        const porEmpresa = reportData.usuarios.reduce((acc, user) => {
            const empresa = user.empresa || 'Sin empresa';
            acc[empresa] = (acc[empresa] || 0) + 1;
            return acc;
        }, {});

        // Estadísticas por categoría de activos
        const porCategoria = reportData.activos.reduce((acc, activo) => {
            const categoria = activo.categoria || 'Sin categoría';
            acc[categoria] = (acc[categoria] || 0) + 1;
            return acc;
        }, {});

        return {
            totalUsuarios,
            totalActivos,
            activosAsignados,
            activosDisponibles,
            totalTickets,
            ticketsAbiertos,
            ticketsCerrados,
            porDepartamento,
            porEmpresa,
            porCategoria
        };
    }, [reportData]);

    // Reporte de asignaciones recientes
    const asignacionesRecientes = useMemo(() => {
        const filtered = reportData.asignaciones
            .filter(asignacion => {
                const fechaAsignacion = new Date(asignacion.fechaAsignacion);
                const startDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);
                return fechaAsignacion >= startDate && fechaAsignacion <= endDate;
            })
            .sort((a, b) => new Date(b.fechaAsignacion) - new Date(a.fechaAsignacion))
            .slice(0, 10);

        return filtered;
    }, [reportData.asignaciones, dateRange]);

    // Reporte de tickets por estado
    const ticketsPorEstado = useMemo(() => {
        const estados = ['Abierto', 'En Proceso', 'Cerrado', 'Cancelado'];
        return estados.map(estado => ({
            estado,
            cantidad: reportData.tickets.filter(t => t.estado === estado).length
        }));
    }, [reportData.tickets]);

    // Estadísticas de mantenimiento
    const mantenimientoStats = useMemo(() => {
        const activosEnMantenimiento = reportData.activos.filter(a => a.estado === 'En Mantenimiento');
        const activosRetirados = reportData.activos.filter(a => a.estado === 'Retirado');
        const activosActivos = reportData.activos.filter(a => a.estado === 'Activo');

        return {
            enMantenimiento: activosEnMantenimiento.length,
            retirados: activosRetirados.length,
            activos: activosActivos.length,
            porcentajeMantenimiento: reportData.activos.length > 0 ?
                ((activosEnMantenimiento.length / reportData.activos.length) * 100).toFixed(1) : 0
        };
    }, [reportData.activos]);

    // Estadísticas de inventario
    const inventarioStats = useMemo(() => {
        const activosConValor = reportData.activos.filter(a => a.valor);
        const valorTotal = activosConValor.reduce((sum, activo) => sum + (activo.valor || 0), 0);
        const valorPromedio = activosConValor.length > 0 ? valorTotal / activosConValor.length : 0;

        return {
            totalActivos: reportData.activos.length,
            activosConValor: activosConValor.length,
            valorTotal: valorTotal,
            valorPromedio: valorPromedio
        };
    }, [reportData.activos]);

    // Estadísticas de tendencias
    const tendenciasStats = useMemo(() => {
        const asignacionesPorMes = {};
        const ticketsPorMes = {};

        // Agrupar asignaciones por mes
        reportData.asignaciones.forEach(asignacion => {
            const fecha = new Date(asignacion.fechaAsignacion);
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            asignacionesPorMes[mes] = (asignacionesPorMes[mes] || 0) + 1;
        });

        // Agrupar tickets por mes
        reportData.tickets.forEach(ticket => {
            const fecha = new Date(ticket.fechaCreacion);
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            ticketsPorMes[mes] = (ticketsPorMes[mes] || 0) + 1;
        });

        return {
            asignacionesPorMes,
            ticketsPorMes,
            ultimos6Meses: Object.keys(asignacionesPorMes).sort().slice(-6)
        };
    }, [reportData.asignaciones, reportData.tickets]);

    // Función para generar reporte PDF
    const generarReportePDF = async (tipo) => {
        try {
            const response = await api.get(`/reportes/${tipo}`, {
                params: {
                    startDate: dateRange.start,
                    endDate: dateRange.end,
                    ...filters
                },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Reporte_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al generar reporte PDF:', error);
            alert('Error al generar el reporte PDF.');
        }
    };

    // Función para exportar datos a Excel
    const exportarExcel = async (tipo) => {
        try {
            const response = await api.get(`/reportes/${tipo}/excel`, {
                params: {
                    startDate: dateRange.start,
                    endDate: dateRange.end,
                    ...filters
                },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Reporte_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al exportar Excel:', error);
            alert('Error al exportar el reporte a Excel.');
        }
    };

    // Si no hay token, mostrar mensaje de redirección
    if (!token) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-semibold flex items-center text-gray-900 dark:text-white mb-6">
                    <BarChart2 className="w-6 h-6 mr-2 text-primary" />
                    Reportes
                </h1>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Redirigiendo al login...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-semibold flex items-center text-gray-900 dark:text-white mb-6">
                    <BarChart2 className="w-6 h-6 mr-2 text-primary" />
                    Reportes
                </h1>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando datos para reportes...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-semibold flex items-center text-gray-900 dark:text-white mb-6">
                    <BarChart2 className="w-6 h-6 mr-2 text-primary" />
                    Reportes
                </h1>
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg p-4">
                    <p>{error}</p>
                    <button
                        onClick={fetchReportData}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold flex items-center text-gray-900 dark:text-white">
                    <BarChart2 className="w-6 h-6 mr-2 text-primary" />
                    Reportes
                </h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => generarReportePDF(selectedReport)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar PDF
                    </button>
                    <button
                        onClick={() => exportarExcel(selectedReport)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Exportar Excel
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    Filtros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Rango de fechas
                        </label>
                        <div className="flex space-x-2">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Categoría
                        </label>
                        <select
                            value={filters.categoria}
                            onChange={(e) => setFilters(prev => ({ ...prev, categoria: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="all">Todas las categorías</option>
                            <option value="Equipos">Equipos</option>
                            <option value="Móviles">Móviles</option>
                            <option value="Monitores">Monitores</option>
                            <option value="Periféricos">Periféricos</option>
                            <option value="Accesorios">Accesorios</option>
                            <option value="Red">Red</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Departamento
                        </label>
                        <select
                            value={filters.departamento}
                            onChange={(e) => setFilters(prev => ({ ...prev, departamento: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="all">Todos los departamentos</option>
                            {Object.keys(generalStats?.porDepartamento || {}).map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Estado
                        </label>
                        <select
                            value={filters.estado}
                            onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                            <option value="En Mantenimiento">En Mantenimiento</option>
                            <option value="Retirado">Retirado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tipos de reportes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    onClick={() => setSelectedReport('general')}
                    className={`p-4 rounded-lg border transition-all ${selectedReport === 'general'
                        ? 'border-primary bg-primary bg-opacity-10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md'
                        }`}
                >
                    <BarChart2 className="w-8 h-8 mb-2" />
                    <h3 className="font-medium">Reporte General</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Resumen completo</p>
                </button>
                <button
                    onClick={() => setSelectedReport('activos')}
                    className={`p-4 rounded-lg border transition-all ${selectedReport === 'activos'
                        ? 'border-primary bg-primary bg-opacity-10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md'
                        }`}
                >
                    <HardDrive className="w-8 h-8 mb-2" />
                    <h3 className="font-medium">Reporte de Activos</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Estado y distribución</p>
                </button>
                <button
                    onClick={() => setSelectedReport('usuarios')}
                    className={`p-4 rounded-lg border transition-all ${selectedReport === 'usuarios'
                        ? 'border-primary bg-primary bg-opacity-10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md'
                        }`}
                >
                    <Users className="w-8 h-8 mb-2" />
                    <h3 className="font-medium">Reporte de Usuarios</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Distribución por departamento</p>
                </button>
                <button
                    onClick={() => setSelectedReport('tickets')}
                    className={`p-4 rounded-lg border transition-all ${selectedReport === 'tickets'
                        ? 'border-primary bg-primary bg-opacity-10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md'
                        }`}
                >
                    <Activity className="w-8 h-8 mb-2" />
                    <h3 className="font-medium">Reporte de Tickets</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Estado y tendencias</p>
                </button>
                <button
                    onClick={() => setSelectedReport('asignaciones')}
                    className={`p-4 rounded-lg border transition-all ${selectedReport === 'asignaciones'
                        ? 'border-primary bg-primary bg-opacity-10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md'
                        }`}
                >
                    <Calendar className="w-8 h-8 mb-2" />
                    <h3 className="font-medium">Reporte de Asignaciones</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Historial y tendencias</p>
                </button>
                <button
                    onClick={() => setSelectedReport('mantenimiento')}
                    className={`p-4 rounded-lg border transition-all ${selectedReport === 'mantenimiento'
                        ? 'border-primary bg-primary bg-opacity-10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md'
                        }`}
                >
                    <AlertTriangle className="w-8 h-8 mb-2" />
                    <h3 className="font-medium">Reporte de Mantenimiento</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Activos en mantenimiento</p>
                </button>
                <button
                    onClick={() => setSelectedReport('inventario')}
                    className={`p-4 rounded-lg border transition-all ${selectedReport === 'inventario'
                        ? 'border-primary bg-primary bg-opacity-10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md'
                        }`}
                >
                    <PieChart className="w-8 h-8 mb-2" />
                    <h3 className="font-medium">Inventario</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Valor y depreciación</p>
                </button>
                <button
                    onClick={() => setSelectedReport('tendencias')}
                    className={`p-4 rounded-lg border transition-all ${selectedReport === 'tendencias'
                        ? 'border-primary bg-primary bg-opacity-10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md'
                        }`}
                >
                    <TrendingUp className="w-8 h-8 mb-2" />
                    <h3 className="font-medium">Tendencias</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Análisis temporal</p>
                </button>
                <button
                    onClick={() => setSelectedReport('ti')}
                    className={`p-4 rounded-lg border transition-all ${selectedReport === 'ti'
                        ? 'border-primary bg-primary bg-opacity-10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md'
                        }`}
                >
                    <Activity className="w-8 h-8 mb-2" />
                    <h3 className="font-medium">Rendimiento Equipo TI</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">KPIs por agente y tendencias</p>
                </button>
                <button
                    onClick={() => setSelectedReport('trimestral')}
                    className={`p-4 rounded-lg border transition-all ${selectedReport === 'trimestral'
                        ? 'border-primary bg-primary bg-opacity-10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md'
                        }`}
                >
                    <FileText className="w-8 h-8 mb-2" />
                    <h3 className="font-medium">Registros Trimestrales</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reporte Excel detallado</p>
                </button>
            </div>

            {/* Contenido del reporte seleccionado */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                {selectedReport === 'general' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reporte General</h3>

                        {/* Estadísticas principales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <Users className="w-8 h-8 text-blue-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-blue-600">Total Usuarios</p>
                                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                            {generalStats?.totalUsuarios || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <HardDrive className="w-8 h-8 text-green-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-green-600">Total Activos</p>
                                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                            {generalStats?.totalActivos || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <CheckCircle className="w-8 h-8 text-yellow-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-yellow-600">Asignados</p>
                                        <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                                            {generalStats?.activosAsignados || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <Activity className="w-8 h-8 text-purple-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-purple-600">Tickets</p>
                                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                            {generalStats?.totalTickets || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gráficos de distribución */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Activos por Categoría</h4>
                                <div className="space-y-2">
                                    {Object.entries(generalStats?.porCategoria || {}).map(([categoria, cantidad]) => (
                                        <div key={categoria} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{categoria}</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{cantidad}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Usuarios por Departamento</h4>
                                <div className="space-y-2">
                                    {Object.entries(generalStats?.porDepartamento || {}).map(([dept, cantidad]) => (
                                        <div key={dept} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{dept}</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{cantidad}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {selectedReport === 'ti' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Rendimiento del Equipo TI</h3>
                        {!tiPerf ? (
                            <div className="text-gray-500">Cargando KPIs...</div>
                        ) : (
                            <>
                                {/* Tendencia de creados vs cerrados */}
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tendencia (creados vs cerrados)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                        {(tiPerf.trend || tiPerf.Trend || []).slice(-10).map((d, i) => (
                                            <div key={i} className="flex justify-between bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                                                <span className="text-gray-600 dark:text-gray-400">{d.fecha || d.Fecha}</span>
                                                <span>
                                                    <span className="mr-3 text-blue-600">C:{d.creados || d.Creados}</span>
                                                    <span className="text-green-600">Cer:{d.cerrados || d.Cerrados}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Aging buckets */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {(() => {
                                        const aging = tiPerf.aging || tiPerf.Aging || {};
                                        return [
                                            { label: '0-2 días', v: aging.d0_2 },
                                            { label: '3-7 días', v: aging.d3_7 },
                                            { label: '8-14 días', v: aging.d8_14 },
                                            { label: '15-30 días', v: aging.d15_30 },
                                            { label: '30+ días', v: aging.d30p },
                                        ];
                                    })().map((b, i) => (
                                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                                            <p className="text-xs text-gray-500">{b.label}</p>
                                            <p className="text-2xl font-bold text-primary">{b.v}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* KPIs por agente */}
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">KPIs por Agente</h4>
                                    <div className="overflow-auto">
                                        <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Agente</th>
                                                    <th className="px-3 py-2 text-right">Abiertos Asignados</th>
                                                    <th className="px-3 py-2 text-right">Resueltos (período)</th>
                                                    <th className="px-3 py-2 text-right">1ra Resp. (min)</th>
                                                    <th className="px-3 py-2 text-right">Resolución (h)</th>
                                                    <th className="px-3 py-2 text-right">SLA Resp. %</th>
                                                    <th className="px-3 py-2 text-right">SLA Resol. %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(tiPerf.perAgent || tiPerf.PerAgent || []).map((a, idx) => (
                                                    <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                                                        <td className="px-3 py-2">{a.nombre || a.Nombre}</td>
                                                        <td className="px-3 py-2 text-right">{a.abiertosAsignados ?? a.AbiertosAsignados}</td>
                                                        <td className="px-3 py-2 text-right">{a.resueltosPeriodo ?? a.ResueltosPeriodo}</td>
                                                        <td className="px-3 py-2 text-right">{a.tiempoPrimeraRespuestaMin ?? a.TiempoPrimeraRespuestaMin}</td>
                                                        <td className="px-3 py-2 text-right">{a.tiempoResolucionHoras ?? a.TiempoResolucionHoras}</td>
                                                        <td className="px-3 py-2 text-right">{a.slaPrimeraRespuestaPct ?? a.SlaPrimeraRespuestaPct}%</td>
                                                        <td className="px-3 py-2 text-right">{a.slaResolucionPct ?? a.SlaResolucionPct}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {selectedReport === 'activos' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reporte de Activos</h3>

                        {/* Estado de activos */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-green-600">Disponibles</p>
                                        <p className="text-xl font-bold text-green-900 dark:text-green-100">
                                            {generalStats?.activosDisponibles || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <Users className="w-6 h-6 text-blue-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-blue-600">Asignados</p>
                                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                            {generalStats?.activosAsignados || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-yellow-600">En Mantenimiento</p>
                                        <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                                            {reportData.activos.filter(a => a.estado === 'En Mantenimiento').length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Categorías de activos */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {Object.entries(generalStats?.porCategoria || {}).map(([categoria, cantidad]) => {
                                const icons = {
                                    'Equipos': HardDrive,
                                    'Móviles': Smartphone,
                                    'Monitores': Monitor,
                                    'Periféricos': Keyboard,
                                    'Accesorios': Usb,
                                    'Red': Wifi
                                };
                                const Icon = icons[categoria] || HardDrive;

                                return (
                                    <div key={categoria} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                                        <Icon className="w-8 h-8 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{categoria}</p>
                                        <p className="text-2xl font-bold text-primary">{cantidad}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {selectedReport === 'usuarios' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reporte de Usuarios</h3>

                        {/* Distribución por departamento */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Distribución por Departamento</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(generalStats?.porDepartamento || {}).map(([dept, cantidad]) => (
                                    <div key={dept} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <Building className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
                                                <span className="font-medium text-gray-900 dark:text-white">{dept}</span>
                                            </div>
                                            <span className="text-2xl font-bold text-primary">{cantidad}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Distribución por empresa */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Distribución por Empresa</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(generalStats?.porEmpresa || {}).map(([empresa, cantidad]) => (
                                    <div key={empresa} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900 dark:text-white">{empresa}</span>
                                            <span className="text-2xl font-bold text-primary">{cantidad}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {selectedReport === 'tickets' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reporte de Tickets</h3>

                        {/* Estado de tickets */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {ticketsPorEstado.map(({ estado, cantidad }) => {
                                const colors = {
                                    'Abierto': 'red',
                                    'En Proceso': 'yellow',
                                    'Cerrado': 'green',
                                    'Cancelado': 'gray'
                                };
                                const color = colors[estado] || 'gray';

                                return (
                                    <div key={estado} className={`bg-${color}-50 dark:bg-${color}-900/20 p-4 rounded-lg`}>
                                        <div className="flex items-center">
                                            <div className={`w-6 h-6 rounded-full bg-${color}-600`}></div>
                                            <div className="ml-3">
                                                <p className={`text-sm font-medium text-${color}-600`}>{estado}</p>
                                                <p className={`text-xl font-bold text-${color}-900 dark:text-${color}-100`}>
                                                    {cantidad}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Asignaciones recientes */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Asignaciones Recientes</h4>
                            <div className="space-y-3">
                                {asignacionesRecientes.map((asignacion, index) => (
                                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {asignacion.activo?.codigo} - {asignacion.usuario?.nombre} {asignacion.usuario?.apellido}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(asignacion.fechaAsignacion).toLocaleDateString('es-ES')}
                                                </p>
                                            </div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {asignacion.activo?.categoria}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {selectedReport === 'asignaciones' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reporte de Asignaciones</h3>

                        {/* Estadísticas de asignaciones */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <Calendar className="w-6 h-6 text-green-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-green-600">Total Asignaciones</p>
                                        <p className="text-xl font-bold text-green-900 dark:text-green-100">
                                            {reportData.asignaciones.length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <TrendingUp className="w-6 h-6 text-blue-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-blue-600">Este Mes</p>
                                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                            {reportData.asignaciones.filter(a => {
                                                const fecha = new Date(a.fechaAsignacion);
                                                const mesActual = new Date().getMonth();
                                                const añoActual = new Date().getFullYear();
                                                return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
                                            }).length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <Users className="w-6 h-6 text-purple-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-purple-600">Usuarios Activos</p>
                                        <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                                            {new Set(reportData.asignaciones.map(a => a.usuario?.id)).size}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Asignaciones recientes */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Asignaciones Recientes</h4>
                            <div className="space-y-3">
                                {asignacionesRecientes.map((asignacion, index) => (
                                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {asignacion.activo?.codigo} - {asignacion.usuario?.nombre} {asignacion.usuario?.apellido}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(asignacion.fechaAsignacion).toLocaleDateString('es-ES')}
                                                </p>
                                            </div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {asignacion.activo?.categoria}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {selectedReport === 'mantenimiento' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reporte de Mantenimiento</h3>

                        {/* Estadísticas de mantenimiento */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-yellow-600">En Mantenimiento</p>
                                        <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                                            {mantenimientoStats.enMantenimiento}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-red-600">Retirados</p>
                                        <p className="text-xl font-bold text-red-900 dark:text-red-100">
                                            {mantenimientoStats.retirados}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-green-600">Activos</p>
                                        <p className="text-xl font-bold text-green-900 dark:text-green-100">
                                            {mantenimientoStats.activos}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <BarChart2 className="w-6 h-6 text-blue-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-blue-600">% Mantenimiento</p>
                                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                            {mantenimientoStats.porcentajeMantenimiento}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lista de activos en mantenimiento */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Activos en Mantenimiento</h4>
                            <div className="space-y-3">
                                {reportData.activos
                                    .filter(a => a.estado === 'En Mantenimiento')
                                    .map((activo, index) => (
                                        <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {activo.codigo} - {activo.categoria}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {activo.nombre || activo.nombreEquipo}
                                                    </p>
                                                </div>
                                                <span className="text-sm text-yellow-600 font-medium">
                                                    En Mantenimiento
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {selectedReport === 'inventario' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reporte de Inventario</h3>

                        {/* Estadísticas de valor */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <PieChart className="w-6 h-6 text-green-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-green-600">Valor Total</p>
                                        <p className="text-xl font-bold text-green-900 dark:text-green-100">
                                            ${inventarioStats.valorTotal.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <BarChart2 className="w-6 h-6 text-blue-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-blue-600">Valor Promedio</p>
                                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                            ${inventarioStats.valorPromedio.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <HardDrive className="w-6 h-6 text-purple-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-purple-600">Total Activos</p>
                                        <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                                            {inventarioStats.totalActivos}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <CheckCircle className="w-6 h-6 text-yellow-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-yellow-600">Con Valor</p>
                                        <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                                            {inventarioStats.activosConValor}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Valor por categoría */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Valor por Categoría</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(generalStats?.porCategoria || {}).map(([categoria, cantidad]) => {
                                    const activosCategoria = reportData.activos.filter(a => a.categoria === categoria);
                                    const valorCategoria = activosCategoria.reduce((sum, a) => sum + (a.valor || 0), 0);

                                    return (
                                        <div key={categoria} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-gray-900 dark:text-white">{categoria}</span>
                                                <span className="text-lg font-bold text-primary">
                                                    ${valorCategoria.toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {cantidad} activos
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {selectedReport === 'tendencias' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reporte de Tendencias</h3>

                        {/* Tendencias de asignaciones */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Tendencias de Asignaciones (Últimos 6 meses)</h4>
                            <div className="space-y-3">
                                {tendenciasStats.ultimos6Meses.map((mes, index) => {
                                    const asignaciones = tendenciasStats.asignacionesPorMes[mes] || 0;
                                    const tickets = tendenciasStats.ticketsPorMes[mes] || 0;
                                    const fecha = new Date(mes + '-01');
                                    const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

                                    return (
                                        <div key={mes} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-gray-900 dark:text-white capitalize">
                                                    {nombreMes}
                                                </span>
                                                <div className="flex space-x-4">
                                                    <div className="text-center">
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">Asignaciones</p>
                                                        <p className="text-lg font-bold text-blue-600">{asignaciones}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">Tickets</p>
                                                        <p className="text-lg font-bold text-green-600">{tickets}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Indicadores de tendencia */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Tendencia de Asignaciones</h4>
                                <div className="flex items-center">
                                    <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
                                    <div>
                                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                            {reportData.asignaciones.length}
                                        </p>
                                        <p className="text-sm text-blue-600">Total asignaciones</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Tendencia de Tickets</h4>
                                <div className="flex items-center">
                                    <Activity className="w-8 h-8 text-green-600 mr-3" />
                                    <div>
                                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                            {reportData.tickets.length}
                                        </p>
                                        <p className="text-sm text-green-600">Total tickets</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {selectedReport === 'trimestral' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reporte Trimestral de Registros</h3>

                        {/* Configuración del reporte */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Configuración del Reporte</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Trimestre
                                    </label>
                                    <select
                                        value={trimestralParams.trimestre}
                                        onChange={(e) => setTrimestralParams(prev => ({ ...prev, trimestre: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value={1}>Q1 (Enero - Marzo)</option>
                                        <option value={2}>Q2 (Abril - Junio)</option>
                                        <option value={3}>Q3 (Julio - Septiembre)</option>
                                        <option value={4}>Q4 (Octubre - Diciembre)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Año
                                    </label>
                                    <input
                                        type="number"
                                        value={trimestralParams.año}
                                        onChange={(e) => setTrimestralParams(prev => ({ ...prev, año: parseInt(e.target.value) }))}
                                        min="2020"
                                        max="2030"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Información del reporte */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Información del Reporte</h4>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Este reporte genera un archivo Excel con <strong>dos hojas separadas</strong>: una para workstations (laptops, desktops, computadores)
                                y otra para celulares (teléfonos, smartphones). Cada hoja tiene su propia estructura de columnas específica.
                            </p>
                        </div>

                        {/* Estructura de las hojas */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Hoja Workstations */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                    <Monitor className="w-5 h-5 mr-2 text-blue-600" />
                                    Hoja "Workstations"
                                </h4>
                                <div className="space-y-3 text-sm">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded">
                                        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Localidad:</h5>
                                        <p className="text-blue-700 dark:text-blue-300">Región, OpCo</p>
                                    </div>
                                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded">
                                        <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">Identificación:</h5>
                                        <p className="text-green-700 dark:text-green-300">Username, Correo</p>
                                    </div>
                                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded">
                                        <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Workstation:</h5>
                                        <p className="text-purple-700 dark:text-purple-300">Hostname, Procesador</p>
                                    </div>
                                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded">
                                        <h5 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Status:</h5>
                                        <p className="text-orange-700 dark:text-orange-300">O.S Name, Utilización, Uso Remoto</p>
                                    </div>
                                    <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded">
                                        <h5 className="font-medium text-red-900 dark:text-red-100 mb-2">Instalaciones:</h5>
                                        <p className="text-red-700 dark:text-red-300">Cisco Secure Endpoint, Cisco Umbrella, Rapid7, Vicarius</p>
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Observaciones:</h5>
                                        <p className="text-gray-700 dark:text-gray-300">Fecha de Actualización, Comentarios, Validación</p>
                                    </div>
                                </div>
                            </div>

                            {/* Hoja Celulares */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                    <Smartphone className="w-5 h-5 mr-2 text-green-600" />
                                    Hoja "Celulares"
                                </h4>
                                <div className="space-y-3 text-sm">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded">
                                        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Responsable:</h5>
                                        <p className="text-blue-700 dark:text-blue-300">Nombre del responsable</p>
                                    </div>
                                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded">
                                        <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">Empresa:</h5>
                                        <p className="text-green-700 dark:text-green-300">Nombre de la empresa</p>
                                    </div>
                                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded">
                                        <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Dispositivo:</h5>
                                        <p className="text-purple-700 dark:text-purple-300">Nombre del Dispositivo, Fabricante, Modelo</p>
                                    </div>
                                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded">
                                        <h5 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Especificaciones:</h5>
                                        <p className="text-orange-700 dark:text-orange-300">Version OS, Memória Disponible</p>
                                    </div>
                                    <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded">
                                        <h5 className="font-medium text-red-900 dark:text-red-100 mb-2">Contacto:</h5>
                                        <p className="text-red-700 dark:text-red-300">Número de Teléfono, MAC</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Características del reporte */}
                        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                            <h4 className="font-medium text-green-900 dark:text-green-100 mb-4">Características del Reporte</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <ul className="space-y-2 text-green-700 dark:text-green-300">
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                            <strong>Dos hojas separadas:</strong> Workstations y Celulares
                                        </li>
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                            <strong>Filtrado automático:</strong> Solo equipos del tipo correspondiente
                                        </li>
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                            <strong>Formato profesional:</strong> Estilos y colores corporativos
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <ul className="space-y-2 text-green-700 dark:text-green-300">
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                            <strong>Filtros automáticos:</strong> Para facilitar el análisis
                                        </li>
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                            <strong>Datos actualizados:</strong> Información en tiempo real
                                        </li>
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                            <strong>Estructura exacta:</strong> Como el documento "Endpoints Dispositivos"
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Botón de generación */}
                        <div className="flex justify-center">
                            <button
                                onClick={generarReporteTrimestral}
                                disabled={generatingTrimestral}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {generatingTrimestral ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Generando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        <span>Generar Reporte Excel</span>
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
} 