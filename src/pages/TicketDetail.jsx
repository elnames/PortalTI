import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import api from '../services/api';
import TicketTimeline from '../components/TicketTimeline';
import ChatInternoModal from '../components/ChatInternoModal';
import ActualizacionModal from '../components/ActualizacionModal';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifyTicketUpdated, notifyTicketAssigned, alertSuccess, alertError } = useNotificationContext();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usuariosSoporte, setUsuariosSoporte] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [esInterno, setEsInterno] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [alerta, setAlerta] = useState(null); // { tipo: 'success'|'error', mensaje: string }
  const [showChatInterno, setShowChatInterno] = useState(false);
  const [showActualizacion, setShowActualizacion] = useState(false);
  const [activosUsuario, setActivosUsuario] = useState([]);
  const [activoSeleccionado, setActivoSeleccionado] = useState('');
  const [activoRelacionado, setActivoRelacionado] = useState(null);

  const estados = ['Pendiente', 'Asignado', 'En Proceso', 'Resuelto', 'Cerrado'];

  const cargarTicket = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data);
      setNuevoEstado(response.data.estado);

      // Establecer el activo relacionado si existe
      if (response.data.activo) {
        setActivoRelacionado(response.data.activo);
        setActivoSeleccionado(response.data.activo.id.toString());
      } else {
        setActivoRelacionado(null);
        setActivoSeleccionado('');
      }
    } catch (error) {
      const errorMsg = 'No se pudo cargar el ticket.';
      setAlerta({ tipo: 'error', mensaje: errorMsg });
      alertError(errorMsg);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id, alertError]);

  const cargarUsuariosSoporte = useCallback(async () => {
    try {
      const response = await api.get('/tickets/soporte/usuarios');
      setUsuariosSoporte(response.data);
    } catch (error) {
      const errorMsg = 'No se pudo cargar la lista de soporte.';
      setAlerta({ tipo: 'error', mensaje: errorMsg });
      alertError(errorMsg);
    }
  }, [alertError]);

  const cargarActivosUsuario = useCallback(async () => {
    try {
      if (!ticket?.emailSolicitante) {
        console.log('No hay email del solicitante disponible');
        return;
      }

      console.log('Cargando activos para email:', ticket.emailSolicitante);
      // Cargar activos asignados al usuario que creó el ticket
      const emailEncoded = encodeURIComponent(ticket.emailSolicitante);
      console.log('Email codificado:', emailEncoded);
      const response = await api.get(`/activos/usuarios/${emailEncoded}/activos`);
      console.log('Activos cargados:', response.data);
      setActivosUsuario(response.data);
    } catch (error) {
      console.error('Error al cargar los activos del usuario:', error);
    }
  }, [ticket?.emailSolicitante]);

  const marcarActivoEnMantenimiento = async (activoId, nuevoEstado) => {
    try {
      await api.put(`/activos/${activoId}/estado`, { estado: nuevoEstado });
      await cargarActivosUsuario();
      const successMsg = `Activo marcado como "${nuevoEstado}"`;
      setAlerta({ tipo: 'success', mensaje: successMsg });
      alertSuccess(successMsg);
      setActivoSeleccionado(''); // Limpiar selección después de actualizar
    } catch (error) {
      const errorMsg = 'Error al actualizar el estado del activo';
      setAlerta({ tipo: 'error', mensaje: errorMsg });
      alertError(errorMsg);
    }
  };

  useEffect(() => {
    cargarTicket();
    if (user?.role?.toLowerCase() === 'admin') {
      cargarUsuariosSoporte();
    }
  }, [id, user?.role]);

  // Cargar activos cuando el ticket esté disponible
  useEffect(() => {
    if (ticket?.emailSolicitante) {
      cargarActivosUsuario();
    }
  }, [ticket?.emailSolicitante]);

  const asignarTicket = async (soporteId) => {
    try {
      await api.put(`/tickets/${id}/asignar`, { soporteId });
      const successMsg = 'Ticket asignado correctamente.';
      setAlerta({ tipo: 'success', mensaje: successMsg });
      alertSuccess(successMsg);

      // Notificar a otros roles sobre la asignación del ticket
      if (soporteId && soporteId !== 0) {
        // Buscar información del soporte asignado
        const soporteAsignado = usuariosSoporte.find(s => s.id === soporteId);
        if (soporteAsignado) {
          notifyTicketAssigned(ticket, soporteAsignado);
        }
      }

      cargarTicket();
    } catch (error) {
      const errorMsg = 'Error al asignar ticket.';
      setAlerta({ tipo: 'error', mensaje: errorMsg });
      alertError(errorMsg);
    }
  };

  const cambiarEstado = async () => {
    try {
      await api.put(`/tickets/${id}/estado`, { estado: nuevoEstado });
      const successMsg = 'Estado actualizado.';
      setAlerta({ tipo: 'success', mensaje: successMsg });
      alertSuccess(successMsg);
      notifyTicketUpdated(ticket);
      cargarTicket();
    } catch (error) {
      const errorMsg = 'Error al cambiar estado.';
      setAlerta({ tipo: 'error', mensaje: errorMsg });
      alertError(errorMsg);
    }
  };



  const getEstadoColor = (estado) => {
    const colores = {
      'Pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      'Asignado': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'En Proceso': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      'Resuelto': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
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

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ticket no encontrado</h2>
          <button
            onClick={() => navigate('/tickets')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Ticket #{ticket.id}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{ticket.titulo || '—'}</p>
        </div>
        <button
          onClick={() => navigate('/tickets')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Volver
        </button>
      </div>

      {/* Alerta visual */}
      {alerta && (
        <div className={`rounded p-3 mb-4 ${alerta.tipo === 'success'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}>
          {alerta.mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Ticket */}
        <div className="lg:col-span-2 space-y-6">
          {/* Línea de tiempo del estado */}
          {ticket && (
            <div className="relative">
              <TicketTimeline
                ticket={ticket}
                onAddActualizacion={() => setShowActualizacion(true)}
                onActualizacionEliminada={cargarTicket}
              />
              {/* Icono de chat para todos los usuarios */}
              <button
                onClick={() => setShowChatInterno(true)}
                className="absolute top-2 right-2 p-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                title="Chat con Soporte"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>
          )}

          {/* Detalles del Ticket */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Detalles del Ticket</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">{ticket.descripcion || '—'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Solicitante</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{ticket.nombreSolicitante || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{ticket.emailSolicitante || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{ticket.telefonoSolicitante || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{ticket.empresa || '—'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{ticket.categoria || '—'}</p>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estado y Acciones */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Estado y Acciones</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado Actual</label>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(ticket.estado)}`}>{ticket.estado}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prioridad</label>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPrioridadColor(ticket.prioridad)}`}>{ticket.prioridad}</span>
              </div>
              {/* Cambio de estado: admin o soporte asignado */}
              {(user?.role?.toLowerCase() === 'admin' || (user?.role?.toLowerCase() === 'soporte' && ticket.asignadoA?.id === user.id)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cambiar Estado</label>
                  <div className="flex space-x-2">
                    <select
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {estados.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                    <button
                      onClick={cambiarEstado}
                      disabled={nuevoEstado === ticket.estado}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Actualizar
                    </button>
                  </div>
                </div>
              )}
              {/* Asignación/Reasignación para admin */}
              {user?.role?.toLowerCase() === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asignar/Reasignar a Soporte</label>
                  <select
                    onChange={(e) => {
                      const value = e.target.value;
                      asignarTicket(value === "" ? 0 : parseInt(value));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={ticket.asignadoA?.id || ''}
                  >
                    <option value="">Sin asignar</option>
                    {usuariosSoporte.map(soporte => (
                      <option key={soporte.id} value={soporte.id}>{soporte.username}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Autoasignación para soporte */}
              {user?.role?.toLowerCase() === 'soporte' && ticket.estado === 'Pendiente' && !ticket.asignadoA && (
                <div>
                  <button
                    onClick={() => asignarTicket(user.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Autoasignarme este ticket
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Información del Asignado */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Asignación</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asignado a</label>
                <p className="mt-1 text-gray-900 dark:text-white">{ticket.asignadoA?.username || 'Sin asignar'}</p>
              </div>
              {ticket.fechaAsignacion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de asignación</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{new Date(ticket.fechaAsignacion).toLocaleString('es-ES')}</p>
                </div>
              )}
            </div>
          </div>
          {/* Fechas */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Fechas</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Creado</label>
                <p className="mt-1 text-gray-900 dark:text-white">{ticket.fechaCreacion ? new Date(ticket.fechaCreacion).toLocaleString('es-ES') : '—'}</p>
              </div>
              {ticket.fechaResolucion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resuelto</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{new Date(ticket.fechaResolucion).toLocaleString('es-ES')}</p>
                </div>
              )}
              {ticket.fechaCierre && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cerrado</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{new Date(ticket.fechaCierre).toLocaleString('es-ES')}</p>
                </div>
              )}
            </div>
          </div>
          {/* Activos Relacionados */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Activos Relacionados</h2>
            <div className="space-y-4">
              {/* Mostrar activo relacionado si existe */}
              {activoRelacionado && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Activo Relacionado al Ticket
                  </h3>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p><strong>Código:</strong> {activoRelacionado.codigo}</p>
                    <p><strong>Equipo:</strong> {activoRelacionado.nombreEquipo}</p>
                    <p><strong>Categoría:</strong> {activoRelacionado.categoria}</p>
                    <p><strong>Estado:</strong> {activoRelacionado.estado}</p>
                    {activoRelacionado.marca && activoRelacionado.modelo && (
                      <p><strong>Marca/Modelo:</strong> {activoRelacionado.marca} {activoRelacionado.modelo}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Solo admin/soporte pueden seleccionar activos */}
              {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'soporte') ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seleccionar Activo del Usuario Afectado
                  </label>
                  <div className="space-y-3">
                    <select
                      value={activoSeleccionado}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      onChange={(e) => {
                        const activoId = e.target.value;
                        setActivoSeleccionado(activoId);
                      }}
                    >
                      <option value="">Seleccionar activo del usuario...</option>
                      {activosUsuario.map((activo) => (
                        <option key={activo.id} value={activo.id}>
                          {activo.codigo} - {activo.categoria} ({activo.estado})
                        </option>
                      ))}
                    </select>

                    {/* Selector de estado del activo */}
                    {activoSeleccionado && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cambiar Estado del Activo
                        </label>
                        <div className="flex space-x-2">
                          <select
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            onChange={(e) => {
                              const nuevoEstado = e.target.value;
                              if (nuevoEstado) {
                                marcarActivoEnMantenimiento(activoSeleccionado, nuevoEstado);
                              }
                            }}
                          >
                            <option value="">Seleccionar estado...</option>
                            <option value="En Mantenimiento">En Mantenimiento</option>
                            <option value="Retirado">Retirado</option>
                            <option value="Operativo">Operativo</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Selecciona el activo del usuario que está causando el problema y su nuevo estado
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Solo el administrador o soporte puede gestionar los activos relacionados con este ticket.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-600 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">En Mantenimiento</h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300">
                    El activo está siendo reparado o mantenido
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 dark:text-red-200">Retirado</h3>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    El activo ha sido retirado del servicio
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-600 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 dark:text-green-200">Operativo</h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    El activo está funcionando correctamente
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ChatInternoModal
        isOpen={showChatInterno}
        onClose={() => setShowChatInterno(false)}
        ticket={ticket}
      />

      <ActualizacionModal
        isOpen={showActualizacion}
        onClose={() => setShowActualizacion(false)}
        ticketId={id}
        onActualizacionAgregada={() => {
          cargarTicket();
          setShowActualizacion(false);
        }}
      />
    </div>
  );
} 