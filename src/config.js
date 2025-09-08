// src/config.js

// Para usar estas variables en desarrollo local
/*
REACT_APP_API_URL=http://localhost:5266/api
REACT_APP_FRONTEND_URL=http://localhost:3000
*/

// Configuración centralizada usando variables de entorno
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5266/api';
export const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';
export const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000;
export const SIGNALR_TIMEOUT = parseInt(process.env.REACT_APP_SIGNALR_TIMEOUT) || 10000;
export const DEBUG = process.env.REACT_APP_DEBUG === 'true';

export const config = {
  api: {
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT
  },
  frontend: {
    url: FRONTEND_URL
  },
  signalr: {
    timeout: SIGNALR_TIMEOUT
  },
  debug: DEBUG
};

// Función para actualizar la URL del API dinámicamente
export const updateApiUrl = (newUrl) => {
  // Actualizar la variable de entorno en tiempo de ejecución
  process.env.REACT_APP_API_URL = newUrl;
  // Actualizar la configuración
  config.api.baseURL = newUrl;
  console.log('API URL actualizada a:', newUrl);
};

// Función para obtener la URL base sin /api
export const getApiBaseUrl = () => {
  return config.api.baseURL.replace('/api', '');
}; 