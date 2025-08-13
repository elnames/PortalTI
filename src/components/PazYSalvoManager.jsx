// src/components/PazYSalvoManager.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Eye, AlertTriangle, CheckCircle, XCircle, User, Calendar } from 'lucide-react';
import { useNotificationContext } from '../contexts/NotificationContext';
import { pazYSalvoAPI } from '../services/api';

export default function PazYSalvoManager() {
    const [pazYSalvoList, setPazYSalvoList] = useState([]);
    const [activosPendientes, setActivosPendientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadData, setUploadData] = useState({
        usuarioId: '',
        usuarioNombre: '',
        fechaSubida: '',
        mostrarActivosPendientes: false,
        notas: ''
    });
    const { notifyPazYSalvoUploaded, alertSuccess, alertError, alertFileUploaded } = useNotificationContext();

    useEffect(() => {
        loadPazYSalvoData();
    }, []);

    const loadPazYSalvoData = async () => {
        try {
            setLoading(true);
            const response = await pazYSalvoAPI.getAll();
            setPazYSalvoList(response.data);
        } catch (error) {
            console.error('Error al cargar datos de Paz y Salvo:', error);
            alertError('Error al cargar datos de Paz y Salvo');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
        } else {
            alertError('Por favor selecciona un archivo PDF válido');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !uploadData.usuarioNombre) {
            alertError('Por favor completa todos los campos requeridos');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('archivo', selectedFile);
            formData.append('usuarioId', uploadData.usuarioId);
            formData.append('usuarioNombre', uploadData.usuarioNombre);
            formData.append('activosPendientes', uploadData.activosPendientes || 0);
            formData.append('notas', uploadData.notas);

            const response = await pazYSalvoAPI.create(formData);

            // Recargar la lista
            await loadPazYSalvoData();

            // Notificar al sistema
            const usuario = { id: response.data.usuarioId, nombre: response.data.usuarioNombre };
            notifyPazYSalvoUploaded(usuario, []);
            alertFileUploaded(selectedFile.name);

            // Limpiar formulario
            setSelectedFile(null);
            setUploadData({
                usuarioId: '',
                usuarioNombre: '',
                fechaSubida: '',
                mostrarActivosPendientes: false,
                notas: ''
            });
            setShowUploadModal(false);

        } catch (error) {
            console.error('Error al subir el archivo:', error);
            alertError('Error al subir el archivo');
        }
    };

    const getStatusIcon = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'completado':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'pendiente':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'rechazado':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <AlertTriangle className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusColor = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'completado':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'rechazado':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const downloadFile = async (id, fileName) => {
        try {
            const response = await pazYSalvoAPI.download(id);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            alertSuccess(`Descargando ${fileName}...`);
        } catch (error) {
            console.error('Error al descargar archivo:', error);
            alertError('Error al descargar el archivo');
        }
    };

    const viewFile = (id) => {
        window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:5266/api'}/pazysalvo/download/${id}`, '_blank');
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header con botón de subida */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Paz y Salvo</h2>
                    <p className="text-gray-500 dark:text-gray-400">Gestión de documentos de paz y salvo</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Upload className="h-4 w-4" />
                    <span>Subir Paz y Salvo</span>
                </button>
            </div>

            {/* Lista de Paz y Salvo */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-600" />
                        Documentos Subidos
                    </h3>
                </div>
                <div className="p-4">
                    {pazYSalvoList.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay documentos de paz y salvo registrados</p>
                    ) : (
                        <div className="space-y-4">
                            {pazYSalvoList.map((pazYSalvo) => (
                                <div key={pazYSalvo.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            {getStatusIcon(pazYSalvo.estado)}
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">{pazYSalvo.usuarioNombre}</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Subido el {pazYSalvo.fechaSubida}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pazYSalvo.estado)}`}>
                                            {pazYSalvo.estado}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Activos pendientes:</span>
                                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                                {pazYSalvo.activosPendientes}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Archivo:</span>
                                            <span className="ml-2 font-mono text-gray-900 dark:text-white">
                                                {pazYSalvo.archivoPath.split('/').pop()}
                                            </span>
                                        </div>
                                    </div>

                                    {pazYSalvo.notas && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{pazYSalvo.notas}</p>
                                    )}

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => viewFile(pazYSalvo.id)}
                                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span>Ver</span>
                                        </button>
                                        <button
                                            onClick={() => downloadFile(pazYSalvo.id, pazYSalvo.archivoPath.split('/').pop())}
                                            className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm"
                                        >
                                            <Download className="h-4 w-4" />
                                            <span>Descargar</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Activos Pendientes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                        Activos Pendientes de Devolución
                    </h3>
                </div>
                <div className="p-4">
                    {activosPendientes.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay activos pendientes de devolución</p>
                    ) : (
                        <div className="space-y-3">
                            {activosPendientes.map((activo) => (
                                <div key={activo.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                            <User className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{activo.codigo} - {activo.nombre}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Asignado a {activo.usuarioAsignado} • {activo.tipo}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                Fecha asignación: {activo.fechaAsignacion}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activo.estado)}`}>
                                        {activo.estado}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de subida */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subir Paz y Salvo</h3>

                        <div className="space-y-4">
                            {/* Selección de archivo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Archivo PDF
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileSelect}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                {selectedFile && (
                                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                        ✓ {selectedFile.name}
                                    </p>
                                )}
                            </div>

                            {/* Usuario */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Usuario
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nombre del usuario"
                                    value={uploadData.usuarioNombre}
                                    onChange={(e) => setUploadData(prev => ({ ...prev, usuarioNombre: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Fecha de subida */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Fecha de Subida
                                </label>
                                <input
                                    type="date"
                                    value={uploadData.fechaSubida}
                                    onChange={(e) => setUploadData(prev => ({ ...prev, fechaSubida: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Checkbox para mostrar activos pendientes */}
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="mostrarActivosPendientes"
                                    checked={uploadData.mostrarActivosPendientes}
                                    onChange={(e) => setUploadData(prev => ({ ...prev, mostrarActivosPendientes: e.target.checked }))}
                                    className="rounded border-gray-300 dark:border-gray-600"
                                />
                                <label htmlFor="mostrarActivosPendientes" className="text-sm text-gray-700 dark:text-gray-300">
                                    Mostrar activos pendientes de devolución
                                </label>
                            </div>

                            {/* Notas */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Notas (opcional)
                                </label>
                                <textarea
                                    placeholder="Observaciones adicionales..."
                                    value={uploadData.notas}
                                    onChange={(e) => setUploadData(prev => ({ ...prev, notas: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || !uploadData.usuarioNombre}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Subir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
