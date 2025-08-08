import React, { useState, useEffect } from 'react';
import { X, User, HardDrive, MessageSquare, Users } from 'lucide-react';
import UserAutoComplete from './UserAutoComplete';
import { useNotifications } from '../contexts/NotificationContext';
import api from '../services/api';

export default function AsignarActivoModal({
    isOpen,
    onClose,
    activo,
    onAsignacionCreada
}) {
    const [usuarios, setUsuarios] = useState([]);
    const [selectedUsuario, setSelectedUsuario] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { notifyActivoAssigned, notifySuccess, notifyError } = useNotifications();

    // Verificar si es asignación múltiple
    const isMultipleAssignment = Array.isArray(activo);
    const activosToAssign = isMultipleAssignment ? activo : [activo];

    useEffect(() => {
        if (isOpen) {
            fetchUsuarios();
        }
    }, [isOpen]);

    const fetchUsuarios = async () => {
        try {
            const { data } = await api.get('/usuarios');
            setUsuarios(data);
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
            setError('Error al cargar la lista de usuarios');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUsuario) {
            setError('Debes seleccionar un usuario');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const selectedUser = usuarios.find(u => u.id.toString() === selectedUsuario);

            if (isMultipleAssignment) {
                // Asignación múltiple
                const promises = activosToAssign.map(activo => {
                    if (!activo || !activo.id) {
                        throw new Error('Activo inválido o sin ID');
                    }
                    return api.post('/asignaciones', {
                        activoId: activo.id,
                        usuarioId: parseInt(selectedUsuario),
                        observaciones: observaciones.trim() || null
                    });
                });

                await Promise.all(promises);

                // Notificar cada asignación
                if (selectedUser) {
                    activosToAssign.forEach(activo => {
                        notifyActivoAssigned(activo, selectedUser);
                    });
                }

                notifySuccess(`${activosToAssign.length} activo(s) asignado(s) correctamente`);
            } else {
                // Asignación individual
                if (!activo || !activo.id) {
                    throw new Error('Activo inválido o sin ID');
                }
                await api.post('/asignaciones', {
                    activoId: activo.id,
                    usuarioId: parseInt(selectedUsuario),
                    observaciones: observaciones.trim() || null
                });

                if (selectedUser) {
                    notifyActivoAssigned(activo, selectedUser);
                }
                notifySuccess('Activo asignado correctamente');
            }

            onAsignacionCreada();
            onClose();
            // Limpiar formulario
            setSelectedUsuario('');
            setObservaciones('');
        } catch (err) {
            console.error('Error al asignar activo(s):', err);
            if (err.response?.status === 400) {
                const errorMsg = err.response.data || 'Uno o más activos ya están asignados a otro usuario';
                setError(errorMsg);
                notifyError(errorMsg);
            } else {
                const errorMsg = 'Error al asignar el(los) activo(s). Inténtalo de nuevo.';
                setError(errorMsg);
                notifyError(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedUsuario('');
        setObservaciones('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {isMultipleAssignment ? 'Asignar Múltiples Activos' : 'Asignar Activo'}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Información del(los) activo(s) */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {isMultipleAssignment ? (
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {activosToAssign.length} activo(s) seleccionado(s)
                                </span>
                            </div>
                            <div className="space-y-1">
                                {activosToAssign.map((activo, index) => (
                                    <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                        • {activo?.codigo} - {activo?.categoria} - {activo?.nombreEquipo || activo?.nombre || 'Sin nombre'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <HardDrive className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {activo?.codigo} - {activo?.categoria}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {activo?.nombreEquipo || activo?.nombre || 'Sin nombre'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {activo?.marca} {activo?.modelo}
                            </p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Usuario con autocompletado */}
                    <UserAutoComplete
                        value={selectedUsuario}
                        onChange={setSelectedUsuario}
                        usuarios={usuarios}
                        placeholder="Buscar usuario por nombre, departamento o email..."
                        label={
                            <span>
                                <User className="w-4 h-4 inline mr-1" />
                                Usuario
                            </span>
                        }
                        required={true}
                    />

                    {/* Observaciones */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <MessageSquare className="w-4 h-4 inline mr-1" />
                            Observaciones (opcional)
                        </label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            placeholder="Motivo de la asignación, condiciones especiales, etc."
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Asignando...' : `Asignar ${isMultipleAssignment ? 'Activos' : 'Activo'}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 