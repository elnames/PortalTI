// src/components/RemoteConnectionManager.jsx
import React, { useState, useEffect } from 'react';
import { Monitor, ExternalLink, Copy, CheckCircle, XCircle, Edit2, Save, X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { activosAPI } from '../services/api';

export default function RemoteConnectionManager({ activoData, onDataUpdated }) {
    const { showToast } = useToast();
    const [copiedProtocol, setCopiedProtocol] = useState(null);
    const [editingField, setEditingField] = useState(null);
    const [connectionData, setConnectionData] = useState({
        rustDeskId: '',
        rustDeskPassword: '',
        anyDeskId: '',
        anyDeskPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        rustDesk: false,
        anyDesk: false
    });

    // Configuración de conexiones remotas - Solo AnyDesk y RustDesk
    const connectionConfigs = [
        {
            name: 'AnyDesk',
            protocol: 'anydesk',
            icon: '🖥️',
            description: 'Conexión remota AnyDesk',
            getUrl: (id) => `anydesk://${id}`,
            getDisplayUrl: (id) => `anydesk://${id}`,
            requiresClient: true,
            clientName: 'AnyDesk',
            idField: 'anyDeskId',
            passwordField: 'anyDeskPassword'
        },
        {
            name: 'RustDesk',
            protocol: 'rustdesk',
            icon: '🔧',
            description: 'Conexión remota RustDesk',
            getUrl: (id) => `rustdesk://${id}`,
            getDisplayUrl: (id) => `rustdesk://${id}`,
            requiresClient: true,
            clientName: 'RustDesk',
            idField: 'rustDeskId',
            passwordField: 'rustDeskPassword'
        }
    ];

    // Cargar datos de conexión cuando se monta el componente
    useEffect(() => {
        if (activoData) {
            setConnectionData({
                rustDeskId: activoData.RustDeskId || activoData.rustDeskId || '',
                rustDeskPassword: activoData.RustDeskPassword || activoData.rustDeskPassword || '',
                anyDeskId: activoData.AnyDeskId || activoData.anyDeskId || '',
                anyDeskPassword: activoData.AnyDeskPassword || activoData.anyDeskPassword || ''
            });
        }
    }, [activoData]);

    const copyToClipboard = async (text, protocol) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedProtocol(protocol);
            showToast('URL copiada al portapapeles', 'success');
            setTimeout(() => setCopiedProtocol(null), 2000);
        } catch (error) {
            showToast('Error al copiar al portapapeles', 'error');
        }
    };

    const initiateConnection = (config) => {
        try {
            const id = connectionData[config.idField];
            if (!id) {
                showToast(`Primero configura el ID de ${config.name}`, 'warning');
                return;
            }

            const url = config.getUrl(id);

            // Mostrar información de conexión
            showToast(`Iniciando conexión ${config.name}...`, 'info');

            // Intentar abrir la conexión
            window.open(url, '_blank');

            // Si no se abre automáticamente, mostrar instrucciones
            setTimeout(() => {
                showToast(`Si la conexión no se abrió automáticamente, copia y pega esta URL en tu ${config.clientName}: ${url}`, 'info');
            }, 1000);

        } catch (error) {
            showToast(`Error al iniciar conexión ${config.name}: ${error.message}`, 'error');
        }
    };

    const handleEditField = (field) => {
        setEditingField(field);
    };

    const handleSaveField = async (field) => {
        const value = connectionData[field];
        if (!value.trim()) {
            showToast('El campo no puede estar vacío', 'error');
            return;
        }

        try {
            const activoId = activoData.Id || activoData.id;
            if (!activoId) {
                showToast('Error: ID de activo no encontrado', 'error');
                return;
            }

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

            setEditingField(null);
            showToast(`${field} guardado correctamente`, 'success');
            
            // Notificar al componente padre para que recargue los datos
            if (onDataUpdated) {
                onDataUpdated();
            }
        } catch (error) {
            console.error('Error al guardar campo:', error);
            showToast('Error al guardar la información', 'error');
        }
    };

    const handleCancelEdit = () => {
        setEditingField(null);
    };

    const togglePasswordVisibility = (type) => {
        setShowPasswords(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const getConnectionInfo = () => {
        return {
            hostname: activoData?.NombreEquipo || activoData?.nombreEquipo || activoData?.Codigo || activoData?.codigo || 'EQUIPO-001',
            ip: '192.168.1.100', // Esto debería venir del activo
            anydeskId: connectionData.anyDeskId,
            rustdeskId: connectionData.rustDeskId
        };
    };

    const connectionInfo = getConnectionInfo();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Monitor className="h-5 w-5 mr-2 text-blue-600" />
                    Conexión Remota
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Conecta remotamente a este equipo usando AnyDesk o RustDesk
                </p>
            </div>

            <div className="p-4">
                {/* Información del equipo */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Información de Conexión</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Hostname:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{connectionInfo.hostname}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">IP:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{connectionInfo.ip}</span>
                        </div>
                    </div>
                </div>

                {/* Configuración de credenciales */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Configuración de Credenciales</h4>

                    {/* AnyDesk */}
                    <div className="mb-4">
                        <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                            🖥️ AnyDesk
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    ID de AnyDesk:
                                </label>
                                <div className="flex items-center space-x-1">
                                    {editingField === 'anyDeskId' ? (
                                        <input
                                            type="text"
                                            value={connectionData.anyDeskId}
                                            onChange={(e) => setConnectionData(prev => ({ ...prev, anyDeskId: e.target.value }))}
                                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                            placeholder="Ingresa el ID de AnyDesk"
                                            autoFocus
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={connectionData.anyDeskId || 'No configurado'}
                                            readOnly
                                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                                        />
                                    )}
                                    {editingField === 'anyDeskId' ? (
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => handleSaveField('anyDeskId')}
                                                className="p-1 text-green-500 hover:text-green-700"
                                                title="Guardar"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="p-1 text-red-500 hover:text-red-700"
                                                title="Cancelar"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEditField('anyDeskId')}
                                            className="p-1 text-blue-500 hover:text-blue-700"
                                            title="Editar ID"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Contraseña:
                                </label>
                                <div className="flex items-center space-x-1">
                                    {editingField === 'anyDeskPassword' ? (
                                        <input
                                            type="password"
                                            value={connectionData.anyDeskPassword}
                                            onChange={(e) => setConnectionData(prev => ({ ...prev, anyDeskPassword: e.target.value }))}
                                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                            placeholder="Ingresa la contraseña"
                                            autoFocus
                                        />
                                    ) : (
                                        <input
                                            type={showPasswords.anyDesk ? "text" : "password"}
                                            value={connectionData.anyDeskPassword || '••••••••'}
                                            readOnly
                                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                                        />
                                    )}
                                    {editingField === 'anyDeskPassword' ? (
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => handleSaveField('anyDeskPassword')}
                                                className="p-1 text-green-500 hover:text-green-700"
                                                title="Guardar"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="p-1 text-red-500 hover:text-red-700"
                                                title="Cancelar"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => handleEditField('anyDeskPassword')}
                                                className="p-1 text-blue-500 hover:text-blue-700"
                                                title="Editar contraseña"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => togglePasswordVisibility('anyDesk')}
                                                className="p-1 text-gray-500 hover:text-gray-700"
                                                title={showPasswords.anyDesk ? "Ocultar" : "Mostrar"}
                                            >
                                                {showPasswords.anyDesk ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RustDesk */}
                    <div>
                        <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                            🔧 RustDesk
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    ID de RustDesk:
                                </label>
                                <div className="flex items-center space-x-1">
                                    {editingField === 'rustDeskId' ? (
                                        <input
                                            type="text"
                                            value={connectionData.rustDeskId}
                                            onChange={(e) => setConnectionData(prev => ({ ...prev, rustDeskId: e.target.value }))}
                                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                            placeholder="Ingresa el ID de RustDesk"
                                            autoFocus
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={connectionData.rustDeskId || 'No configurado'}
                                            readOnly
                                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                                        />
                                    )}
                                    {editingField === 'rustDeskId' ? (
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => handleSaveField('rustDeskId')}
                                                className="p-1 text-green-500 hover:text-green-700"
                                                title="Guardar"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="p-1 text-red-500 hover:text-red-700"
                                                title="Cancelar"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEditField('rustDeskId')}
                                            className="p-1 text-blue-500 hover:text-blue-700"
                                            title="Editar ID"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Contraseña:
                                </label>
                                <div className="flex items-center space-x-1">
                                    {editingField === 'rustDeskPassword' ? (
                                        <input
                                            type="password"
                                            value={connectionData.rustDeskPassword}
                                            onChange={(e) => setConnectionData(prev => ({ ...prev, rustDeskPassword: e.target.value }))}
                                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                            placeholder="Ingresa la contraseña"
                                            autoFocus
                                        />
                                    ) : (
                                        <input
                                            type={showPasswords.rustDesk ? "text" : "password"}
                                            value={connectionData.rustDeskPassword || '••••••••'}
                                            readOnly
                                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                                        />
                                    )}
                                    {editingField === 'rustDeskPassword' ? (
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => handleSaveField('rustDeskPassword')}
                                                className="p-1 text-green-500 hover:text-green-700"
                                                title="Guardar"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="p-1 text-red-500 hover:text-red-700"
                                                title="Cancelar"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => handleEditField('rustDeskPassword')}
                                                className="p-1 text-blue-500 hover:text-blue-700"
                                                title="Editar contraseña"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => togglePasswordVisibility('rustDesk')}
                                                className="p-1 text-gray-500 hover:text-gray-700"
                                                title={showPasswords.rustDesk ? "Ocultar" : "Mostrar"}
                                            >
                                                {showPasswords.rustDesk ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Opciones de conexión */}
                <div className="space-y-3">
                    {connectionConfigs.map((config) => {
                        const id = connectionData[config.idField];
                        const url = id ? config.getUrl(id) : '';
                        const displayUrl = id ? config.getDisplayUrl(id) : 'No configurado';

                        return (
                            <div key={config.protocol} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">{config.icon}</span>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{config.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{config.description}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{displayUrl}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {/* Botón de conexión */}
                                    <button
                                        onClick={() => initiateConnection(config)}
                                        disabled={!id}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${id
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                            }`}
                                        title={id ? `Conectar usando ${config.name}` : `Configura el ID de ${config.name} primero`}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        <span>Conectar</span>
                                    </button>

                                    {/* Botón de copiar */}
                                    {id && (
                                        <button
                                            onClick={() => copyToClipboard(url, config.protocol)}
                                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                            title="Copiar URL"
                                        >
                                            {copiedProtocol === config.protocol ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Información adicional */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                        <Monitor className="h-4 w-4 mr-2" />
                        Instrucciones de Conexión
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Configura primero el ID y contraseña de cada herramienta</li>
                        <li>• Asegúrate de tener instalado el cliente correspondiente en tu equipo</li>
                        <li>• El equipo destino debe estar encendido y conectado a la red</li>
                        <li>• El usuario debe autorizar la conexión cuando se solicite</li>
                        <li>• Para conexiones externas, verifica que los puertos estén abiertos</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}