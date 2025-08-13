import React, { useState, useEffect } from 'react';
import { Monitor, ExternalLink, Copy, Check, Edit2, Save, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { activosAPI, chatAPI } from '../services/api';

const RemoteControlButton = ({ conversacion, activosAsignados }) => {
    const { showToast } = useToast();
    const [showModal, setShowModal] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [rustDeskIds, setRustDeskIds] = useState({});

    // Debug: mostrar los datos que llegan
    console.log('activosAsignados:', activosAsignados);
    console.log('Primer activo completo:', activosAsignados?.[0]);

    // Filtrar solo equipos que pueden usar RustDesk
    const equiposRustDesk = activosAsignados?.filter(activo => {
        console.log('Activo completo:', activo);
        console.log('Activo.Codigo:', activo?.Codigo);
        console.log('Activo.Categoria:', activo?.Categoria);
        console.log('Activo.codigo (minúscula):', activo?.codigo);
        console.log('Activo.categoria (minúscula):', activo?.categoria);
        return ['Equipos', 'Equipo'].includes(activo?.Categoria || activo?.categoria);
    }) || [];

    console.log('equiposRustDesk filtrados:', equiposRustDesk);

    const handleRemoteControl = () => {
        if (!equiposRustDesk || equiposRustDesk.length === 0) {
            showToast('El usuario no tiene equipos compatibles con RustDesk asignados', 'warning');
            return;
        }
        setShowModal(true);
    };

    const copyToClipboard = async (text, type) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(type);
            showToast(`${type} copiado al portapapeles`, 'success');
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            showToast('Error al copiar al portapapeles', 'error');
        }
    };

    const openRustDesk = (id) => {
        // Copiar el ID al portapapeles y mostrar instrucciones
        try {
            navigator.clipboard.writeText(id);
            showToast(`ID ${id} copiado al portapapeles. Abre RustDesk y pega el ID`, 'success');

            // Mostrar instrucciones adicionales
            setTimeout(() => {
                showToast('1. Abre RustDesk en tu PC 2. Pega el ID en el campo "ID" 3. Haz clic en "Conectar"', 'info');
            }, 2000);
        } catch (error) {
            showToast('Error al copiar ID. Cópialo manualmente: ' + id, 'error');
        }
    };

    const getRustDeskId = (activo) => {
        // Usar el ID guardado en el estado, sino el campo RustDeskId, sino el código como fallback
        return rustDeskIds[activo.Id || activo.id] || activo.RustDeskId || activo.rustDeskId || activo.Codigo || activo.codigo || activo.Id || activo.id;
    };

    const handleEditId = (activoId) => {
        setEditingId(activoId);
    };

    const handleSaveId = async (activoId) => {
        const newId = rustDeskIds[activoId] || '';
        if (newId.trim()) {
            try {
                await activosAPI.updateRustDeskId(activoId, newId.trim());
                setRustDeskIds(prev => ({ ...prev, [activoId]: newId.trim() }));
                setEditingId(null);
                showToast('ID de RustDesk guardado correctamente', 'success');
            } catch (error) {
                console.error('Error al guardar ID de RustDesk:', error);
                showToast('Error al guardar ID de RustDesk', 'error');
            }
        } else {
            showToast('El ID no puede estar vacío', 'error');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const enviarAsistenciaRapida = async () => {
        try {
            if (!conversacion?.id) {
                showToast('No se puede enviar asistencia: conversación no válida', 'error');
                return;
            }

            // Enviar mensaje especial al chat que active el modal en el usuario
            const mensajeEspecial = `🔧 **SOLICITUD DE CONTROL REMOTO**

El administrador/soporte necesita acceder a tu equipo para ayudarte.

**Haz clic en el botón de abajo para ver las instrucciones de configuración:**

[CONFIGURAR_RUSTDESK_MODAL]`;

            // Enviar el mensaje usando la API de chat
            await chatAPI.enviarMensaje(conversacion.id, {
                contenido: mensajeEspecial,
                esInterno: false
            });

            showToast('Solicitud enviada al usuario. El usuario verá las instrucciones de configuración.', 'success');

            // Cerrar el modal del admin
            setShowModal(false);
        } catch (error) {
            console.error('Error al enviar solicitud:', error);
            showToast('Error al enviar solicitud', 'error');
        }
    };

    // Cargar IDs de RustDesk guardados cuando se abre el modal
    useEffect(() => {
        if (showModal && equiposRustDesk.length > 0) {
            const idsGuardados = {};
            equiposRustDesk.forEach(activo => {
                if (activo.RustDeskId || activo.rustDeskId) {
                    idsGuardados[activo.Id || activo.id] = activo.RustDeskId || activo.rustDeskId;
                }
            });
            setRustDeskIds(idsGuardados);
        }
    }, [showModal, equiposRustDesk]);

    return (
        <>
            <button
                onClick={handleRemoteControl}
                className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                title="Control Remoto"
            >
                <Monitor className="w-4 h-4" />
                <span>Control Remoto</span>
            </button>

            {/* Modal de control remoto */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Control Remoto - {conversacion?.usuario?.username}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {equiposRustDesk.length} equipos compatibles con RustDesk
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
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
                        <div className="flex-1 overflow-hidden">
                            <div className="h-full flex">
                                {/* Lista de equipos */}
                                <div className="flex-1 p-6 overflow-y-auto max-h-[60vh]">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                                            Equipos Asignados
                                        </h3>
                                        {equiposRustDesk && equiposRustDesk.length > 0 ? (
                                            <div className="grid gap-2">
                                                {equiposRustDesk.map((activo) => {
                                                    const rustDeskId = getRustDeskId(activo);
                                                    return (
                                                        <div
                                                            key={activo.Id || activo.id}
                                                            className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 hover:shadow-sm transition-shadow"
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                                        {activo.Codigo || activo.codigo} - {activo.NombreEquipo || activo.nombreEquipo}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                        {activo.Categoria || activo.categoria} • {activo.TipoEquipo || activo.tipoEquipo}
                                                                    </p>
                                                                </div>
                                                                <div className="ml-3 flex-shrink-0">
                                                                    <button
                                                                        onClick={() => openRustDesk(rustDeskId)}
                                                                        className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                        <span>Copiar ID</span>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center space-x-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                        ID RustDesk:
                                                                    </label>
                                                                    <div className="flex items-center space-x-1">
                                                                        {editingId === (activo.Id || activo.id) ? (
                                                                            <input
                                                                                type="text"
                                                                                value={rustDeskIds[activo.Id || activo.id] || ''}
                                                                                onChange={(e) => setRustDeskIds(prev => ({ ...prev, [activo.Id || activo.id]: e.target.value }))}
                                                                                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                                                                placeholder="Ingresa el ID real de RustDesk"
                                                                                autoFocus
                                                                            />
                                                                        ) : (
                                                                            <input
                                                                                type="text"
                                                                                value={rustDeskId}
                                                                                readOnly
                                                                                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white truncate"
                                                                            />
                                                                        )}

                                                                        {editingId === (activo.Id || activo.id) ? (
                                                                            <div className="flex space-x-1">
                                                                                <button
                                                                                    onClick={() => handleSaveId(activo.Id || activo.id)}
                                                                                    className="p-1 text-green-500 hover:text-green-700 dark:hover:text-green-300"
                                                                                    title="Guardar ID"
                                                                                >
                                                                                    <Save className="w-4 h-4" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={handleCancelEdit}
                                                                                    className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300"
                                                                                    title="Cancelar"
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex space-x-1">
                                                                                <button
                                                                                    onClick={() => handleEditId(activo.Id || activo.id)}
                                                                                    className="p-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                                                                                    title="Editar ID"
                                                                                >
                                                                                    <Edit2 className="w-4 h-4" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => copyToClipboard(rustDeskId, `ID-${activo.Id || activo.id}`)}
                                                                                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                                                                    title="Copiar ID"
                                                                                >
                                                                                    {copiedId === `ID-${activo.Id || activo.id}` ? (
                                                                                        <Check className="w-4 h-4 text-green-500" />
                                                                                    ) : (
                                                                                        <Copy className="w-4 h-4" />
                                                                                    )}
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                El usuario no tiene equipos asignados para control remoto.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Panel lateral con instrucciones */}
                                <div className="w-80 p-6 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                                        <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-3">
                                            Instrucciones
                                        </h3>
                                        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                                            <li className="flex items-start">
                                                <span className="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
                                                <strong>Para ti:</strong> Asegúrate de tener RustDesk instalado
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
                                                <strong>Para el usuario:</strong> Debe tener RustDesk ejecutándose
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
                                                Haz clic en "Editar ID" para ingresar el ID real de RustDesk
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
                                                El ID aparece en la ventana principal de RustDesk del usuario
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
                                                <strong>Importante:</strong> El usuario debe autorizar la conexión
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
                                                <strong>Recomendado:</strong> Usa "Asistencia Rápida" para guiar al usuario
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
                                                <strong>Nota:</strong> El botón "Conectar" copia el ID al portapapeles
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                                            Guía de Configuración
                                        </h3>
                                        <div className="space-y-2">
                                            <button
                                                onClick={enviarAsistenciaRapida}
                                                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                <span>Mostrar Guía de Configuración</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RemoteControlButton;
