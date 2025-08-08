// src/services/api.js
import axios from 'axios';

// Configuración base de axios
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5266/api',
    timeout: 30000,
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Función para verificar la salud de la API
export const checkApiHealth = async () => {
    try {
        await api.get('/actas/test');
        return true;
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
};

// Función para verificar la salud de la API de tickets para usuarios autenticados
export const checkTicketsApiHealth = async () => {
    try {
        await api.get('/tickets/health-user');
        return true;
    } catch (error) {
        console.error('Tickets API health check failed:', error);
        return false;
    }
};

// Métodos para Actas
export const actasAPI = {
    getMisActas: () => api.get('/actas/mis-actas'),
    getActasPendientesAprobacion: () => api.get('/actas/pendientes-aprobacion'),
    getTodasActas: () => api.get('/actas/todas'),
    firmarDigital: (data) => api.post('/actas/firmar-digital', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    subirPdf: (formData) => api.post('/actas/subir-pdf', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    subirActaAdmin: (formData) => api.post('/actas/subir-admin', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

    // Endpoints de previsualización según el flujo completo
    previsualizarActa: (asignacionId) => api.get(`/actas/previsualizar/${asignacionId}`, { responseType: 'blob' }),
    previsualizarActaFirmado: (actaId) => api.get(`/actas/previsualizar-firmado/${actaId}`, { responseType: 'blob' }),
    descargarActa: (actaId) => api.get(`/actas/${actaId}/descargar`, { responseType: 'blob' }),

    // Endpoint para previsualización personalizada
    previsualizarActaPersonalizada: (id, params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.incluirFirmaTI !== undefined) {
            queryParams.append('incluirFirmaTI', params.incluirFirmaTI.toString());
        }
        if (params.fechaEntrega) {
            queryParams.append('fechaEntrega', params.fechaEntrega);
        }
        const url = `/actas/previsualizar-personalizada/${id}?${queryParams}`;
        console.log('URL de previsualización:', url);
        return api.get(url, { responseType: 'blob' });
    },

    // Endpoints de acción
    aprobarActa: (actaId, data) => api.post(`/actas/${actaId}/aprobar`, data),
    eliminarActa: (actaId) => api.delete(`/actas/${actaId}`),
    subirFirma: (formData) => api.post('/actas/subir-firma', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    marcarPendienteFirma: (data) => api.post('/actas/marcar-pendiente-firma', data)
};

// Métodos para Asignaciones (incluye generación de actas)
export const asignacionesAPI = {
    getAll: () => api.get('/asignaciones'),
    getByActivo: (activoId) => api.get(`/asignaciones/activo/${activoId}`),
    getByUsuario: (usuarioId) => api.get(`/asignaciones/usuario/${usuarioId}`),
    getActivas: () => api.get('/asignaciones/activas'),
    create: (data) => api.post('/asignaciones', data),
    devolver: (asignacionId, data) => api.put(`/asignaciones/${asignacionId}/devolver`, data),
    generarActa: (asignacionId, params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.includeSignature !== undefined) {
            queryParams.append('includeSignature', params.includeSignature);
        }
        if (params.fechaEntrega) {
            queryParams.append('fechaEntrega', params.fechaEntrega);
        }
        return api.get(`/asignaciones/${asignacionId}/acta?${queryParams}`, { responseType: 'blob' });
    },
    subirActaFirmada: (asignacionId, formData) => api.post(`/asignaciones/${asignacionId}/acta-firmada`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    crearActasPendientes: () => api.post('/asignaciones/crear-actas-pendientes'),
    generarDatosPrueba: () => api.post('/asignaciones/generar-datos-prueba')
};

// Métodos para Usuarios
export const usuariosAPI = {
    getAll: () => api.get('/usuarios'),
    getById: (id) => api.get(`/usuarios/${id}`),
    create: (data) => api.post('/usuarios', data),
    update: (id, data) => api.put(`/usuarios/${id}`, data),
    delete: (id) => api.delete(`/usuarios/${id}`),
    getActivosAsignados: (usuarioId) => api.get(`/usuarios/${usuarioId}/activos-asignados`)
};

// Métodos para Activos
export const activosAPI = {
    getAll: () => api.get('/activos'),
    getById: (id) => api.get(`/activos/${id}`),
    create: (data) => api.post('/activos', data),
    update: (id, data) => api.put(`/activos/${id}`, data),
    delete: (id) => api.delete(`/activos/${id}`),
    getDisponibles: () => api.get('/activos/disponibles'),
    getAsignados: () => api.get('/activos/asignados'),
    getEnMantenimiento: () => api.get('/activos/en-mantenimiento'),
    getRetirados: () => api.get('/activos/retirados'),
    darBaja: (id, motivo) => api.put(`/activos/${id}/dar-baja`, { motivoBaja: motivo })
};

// Métodos para Tickets
export const ticketsAPI = {
    getAll: () => api.get('/tickets'),
    getById: (id) => api.get(`/tickets/${id}`),
    create: (data) => api.post('/tickets', data),
    update: (id, data) => api.put(`/tickets/${id}`, data),
    delete: (id) => api.delete(`/tickets/${id}`),
    getMisTickets: () => api.get('/tickets/mis-tickets'),
    getComentarios: (ticketId) => api.get(`/tickets/${ticketId}/comentarios`),
    agregarComentario: (ticketId, data) => api.post(`/tickets/${ticketId}/comentarios`, data),
    subirArchivo: (ticketId, formData) => api.post(`/tickets/${ticketId}/archivos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    descargarArchivo: (ticketId, archivoId) => api.get(`/tickets/${ticketId}/archivos/${archivoId}`, { responseType: 'blob' })
};

// Métodos para Dashboard
export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
    getRecentActivity: () => api.get('/dashboard/recent-activity'),
    getChartData: () => api.get('/dashboard/chart-data')
};

// Métodos para Autenticación
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    refresh: () => api.post('/auth/refresh'),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.put('/auth/change-password', data),
    uploadSignature: (formData) => api.post('/auth/upload-signature', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
};

// Métodos para Reportes
export const reportesAPI = {
    getActivosReport: (filters = {}) => api.get('/reportes/activos', { params: filters }),
    getAsignacionesReport: (filters = {}) => api.get('/reportes/asignaciones', { params: filters }),
    getTicketsReport: (filters = {}) => api.get('/reportes/tickets', { params: filters }),
    exportToExcel: (reportType, filters = {}) => api.get(`/reportes/${reportType}/excel`, {
        params: filters,
        responseType: 'blob'
    })
};

// Métodos para Notificaciones
export const notificacionesAPI = {
    getMisNotificaciones: () => api.get('/notificaciones/mis-notificaciones'),
    marcarComoLeida: (notificacionId) => api.put(`/notificaciones/${notificacionId}/leer`),
    marcarTodasComoLeidas: () => api.put('/notificaciones/marcar-todas-leidas'),
    getNoLeidas: () => api.get('/notificaciones/no-leidas')
};

// Métodos para Chat
export const chatAPI = {
    getConversaciones: () => api.get('/chat/conversaciones'),
    getConversacion: (id) => api.get(`/chat/conversaciones/${id}`),
    getSoporteDisponible: () => api.get('/chat/soporte-disponible'),
    crearConversacion: (data) => api.post('/chat/conversaciones', data),
    getMensajes: (conversacionId) => api.get(`/chat/conversaciones/${conversacionId}/mensajes`),
    enviarMensaje: (conversacionId, data) => api.post(`/chat/conversaciones/${conversacionId}/mensajes`, data),
    asignarSoporte: (conversacionId, data) => api.put(`/chat/conversaciones/${conversacionId}/asignar`, data),
    cerrarConversacion: (conversacionId) => api.put(`/chat/conversaciones/${conversacionId}/cerrar`),
    generarTicket: (conversacionId, data) => api.post(`/chat/conversaciones/${conversacionId}/generar-ticket`, data),
    getActivosUsuario: (conversacionId) => api.get(`/chat/conversaciones/${conversacionId}/activos-usuario`)
};

export default api;
