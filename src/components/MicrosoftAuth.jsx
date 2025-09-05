// src/components/MicrosoftAuth.jsx
import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { microsoftConfig } from '../config/microsoftConfig';
import {
    CheckCircle,
    AlertCircle,
    LogOut,
    User,
    Calendar,
    Building2,
    ExternalLink
} from 'lucide-react';

const MicrosoftAuth = ({ onAuthSuccess, onAuthError }) => {
    const { showToast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    // Verificar si ya está autenticado al cargar el componente
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        const token = localStorage.getItem('microsoftAccessToken');
        if (token) {
            try {
                // Verificar si el token es válido haciendo una llamada simple
                const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const user = await response.json();
                    setUserInfo(user);
                    setIsAuthenticated(true);
                    onAuthSuccess?.(user);
                } else {
                    // Token inválido, limpiar
                    localStorage.removeItem('microsoftAccessToken');
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Error verificando autenticación:', error);
                localStorage.removeItem('microsoftAccessToken');
                setIsAuthenticated(false);
            }
        }
    };

    const handleMicrosoftLogin = async () => {
        try {
            setLoading(true);

            // Verificar si la configuración está lista
            if (!microsoftConfig.isConfigured()) {
                showToast('Configuración de Microsoft no encontrada. Consulta la documentación para configurar Azure AD.', 'warning');
                return;
            }

            // Configuración de Microsoft Graph
            const clientId = microsoftConfig.clientId;
            const redirectUri = microsoftConfig.redirectUri;
            const scope = microsoftConfig.scopes.join(' ');

            // URL de autorización de Microsoft
            const authUrl = `${microsoftConfig.authority}/oauth2/v2.0/authorize?` +
                `client_id=${clientId}&` +
                `response_type=code&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `response_mode=query&` +
                `scope=${encodeURIComponent(scope)}&` +
                `state=calendar_auth`;

            // Abrir ventana de autenticación
            const authWindow = window.open(
                authUrl,
                'microsoft-auth',
                'width=500,height=600,scrollbars=yes,resizable=yes'
            );

            // Escuchar el mensaje de la ventana de autenticación
            const messageListener = (event) => {
                if (event.origin !== window.location.origin) return;

                if (event.data.type === 'MICROSOFT_AUTH_SUCCESS') {
                    const { accessToken, user } = event.data;
                    localStorage.setItem('microsoftAccessToken', accessToken);
                    setUserInfo(user);
                    setIsAuthenticated(true);
                    onAuthSuccess?.(user);
                    showToast('Autenticación con Microsoft exitosa', 'success');
                    authWindow.close();
                    window.removeEventListener('message', messageListener);
                } else if (event.data.type === 'MICROSOFT_AUTH_ERROR') {
                    showToast('Error en la autenticación con Microsoft', 'error');
                    onAuthError?.(event.data.error);
                    authWindow.close();
                    window.removeEventListener('message', messageListener);
                }
            };

            window.addEventListener('message', messageListener);

            // Limpiar el listener si la ventana se cierra manualmente
            const checkClosed = setInterval(() => {
                if (authWindow.closed) {
                    window.removeEventListener('message', messageListener);
                    clearInterval(checkClosed);
                    setLoading(false);
                }
            }, 1000);

        } catch (error) {
            console.error('Error iniciando autenticación:', error);
            showToast('Error al iniciar autenticación con Microsoft', 'error');
            onAuthError?.(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('microsoftAccessToken');
        setUserInfo(null);
        setIsAuthenticated(false);
        showToast('Sesión de Microsoft cerrada', 'info');
    };

    if (isAuthenticated && userInfo) {
        return (
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">
                        Conectado con Microsoft
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                        {userInfo.displayName || userInfo.userPrincipalName}
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg transition-colors"
                    title="Cerrar sesión"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        );
    }

    // Mostrar instrucciones de configuración si no está configurado
    if (!microsoftConfig.isConfigured()) {
        return (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Configuración Requerida
                        </h3>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            Microsoft Teams no está configurado
                        </p>
                    </div>
                </div>

                <div className="space-y-2 text-xs text-amber-700 dark:text-amber-300">
                    <p>Para usar las reuniones de Teams, necesitas:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Registrar la aplicación en Azure AD</li>
                        <li>Configurar las variables de entorno</li>
                        <li>Obtener el Client ID real</li>
                    </ol>
                </div>

                <button
                    onClick={() => window.open('/docs/MICROSOFT_TEAMS_SETUP.md', '_blank')}
                    className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors text-sm"
                >
                    <ExternalLink className="w-4 h-4" />
                    Ver Guía de Configuración
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Integración con Microsoft Teams
                    </h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                        Conecta tu cuenta para crear reuniones automáticamente
                    </p>
                </div>
            </div>

            <button
                onClick={handleMicrosoftLogin}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors"
            >
                {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Building2 className="w-4 h-4" />
                )}
                {loading ? 'Conectando...' : 'Conectar con Microsoft'}
            </button>

            <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                <div className="flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3" />
                    <span>Crear reuniones automáticamente</span>
                </div>
                <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>Gestionar participantes</span>
                </div>
            </div>
        </div>
    );
};

export default MicrosoftAuth;
