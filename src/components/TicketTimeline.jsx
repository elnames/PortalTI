import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function TicketTimeline({ ticket, onAddActualizacion, onActualizacionEliminada }) {
  const { user } = useAuth();
  const [comentarios, setComentarios] = React.useState([]);

  // Estados del ticket con colores originales
  const estados = React.useMemo(() => [
    { nombre: 'Pendiente', color: 'bg-yellow-500', descripcion: 'Ticket creado y esperando asignación' },
    { nombre: 'Asignado', color: 'bg-blue-500', descripcion: 'Ticket asignado a un técnico' },
    { nombre: 'En Proceso', color: 'bg-orange-500', descripcion: 'Trabajando en la resolución' },
    { nombre: 'Resuelto', color: 'bg-green-500', descripcion: 'Problema resuelto' },
    { nombre: 'Cerrado', color: 'bg-gray-500', descripcion: 'Ticket cerrado' }
  ], []);

  // Función para obtener el estado actual del ticket
  const getEstadoActual = React.useCallback(() => {
    const index = estados.findIndex(e => e.nombre === ticket.estado);
    return index >= 0 ? index : 0;
  }, [ticket.estado, estados]);

  // Función para determinar el tipo de actualización
  const getTipoActualizacion = React.useCallback((comentario) => {
    const contenido = (comentario.contenido || '').toLowerCase();
    if (contenido.includes('asignado') || contenido.includes('reasignado') || contenido.includes('reassigned')) {
      return 'asignacion';
    }
    return 'actualizacion';
  }, []);

  // Función para determinar el estado donde se creó la actualización
  const getEstadoCreacion = React.useCallback((comentario) => {
    const estados = ['Pendiente', 'Asignado', 'En Proceso', 'Resuelto', 'Cerrado'];

    // Si el comentario tiene el campo estadoCreacion, usarlo
    if (comentario.estadoCreacion) {
      const index = estados.indexOf(comentario.estadoCreacion);
      return index >= 0 ? index : 0;
    }

    // Para comentarios antiguos sin estadoCreacion, usar una estrategia basada en el contenido
    const tipo = getTipoActualizacion(comentario);

    if (tipo === 'asignacion') {
      // Las asignaciones siempre van entre "Asignado" y "En Proceso"
      return 1;
    }

    // Para actualizaciones normales, usar el estado "En Proceso" como aproximación
    // ya que la mayoría de actualizaciones se crean durante el proceso de resolución
    return 2; // Índice del estado "En Proceso"
  }, [getTipoActualizacion]);

  // Función para determinar en qué posición mostrar la actualización
  const getPosicionActualizacion = React.useCallback((comentario) => {
    const tipo = getTipoActualizacion(comentario);

    if (tipo === 'asignacion') {
      // Las asignaciones SIEMPRE se muestran entre "Asignado" y "En Proceso"
      // Solo las reasignaciones durante "En Proceso" se muestran entre "En Proceso" y "Resuelto"
      const esReasignacion = comentario.contenido.includes('reasignado') || comentario.contenido.includes('reassigned');
      const estadoActual = getEstadoActual();

      if (estadoActual >= 2 && esReasignacion) { // Si está en "En Proceso" o posterior Y es reasignación
        return 2; // Índice del estado "En Proceso" (entre "En Proceso" y "Resuelto")
      } else {
        return 1; // Índice del estado "Asignado" (entre "Asignado" y "En Proceso")
      }
    } else {
      // Las actualizaciones se muestran en el estado donde fueron creadas
      // No se mueven con el cambio de estado
      const estadoCreacion = getEstadoCreacion(comentario);
      return estadoCreacion;
    }
  }, [getTipoActualizacion, getEstadoActual, getEstadoCreacion]);

  // Cargar comentarios del ticket
  React.useEffect(() => {
    const cargarComentarios = async () => {
      if (!ticket?.id) return;

      try {
        const response = await api.get(`/tickets/${ticket.id}/comentarios`);
        setComentarios(response.data);
      } catch (error) {
        console.error('Error al cargar comentarios:', error);
      }
    };

    cargarComentarios();
  }, [ticket?.id]);

  // Agrupar actualizaciones por posición
  const actualizacionesPorPosicion = React.useMemo(() => {
    const grupos = {};

    comentarios.forEach(comentario => {
      // Solo mostrar comentarios NO internos en el timeline
      if (!comentario.esInterno) {
        const posicion = getPosicionActualizacion(comentario);
        if (!grupos[posicion]) {
          grupos[posicion] = [];
        }
        grupos[posicion].push(comentario);
      }
    });

    return grupos;
  }, [comentarios, getPosicionActualizacion]);

  // Función para eliminar actualización
  const eliminarActualizacion = async (comentarioId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta actualización?')) {
      return;
    }

    try {
      await api.delete(`/tickets/${ticket.id}/comentarios/${comentarioId}`);
      if (onActualizacionEliminada) {
        onActualizacionEliminada();
      }
    } catch (error) {
      console.error('Error al eliminar actualización:', error);
      alert('Error al eliminar la actualización');
    }
  };

  // Si no hay ticket, no renderizar nada
  if (!ticket) {
    return null;
  }

  // Función para renderizar actualizaciones en una posición específica
  const renderActualizacionesEnPosicion = (posicion) => {
    const actualizaciones = actualizacionesPorPosicion[posicion] || [];

    if (actualizaciones.length === 0) return null;

    return (
      <div className="ml-4 space-y-4">
        {actualizaciones.map((actualizacion, updateIndex) => {
          const tipo = getTipoActualizacion(actualizacion);
          const esAsignacion = tipo === 'asignacion';

          return (
            <div key={`actualizacion-${posicion}-${updateIndex}`} className="relative flex items-start">
              {/* Punto de actualización */}
              <div className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 ${esAsignacion
                ? 'bg-purple-500 border-white dark:border-gray-800'
                : 'bg-blue-500 border-white dark:border-gray-800'
                }`}>
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 6v6m0 0v6m0-6h6m-6 0H6" clipRule="evenodd" />
                </svg>
              </div>

              {/* Contenido de la actualización */}
              <div className="ml-4 flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className={`text-sm font-medium ${esAsignacion
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-blue-700 dark:text-blue-300'
                    }`}>
                    {esAsignacion ? 'Asignación' : 'Actualización'}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${esAsignacion
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                    }`}>
                    {actualizacion.creadoPor?.username || 'Soporte'}
                  </span>
                </div>
                <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                  {actualizacion.contenido}
                </p>

                {/* Evidencia de la actualización */}
                {actualizacion.evidencia && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Evidencia:</span>
                      <button
                        onClick={() => window.open(actualizacion.evidencia, '_blank')}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                      >
                        Ver imagen
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = actualizacion.evidencia;
                          link.download = `evidencia-${actualizacion.id}`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-xs"
                      >
                        Descargar
                      </button>
                    </div>
                    <img
                      src={actualizacion.evidencia}
                      alt="Evidencia"
                      className="max-w-xs rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(actualizacion.evidencia, '_blank')}
                    />
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {actualizacion.fechaCreacion && (
                      <span>{esAsignacion ? 'Asignado' : 'Actualizado'}: {new Date(actualizacion.fechaCreacion).toLocaleString('es-ES')}</span>
                    )}
                  </div>
                  {(user?.id === actualizacion.creadoPor?.id || user?.role === 'admin') && (
                    <button
                      onClick={() => eliminarActualizacion(actualizacion.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs ml-2"
                      title="Eliminar actualización"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Función para renderizar el botón de agregar actualización
  const renderAddButton = (index) => {
    const estadoActual = getEstadoActual();
    const esEstadoActual = index === estadoActual;
    const puedeAgregarActualizacion = ticket.estado === 'En Proceso' || ticket.estado === 'Asignado';
    const esAdminOSoporte = user?.role === 'admin' || user?.role === 'soporte';

    if (esEstadoActual && puedeAgregarActualizacion && onAddActualizacion && esAdminOSoporte) {
      return (
        <div className="ml-4 space-y-4">
          {/* Mostrar actualizaciones existentes */}
          {renderActualizacionesEnPosicion(index)}

          {/* Botón de agregar actualización */}
          <div className="relative flex items-start">
            <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 bg-blue-500 border-white dark:border-gray-800 cursor-pointer hover:bg-blue-600 transition-colors">
              <Plus className="w-3 h-3 text-white" />
            </div>
            <div className="ml-4 flex-1">
              <button
                onClick={onAddActualizacion}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Agregar actualización
              </button>
            </div>
          </div>
        </div>
      );
    }

    return renderActualizacionesEnPosicion(index);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Progreso del Ticket</h2>

      <div className="relative">
        {/* Línea de conexión */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>

        <div className="space-y-6">
          {estados.map((estado, index) => {
            const completado = index <= getEstadoActual();
            const actual = index === getEstadoActual();

            return (
              <React.Fragment key={`${estado.nombre}-${index}`}>
                <div className="relative flex items-start">
                  {/* Punto de estado */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${completado
                    ? `${estado.color} border-white dark:border-gray-800`
                    : 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500'
                    }`}>
                    {completado && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  {/* Contenido del estado */}
                  <div className="ml-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-sm font-medium ${completado
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                        }`}>
                        {estado.nombre}
                      </h3>
                      {actual && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full">
                          Actual
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${completado
                      ? 'text-gray-600 dark:text-gray-300'
                      : 'text-gray-400 dark:text-gray-500'
                      }`}>
                      {estado.descripcion}
                    </p>

                    {/* Fechas específicas si están disponibles */}
                    {completado && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {estado.nombre === 'Pendiente' && ticket.fechaCreacion && (
                          <span>Creado: {new Date(ticket.fechaCreacion).toLocaleString('es-ES')}</span>
                        )}
                        {estado.nombre === 'Asignado' && ticket.fechaAsignacion && (
                          <span>Asignado: {new Date(ticket.fechaAsignacion).toLocaleString('es-ES')}</span>
                        )}
                        {estado.nombre === 'Resuelto' && ticket.fechaResolucion && (
                          <span>Resuelto: {new Date(ticket.fechaResolucion).toLocaleString('es-ES')}</span>
                        )}
                        {estado.nombre === 'Cerrado' && ticket.fechaCierre && (
                          <span>Cerrado: {new Date(ticket.fechaCierre).toLocaleString('es-ES')}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón de agregar actualización */}
                {renderAddButton(index)}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
} 