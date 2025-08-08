import React from 'react';

const ActivosAsignadosModal = ({ isOpen, onClose, usuario, activosAsignados }) => {
  if (!isOpen || !activosAsignados || activosAsignados.length === 0) return null;

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'disponible':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'asignado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'en mantenimiento':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'retirado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getCategoriaIcon = (categoria) => {
    switch (categoria?.toLowerCase()) {
      case 'equipos':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'móviles':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'monitores':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
    }
  };

  const parseDiscos = (discosJson) => {
    if (!discosJson) return [];
    try {
      return JSON.parse(discosJson);
    } catch {
      return [];
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={(e) => {
        e.stopPropagation();
        onClose(); // Cerrar modal al hacer clic en el fondo
      }}
    >
      <div
        className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Activos de {usuario?.nombre} {usuario?.apellido}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activosAsignados.length} activo{activosAsignados.length !== 1 ? 's' : ''} asignado{activosAsignados.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lista de activos */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activosAsignados.map((activo, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                {/* Header del activo */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      {getCategoriaIcon(activo.categoria)}
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        {activo.nombreEquipo || activo.codigo}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activo.categoria}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(activo.estado)}`}>
                    {activo.estado}
                  </span>
                </div>

                {/* Información del activo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Información General
                    </h5>
                    <div className="space-y-1">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Código:</span>
                        <p className="text-sm text-gray-900 dark:text-white">{activo.codigo}</p>
                      </div>
                      {activo.ubicacion && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Ubicación:</span>
                          <p className="text-sm text-gray-900 dark:text-white">{activo.ubicacion}</p>
                        </div>
                      )}
                      {activo.marca && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Marca:</span>
                          <p className="text-sm text-gray-900 dark:text-white">{activo.marca}</p>
                        </div>
                      )}
                      {activo.modelo && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Modelo:</span>
                          <p className="text-sm text-gray-900 dark:text-white">{activo.modelo}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Especificaciones
                    </h5>
                    <div className="space-y-1">
                      {activo.procesador && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Procesador:</span>
                          <p className="text-sm text-gray-900 dark:text-white">{activo.procesador}</p>
                        </div>
                      )}
                      {activo.ram && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">RAM:</span>
                          <p className="text-sm text-gray-900 dark:text-white">{activo.ram}</p>
                        </div>
                      )}
                      {activo.sistemaOperativo && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Sistema Operativo:</span>
                          <p className="text-sm text-gray-900 dark:text-white">{activo.sistemaOperativo}</p>
                        </div>
                      )}
                      {activo.pulgadas && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Pulgadas:</span>
                          <p className="text-sm text-gray-900 dark:text-white">{activo.pulgadas}</p>
                        </div>
                      )}
                      {activo.imei && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">IMEI:</span>
                          <p className="text-sm text-gray-900 dark:text-white">{activo.imei}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Discos (si aplica) */}
                {activo.discosJson && parseDiscos(activo.discosJson).length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discos
                    </h5>
                    <div className="space-y-1">
                      {parseDiscos(activo.discosJson).map((disco, discoIndex) => (
                        <div key={discoIndex} className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                          <p className="text-xs text-gray-900 dark:text-white">
                            <span className="font-medium">Disco {discoIndex + 1}:</span> {disco.tipo} {disco.capacidad}GB
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fecha de Asignación */}
                {activo.fechaAsignacion && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de Asignación
                    </h5>
                    <p className="text-xs text-gray-900 dark:text-white">
                      {new Date(activo.fechaAsignacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivosAsignadosModal; 