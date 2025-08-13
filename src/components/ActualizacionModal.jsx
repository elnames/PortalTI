import React, { useState } from 'react';
import { X, Plus, Send, Image as ImageIcon, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import api from '../services/api';

export default function ActualizacionModal({ isOpen, onClose, ticketId, onActualizacionAgregada }) {
  const { user } = useAuth();
  const { alertSuccess, alertError } = useNotificationContext();
  const [contenido, setContenido] = useState('');
  const [evidencia, setEvidencia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contenido.trim()) {
      alertError('La actualización no puede estar vacía');
      return;
    }

    setLoading(true);

    try {
      const formData = {
        contenido: contenido.trim(),
        esInterno: false
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

      await api.post(`/tickets/${ticketId}/comentarios`, formData);

      alertSuccess('Actualización agregada exitosamente');
      setContenido('');
      setEvidencia(null);

      if (onActualizacionAgregada) {
        onActualizacionAgregada();
      }
    } catch (error) {
      console.error('Error al agregar actualización:', error);
      alertError('Error al agregar la actualización');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alertError('Solo se permiten archivos de imagen (JPG, PNG, GIF)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alertError('El archivo es demasiado grande. Máximo 5MB');
        return;
      }
      setEvidencia(file);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'evidencia';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Agregar Actualización
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Formulario */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Actualización *
                </label>
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Escribe la actualización del ticket aquí..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Evidencia (Opcional)
                </label>
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !contenido.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Agregando...' : 'Agregar actualización'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal para ver imagen */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-60 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Evidencia"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
} 