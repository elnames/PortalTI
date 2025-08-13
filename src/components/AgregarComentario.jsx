import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import api from '../services/api';

export default function AgregarComentario({ ticketId, onComentarioAgregado, esActualizacion = false, esInterno = false }) {
  const { user } = useAuth();
  const { alertSuccess, alertError } = useNotificationContext();
  const [contenido, setContenido] = useState('');
  const [esInternoState, setEsInternoState] = useState(esInterno);
  const [evidencia, setEvidencia] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contenido.trim()) {
      alertError('El mensaje no puede estar vacío');
      return;
    }

    setLoading(true);

    try {
      const formData = {
        contenido: contenido.trim(),
        esInterno: esInternoState
      };

      // Si hay evidencia, subirla primero
      if (evidencia) {
        const formDataFile = new FormData();
        formDataFile.append('file', evidencia);

        const uploadResponse = await api.post('/tickets/upload-evidence', formDataFile, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        formData.evidencia = uploadResponse.data.url;
      }

      const response = await api.post(`/tickets/${ticketId}/comentarios`, formData);

      alertSuccess(esInternoState ? 'Mensaje interno agregado exitosamente' : 'Actualización agregada exitosamente');
      setContenido('');
      setEsInternoState(esInterno);
      setEvidencia(null);

      if (onComentarioAgregado) {
        onComentarioAgregado(response.data);
      }
    } catch (error) {
      console.error('Error al agregar mensaje:', error);
      alertError('Error al agregar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo (solo imágenes)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alertError('Solo se permiten archivos de imagen (JPG, PNG, GIF)');
        return;
      }
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alertError('El archivo es demasiado grande. Máximo 5MB');
        return;
      }
      setEvidencia(file);
    }
  };

  const getTitle = () => {
    if (esInterno) return 'Agregar Mensaje Interno';
    if (esActualizacion) return 'Agregar Actualización';
    return 'Agregar Comentario';
  };

  const getPlaceholder = () => {
    if (esInterno) return 'Escribe tu mensaje interno aquí...';
    if (esActualizacion) return 'Escribe la actualización del ticket aquí...';
    return 'Escribe tu comentario aquí...';
  };

  const getButtonText = () => {
    if (esInterno) return 'Agregar Mensaje Interno';
    if (esActualizacion) return 'Agregar Actualización';
    return 'Agregar Comentario';
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        {getTitle()}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {esInterno ? 'Mensaje Interno *' : esActualizacion ? 'Actualización *' : 'Comentario *'}
          </label>
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={getPlaceholder()}
            required
          />
        </div>

        {/* Solo mostrar checkbox de interno si no está forzado */}
        {!esInterno && !esActualizacion && (
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={esInternoState}
                onChange={(e) => setEsInternoState(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Comentario interno (solo visible para soporte y admin)
              </span>
            </label>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Evidencia (Opcional)</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Formatos permitidos: JPG, PNG, GIF. Máximo 5MB.
          </p>
        </div>

        {evidencia && (
          <div className="flex items-center space-x-2">
            <img
              src={URL.createObjectURL(evidencia)}
              alt="Vista previa"
              className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
            />
            <button
              type="button"
              onClick={() => setEvidencia(null)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
            >
              Eliminar
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !contenido.trim()}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Agregando...' : getButtonText()}
        </button>
      </form>
    </div>
  );
} 