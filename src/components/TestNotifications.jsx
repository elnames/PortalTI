import React, { useState } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const TestNotifications = () => {
    const {
        notifyActaRechazada,
        notifyActaFirmada,
        createNotification,
        createNotificationForAdmins,
        createNotificationForRole
    } = useNotificationContext();
    const { showSuccess, showError } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [testMessage, setTestMessage] = useState('');

    const handleTestActaRechazada = async () => {
        setLoading(true);
        try {
            // Simular datos de acta y usuario
            const acta = {
                id: 1,
                activo: { codigo: 'TEST-001' }
            };
            const usuario = {
                id: 2,
                nombre: 'Usuario',
                apellido: 'Test'
            };

            await notifyActaRechazada(acta, usuario);
            showSuccess('Notificación de acta rechazada enviada correctamente');
        } catch (error) {
            showError(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestActaFirmada = async () => {
        setLoading(true);
        try {
            // Simular datos de acta y usuario
            const acta = {
                id: 1,
                activo: { codigo: 'TEST-001' }
            };
            const usuario = {
                id: 2,
                nombre: 'Usuario',
                apellido: 'Test'
            };

            await notifyActaFirmada(acta, usuario);
            showSuccess('Notificación de acta firmada enviada a admins correctamente');
        } catch (error) {
            showError(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestNotificacionDirecta = async () => {
        setLoading(true);
        try {
            await createNotification({
                userId: 2, // ID del usuario que recibirá la notificación
                tipo: 'test',
                titulo: 'Notificación de prueba directa',
                mensaje: 'Esta es una notificación de prueba enviada directamente',
                refTipo: 'Test',
                refId: 1,
                ruta: '/test'
            });
            showSuccess('Notificación directa enviada correctamente');
        } catch (error) {
            showError(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestNotificacionUsuarioActual = async () => {
        setLoading(true);
        try {
            if (!user?.id) {
                showError('No se pudo obtener el ID del usuario actual');
                return;
            }

            await createNotification({
                userId: user.id,
                tipo: 'test',
                titulo: 'Notificación de prueba para usuario actual',
                mensaje: `Esta es una notificación de prueba enviada directamente al usuario ${user.nombre || user.username}`,
                refTipo: 'Test',
                refId: user.id,
                ruta: '/test'
            });
            showSuccess(`Notificación directa enviada al usuario actual (ID: ${user.id})`);
        } catch (error) {
            showError(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestNotificacionAdmins = async () => {
        setLoading(true);
        try {
            await createNotificationForAdmins({
                userId: 0,
                tipo: 'test',
                titulo: 'Notificación de prueba para admins',
                mensaje: 'Esta es una notificación de prueba para todos los administradores',
                refTipo: 'Test',
                refId: 1,
                ruta: '/test'
            });
            showSuccess('Notificación para admins enviada correctamente');
        } catch (error) {
            showError(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestNotificacionRol = async () => {
        setLoading(true);
        try {
            await createNotificationForRole('soporte', {
                userId: 0,
                tipo: 'test',
                titulo: 'Notificación de prueba para soporte',
                mensaje: 'Esta es una notificación de prueba para todos los usuarios de soporte',
                refTipo: 'Test',
                refId: 1,
                ruta: '/test'
            });
            showSuccess('Notificación para rol soporte enviada correctamente');
        } catch (error) {
            showError(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Nuevas funciones que usan el endpoint del backend
    const handleTestBackendDirect = async () => {
        setLoading(true);
        try {
            const response = await api.post('/notifications/test', {
                type: 'direct',
                message: testMessage || 'Notificación de prueba directa desde backend'
            });
            showSuccess(`Backend: ${response.data.message}`);
        } catch (error) {
            showError(`Error backend: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestBackendDirectUsuario4 = async () => {
        setLoading(true);
        try {
            const response = await api.post('/notifications/test', {
                type: 'direct',
                userId: 4,
                message: testMessage || 'Notificación de prueba directa para usuario ID 4 desde backend'
            });
            showSuccess(`Backend Usuario 4: ${response.data.message}`);
        } catch (error) {
            showError(`Error backend: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestBackendAdmins = async () => {
        setLoading(true);
        try {
            const response = await api.post('/notifications/test', {
                type: 'admins',
                message: testMessage || 'Notificación de prueba para admins desde backend'
            });
            showSuccess(`Backend: ${response.data.message}`);
        } catch (error) {
            showError(`Error backend: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestBackendRole = async () => {
        setLoading(true);
        try {
            const response = await api.post('/notifications/test', {
                type: 'role',
                role: 'soporte',
                message: testMessage || 'Notificación de prueba para soporte desde backend'
            });
            showSuccess(`Backend: ${response.data.message}`);
        } catch (error) {
            showError(`Error backend: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Nuevas funciones para probar flujos específicos
    const handleTestCreacionUsuario = async () => {
        setLoading(true);
        try {
            const response = await api.post('/notifications/test', {
                type: 'role',
                role: 'admin',
                message: testMessage || 'Nuevo usuario creado: Juan Pérez (juan.perez@empresa.com)'
            });
            showSuccess(`Creación Usuario: ${response.data.message}`);
        } catch (error) {
            showError(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestCreacionActivo = async () => {
        setLoading(true);
        try {
            const response = await api.post('/notifications/test', {
                type: 'role',
                role: 'admin',
                message: testMessage || 'Nuevo activo registrado: EQUIPO-001 - Equipos'
            });
            showSuccess(`Creación Activo: ${response.data.message}`);
        } catch (error) {
            showError(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestAsignacion = async () => {
        setLoading(true);
        try {
            // Simular notificación de asignación
            await createNotification({
                userId: 2, // Usuario asignado
                tipo: 'assignment',
                titulo: 'Activo asignado',
                mensaje: 'Se te ha asignado el activo: EQUIPO-001 - Laptop Dell',
                refTipo: 'Activo',
                refId: 1,
                ruta: '/activos/1'
            });

            // Notificar a admins
            await createNotificationForRole('admin', {
                userId: 0,
                tipo: 'assignment',
                titulo: 'Nueva asignación de activo',
                mensaje: 'Se asignó el activo EQUIPO-001 a Juan Pérez',
                refTipo: 'Activo',
                refId: 1,
                ruta: '/activos/1'
            });

            showSuccess('Notificación de asignación enviada correctamente');
        } catch (error) {
            showError(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestRechazoActa = async () => {
        setLoading(true);
        try {
            const response = await api.post('/notifications/test-rechazo-acta', {
                userId: 4,
                actaId: 1,
                comentarios: 'Prueba de rechazo automático de acta'
            });
            showSuccess(`Rechazo de Acta enviado correctamente: ${response.data.message}`);
        } catch (error) {
            showError(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestSimple = async () => {
        setLoading(true);
        try {
            const response = await api.post('/notifications/test-simple', {
                userId: 4,
                actaId: 1,
                aprobar: false,
                comentarios: 'Prueba simple de rechazo'
            });
            showSuccess(`Test simple completado: ${response.data.message}`);
        } catch (error) {
            showError(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestUsuarioEspecifico = async (userId) => {
        setLoading(true);
        try {
            const response = await api.post('/notifications/test-usuario-especifico', {
                userId: userId,
                mensaje: `Test específico para usuario ${userId}`
            });
            showSuccess(`Test enviado al usuario ${userId}: ${response.data.message}`);
        } catch (error) {
            showError(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDebugConnections = async () => {
        setLoading(true);
        try {
            const response = await api.get('/notifications/debug-connections');
            console.log('Debug connections:', response.data);
            showSuccess('Información de conexiones obtenida (ver consola)');
        } catch (error) {
            showError(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pruebas de Notificaciones
            </h3>

            {/* Campo de mensaje personalizado */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mensaje personalizado (opcional):
                </label>
                <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Escribe un mensaje personalizado..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                        onClick={handleTestActaRechazada}
                        disabled={loading}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Enviando...' : 'Probar Acta Rechazada'}
                    </button>

                    <button
                        onClick={handleTestActaFirmada}
                        disabled={loading}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Enviando...' : 'Probar Acta Firmada (Admins)'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                        onClick={handleTestNotificacionDirecta}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Enviando...' : 'Notificación Directa'}
                    </button>

                    <button
                        onClick={handleTestNotificacionUsuarioActual}
                        disabled={loading}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Enviando...' : 'Notificación Usuario Actual'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                        onClick={handleTestNotificacionAdmins}
                        disabled={loading}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Enviando...' : 'Notificación Admins'}
                    </button>

                    <button
                        onClick={handleTestNotificacionRol}
                        disabled={loading}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Enviando...' : 'Notificación Rol Soporte'}
                    </button>
                </div>

                {/* Nuevas pruebas del backend */}
                <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Pruebas del Backend (Más Confiables)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                            onClick={handleTestBackendDirect}
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Enviando...' : 'Backend: Directa'}
                        </button>

                        <button
                            onClick={handleTestBackendDirectUsuario4}
                            disabled={loading}
                            className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Enviando...' : 'Backend: Usuario 4'}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <button
                            onClick={handleTestBackendAdmins}
                            disabled={loading}
                            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Enviando...' : 'Backend: Admins'}
                        </button>

                        <button
                            onClick={handleTestBackendRole}
                            disabled={loading}
                            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Enviando...' : 'Backend: Rol Soporte'}
                        </button>
                    </div>
                </div>

                {/* Nuevas pruebas de flujos específicos */}
                <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Pruebas de Flujos Específicos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            onClick={handleTestCreacionUsuario}
                            disabled={loading}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Enviando...' : 'Creación Usuario'}
                        </button>

                        <button
                            onClick={handleTestCreacionActivo}
                            disabled={loading}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Enviando...' : 'Creación Activo'}
                        </button>

                        <button
                            onClick={handleTestAsignacion}
                            disabled={loading}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Enviando...' : 'Asignación Activo'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <button
                        onClick={handleTestRechazoActa}
                        disabled={loading}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Enviando...' : 'Test Rechazo Acta (Usuario 4)'}
                    </button>

                    <button
                        onClick={handleTestSimple}
                        disabled={loading}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Enviando...' : 'Test Simple (Usuario 4)'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <button
                        onClick={() => handleTestUsuarioEspecifico(2)}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Enviando...' : 'Test Usuario 2 (Admin)'}
                    </button>

                    <button
                        onClick={() => handleTestUsuarioEspecifico(4)}
                        disabled={loading}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Enviando...' : 'Test Usuario 4 (Usuario)'}
                    </button>

                    <button
                        onClick={() => handleTestUsuarioEspecifico(5)}
                        disabled={loading}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Enviando...' : 'Test Usuario 5 (Soporte)'}
                    </button>
                </div>

                <div className="mt-3">
                    <button
                        onClick={handleDebugConnections}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Consultando...' : 'Debug Conexiones'}
                    </button>
                </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Flujos de Notificaciones Implementados:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• <strong>Usuario → Admin/Soporte:</strong> Cuando un usuario firma un acta (digital o PDF)</li>
                    <li>• <strong>Admin/Soporte → Usuario:</strong> Cuando se rechaza un acta</li>
                    <li>• <strong>Admin/Soporte → Usuario:</strong> Cuando se marca como pendiente de firma</li>
                    <li>• <strong>Admin/Soporte → Usuario:</strong> Cuando admin/soporte sube un acta</li>
                    <li>• <strong>Admin/Soporte → Usuario:</strong> Cuando se aprueba un acta</li>
                    <li>• <strong>Admin/Soporte → Admin/Soporte:</strong> Cuando se crea un usuario o activo</li>
                    <li>• <strong>Admin/Soporte → Admin/Soporte/Usuario:</strong> Cuando se asigna un activo a un usuario</li>
                </ul>
            </div>

            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Instrucciones de Prueba:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>Prueba 1:</strong> Haz clic en "Backend: Directa" - deberías recibir una notificación inmediatamente</li>
                    <li>• <strong>Prueba 2:</strong> Si eres admin, haz clic en "Backend: Admins" - deberías recibir notificación</li>
                    <li>• <strong>Prueba 3:</strong> Si eres soporte, haz clic en "Backend: Rol Soporte" - deberías recibir notificación</li>
                    <li>• <strong>Prueba 4:</strong> "Creación Usuario" - simula notificación cuando se crea un usuario</li>
                    <li>• <strong>Prueba 5:</strong> "Creación Activo" - simula notificación cuando se crea un activo</li>
                    <li>• <strong>Prueba 6:</strong> "Asignación Activo" - simula notificación cuando se asigna un activo</li>
                    <li>• <strong>Prueba 7:</strong> "Test Rechazo Acta" - simula un rechazo de acta para el usuario 4</li>
                    <li>• <strong>Verificación:</strong> Revisa la campanita en el header para ver las notificaciones</li>
                </ul>
            </div>
        </div>
    );
};

export default TestNotifications;
