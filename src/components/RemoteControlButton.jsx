import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Monitor, ExternalLink, Copy, Check, Edit2, Save, X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { activosAPI, chatAPI } from '../services/api';

const RemoteControlButton = ({ conversacion, activosAsignados }) => {
    const { showToast } = useToast();
    const [showModal, setShowModal] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [connectionData, setConnectionData] = useState({});
    const [editingField, setEditingField] = useState(null);
    const [showPasswords, setShowPasswords] = useState({});

    // Debug: mostrar los datos que llegan
    console.log('activosAsignados:', activosAsignados);
    console.log('Primer activo completo:', activosAsignados?.[0]);

    // Filtrar equipos que pueden usar control remoto (computadoras, laptops, etc.)
    const equiposRustDesk = activosAsignados?.filter(activo => {
        console.log('Activo completo:', activo);
        console.log('Activo.Codigo:', activo?.Codigo);
        console.log('Activo.Categoria:', activo?.Categoria);
        console.log('Activo.codigo (minúscula):', activo?.codigo);
        console.log('Activo.categoria (minúscula):', activo?.categoria);

        const categoria = activo?.Categoria || activo?.categoria || '';
        const tipoEquipo = activo?.TipoEquipo || activo?.tipoEquipo || '';

        // Incluir equipos de cómputo que pueden usar control remoto
        const categoriasCompatibles = ['Equipos', 'Equipo', 'Computadoras', 'Laptops', 'PC', 'Desktop'];
        const tiposCompatibles = ['Laptop', 'Desktop', 'PC', 'Computadora', 'Estación de trabajo'];

        return categoriasCompatibles.includes(categoria) ||
            tiposCompatibles.includes(tipoEquipo) ||
            categoria.toLowerCase().includes('equipo') ||
            categoria.toLowerCase().includes('computadora') ||
            tipoEquipo.toLowerCase().includes('laptop') ||
            tipoEquipo.toLowerCase().includes('desktop') ||
            tipoEquipo.toLowerCase().includes('pc');
    }) || [];

    console.log('equiposRustDesk filtrados:', equiposRustDesk);

    const handleRemoteControl = () => {
        if (!equiposRustDesk || equiposRustDesk.length === 0) {
            showToast('El usuario no tiene equipos compatibles con control remoto asignados', 'warning');
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
        try {
            navigator.clipboard.writeText(id);
            showToast(`ID ${id} copiado al portapapeles. Abre RustDesk y pega el ID`, 'success');

            setTimeout(() => {
                showToast('1. Abre RustDesk en tu PC 2. Pega el ID en el campo "ID" 3. Haz clic en "Conectar"', 'info');
            }, 2000);
        } catch (error) {
            showToast('Error al copiar ID. Cópialo manualmente: ' + id, 'error');
        }
    };

    const openAnyDesk = (id) => {
        try {
            navigator.clipboard.writeText(id);
            showToast(`ID ${id} copiado al portapapeles. Abre AnyDesk y pega el ID`, 'success');

            setTimeout(() => {
                showToast('1. Abre AnyDesk en tu PC 2. Pega el ID en el campo "ID" 3. Haz clic en "Conectar"', 'info');
            }, 2000);
        } catch (error) {
            showToast('Error al copiar ID. Cópialo manualmente: ' + id, 'error');
        }
    };

    const handleEditField = (activoId, field) => {
        setEditingField(`${activoId}-${field}`);
    };

    const handleSaveField = async (activoId, field, value) => {
        if (!value.trim()) {
            showToast('El campo no puede estar vacío', 'error');
            return;
        }

        try {
            // Determinar qué API llamar según el campo
            if (field === 'rustDeskId') {
                await activosAPI.updateRustDeskId(activoId, value.trim());
            } else if (field === 'rustDeskPassword') {
                await activosAPI.updateRustDeskPassword(activoId, value.trim());
            } else if (field === 'anyDeskId') {
                await activosAPI.updateAnyDeskId(activoId, value.trim());
            } else if (field === 'anyDeskPassword') {
                await activosAPI.updateAnyDeskPassword(activoId, value.trim());
            }

            // Actualizar el estado local
            setConnectionData(prev => ({
                ...prev,
                [`${activoId}-${field}`]: value.trim()
            }));

            setEditingField(null);
            showToast(`${field} guardado correctamente`, 'success');
        } catch (error) {
            console.error('Error al guardar campo:', error);
            showToast('Error al guardar la información', 'error');
        }
    };

    const handleCancelFieldEdit = () => {
        setEditingField(null);
    };

    const togglePasswordVisibility = (activoId, type) => {
        setShowPasswords(prev => ({
            ...prev,
            [`${activoId}-${type}`]: !prev[`${activoId}-${type}`]
        }));
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

    // Cargar datos de conexión cuando se abre el modal
    useEffect(() => {
        if (showModal && equiposRustDesk.length > 0) {
            const connectionDataGuardado = {};

            equiposRustDesk.forEach(activo => {
                const activoId = activo.Id || activo.id;

                // Cargar todos los datos de conexión
                connectionDataGuardado[`${activoId}-rustDeskId`] = activo.RustDeskId || activo.rustDeskId || '';
                connectionDataGuardado[`${activoId}-rustDeskPassword`] = activo.RustDeskPassword || activo.rustDeskPassword || '';
                connectionDataGuardado[`${activoId}-anyDeskId`] = activo.AnyDeskId || activo.anyDeskId || '';
                connectionDataGuardado[`${activoId}-anyDeskPassword`] = activo.AnyDeskPassword || activo.anyDeskPassword || '';
            });

            setConnectionData(connectionDataGuardado);
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
            {showModal && createPortal(
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
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
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] flex flex-col relative">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Control Remoto - {conversacion?.usuario?.username}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {equiposRustDesk.length} equipos compatibles con control remoto
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
                                            Equipos Asignados - Control Remoto
                                        </h3>
                                        {equiposRustDesk && equiposRustDesk.length > 0 ? (
                                            <div className="grid gap-4">
                                                {equiposRustDesk.map((activo) => {
                                                    const activoId = activo.Id || activo.id;
                                                    const rustDeskId = connectionData[`${activoId}-rustDeskId`] || '';
                                                    const rustDeskPassword = connectionData[`${activoId}-rustDeskPassword`] || '';
                                                    const anyDeskId = connectionData[`${activoId}-anyDeskId`] || '';
                                                    const anyDeskPassword = connectionData[`${activoId}-anyDeskPassword`] || '';

                                                    return (
                                                        <div
                                                            key={activoId}
                                                            className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-sm transition-shadow"
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                                        {activo.Codigo || activo.codigo} - {activo.NombreEquipo || activo.nombreEquipo}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                        {activo.Categoria || activo.categoria} • {activo.TipoEquipo || activo.tipoEquipo}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* AnyDesk */}
                                                            <div className="mb-3">
                                                                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                                    🖥️ AnyDesk
                                                                </h5>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                                            ID:
                                                                        </label>
                                                                        <div className="flex items-center space-x-1">
                                                                            {editingField === `${activoId}-anyDeskId` ? (
                                                                                <input
                                                                                    type="text"
                                                                                    value={connectionData[`${activoId}-anyDeskId`] || ''}
                                                                                    onChange={(e) => setConnectionData(prev => ({ ...prev, [`${activoId}-anyDeskId`]: e.target.value }))}
                                                                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                                                                    placeholder="ID de AnyDesk"
                                                                                    autoFocus
                                                                                />
                                                                            ) : (
                                                                                <input
                                                                                    type="text"
                                                                                    value={anyDeskId || 'No configurado'}
                                                                                    readOnly
                                                                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                                                                                />
                                                                            )}
                                                                            {editingField === `${activoId}-anyDeskId` ? (
                                                                                <div className="flex space-x-1">
                                                                                    <button
                                                                                        onClick={() => handleSaveField(activoId, 'anyDeskId', connectionData[`${activoId}-anyDeskId`] || '')}
                                                                                        className="p-1 text-green-500 hover:text-green-700"
                                                                                        title="Guardar"
                                                                                    >
                                                                                        <Save className="w-3 h-3" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={handleCancelFieldEdit}
                                                                                        className="p-1 text-red-500 hover:text-red-700"
                                                                                        title="Cancelar"
                                                                                    >
                                                                                        <X className="w-3 h-3" />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex space-x-1">
                                                                                    <button
                                                                                        onClick={() => handleEditField(activoId, 'anyDeskId')}
                                                                                        className="p-1 text-blue-500 hover:text-blue-700"
                                                                                        title="Editar ID"
                                                                                    >
                                                                                        <Edit2 className="w-3 h-3" />
                                                                                    </button>
                                                                                    {anyDeskId && (
                                                                                        <button
                                                                                            onClick={() => openAnyDesk(anyDeskId)}
                                                                                            className="p-1 text-purple-500 hover:text-purple-700"
                                                                                            title="Copiar ID"
                                                                                        >
                                                                                            <Copy className="w-3 h-3" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                                            Contraseña:
                                                                        </label>
                                                                        <div className="flex items-center space-x-1">
                                                                            {editingField === `${activoId}-anyDeskPassword` ? (
                                                                                <input
                                                                                    type="password"
                                                                                    value={connectionData[`${activoId}-anyDeskPassword`] || ''}
                                                                                    onChange={(e) => setConnectionData(prev => ({ ...prev, [`${activoId}-anyDeskPassword`]: e.target.value }))}
                                                                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                                                                    placeholder="Contraseña"
                                                                                    autoFocus
                                                                                />
                                                                            ) : (
                                                                                <input
                                                                                    type={showPasswords[`${activoId}-anyDesk`] ? "text" : "password"}
                                                                                    value={anyDeskPassword || '••••••••'}
                                                                                    readOnly
                                                                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                                                                                />
                                                                            )}
                                                                            {editingField === `${activoId}-anyDeskPassword` ? (
                                                                                <div className="flex space-x-1">
                                                                                    <button
                                                                                        onClick={() => handleSaveField(activoId, 'anyDeskPassword', connectionData[`${activoId}-anyDeskPassword`] || '')}
                                                                                        className="p-1 text-green-500 hover:text-green-700"
                                                                                        title="Guardar"
                                                                                    >
                                                                                        <Save className="w-3 h-3" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={handleCancelFieldEdit}
                                                                                        className="p-1 text-red-500 hover:text-red-700"
                                                                                        title="Cancelar"
                                                                                    >
                                                                                        <X className="w-3 h-3" />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex space-x-1">
                                                                                    <button
                                                                                        onClick={() => handleEditField(activoId, 'anyDeskPassword')}
                                                                                        className="p-1 text-blue-500 hover:text-blue-700"
                                                                                        title="Editar contraseña"
                                                                                    >
                                                                                        <Edit2 className="w-3 h-3" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => togglePasswordVisibility(activoId, 'anyDesk')}
                                                                                        className="p-1 text-gray-500 hover:text-gray-700"
                                                                                        title={showPasswords[`${activoId}-anyDesk`] ? "Ocultar" : "Mostrar"}
                                                                                    >
                                                                                        {showPasswords[`${activoId}-anyDesk`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* RustDesk */}
                                                            <div>
                                                                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                                    🔧 RustDesk
                                                                </h5>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                                            ID:
                                                                        </label>
                                                                        <div className="flex items-center space-x-1">
                                                                            {editingField === `${activoId}-rustDeskId` ? (
                                                                                <input
                                                                                    type="text"
                                                                                    value={connectionData[`${activoId}-rustDeskId`] || ''}
                                                                                    onChange={(e) => setConnectionData(prev => ({ ...prev, [`${activoId}-rustDeskId`]: e.target.value }))}
                                                                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                                                                    placeholder="ID de RustDesk"
                                                                                    autoFocus
                                                                                />
                                                                            ) : (
                                                                                <input
                                                                                    type="text"
                                                                                    value={rustDeskId || 'No configurado'}
                                                                                    readOnly
                                                                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                                                                                />
                                                                            )}
                                                                            {editingField === `${activoId}-rustDeskId` ? (
                                                                                <div className="flex space-x-1">
                                                                                    <button
                                                                                        onClick={() => handleSaveField(activoId, 'rustDeskId', connectionData[`${activoId}-rustDeskId`] || '')}
                                                                                        className="p-1 text-green-500 hover:text-green-700"
                                                                                        title="Guardar"
                                                                                    >
                                                                                        <Save className="w-3 h-3" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={handleCancelFieldEdit}
                                                                                        className="p-1 text-red-500 hover:text-red-700"
                                                                                        title="Cancelar"
                                                                                    >
                                                                                        <X className="w-3 h-3" />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex space-x-1">
                                                                                    <button
                                                                                        onClick={() => handleEditField(activoId, 'rustDeskId')}
                                                                                        className="p-1 text-blue-500 hover:text-blue-700"
                                                                                        title="Editar ID"
                                                                                    >
                                                                                        <Edit2 className="w-3 h-3" />
                                                                                    </button>
                                                                                    {rustDeskId && (
                                                                                        <button
                                                                                            onClick={() => openRustDesk(rustDeskId)}
                                                                                            className="p-1 text-purple-500 hover:text-purple-700"
                                                                                            title="Copiar ID"
                                                                                        >
                                                                                            <Copy className="w-3 h-3" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                                            Contraseña:
                                                                        </label>
                                                                        <div className="flex items-center space-x-1">
                                                                            {editingField === `${activoId}-rustDeskPassword` ? (
                                                                                <input
                                                                                    type="password"
                                                                                    value={connectionData[`${activoId}-rustDeskPassword`] || ''}
                                                                                    onChange={(e) => setConnectionData(prev => ({ ...prev, [`${activoId}-rustDeskPassword`]: e.target.value }))}
                                                                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                                                                    placeholder="Contraseña"
                                                                                    autoFocus
                                                                                />
                                                                            ) : (
                                                                                <input
                                                                                    type={showPasswords[`${activoId}-rustDesk`] ? "text" : "password"}
                                                                                    value={rustDeskPassword || '••••••••'}
                                                                                    readOnly
                                                                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                                                                                />
                                                                            )}
                                                                            {editingField === `${activoId}-rustDeskPassword` ? (
                                                                                <div className="flex space-x-1">
                                                                                    <button
                                                                                        onClick={() => handleSaveField(activoId, 'rustDeskPassword', connectionData[`${activoId}-rustDeskPassword`] || '')}
                                                                                        className="p-1 text-green-500 hover:text-green-700"
                                                                                        title="Guardar"
                                                                                    >
                                                                                        <Save className="w-3 h-3" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={handleCancelFieldEdit}
                                                                                        className="p-1 text-red-500 hover:text-red-700"
                                                                                        title="Cancelar"
                                                                                    >
                                                                                        <X className="w-3 h-3" />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex space-x-1">
                                                                                    <button
                                                                                        onClick={() => handleEditField(activoId, 'rustDeskPassword')}
                                                                                        className="p-1 text-blue-500 hover:text-blue-700"
                                                                                        title="Editar contraseña"
                                                                                    >
                                                                                        <Edit2 className="w-3 h-3" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => togglePasswordVisibility(activoId, 'rustDesk')}
                                                                                        className="p-1 text-gray-500 hover:text-gray-700"
                                                                                        title={showPasswords[`${activoId}-rustDesk`] ? "Ocultar" : "Mostrar"}
                                                                                    >
                                                                                        {showPasswords[`${activoId}-rustDesk`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
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
                                                <strong>Para ti:</strong> Asegúrate de tener AnyDesk o RustDesk instalado
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
                                                <strong>Para el usuario:</strong> Debe tener el software ejecutándose
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
                                                Haz clic en "Editar" para configurar IDs y contraseñas
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
                                                Los IDs aparecen en la ventana principal del software
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
                                                <strong>Importante:</strong> El usuario debe autorizar la conexión
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
                                                <strong>Recomendado:</strong> Usa "Asistencia Rápida" para guiar al usuario
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
                                                <span>Enviar Guía al Usuario</span>
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
                </div>,
                document.body
            )}
        </>
    );
};

export default RemoteControlButton;
