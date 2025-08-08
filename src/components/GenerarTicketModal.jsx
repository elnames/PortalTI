import React, { useState, useEffect } from 'react';
import { X, User, HardDrive, AlertCircle, CheckCircle } from 'lucide-react';
import { chatAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function GenerarTicketModal({ isOpen, onClose, conversacion, onTicketGenerado }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [usuario, setUsuario] = useState(null);
    const [activosAsignados, setActivosAsignados] = useState([]);
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        empresa: '',
        departamento: '',
        categoria: 'Otros',
        prioridad: 'Media',
        activoId: null
    });

    useEffect(() => {
        if (isOpen && conversacion) {
            cargarDatosUsuario();
            setFormData({
                titulo: `Ticket desde chat - ${conversacion.titulo}`,
                descripcion: `Conversación iniciada: ${conversacion.descripcion || 'Sin descripción'}`,
                empresa: '',
                departamento: '',
                categoria: 'Otros',
                prioridad: 'Media',
                activoId: null
            });
        }
    }, [isOpen, conversacion]);

    const cargarDatosUsuario = async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getActivosUsuario(conversacion.id);
            setUsuario(response.data.usuario);
            setActivosAsignados(response.data.activosAsignados);

            // Pre-llenar empresa y departamento si están disponibles
            if (response.data.usuario) {
                setFormData(prev => ({
                    ...prev,
                    empresa: response.data.usuario.empresa || 'VICSA',
                    departamento: response.data.usuario.departamento || ''
                }));
            }
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            showToast('Error al cargar datos del usuario', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.titulo.trim() || !formData.descripcion.trim()) {
            showToast('Por favor complete todos los campos requeridos', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await chatAPI.generarTicket(conversacion.id, formData);
            showToast(`Ticket #${response.data.id} generado exitosamente`, 'success');
            onTicketGenerado(response.data);
            onClose();
        } catch (error) {
            console.error('Error al generar ticket:', error);
            showToast('Error al generar el ticket', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Generar Ticket desde Chat
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {!loading && usuario && (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center mb-3">
                                <User className="w-5 h-5 text-blue-600 mr-2" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Información del Solicitante
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {usuario.nombre} {usuario.apellido}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {usuario.email}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Departamento:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {usuario.departamento || 'No especificado'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Empresa:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {usuario.empresa || 'VICSA'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && activosAsignados.length > 0 && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center mb-3">
                                <HardDrive className="w-5 h-5 text-green-600 mr-2" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Activos Asignados al Usuario
                                </h3>
                            </div>
                            <div className="space-y-2">
                                {activosAsignados.map((activo) => (
                                    <div
                                        key={activo.id}
                                        className={`p-3 rounded border cursor-pointer transition-colors ${formData.activoId === activo.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                                            }`}
                                        onClick={() => setFormData(prev => ({ ...prev, activoId: activo.id }))}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {activo.codigo} - {activo.nombreEquipo}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {activo.categoria} • {activo.tipoEquipo}
                                                </div>
                                            </div>
                                            {formData.activoId === activo.id && (
                                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && activosAsignados.length === 0 && (
                        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                                <span className="text-yellow-800 dark:text-yellow-200">
                                    El usuario no tiene activos asignados
                                </span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Título del Ticket *
                            </label>
                            <input
                                type="text"
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Descripción *
                            </label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Empresa
                                </label>
                                <input
                                    type="text"
                                    name="empresa"
                                    value={formData.empresa}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Departamento
                                </label>
                                <input
                                    type="text"
                                    name="departamento"
                                    value={formData.departamento}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Categoría
                                </label>
                                <select
                                    name="categoria"
                                    value={formData.categoria}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="Hardware">Hardware</option>
                                    <option value="Software">Software</option>
                                    <option value="Red">Red</option>
                                    <option value="Acceso">Acceso</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Prioridad
                                </label>
                                <select
                                    name="prioridad"
                                    value={formData.prioridad}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="Baja">Baja</option>
                                    <option value="Media">Media</option>
                                    <option value="Alta">Alta</option>
                                    <option value="Crítica">Crítica</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Generando...' : 'Generar Ticket'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
