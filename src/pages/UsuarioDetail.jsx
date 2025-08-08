// src/pages/UsuarioDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, MapPin, Building, Users, FileText, Ticket, HardDrive, Calendar, ArrowLeft, Edit, Phone, IdCard } from 'lucide-react';
import api from '../services/api';

export default function UsuarioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [activosAsignados, setActivosAsignados] = useState([]);
  const [ticketsUsuario, setTicketsUsuario] = useState([]);
  const [actasUsuario, setActasUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const cargarDatosUsuario = async () => {
      try {
        setLoading(true);

        // Cargar datos básicos del usuario
        const { data: userData } = await api.get(`/usuarios/${id}`);
        setUsuario(userData);

        // Cargar activos asignados
        try {
          const { data: activosData } = await api.get(`/activos/usuarios/${encodeURIComponent(userData.email)}/activos`);
          setActivosAsignados(activosData);
        } catch (error) {
          console.log('No se pudieron cargar los activos asignados');
        }

        // Cargar tickets del usuario
        try {
          const { data: ticketsData } = await api.get(`/tickets/usuario/${userData.email}`);
          setTicketsUsuario(ticketsData);
        } catch (error) {
          console.log('No se pudieron cargar los tickets del usuario');
        }

        // Cargar actas del usuario
        try {
          const { data: actasData } = await api.get(`/actas/usuario/${userData.email}`);
          setActasUsuario(actasData);
        } catch (error) {
          console.log('No se pudieron cargar las actas del usuario');
        }

      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatosUsuario();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="p-6">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Usuario no encontrado</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">El usuario que buscas no existe o ha sido eliminado.</p>
        </div>
      </div>
    );
  }

  const getInitials = (nombre, apellido) => {
    if (nombre && apellido) {
      return `${nombre[0]}${apellido[0]}`.toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'activo':
      case 'asignado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'inactivo':
      case 'cerrado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/usuarios')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {getInitials(usuario.nombre, usuario.apellido)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {usuario.nombre} {usuario.apellido}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">{usuario.email}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(`/usuarios/${id}/editar`)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Edit className="h-4 w-4" />
          <span>Editar perfil</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'info', label: 'Información', icon: User },
            { id: 'activos', label: 'Activos', icon: HardDrive, count: activosAsignados.length },
            { id: 'tickets', label: 'Tickets', icon: Ticket, count: ticketsUsuario.length },
            { id: 'actas', label: 'Actas', icon: FileText, count: actasUsuario.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Personal */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Información Personal
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <IdCard className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">RUT</p>
                    <p className="font-medium text-gray-900 dark:text-white">{usuario.rut}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Correo Electrónico</p>
                    <p className="font-medium text-gray-900 dark:text-white">{usuario.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Teléfono</p>
                    <p className="font-medium text-gray-900 dark:text-white">{usuario.telefono || 'No especificado'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Laboral */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Información Laboral
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Empresa</p>
                    <p className="font-medium text-gray-900 dark:text-white">{usuario.empresa}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Departamento</p>
                    <p className="font-medium text-gray-900 dark:text-white">{usuario.departamento}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ubicación</p>
                    <p className="font-medium text-gray-900 dark:text-white">{usuario.ubicacion || 'No especificada'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activos' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <HardDrive className="h-5 w-5 mr-2 text-blue-600" />
                Activos Asignados ({activosAsignados.length})
              </h3>
            </div>
            <div className="p-6">
              {activosAsignados.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activosAsignados.map((activo) => (
                    <div
                      key={activo.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/activos/${activo.codigo}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{activo.codigo}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activo.estado)}`}>
                          {activo.estado}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{activo.nombreEquipo}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{activo.categoria}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <HardDrive className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Sin activos asignados</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Este usuario no tiene activos asignados actualmente.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Ticket className="h-5 w-5 mr-2 text-blue-600" />
                Tickets del Usuario ({ticketsUsuario.length})
              </h3>
            </div>
            <div className="p-6">
              {ticketsUsuario.length > 0 ? (
                <div className="space-y-4">
                  {ticketsUsuario.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">#{ticket.id} - {ticket.titulo}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.estado)}`}>
                          {ticket.estado}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ticket.descripcion}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                        <span>{ticket.categoria}</span>
                        <span>{formatDate(ticket.fechaCreacion)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Sin tickets</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Este usuario no tiene tickets registrados.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'actas' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Actas del Usuario ({actasUsuario.length})
              </h3>
            </div>
            <div className="p-6">
              {actasUsuario.length > 0 ? (
                <div className="space-y-4">
                  {actasUsuario.map((acta) => (
                    <div
                      key={acta.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/actas/previsualizar-firmado/${acta.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{acta.titulo}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(acta.estado)}`}>
                          {acta.estado}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{acta.descripcion}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                        <span>{acta.tipo}</span>
                        <span>{formatDate(acta.fechaCreacion)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Sin actas</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Este usuario no tiene actas registradas.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
