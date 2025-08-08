import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import MisTickets from '../components/MisTickets';

export default function Tickets() {
  const { user, token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState(null);
  const [usuariosSoporte, setUsuariosSoporte] = useState([]);
  const [filtros, setFiltros] = useState({
    estado: '',
    prioridad: '',
    categoria: '',
    asignadoAId: ''
  });

  // Debug: Verificar autenticación
  useEffect(() => {
    console.log('=== DEBUG AUTH ===');
    console.log('User:', user);
    console.log('Token:', token ? 'Presente' : 'Ausente');
    console.log('User Role:', user?.role);
    console.log('==================');
  }, [user, token]);

  const cargarTickets = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Cargando tickets...');
      console.log('Token en localStorage:', localStorage.getItem('token'));

      const response = await api.get('/tickets', {
        params: filtros
      });

      console.log('Tickets cargados:', response.data);
      setTickets(response.data);
    } catch (error) {
      console.error('Error al cargar tickets:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const cargarEstadisticas = useCallback(async () => {
    try {
      const response = await api.get('/tickets/estadisticas');
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }, []);

  const cargarUsuariosSoporte = useCallback(async () => {
    try {
      const response = await api.get('/tickets/soporte/usuarios');
      setUsuariosSoporte(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios de soporte:', error);
    }
  }, []);

  useEffect(() => {
    cargarTickets();
    if (user?.role?.toLowerCase() === 'admin') {
      cargarEstadisticas();
      cargarUsuariosSoporte();
    }
  }, [cargarTickets, cargarEstadisticas, cargarUsuariosSoporte, user]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Funciones de color para estados y prioridades (comentadas por ahora)
  // const getEstadoColor = (estado) => {
  //   const colores = {
  //     'Pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  //     'Asignado': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  //     'En Proceso': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  //     'Resuelto': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  //     'Cerrado': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  //   };
  //   return colores[estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  // };

  // const getPrioridadColor = (prioridad) => {
  //   const colores = {
  //     'Baja': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  //     'Media': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  //     'Alta': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  //     'Crítica': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
  //   };
  //   return colores[prioridad] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  // };

  // Definir columnas usando la estructura correcta de @tanstack/react-table
  // const columns = [
  //   { accessorKey: 'id', header: 'ID' },
  //   { accessorKey: 'titulo', header: 'Título' },
  //   { accessorKey: 'empresa', header: 'Empresa', cell: ({ getValue }) => getValue() || '—' },
  //   { accessorKey: 'estado', header: 'Estado' },
  // ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  // Filtros y helpers ya definidos arriba

  // Tabla de Tickets estilizada con todas las columnas y filtros
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Tickets</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Administra y da seguimiento a los tickets de soporte</p>
        </div>
        <div className="flex space-x-2">
          <a
            href={user?.role === 'admin' || user?.role === 'soporte' ? '/crear-ticket-admin' : '/crear-ticket'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nuevo Ticket
          </a>
        </div>
      </div>

      {/* Módulo Mis Tickets para rol de soporte */}
      {user?.role?.toLowerCase() === 'soporte' && (
        <MisTickets />
      )}

      {/* Título de la tabla */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Todos los Tickets</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Lista completa de los últimos tickets en el sistema</p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
            <select
              value={filtros.categoria}
              onChange={(e) => handleFiltroChange('categoria', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todas</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Red">Red</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
          {user?.role?.toLowerCase() === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asignado a</label>
              <select
                value={filtros.asignadoAId}
                onChange={(e) => handleFiltroChange('asignadoAId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos</option>
                {usuariosSoporte.map(soporte => (
                  <option key={soporte.id} value={soporte.id}>{soporte.username}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>


      {/* Estadísticas (solo para Admin) */}
      {user?.role?.toLowerCase() === 'admin' && estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{estadisticas.totalTickets}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{estadisticas.porEstado?.find(e => e.estado === 'Pendiente')?.cantidad || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pendientes</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{estadisticas.porEstado?.find(e => e.estado === 'En Proceso')?.cantidad || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Proceso</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{estadisticas.porEstado?.find(e => e.estado === 'Resuelto')?.cantidad || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Resueltos</div>
          </div>
        </div>
      )}

      {/* Tabla de Tickets estilizada */}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Título</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Solicitante</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Empresa</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Categoría</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Prioridad</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Asignado a</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Fecha</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {tickets.map((ticket, index) => (
              <tr
                key={`${ticket.id}-${index}`}
                className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition cursor-pointer"
                onClick={() => window.location.href = `/tickets/${ticket.id}`}
              >
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ticket.id}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ticket.titulo}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ticket.nombreSolicitante || '—'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ticket.empresa || '—'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ticket.categoria || '—'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span className={
                    ticket.prioridad === 'Baja' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium' :
                      ticket.prioridad === 'Media' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 px-2 py-1 rounded-full text-xs font-medium' :
                        ticket.prioridad === 'Alta' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 px-2 py-1 rounded-full text-xs font-medium' :
                          ticket.prioridad === 'Crítica' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium'
                  }>
                    {ticket.prioridad}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span className={
                    ticket.estado === 'Pendiente' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium' :
                      ticket.estado === 'Asignado' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium' :
                        ticket.estado === 'En Proceso' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 px-2 py-1 rounded-full text-xs font-medium' :
                          ticket.estado === 'Resuelto' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium'
                  }>
                    {ticket.estado}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ticket.asignadoA?.username || 'Sin asignar'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ticket.fechaCreacion ? new Date(ticket.fechaCreacion).toLocaleDateString('es-ES') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
