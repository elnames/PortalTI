// src/config/microsoftConfig.js
// Configuración temporal para Microsoft Graph API

export const microsoftConfig = {
    // Configuración para desarrollo local
    clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID || 'demo-client-id',
    tenantId: process.env.REACT_APP_MICROSOFT_TENANT_ID || 'common',
    redirectUri: process.env.REACT_APP_MICROSOFT_REDIRECT_URI || `${window.location.origin}/auth/microsoft/callback`,

    // URLs de Microsoft Graph
    authority: 'https://login.microsoftonline.com/common',
    graphEndpoint: 'https://graph.microsoft.com/v1.0',

    // Scopes necesarios
    scopes: [
        'https://graph.microsoft.com/calendars.readwrite',
        'https://graph.microsoft.com/user.read',
        'https://graph.microsoft.com/onlineMeetings.readwrite'
    ],

    // Configuración de la aplicación
    isConfigured: () => {
        const clientId = process.env.REACT_APP_MICROSOFT_CLIENT_ID;
        return clientId && clientId !== 'your-client-id' && clientId !== 'demo-client-id';
    }
};

export default microsoftConfig;
