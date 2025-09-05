// src/pages/MicrosoftCallback.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const MicrosoftCallback = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const code = searchParams.get('code');
                const error = searchParams.get('error');
                const state = searchParams.get('state');

                if (error) {
                    throw new Error(`Error de autorización: ${error}`);
                }

                if (!code) {
                    throw new Error('No se recibió el código de autorización');
                }

                if (state !== 'calendar_auth') {
                    throw new Error('Estado de autorización inválido');
                }

                // Intercambiar código por token
                const tokenResponse = await fetch('/api/microsoft/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code,
                        redirectUri: `${window.location.origin}/auth/microsoft/callback`
                    })
                });

                if (!tokenResponse.ok) {
                    throw new Error('Error al obtener el token de acceso');
                }

                const tokenData = await tokenResponse.json();

                // Obtener información del usuario
                const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`
                    }
                });

                if (!userResponse.ok) {
                    throw new Error('Error al obtener información del usuario');
                }

                const user = await userResponse.json();

                // Enviar datos a la ventana padre
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'MICROSOFT_AUTH_SUCCESS',
                        accessToken: tokenData.access_token,
                        user: user
                    }, window.location.origin);
                }

                setStatus('success');

                // Cerrar la ventana después de un breve delay
                setTimeout(() => {
                    window.close();
                }, 2000);

            } catch (error) {
                console.error('Error en callback de Microsoft:', error);

                if (window.opener) {
                    window.opener.postMessage({
                        type: 'MICROSOFT_AUTH_ERROR',
                        error: error.message
                    }, window.location.origin);
                }

                setStatus('error');

                setTimeout(() => {
                    window.close();
                }, 3000);
            }
        };

        handleCallback();
    }, [searchParams]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Procesando autenticación...
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Por favor espera mientras configuramos tu cuenta de Microsoft
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        ¡Autenticación exitosa!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Tu cuenta de Microsoft se ha conectado correctamente. Esta ventana se cerrará automáticamente.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Error de autenticación
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Hubo un problema al conectar tu cuenta de Microsoft. Esta ventana se cerrará automáticamente.
                </p>
            </div>
        </div>
    );
};

export default MicrosoftCallback;
