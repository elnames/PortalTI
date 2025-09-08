// src/components/PazYSalvoManager.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Eye, AlertTriangle, CheckCircle, XCircle, User, Calendar, Package, CheckSquare, Square, Trash2 } from 'lucide-react';
import { useNotificationContext } from '../contexts/NotificationContext';
import { pazYSalvoAPI, usuariosAPI } from '../services/api';
import { getApiBaseUrl } from '../config';
import UserAutoComplete from './UserAutoComplete';

export default function PazYSalvoManager() {
    const [pazYSalvoList, setPazYSalvoList] = useState([]);
    const [activosPendientes, setActivosPendientes] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [activosUsuarioSeleccionado, setActivosUsuarioSeleccionado] = useState([]);
    const [activosDevueltos, setActivosDevueltos] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [loadingActivos, setLoadingActivos] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadData, setUploadData] = useState({
        usuarioId: '',
        usuarioNombre: '',
        fechaSubida: new Date().toISOString().split('T')[0], // Fecha actual por defecto
        mostrarActivosPendientes: false,
        notas: ''
    });
    const { notifyPazYSalvoUploaded, alertSuccess, alertError, alertFileUploaded } = useNotificationContext();

    useEffect(() => {
        loadPazYSalvoData();
        loadUsuarios();
        loadActivosPendientes();
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

    const loadUsuarios = async () => {
        try {
            const response = await usuariosAPI.getAll();
            setUsuarios(response.data);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            alertError('Error al cargar usuarios');
        }
    };

    const loadActivosPendientes = async () => {
        try {
            const response = await pazYSalvoAPI.getActivosPendientesTodos();
            setActivosPendientes(response.data);
        } catch (error) {
            console.error('Error al cargar activos pendientes:', error);
            alertError('Error al cargar activos pendientes');
        }
    };

    const handleUsuarioChange = async (usuarioId) => {
        if (!usuarioId) {
            setActivosUsuarioSeleccionado([]);
            setActivosDevueltos(new Set());
            setUploadData(prev => ({
                ...prev,
                usuarioId: '',
                usuarioNombre: '',
                activosPendientes: 0
            }));
            return;
        }

        try {
            setLoadingActivos(true);
            const response = await pazYSalvoAPI.getActivosPendientes(usuarioId);
            const activos = response.data;
            setActivosUsuarioSeleccionado(activos);
            setActivosDevueltos(new Set()); // Resetear checkboxes

            // Encontrar el usuario seleccionado para obtener su nombre
            const usuarioSeleccionado = usuarios.find(u => u.id === usuarioId);
            const nombreUsuario = usuarioSeleccionado ?
                `${usuarioSeleccionado.nombre} ${usuarioSeleccionado.apellido}` : '';

            setUploadData(prev => ({
                ...prev,
                usuarioId: usuarioId,
                usuarioNombre: nombreUsuario,
                activosPendientes: activos.length
            }));
        } catch (error) {
            console.error('Error al cargar activos del usuario:', error);
            alertError('Error al cargar activos del usuario');
            setActivosUsuarioSeleccionado([]);
        } finally {
            setLoadingActivos(false);
        }
    };

    const handleActivoToggle = (activoId) => {
        setActivosDevueltos(prev => {
            const newSet = new Set(prev);
            if (newSet.has(activoId)) {
                newSet.delete(activoId);
            } else {
                newSet.add(activoId);
            }
            return newSet;
        });
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile || !uploadData.usuarioId) {
            alertError('Por favor selecciona un archivo y un usuario');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('archivo', selectedFile);
            formData.append('usuarioId', uploadData.usuarioId);
            formData.append('usuarioNombre', uploadData.usuarioNombre);
            formData.append('activosPendientes', activosUsuarioSeleccionado.length - activosDevueltos.size);
            formData.append('notas', uploadData.notas || '');

            // Agregar información de activos devueltos
            const activosDevueltosInfo = activosUsuarioSeleccionado
                .filter(activo => activosDevueltos.has(activo.id))
                .map(activo => ({
                    id: activo.id,
                    codigo: activo.codigo,
                    nombre: activo.nombre,
                    categoria: activo.categoria
                }));

            formData.append('activosDevueltos', JSON.stringify(activosDevueltosInfo));

            await pazYSalvoAPI.create(formData);

            alertSuccess('Paz y Salvo subido exitosamente');
            setShowUploadModal(false);
            setSelectedFile(null);
            setActivosDevueltos(new Set());
            setUploadData({
                usuarioId: '',
                usuarioNombre: '',
                fechaSubida: new Date().toISOString().split('T')[0],
                mostrarActivosPendientes: false,
                notas: ''
            });

            // Recargar datos
            loadPazYSalvoData();
            loadActivosPendientes();
        } catch (error) {
            console.error('Error al subir archivo:', error);
            if (error.response?.status === 400) {
                alertError(error.response.data || 'Error en el formato del archivo');
            } else {
                alertError('Error al subir el archivo');
            }
        }
    };

    const handleMarcarDevuelto = async (activo) => {
        try {
            await pazYSalvoAPI.marcarActivoDevuelto({
                usuarioId: activo.usuarioId,
                activoId: activo.id,
                observaciones: 'Devuelto desde Paz y Salvo'
            });

            alertSuccess('Activo marcado como devuelto');
            loadActivosPendientes(); // Recargar lista
            loadPazYSalvoData(); // Recargar documentos
        } catch (error) {
            console.error('Error al marcar activo como devuelto:', error);
            alertError('Error al marcar activo como devuelto');
        }
    };

    const getStatusIcon = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'completado':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'pendiente':
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case 'rechazado':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <FileText className="h-5 w-5 text-gray-600" />;
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
        // Abrir en nueva pestaña para previsualización
        const url = `${getApiBaseUrl()}/api/pazysalvo/preview/${id}`;
        window.open(url, '_blank');
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
            try {
                await pazYSalvoAPI.eliminar(id);
                alertSuccess('Documento eliminado exitosamente');
                loadPazYSalvoData(); // Recargar lista
                loadActivosPendientes(); // Recargar activos pendientes
            } catch (error) {
                console.error('Error al eliminar documento:', error);
                alertError('Error al eliminar el documento');
            }
        }
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
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
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
                                        <button
                                            onClick={() => handleEliminar(pazYSalvo.id)}
                                            className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span>Eliminar</span>
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
                                <div key={`${activo.usuarioId}-${activo.id}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                            <Package className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {activo.codigo} - {activo.nombreEquipo || activo.nombre}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {activo.categoria} • Asignado a {activo.usuarioNombre}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                Asignado el {new Date(activo.fechaAsignacion).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleMarcarDevuelto(activo)}
                                        className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                    >
                                        <CheckSquare className="h-4 w-4" />
                                        <span>Marcar Devuelto</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Subida */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subir Paz y Salvo</h3>
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setActivosDevueltos(new Set());
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Usuario */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Usuario
                                </label>
                                <UserAutoComplete
                                    usuarios={usuarios}
                                    onChange={handleUsuarioChange}
                                    placeholder="Buscar usuario..."
                                />
                            </div>

                            {/* Activos Asignados al Usuario */}
                            {activosUsuarioSeleccionado.length > 0 && (
                                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                                        Activos Asignados al Usuario
                                    </h4>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {activosDevueltos.size} devueltos / {activosUsuarioSeleccionado.length} total
                                    </div>
                                    <div className="max-h-40 overflow-y-auto space-y-2">
                                        {activosUsuarioSeleccionado.map((activo, index) => {
                                            const isDevuelto = activosDevueltos.has(activo.id);
                                            return (
                                                <div key={index} className={`flex items-center justify-between p-2 rounded transition-colors ${isDevuelto
                                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                                    : 'bg-gray-50 dark:bg-gray-700'
                                                    }`}>
                                                    <div className="flex items-center space-x-3 flex-1">
                                                        <button
                                                            onClick={() => handleActivoToggle(activo.id)}
                                                            className="text-blue-600 hover:text-blue-700"
                                                        >
                                                            {isDevuelto ? (
                                                                <CheckSquare className="h-4 w-4" />
                                                            ) : (
                                                                <Square className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-medium ${isDevuelto
                                                            ? 'text-green-800 dark:text-green-400'
                                                            : 'text-gray-900 dark:text-white'
                                                            }`}>
                                                            {activo.codigo} - {activo.categoria}
                                                        </p>
                                                        <p className={`text-xs ${isDevuelto
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-gray-500 dark:text-gray-400'
                                                            }`}>
                                                            {activo.nombreEquipo || activo.nombre}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Archivo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Archivo PDF
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
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

                            {/* Notas */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Notas (opcional)
                                </label>
                                <textarea
                                    value={uploadData.notas}
                                    onChange={(e) => setUploadData(prev => ({ ...prev, notas: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Observaciones adicionales..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setActivosDevueltos(new Set());
                                }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || !uploadData.usuarioId}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
