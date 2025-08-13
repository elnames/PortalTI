import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import SimpleChart from '../components/SimpleChart';
import { 
    HardDrive, 
    Clipboard, 
    Users, 
    FileText, 
    AlertTriangle, 
    CheckCircle, 
    Clock, 
    TrendingUp,
    MessageSquare,
    Activity,
    Building,
    Wrench,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentChartIndex, setCurrentChartIndex] = useState(0);

    useEffect(() => {
        api.get('/dashboard')
            .then(res => setData(res.data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    // Auto-cambio de gráficas cada 10 segundos
    useEffect(() => {
        if (!data) return;
        
        const interval = setInterval(() => {
            setCurrentChartIndex(prev => (prev + 1) % 4); // 4 gráficas en total
        }, 10000);

        return () => clearInterval(interval);
    }, [data]);

    if (loading) return <div className="p-6">Cargando dashboard...</div>;
    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
    if (!data) return null;

    // Preparar datos para las diferentes gráficas
    const chartData = {
        activosPorCategoria: data.activos.porCategoria.map(cat => ({ 
            name: cat.categoria, 
            value: cat.cantidad 
        })),
        ticketsPorEstado: [
            { name: 'Pendientes', value: data.tickets.pendientes },
            { name: 'En Proceso', value: data.tickets.enProceso },
            { name: 'Resueltos', value: data.tickets.resueltos },
            { name: 'Cerrados', value: data.tickets.cerrados }
        ],
        estadisticasGenerales: [
            { name: 'Activos', value: data.estadisticas.totalActivos },
            { name: 'Usuarios', value: data.estadisticas.totalUsuarios },
            { name: 'Tickets', value: data.tickets.total },
            { name: 'Actas', value: data.actas.total }
        ],
        estadosActivos: [
            { name: 'Asignados', value: data.estadisticas.activosAsignados },
            { name: 'Disponibles', value: data.estadisticas.activosDisponibles },
            { name: 'Dados de Baja', value: data.estadisticas.activosDadosDeBaja }
        ]
    };

    const chartConfigs = [
        {
            title: 'Activos por Categoría',
            data: chartData.activosPorCategoria,
            icon: HardDrive,
            color: 'blue',
            description: 'Distribución de activos por tipo de categoría'
        },
        {
            title: 'Tickets por Estado',
            data: chartData.ticketsPorEstado,
            icon: MessageSquare,
            color: 'orange',
            description: 'Estado actual de los tickets del sistema'
        },
        {
            title: 'Estadísticas Generales',
            data: chartData.estadisticasGenerales,
            icon: TrendingUp,
            color: 'green',
            description: 'Resumen de elementos principales del sistema'
        },
        {
            title: 'Estados de Activos',
            data: chartData.estadosActivos,
            icon: Clipboard,
            color: 'purple',
            description: 'Distribución de activos por estado'
        }
    ];

    const currentChart = chartConfigs[currentChartIndex];

    // Tarjetas resumen principales
    const mainStats = [
        { 
            title: 'Activos Totales', 
            value: data.estadisticas.totalActivos, 
            icon: HardDrive,
            color: 'blue'
        },
        { 
            title: 'Activos Asignados', 
            value: data.estadisticas.activosAsignados, 
            icon: Clipboard,
            color: 'green'
        },
        { 
            title: 'Tickets Pendientes', 
            value: data.tickets.pendientes, 
            icon: AlertTriangle,
            color: 'orange'
        },
        { 
            title: 'Usuarios Registrados', 
            value: data.estadisticas.totalUsuarios, 
            icon: Users,
            color: 'purple'
        },
    ];

    // Tarjetas secundarias
    const secondaryStats = [
        { 
            title: 'Activos Disponibles', 
            value: data.estadisticas.activosDisponibles, 
            icon: CheckCircle,
            color: 'green'
        },
        { 
            title: 'Actas Pendientes', 
            value: data.actas.pendientes, 
            icon: FileText,
            color: 'yellow'
        },
        { 
            title: 'Tickets En Proceso', 
            value: data.tickets.enProceso, 
            icon: Clock,
            color: 'blue'
        },
        { 
            title: 'Activos Dados de Baja', 
            value: data.estadisticas.activosDadosDeBaja, 
            icon: Wrench,
            color: 'red'
        },
    ];

    const handleChartChange = (direction) => {
        if (direction === 'next') {
            setCurrentChartIndex(prev => (prev + 1) % chartConfigs.length);
        } else {
            setCurrentChartIndex(prev => (prev - 1 + chartConfigs.length) % chartConfigs.length);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        ¡Bienvenido al Portal IT!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Panel de control para <b>{user?.role === 'admin' ? 'Administrador' : user?.role === 'soporte' ? 'Soporte Técnico' : 'Usuario'}</b>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Última actualización
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        {new Date().toLocaleString()}
                    </p>
                    {user?.role === 'admin' && (
                        <button
                            onClick={async () => {
                                if (window.confirm('¿Estás seguro de que quieres limpiar la base de datos y poblar con datos genéricos? Esta acción preservará los usuarios administradores existentes.')) {
                                    try {
                                        const response = await api.post('/dashboard/seed-data');
                                        alert('Base de datos poblada exitosamente:\n' + 
                                              `- ${response.data.details.usuarios} usuarios creados\n` +
                                              `- ${response.data.details.activos} activos creados\n` +
                                              `- ${response.data.details.asignaciones} asignaciones creadas\n` +
                                              `- ${response.data.details.tickets} tickets de ejemplo\n` +
                                              `- ${response.data.details.actas} actas de ejemplo\n` +
                                              `- Usuarios admin preservados: ${response.data.details.admins}`);
                                        window.location.reload();
                                    } catch (error) {
                                        console.error('Error al poblar la base de datos:', error);
                                        alert('Error al poblar la base de datos: ' + (error.response?.data?.message || error.message));
                                    }
                                }
                            }}
                            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                            title="Limpiar BD y poblar con datos genéricos (preserva admins)"
                        >
                            🔄 Poblar BD Genérica
                        </button>
                    )}
                </div>
            </div>

            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {mainStats.map((s) => (
                    <Card key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} />
                ))}
            </div>

            {/* Estadísticas secundarias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {secondaryStats.map((s) => (
                    <Card key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} />
                ))}
            </div>

            {/* Gráficas y listas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfica dinámica */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <currentChart.icon className={`w-5 h-5 mr-2 text-${currentChart.color}-600 dark:text-${currentChart.color}-400`} />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {currentChart.title}
                            </h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handleChartChange('prev')}
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-500" />
                            </button>
                            <div className="flex space-x-1">
                                {chartConfigs.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors ${
                                            index === currentChartIndex 
                                                ? 'bg-blue-500' 
                                                : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => handleChartChange('next')}
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {currentChart.description}
                    </p>
                    <div className="w-full h-64">
                        <SimpleChart data={currentChart.data} />
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Cambia automáticamente cada 10 segundos • {currentChartIndex + 1} de {chartConfigs.length}
                        </p>
                    </div>
                </div>

                {/* Últimos tickets */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Últimos Tickets
                    </h2>
                    <div className="space-y-3">
                        {data.ultimosTickets && data.ultimosTickets.length > 0 ? (
                            data.ultimosTickets.map((ticket, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            #{ticket.id} - {ticket.titulo}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {ticket.solicitante} • {ticket.prioridad}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            ticket.estado === 'Pendiente' ? 'bg-orange-100 text-orange-800' :
                                            ticket.estado === 'En Proceso' ? 'bg-blue-100 text-blue-800' :
                                            ticket.estado === 'Resuelto' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {ticket.estado}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(ticket.fecha).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                No hay tickets recientes
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Secciones específicas por rol */}
            {user?.role === 'admin' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Últimas actividades */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                            <Activity className="w-5 h-5 mr-2" />
                            Últimas Actividades del Sistema
                        </h2>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {data.ultimasActividades && data.ultimasActividades.length > 0 ? (
                                data.ultimasActividades.map((actividad, i) => (
                                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {actividad.usuario}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {actividad.accion} - {actividad.descripcion}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(actividad.fecha).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                    No hay actividades recientes
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Estadísticas por empresa */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                            <Building className="w-5 h-5 mr-2" />
                            Usuarios por Empresa
                        </h2>
                        <div className="space-y-3">
                            {data.estadisticasEmpresas && data.estadisticasEmpresas.length > 0 ? (
                                data.estadisticasEmpresas.map((empresa, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {empresa.empresa}
                                        </span>
                                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                            {empresa.cantidad}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                    No hay datos de empresas
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {user?.role === 'soporte' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tickets asignados al soporte */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Mis Tickets Asignados
                        </h2>
                        <div className="space-y-3">
                            {data.ticketsAsignados && data.ticketsAsignados.length > 0 ? (
                                data.ticketsAsignados.map((ticket, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                #{ticket.id} - {ticket.titulo}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Prioridad: {ticket.prioridad}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                ticket.estado === 'Pendiente' ? 'bg-orange-100 text-orange-800' :
                                                ticket.estado === 'En Proceso' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {ticket.estado}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(ticket.fecha).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                    No tienes tickets asignados
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Activos con problemas */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            Activos con Problemas
                        </h2>
                        <div className="space-y-3">
                            {data.activosConProblemas && data.activosConProblemas.length > 0 ? (
                                data.activosConProblemas.map((activo, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {activo.codigo}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {activo.categoria}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                                {activo.ticketsAbiertos} tickets
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                    No hay activos con problemas reportados
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Activos próximos a mantenimiento */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Activos Próximos a Mantenimiento
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.activosProxMantenimiento && data.activosProxMantenimiento.length > 0 ? (
                        data.activosProxMantenimiento.map((activo, i) => (
                            <div key={i} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {activo.codigo}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {activo.categoria}
                                </p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                                    {activo.diasDesdeCreacion} días desde creación
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4 col-span-full">
                            No hay activos próximos a mantenimiento
                        </p>
                    )}
                </div>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Acciones Rápidas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <a
                        href="/activos"
                        className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                        <HardDrive className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-gray-900 dark:text-white">Gestionar Activos</span>
                    </a>
                    <a
                        href="/tickets"
                        className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                    >
                        <MessageSquare className="w-5 h-5 mr-3 text-orange-600 dark:text-orange-400" />
                        <span className="font-medium text-gray-900 dark:text-white">Ver Tickets</span>
                    </a>
                    <a
                        href="/usuarios"
                        className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                        <Users className="w-5 h-5 mr-3 text-purple-600 dark:text-purple-400" />
                        <span className="font-medium text-gray-900 dark:text-white">Gestionar Usuarios</span>
                    </a>
                    <a
                        href="/gestion-actas"
                        className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                        <FileText className="w-5 h-5 mr-3 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-gray-900 dark:text-white">Gestionar Actas</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
