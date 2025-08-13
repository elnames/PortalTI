import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const RustDeskModal = ({ isOpen, onClose, conversacionId, onCredencialesEnviadas }) => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [manualId, setManualId] = useState('');
    const [manualPassword, setManualPassword] = useState('');
    const [isEnviando, setIsEnviando] = useState(false);

    const descargarRustDesk = () => {
        // Descargar RustDesk desde la carpeta public
        const link = document.createElement('a');
        link.href = '/rustdesk.exe'; // Asumiendo que el archivo se llama rustdesk.exe
        link.download = 'rustdesk.exe';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Descargando RustDesk...', 'success');
    };

    const abrirRustDesk = () => {
        // Intentar abrir RustDesk si está instalado
        try {
            window.open('rustdesk://', '_blank');
            showToast('Abriendo RustDesk...', 'success');
        } catch (error) {
            showToast('RustDesk no está instalado. Descárgalo primero.', 'warning');
        }
    };

    const copiarCredenciales = async () => {
        if (manualId) {
            try {
                const credenciales = manualPassword
                    ? `ID: ${manualId}\nContraseña: ${manualPassword}`
                    : `ID: ${manualId}`;
                await navigator.clipboard.writeText(credenciales);
                showToast('Credenciales copiadas al portapapeles', 'success');
            } catch (error) {
                showToast('Error al copiar credenciales', 'error');
            }
        } else {
            showToast('Completa el ID primero', 'warning');
        }
    };

    const enviarCredenciales = async () => {
        if (!manualId) {
            showToast('Completa el ID', 'warning');
            return;
        }

        if (!conversacionId) {
            showToast('Error: No se puede enviar sin una conversación activa', 'error');
            return;
        }

        setIsEnviando(true);

        try {
            const credenciales = `🔧 **CREDENCIALES DE RUSTDESK**

**ID:** ${manualId}${manualPassword ? `\n**Contraseña:** ${manualPassword}` : ''}

El administrador puede usar estas credenciales para conectarse a tu equipo.`;

            // Importar la API de chat dinámicamente
            const { default: chatAPI } = await import('../services/api');

            // Enviar el mensaje al chat
            await chatAPI.enviarMensaje(conversacionId, {
                contenido: credenciales,
                esInterno: false,
                tipo: 'credenciales_rustdesk'
            });

            showToast('Credenciales enviadas al chat', 'success');

            // Limpiar los campos
            setManualId('');
            setManualPassword('');

            // Notificar al componente padre que se enviaron credenciales
            if (onCredencialesEnviadas) {
                onCredencialesEnviadas({
                    id: manualId,
                    password: manualPassword
                });
            }

            // Cerrar el modal
            onClose();

        } catch (error) {
            console.error('Error al enviar credenciales:', error);
            showToast('Error al enviar credenciales al chat', 'error');
        } finally {
            setIsEnviando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                🔧 Configuración de Control Remoto
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                El administrador necesita acceder a tu equipo. Sigue estos pasos:
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <span className="sr-only">Cerrar</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-6">
                        {/* Paso 1: Descargar RustDesk */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    1
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                        Descargar RustDesk
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                        Si no tienes RustDesk instalado, descárgalo desde nuestro servidor:
                                    </p>
                                    <button
                                        onClick={descargarRustDesk}
                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>Descargar RustDesk</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Paso 2: Abrir RustDesk */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    2
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                                        Abrir RustDesk
                                    </h3>
                                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                                        Ejecuta RustDesk en tu equipo. En la ventana principal verás tu ID y contraseña:
                                    </p>
                                    <button
                                        onClick={abrirRustDesk}
                                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        <span>Abrir RustDesk</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Paso 3: Ingresar ID y Contraseña */}
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    3
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                                        Ingresar ID y Contraseña
                                    </h3>
                                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                                        Copia el ID y contraseña de la ventana de RustDesk e ingrésalos aquí:
                                    </p>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    ID de RustDesk *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={manualId}
                                                    onChange={(e) => setManualId(e.target.value)}
                                                    placeholder="Ej: 12345678901234567890"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Contraseña (opcional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={manualPassword}
                                                    onChange={(e) => setManualPassword(e.target.value)}
                                                    placeholder="Si configuraste una"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={enviarCredenciales}
                                                disabled={isEnviando || !manualId}
                                                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {isEnviando ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        <span>Enviando...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                        </svg>
                                                        <span>Enviar al Chat</span>
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={copiarCredenciales}
                                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                <span>Copiar</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                            <strong>Nota:</strong> Copia el ID y contraseña directamente de la ventana de RustDesk. El ID es el número largo que aparece en la parte superior.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Paso 4: Enviar ID */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    4
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                                        Enviar tu ID
                                    </h3>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                                        Copia tu ID de RustDesk (el número largo que aparece) y envíamelo en el chat:
                                    </p>
                                    <div className="bg-white dark:bg-gray-700 border border-yellow-300 dark:border-yellow-600 rounded-lg p-3">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <strong>Ejemplo de ID:</strong> 12345678901234567890
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Paso 5: Autorizar conexión */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    5
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">
                                        Autorizar conexión
                                    </h3>
                                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                        Cuando el administrador intente conectarse, RustDesk te pedirá autorización. Haz clic en "Aceptar" y puedes marcar "Confiar en este dispositivo" para futuras conexiones.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Información importante */}
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center">
                                    ⚠️
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
                                        Información importante
                                    </h3>
                                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                                        <li>• Mantén RustDesk abierto mientras te ayuden</li>
                                        <li>• Si no ves tu ID, haz clic en "Mostrar ID" en RustDesk</li>
                                        <li>• Tu contraseña solo la necesitas si configuraste una</li>
                                        <li>• Puedes cerrar este modal y continuar con el chat</li>
                                        <li>• Copia el ID exactamente como aparece en RustDesk</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                            Entendido, continuar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RustDeskModal;
