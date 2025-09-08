// config.example.js
// Copia este archivo como .env.local y actualiza las URLs

// Variables de entorno para PortalTI
// URLs de los túneles (actualizar cuando cambien)
export const EXAMPLE_ENV_VARS = {
  REACT_APP_API_URL: 'https://e18a694aa557.ngrok-free.app/api',
  REACT_APP_FRONTEND_URL: 'https://packing-race-songs-regards.trycloudflare.com',
  REACT_APP_ENV: 'development',
  REACT_APP_DEBUG: 'true',
  REACT_APP_API_TIMEOUT: '30000',
  REACT_APP_SIGNALR_TIMEOUT: '10000'
};

// Para usar estas variables en desarrollo local
/*
REACT_APP_API_URL=http://localhost:5266/api
REACT_APP_FRONTEND_URL=http://localhost:3000
REACT_APP_ENV=development
REACT_APP_DEBUG=true
REACT_APP_API_TIMEOUT=30000
REACT_APP_SIGNALR_TIMEOUT=10000
*/
