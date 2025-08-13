// src/components/RemoteConnectionManager.jsx
import React, { useState } from 'react';
import { Monitor, ExternalLink, Copy, CheckCircle, XCircle } from 'lucide-react';
import { useNotificationContext } from '../contexts/NotificationContext';

export default function RemoteConnectionManager({ activoData }) {
    const [copiedProtocol, setCopiedProtocol] = useState(null);
    const { alertRemoteConnection, alertSuccess, alertError, alertInfo } = useNotificationContext();

    // Configuración de conexiones remotas
    const connectionConfigs = [
        {
            name: 'AnyDesk',
            protocol: 'anydesk',
            icon: '🖥️',
            description: 'Conexión remota AnyDesk',
            getUrl: (hostname) => `anydesk://${hostname}`,
            getDisplayUrl: (hostname) => `anydesk://${hostname}`,
            requiresClient: true,
            clientName: 'AnyDesk'
        },
        {
            name: 'RustDesk',
            protocol: 'rustdesk',
            icon: '🔧',
            description: 'Conexión remota RustDesk',
            getUrl: (hostname) => `rustdesk://${hostname}`,
            getDisplayUrl: (hostname) => `rustdesk://${hostname}`,
            requiresClient: true,
            clientName: 'RustDesk'
        },
        {
            name: 'RDP',
            protocol: 'rdp',
            icon: '🖥️',
            description: 'Conexión RDP (Remote Desktop)',
            getUrl: (ip) => `rdp://${ip}`,
            getDisplayUrl: (ip) => `rdp://${ip}`,
            requiresClient: true,
            clientName: 'Remote Desktop'
        },
        {
            name: 'VNC',
            protocol: 'vnc',
            icon: '👁️',
            description: 'Conexión VNC',
            getUrl: (hostname) => `vnc://${hostname}`,
            getDisplayUrl: (hostname) => `vnc://${hostname}`,
            requiresClient: true,
            clientName: 'VNC Viewer'
        },
        {
            name: 'SSH',
            protocol: 'ssh',
            icon: '🔐',
            description: 'Conexión SSH',
            getUrl: (hostname) => `ssh://${hostname}`,
            getDisplayUrl: (hostname) => `ssh://${hostname}`,
            requiresClient: true,
            clientName: 'SSH Client'
        }
    ];

    const copyToClipboard = async (text, protocol) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedProtocol(protocol);
            alertSuccess('URL copiada al portapapeles');
            setTimeout(() => setCopiedProtocol(null), 2000);
        } catch (error) {
            alertError('Error al copiar al portapapeles');
        }
    };

    const initiateConnection = (config, hostname) => {
        try {
            const url = config.getUrl(hostname);

            // Mostrar alerta de conexión
            alertRemoteConnection(config.name, hostname);

            // Intentar abrir la conexión
            window.open(url, '_blank');

            // Si no se abre automáticamente, mostrar instrucciones
            setTimeout(() => {
                if (!window.open) {
                    alertInfo(`Si la conexión no se abrió automáticamente, copia y pega esta URL en tu ${config.clientName}: ${url}`);
                }
            }, 1000);

        } catch (error) {
            alertError(`Error al iniciar conexión ${config.name}: ${error.message}`);
        }
    };

    const getConnectionInfo = () => {
        // Obtener información de conexión del activo
        // Por ahora usamos datos de ejemplo
        return {
            hostname: activoData?.nombreEquipo || 'EQUIPO-001',
            ip: '192.168.1.100',
            anydeskId: '123456789',
            rustdeskId: 'RUST-001',
            sshPort: '22',
            rdpPort: '3389'
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
                    Conecta remotamente a este equipo usando diferentes protocolos
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
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">AnyDesk ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{connectionInfo.anydeskId}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">RustDesk ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{connectionInfo.rustdeskId}</span>
                        </div>
                    </div>
                </div>

                {/* Opciones de conexión */}
                <div className="space-y-3">
                    {connectionConfigs.map((config) => {
                        const url = config.getUrl(connectionInfo.hostname);
                        const displayUrl = config.getDisplayUrl(connectionInfo.hostname);

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
                                        onClick={() => initiateConnection(config, connectionInfo.hostname)}
                                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                                        title={`Conectar usando ${config.name}`}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        <span>Conectar</span>
                                    </button>

                                    {/* Botón de copiar */}
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
                        <li>• Asegúrate de tener instalado el cliente correspondiente en tu equipo</li>
                        <li>• El equipo destino debe estar encendido y conectado a la red</li>
                        <li>• Algunas conexiones pueden requerir credenciales de acceso</li>
                        <li>• Para conexiones externas, verifica que los puertos estén abiertos</li>
                    </ul>
                </div>

                {/* Estado de servicios */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Estado de Servicios</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">RDP: Activo</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">SSH: Activo</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-gray-700 dark:text-gray-300">VNC: Inactivo</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">AnyDesk: Activo</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
