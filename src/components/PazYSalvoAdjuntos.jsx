// src/components/PazYSalvoAdjuntos.jsx
import React, { useState } from 'react';
import {
    Upload,
    Download,
    Eye,
    File,
    Image,
    FileText,
    Trash2,
    Plus,
    X
} from 'lucide-react';
import { pazYSalvoAPI } from '../services/api';
import { useNotificationContext } from '../contexts/NotificationContext';

export default function PazYSalvoAdjuntos({ pazYSalvo, onRefresh }) {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadDescription, setUploadDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const { alertSuccess, alertError } = useNotificationContext();

    const getFileIcon = (tipo) => {
        if (tipo?.startsWith('image/')) {
            return <Image className="h-5 w-5 text-green-600" />;
        }
        if (tipo?.includes('pdf')) {
            return <FileText className="h-5 w-5 text-red-600" />;
        }
        return <File className="h-5 w-5 text-gray-600" />;
    };

    const getFileTypeColor = (tipo) => {
        if (tipo?.startsWith('image/')) {
            return 'text-green-600 dark:text-green-400';
        }
        if (tipo?.includes('pdf')) {
            return 'text-red-600 dark:text-red-400';
        }
        return 'text-gray-600 dark:text-gray-400';
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alertError('Debe seleccionar un archivo');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('archivo', selectedFile);
            formData.append('descripcion', uploadDescription);

            await pazYSalvoAPI.subirAdjunto(pazYSalvo.id, formData);

            alertSuccess('Archivo subido exitosamente');
            setShowUploadModal(false);
            setSelectedFile(null);
            setUploadDescription('');
            onRefresh();
        } catch (error) {
            console.error('Error al subir archivo:', error);
            alertError('Error al subir el archivo');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (adjunto) => {
        try {
            const response = await pazYSalvoAPI.descargarAdjunto(adjunto.id);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', adjunto.nombre);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            alertSuccess('Archivo descargado exitosamente');
        } catch (error) {
            console.error('Error al descargar archivo:', error);
            alertError('Error al descargar el archivo');
        }
    };

    const handleView = (adjunto) => {
        // Abrir en nueva pestaña para previsualización
        const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5266'}/api/pazysalvo/${pazYSalvo.id}/adjuntos/${adjunto.id}`;
        window.open(url, '_blank');
    };

    const handleDelete = async (adjuntoId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
            return;
        }

        try {
            await pazYSalvoAPI.eliminarAdjunto(pazYSalvo.id, adjuntoId);
            alertSuccess('Archivo eliminado exitosamente');
            onRefresh();
        } catch (error) {
            console.error('Error al eliminar archivo:', error);
            alertError('Error al eliminar el archivo');
        }
    };

    if (!pazYSalvo.adjuntos || pazYSalvo.adjuntos.length === 0) {
        return (
            <div className="text-center py-8">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No hay archivos adjuntos</p>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center space-x-2 mx-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Subir archivo</span>
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-blue-600" />
                    Archivos Adjuntos
                </h4>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Subir archivo</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pazYSalvo.adjuntos.map((adjunto, index) => (
                    <div key={adjunto.id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                {getFileIcon(adjunto.tipo)}
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {adjunto.nombre}
                                    </h5>
                                    <p className={`text-xs ${getFileTypeColor(adjunto.tipo)}`}>
                                        {adjunto.tipo}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(adjunto.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <div className="flex justify-between">
                                <span>Subido por:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {adjunto.subidoPor?.nombre} {adjunto.subidoPor?.apellido}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Fecha:</span>
                                <span>{formatDate(adjunto.fecha)}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handleView(adjunto)}
                                className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                            >
                                <Eye className="h-4 w-4" />
                                <span>Ver</span>
                            </button>
                            <button
                                onClick={() => handleDownload(adjunto)}
                                className="flex items-center space-x-1 px-3 py-1 text-green-600 hover:text-green-700 text-sm transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                <span>Descargar</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de subida */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Subir Archivo
                            </h3>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Archivo
                                </label>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100
                                        dark:file:bg-blue-900/20 dark:file:text-blue-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Descripción (opcional)
                                </label>
                                <textarea
                                    value={uploadDescription}
                                    onChange={(e) => setUploadDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Descripción del archivo..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || loading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Subiendo...' : 'Subir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
