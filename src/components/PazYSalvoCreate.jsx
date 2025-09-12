// src/components/PazYSalvoCreate.jsx
import React, { useState, useEffect } from 'react';
import { X, User, Calendar, FileText, Package, AlertTriangle } from 'lucide-react';
import { pazYSalvoAPI } from '../services/api';
import UserAutoComplete from './UserAutoComplete';

export default function PazYSalvoCreate({ usuarios, onCreate, onClose }) {
    const [formData, setFormData] = useState({
        usuarioId: '',
        fechaSalida: new Date().toISOString().split('T')[0],
        motivoSalida: '',
        observaciones: '',
        jefeDirectoId: '',
        firmas: [],
        activos: []
    });
    const [activosUsuario, setActivosUsuario] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const motivosSalida = [
        'Renuncia',
        'Despido',
        'Término de contrato',
        'Jubilación',
        'Fallecimiento',
        'Otro'
    ];

    const handleUsuarioChange = async (usuarioId) => {

        if (!usuarioId) {
            setFormData(prev => ({
                ...prev,
                usuarioId: ''
            }));
            setActivosUsuario([]);
            // Limpiar error del campo
            if (errors.usuarioId) {
                setErrors(prev => ({
                    ...prev,
                    usuarioId: ''
                }));
            }
            return;
        }

        try {
            setLoading(true);

            // Actualizar el formData con el usuarioId seleccionado
            setFormData(prev => ({
                ...prev,
                usuarioId: usuarioId
            }));

            const response = await pazYSalvoAPI.getActivosPendientes(usuarioId);
            setActivosUsuario(response.data || []);

            const usuario = usuarios.find(u => u.id === usuarioId);

            setFormData(prev => {
                const newData = {
                    ...prev,
                    usuarioId: usuarioId,
                    usuarioRut: usuario?.rut || ''
                };
                return newData;
            });

            // Limpiar error del campo cuando se selecciona un usuario
            if (errors.usuarioId) {
                setErrors(prev => ({
                    ...prev,
                    usuarioId: ''
                }));
            }
        } catch (error) {
            console.error('Error al cargar activos del usuario:', error);
            console.error('Error details:', error.response?.data);
            setActivosUsuario([]);
            // Mostrar mensaje de error al usuario si es necesario
            if (error.response?.status === 401) {
                console.error('Error de autenticación al cargar activos');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleJefeDirectoChange = (jefeDirectoId) => {
        setFormData(prev => ({
            ...prev,
            jefeDirectoId: jefeDirectoId || ''
        }));

        // Limpiar error del campo cuando se selecciona un jefe directo
        if (errors.jefeDirectoId) {
            setErrors(prev => ({
                ...prev,
                jefeDirectoId: ''
            }));
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Limpiar error del campo
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.usuarioId) {
            newErrors.usuarioId = 'Debe seleccionar un usuario';
        } else {
        }

        if (!formData.fechaSalida) {
            newErrors.fechaSalida = 'Debe especificar la fecha de salida';
        }

        if (!formData.motivoSalida) {
            newErrors.motivoSalida = 'Debe especificar el motivo de salida';
        }

        if (!formData.jefeDirectoId) {
            newErrors.jefeDirectoId = 'Debe seleccionar el jefe directo';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            // Si hay un jefe directo seleccionado, verificar si necesita ser creado
            if (formData.jefeDirectoId) {
                try {
                    const jefeResponse = await fetch('/api/pazysalvoroles/create-jefe-directo', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ UsuarioId: parseInt(formData.jefeDirectoId) })
                    });

                    if (jefeResponse.ok) {
                        const jefeData = await jefeResponse.json();
                        console.log('Jefe directo creado/actualizado:', jefeData);
                    }
                } catch (jefeError) {
                    console.warn('Error al crear jefe directo (continuando):', jefeError);
                    // Continuar con la creación del Paz y Salvo aunque falle la creación del jefe directo
                }
            }

            // Preparar datos para enviar al backend
            const dataToSend = {
                usuarioId: parseInt(formData.usuarioId),
                fechaSalida: formData.fechaSalida,
                motivoSalida: formData.motivoSalida,
                observaciones: formData.observaciones || null,
                jefeDirectoId: formData.jefeDirectoId ? parseInt(formData.jefeDirectoId) : null,
                firmas: formData.firmas || [],
                activos: formData.activos || []
            };

            await onCreate(dataToSend);
        } catch (error) {
            console.error('Error al crear Paz y Salvo:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            usuarioId: '',
            usuarioRut: '',
            fechaSalida: new Date().toISOString().split('T')[0],
            motivoSalida: '',
            observaciones: '',
            jefeDirectoId: ''
        });
        setActivosUsuario([]);
        setErrors({});
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-blue-600" />
                            Crear Paz y Salvo
                        </h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Selección de usuario */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <User className="h-4 w-4 inline mr-1" />
                                Usuario *
                            </label>
                            <UserAutoComplete
                                value={formData.usuarioId}
                                usuarios={usuarios}
                                onChange={handleUsuarioChange}
                                placeholder="Buscar usuario por nombre o RUT..."
                            />
                            {errors.usuarioId && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.usuarioId}</p>
                            )}
                        </div>

                        {/* Información del empleado */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Calendar className="h-4 w-4 inline mr-1" />
                                    Fecha de salida *
                                </label>
                                <input
                                    type="date"
                                    value={formData.fechaSalida}
                                    onChange={(e) => handleInputChange('fechaSalida', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${errors.fechaSalida
                                        ? 'border-red-300 dark:border-red-600'
                                        : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                />
                                {errors.fechaSalida && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaSalida}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Motivo de salida *
                                </label>
                                <select
                                    value={formData.motivoSalida}
                                    onChange={(e) => handleInputChange('motivoSalida', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${errors.motivoSalida
                                        ? 'border-red-300 dark:border-red-600'
                                        : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                >
                                    <option value="">Seleccionar motivo...</option>
                                    {motivosSalida.map(motivo => (
                                        <option key={motivo} value={motivo}>{motivo}</option>
                                    ))}
                                </select>
                                {errors.motivoSalida && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.motivoSalida}</p>
                                )}
                            </div>
                        </div>

                        {/* Jefe Directo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <User className="h-4 w-4 inline mr-1" />
                                Jefe Directo *
                            </label>
                            <UserAutoComplete
                                value={formData.jefeDirectoId}
                                usuarios={usuarios}
                                onChange={handleJefeDirectoChange}
                                placeholder="Buscar jefe directo por nombre o RUT..."
                            />
                            {errors.jefeDirectoId && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.jefeDirectoId}</p>
                            )}
                        </div>

                        {/* Activos asignados al usuario */}
                        {activosUsuario.length > 0 && (
                            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                                    <Package className="h-4 w-4 mr-2 text-blue-600" />
                                    Activos Asignados ({activosUsuario.length})
                                </h4>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {activosUsuario.map((activo, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {activo.Descripcion || `${activo.codigo || activo.Id} - ${activo.categoria || 'Activo'}`}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {activo.nombreEquipo || activo.nombre || 'Sin nombre específico'}
                                                </p>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {activo.fechaAsignacion &&
                                                    new Date(activo.fechaAsignacion).toLocaleDateString('es-ES')
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="flex items-start space-x-2">
                                        <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-blue-800 dark:text-blue-400">
                                            <p className="font-medium">Información importante:</p>
                                            <p>Se creará un snapshot de estos activos al momento de generar el Paz y Salvo.
                                                El documento se enviará automáticamente a firma una vez creado.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Observaciones */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Observaciones (opcional)
                            </label>
                            <textarea
                                value={formData.observaciones}
                                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Observaciones adicionales sobre el Paz y Salvo..."
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? 'Creando...' : 'Crear Paz y Salvo'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
