import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const RustDeskModal = ({ isOpen, onClose, conversacionId, onCredencialesEnviadas }) => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [manualId, setManualId] = useState('');
    const [manualPassword, setManualPassword] = useState('');
    const [anyDeskId, setAnyDeskId] = useState('');
    const [anyDeskPassword, setAnyDeskPassword] = useState('');
    const [selectedTool, setSelectedTool] = useState('rustdesk'); // 'rustdesk' o 'anydesk'
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

    const descargarAnyDesk = () => {
        // Descargar AnyDesk desde la carpeta public
        const link = document.createElement('a');
        link.href = '/anydesk.exe'; // Asumiendo que el archivo se llama anydesk.exe
        link.download = 'anydesk.exe';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Descargando AnyDesk...', 'success');
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

    const abrirAnyDesk = () => {
        // Intentar abrir AnyDesk si está instalado
        try {
            window.open('anydesk://', '_blank');
            showToast('Abriendo AnyDesk...', 'success');
        } catch (error) {
            showToast('AnyDesk no está instalado. Descárgalo primero.', 'warning');
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
        const currentId = selectedTool === 'rustdesk' ? manualId : anyDeskId;
        const currentPassword = selectedTool === 'rustdesk' ? manualPassword : anyDeskPassword;
        const toolName = selectedTool === 'rustdesk' ? 'RUSTDESK' : 'ANYDESK';

        if (!currentId) {
            showToast('Completa el ID', 'warning');
            return;
        }

        if (!conversacionId) {
            showToast('Error: No se puede enviar sin una conversación activa', 'error');
            return;
        }

        setIsEnviando(true);

        try {
            const credenciales = `🔧 **CREDENCIALES DE ${toolName}**

**ID:** ${currentId}${currentPassword ? `\n**Contraseña:** ${currentPassword}` : ''}

El administrador puede usar estas credenciales para conectarse a tu equipo.`;

            // Importar la API de chat dinámicamente
            const { default: chatAPI } = await import('../services/api');

            // Enviar el mensaje al chat
            await chatAPI.enviarMensaje(conversacionId, {
                contenido: credenciales,
                esInterno: false,
                tipo: `credenciales_${selectedTool}`
            });

            showToast('Credenciales enviadas al chat', 'success');

            // Limpiar los campos
            setManualId('');
            setManualPassword('');
            setAnyDeskId('');
            setAnyDeskPassword('');

            // Notificar al componente padre que se enviaron credenciales
            if (onCredencialesEnviadas) {
                onCredencialesEnviadas({
                    id: currentId,
                    password: currentPassword,
                    tool: selectedTool
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

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
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

                            {/* Selector de herramienta */}
                            <div className="mt-3 flex space-x-2">
                                <button
                                    onClick={() => setSelectedTool('rustdesk')}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedTool === 'rustdesk'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    🔧 RustDesk
                                </button>
                                <button
                                    onClick={() => setSelectedTool('anydesk')}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedTool === 'anydesk'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    🖥️ AnyDesk
                                </button>
                            </div>
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
                        {/* Paso 1: Descargar herramienta */}
                        <div className={`${selectedTool === 'rustdesk' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-blue-50 dark:bg-blue-900/20'} rounded-lg p-4`}>
                            <div className="flex items-start space-x-3">
                                <div className={`flex-shrink-0 w-8 h-8 ${selectedTool === 'rustdesk' ? 'bg-purple-600' : 'bg-blue-600'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                                    1
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-medium ${selectedTool === 'rustdesk' ? 'text-purple-900 dark:text-purple-100' : 'text-blue-900 dark:text-blue-100'} mb-2`}>
                                        Descargar {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'}
                                    </h3>
                                    <p className={`text-sm ${selectedTool === 'rustdesk' ? 'text-purple-700 dark:text-purple-300' : 'text-blue-700 dark:text-blue-300'} mb-3`}>
                                        Si no tienes {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'} instalado, descárgalo desde nuestro servidor:
                                    </p>
                                    <button
                                        onClick={selectedTool === 'rustdesk' ? descargarRustDesk : descargarAnyDesk}
                                        className={`flex items-center space-x-2 px-4 py-2 ${selectedTool === 'rustdesk' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>Descargar {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Paso 2: Abrir herramienta */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    2
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                                        Abrir {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'}
                                    </h3>
                                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                                        Ejecuta {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'} en tu equipo. En la ventana principal verás tu ID y contraseña:
                                    </p>
                                    <button
                                        onClick={selectedTool === 'rustdesk' ? abrirRustDesk : abrirAnyDesk}
                                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        <span>Abrir {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Paso 3: Ingresar ID y Contraseña */}
                        <div className={`${selectedTool === 'rustdesk' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-blue-50 dark:bg-blue-900/20'} rounded-lg p-4`}>
                            <div className="flex items-start space-x-3">
                                <div className={`flex-shrink-0 w-8 h-8 ${selectedTool === 'rustdesk' ? 'bg-purple-600' : 'bg-blue-600'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                                    3
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-medium ${selectedTool === 'rustdesk' ? 'text-purple-900 dark:text-purple-100' : 'text-blue-900 dark:text-blue-100'} mb-2`}>
                                        Ingresar ID y Contraseña
                                    </h3>
                                    <p className={`text-sm ${selectedTool === 'rustdesk' ? 'text-purple-700 dark:text-purple-300' : 'text-blue-700 dark:text-blue-300'} mb-3`}>
                                        Copia el ID y contraseña de la ventana de {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'} e ingrésalos aquí:
                                    </p>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    ID de {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'} *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={selectedTool === 'rustdesk' ? manualId : anyDeskId}
                                                    onChange={(e) => selectedTool === 'rustdesk' ? setManualId(e.target.value) : setAnyDeskId(e.target.value)}
                                                    placeholder={selectedTool === 'rustdesk' ? "Ej: 12345678901234567890" : "Ej: 123456789"}
                                                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 ${selectedTool === 'rustdesk' ? 'focus:ring-purple-500 dark:focus:ring-purple-400' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Contraseña (opcional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={selectedTool === 'rustdesk' ? manualPassword : anyDeskPassword}
                                                    onChange={(e) => selectedTool === 'rustdesk' ? setManualPassword(e.target.value) : setAnyDeskPassword(e.target.value)}
                                                    placeholder="Si configuraste una"
                                                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 ${selectedTool === 'rustdesk' ? 'focus:ring-purple-500 dark:focus:ring-purple-400' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={enviarCredenciales}
                                                disabled={isEnviando || !(selectedTool === 'rustdesk' ? manualId : anyDeskId)}
                                                className={`flex items-center space-x-2 px-4 py-2 ${selectedTool === 'rustdesk' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
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
                                            <strong>Nota:</strong> Copia el ID y contraseña directamente de la ventana de {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'}. {selectedTool === 'rustdesk' ? 'El ID es el número largo que aparece en la parte superior.' : 'El ID es el número que aparece en la ventana principal.'}
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
                                        Copia tu ID de {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'} {selectedTool === 'rustdesk' ? '(el número largo que aparece)' : '(el número que aparece)'} y envíamelo en el chat:
                                    </p>
                                    <div className="bg-white dark:bg-gray-700 border border-yellow-300 dark:border-yellow-600 rounded-lg p-3">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <strong>Ejemplo de ID:</strong> {selectedTool === 'rustdesk' ? '12345678901234567890' : '123456789'}
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
                                        Cuando el administrador intente conectarse, {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'} te pedirá autorización. Haz clic en "Aceptar" y puedes marcar "Confiar en este dispositivo" para futuras conexiones.
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
                                        <li>• Mantén {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'} abierto mientras te ayuden</li>
                                        <li>• Si no ves tu ID, haz clic en "Mostrar ID" en {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'}</li>
                                        <li>• Tu contraseña solo la necesitas si configuraste una</li>
                                        <li>• Puedes cerrar este modal y continuar con el chat</li>
                                        <li>• Copia el ID exactamente como aparece en {selectedTool === 'rustdesk' ? 'RustDesk' : 'AnyDesk'}</li>
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
        </div>,
        document.body
    );
};

export default RustDeskModal;
