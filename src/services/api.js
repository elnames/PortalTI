// src/services/api.js
import axios from 'axios';
import { config } from '../config';

// Configuración base de axios
const api = axios.create({
    baseURL: config.api.baseURL,
    timeout: config.api.timeout,
});

// Interceptor para agregar el token de autenticación y headers de ngrok
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log('API INTERCEPTOR - Token encontrado:', !!token);
        console.log('API INTERCEPTOR - URL:', config.url);
        console.log('API INTERCEPTOR - Method:', config.method);
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('API INTERCEPTOR - Authorization header agregado');
        } else {
            console.log('API INTERCEPTOR - No hay token, petición sin autenticación');
        }
        
        // Agregar header para evitar warning de ngrok
        if (config.baseURL && config.baseURL.includes('ngrok-free.app')) {
            config.headers['ngrok-skip-browser-warning'] = 'true';
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
    // CONSULTAS
    getMisActas: () => api.get('/actas/mis-actas'),
    getActasPendientesAprobacion: () => api.get('/actas/pendientes-aprobacion'),
    getTodasActas: () => api.get('/actas/todas'),
    getByAsignacionId: (asignacionId) => api.get(`/actas/asignacion/${asignacionId}`),

    // ACCIONES DE ACTA
    generarActaAdmin: (data) => api.post('/actas/generar', data),
    previsualizarActaTemporal: (data) => api.post('/actas/previsualizar-temporal', data, { responseType: 'blob' }),
    marcarPendienteFirma: (data) => api.post('/actas/marcar-pendiente-firma', data),
    firmarDigital: (data) => api.post('/actas/firmar-digital', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    subirPdf: (formData) => api.post('/actas/subir-pdf', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    subirActaAdmin: (formData) => api.post('/actas/subir-admin', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    aprobarActa: (actaId, data) => api.post(`/actas/${actaId}/aprobar`, data),
    rechazarActa: (actaId, data) => api.post(`/actas/${actaId}/rechazar`, data),
    marcarPendiente: (actaId) => api.post(`/actas/${actaId}/pendiente`),
    uploadPdfTI: (actaId, formData) => api.post(`/actas/${actaId}/upload-pdf-ti`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    anularActa: (actaId, data) => api.post(`/actas/${actaId}/anular`, data),
    previewAuto: (actaId) => api.get(`/actas/${actaId}/preview-auto`, { responseType: 'blob' }),

    // PREVISUALIZACIÓN Y DESCARGA
    previsualizarActa: (asignacionId) => api.get(`/actas/previsualizar/${asignacionId}`, { responseType: 'blob' }),
    previsualizarActaFirmado: (actaId) => api.get(`/actas/previsualizar-firmado/${actaId}`, { responseType: 'blob' }),
    descargarActa: (actaId) => api.get(`/actas/${actaId}/descargar`, { responseType: 'blob' }),
    previsualizarActaPersonalizada: (id, params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.incluirFirmaTI !== undefined) {
            queryParams.append('incluirFirmaTI', params.incluirFirmaTI.toString());
        }
        if (params.fechaEntrega) {
            queryParams.append('fechaEntrega', params.fechaEntrega);
        }
        const url = `/actas/previsualizar-personalizada/${id}?${queryParams}`;
        return api.get(url, { responseType: 'blob' });
    },

    // UTILIDADES
    subirFirma: (formData) => api.post('/actas/subir-firma', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    eliminarActa: (actaId) => api.delete(`/actas/${actaId}`)
};

// Métodos para Asignaciones (incluye generación de actas)
export const asignacionesAPI = {
    getAll: () => api.get('/asignaciones'),
    getById: (id) => api.get(`/asignaciones/${id}`),
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
    getMisActivos: () => api.get('/activos/mis-activos'),
    darBaja: (id, motivo) => api.put(`/activos/${id}/dar-baja`, { motivoBaja: motivo }),
    updateRustDeskId: (activoId, rustDeskId) => api.patch(`/activos/${activoId}/rustdesk-id`, { rustDeskId })
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
    getStats: () => api.get('/dashboard'),
    getRecentActivity: () => api.get('/dashboard/recent-activity'),
    getChartData: () => api.get('/dashboard/chart-data')
};

// Métodos para Autenticación
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    refresh: () => api.post('/auth/refresh'),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/me'),
    getUsuarios: () => api.get('/auth/usuarios'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.put('/auth/change-password', data),
    uploadSignature: (formData) => api.post('/auth/upload-signature', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
};

// Métodos para Reportes
export const reportesAPI = {
    getActivosReport: (filters = {}) => api.get('/reportes/activos', { params: filters }),
    getAsignacionesReport: (filters = {}) => api.get('/reportes/asignaciones', { params: filters }),
    getTicketsReport: (filters = {}) => api.get('/reportes/tickets', { params: filters }),
    getTiPerformance: (params = {}) => api.get('/reportes/ti-performance', { params }),
    exportToExcel: (reportType, filters = {}) => api.get(`/reportes/${reportType}/excel`, {
        params: filters,
        responseType: 'blob'
    }),
    // Nuevo reporte trimestral
    getRegistrosTrimestrales: (trimestre, año) => api.get('/reportes/registros-trimestrales/excel', {
        params: { trimestre, año },
        responseType: 'blob'
    })
};

// Métodos para Calendario (admin/soporte)
export const calendarioAPI = {
    getEvents: (params = {}) => api.get('/calendario/events', { params }),
    create: (data) => api.post('/calendario', data),
    getById: (id) => api.get(`/calendario/${id}`),
    update: (id, data) => api.put(`/calendario/${id}`, data),
    remove: (id) => api.delete(`/calendario/${id}`)
};

// Métodos para Notificaciones
export const notificacionesAPI = {
    getMisNotificaciones: () => api.get('/notifications'),
    marcarComoLeida: (notificacionId) => api.post('/notifications/read', { ids: [notificacionId] }),
    marcarTodasComoLeidas: () => api.post('/notifications/read', { ids: [] }),
    getNoLeidas: () => api.get('/notifications?isRead=false')
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
    getActivosUsuario: (conversacionId) => api.get(`/chat/conversaciones/${conversacionId}/activos-usuario`),

    // Nuevas funcionalidades para gestión de chats y mensajes
    archivarConversacion: (conversacionId) => api.put(`/chat/conversaciones/${conversacionId}/archivar`),
    desarchivarConversacion: (conversacionId) => api.put(`/chat/conversaciones/${conversacionId}/desarchivar`),
    eliminarConversacion: (conversacionId) => api.delete(`/chat/conversaciones/${conversacionId}`),
    eliminarMensaje: (mensajeId) => api.delete(`/chat/mensajes/${mensajeId}`),
    getConversacionesArchivadas: () => api.get('/chat/conversaciones/archivadas'),
    marcarMensajesComoLeidos: (conversacionId) => api.post(`/chat/${conversacionId}/marcar-leidos`)
};

// Métodos para Software y Seguridad
export const softwareSecurityAPI = {
    // Obtener todo el software y seguridad de un activo
    getByActivo: (activoId) => api.get(`/SoftwareSecurity/activo/${activoId}`),

    // Software
    createSoftware: (data) => api.post('/SoftwareSecurity/software', data),
    getSoftware: (id) => api.get(`/SoftwareSecurity/software/${id}`),
    updateSoftware: (id, data) => api.put(`/SoftwareSecurity/software/${id}`, data),
    deleteSoftware: (id) => api.delete(`/SoftwareSecurity/software/${id}`),

    // Programas de Seguridad
    createProgramaSeguridad: (data) => api.post('/SoftwareSecurity/seguridad', data),
    getProgramaSeguridad: (id) => api.get(`/SoftwareSecurity/seguridad/${id}`),
    updateProgramaSeguridad: (id, data) => api.put(`/SoftwareSecurity/seguridad/${id}`, data),
    deleteProgramaSeguridad: (id) => api.delete(`/SoftwareSecurity/seguridad/${id}`),

    // Licencias
    createLicencia: (data) => api.post('/SoftwareSecurity/licencia', data),
    getLicencia: (id) => api.get(`/SoftwareSecurity/licencia/${id}`),
    updateLicencia: (id, data) => api.put(`/SoftwareSecurity/licencia/${id}`, data),
    deleteLicencia: (id) => api.delete(`/SoftwareSecurity/licencia/${id}`)
};

// Métodos para Programas Estándar
export const programasEstandarAPI = {
    getAll: () => api.get('/programasestandar'),
    getByCategoria: (categoria) => api.get(`/programasestandar?categoria=${categoria}`),
    getCategorias: () => api.get('/programasestandar/categorias'),
    verificarInstalacion: (data) => api.post('/programasestandar/verificar-instalacion', data)
};

// Métodos para Paz y Salvo
export const pazYSalvoAPI = {
    getAll: () => api.get('/pazysalvo'),
    getById: (id) => api.get(`/pazysalvo/${id}`),
    create: (formData) => api.post('/pazysalvo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, data) => api.put(`/pazysalvo/${id}`, data),
    delete: (id) => api.delete(`/pazysalvo/${id}`),
    eliminar: (id) => api.delete(`/pazysalvo/${id}/eliminar`),
    download: (id) => api.get(`/pazysalvo/download/${id}`, { responseType: 'blob' }),
    preview: (id) => api.get(`/pazysalvo/preview/${id}`),
    getActivosPendientes: (usuarioId) => api.get(`/pazysalvo/activos-pendientes/${usuarioId}`),
    getActivosPendientesTodos: () => api.get('/pazysalvo/activos-pendientes-todos'),
    marcarActivoDevuelto: (data) => api.post('/pazysalvo/marcar-activo-devuelto', data)
};

export const systemConfigAPI = {
    getConfig: () => api.get('/systemconfig'),
    updateConfig: (config) => api.put('/systemconfig', config),
    createBackup: () => api.post('/systemconfig/backup'),
    toggleMaintenance: (enabled, message) => api.post('/systemconfig/maintenance', { enabled, message }),
    getStats: () => api.get('/systemconfig/stats'),
    initializeConfig: () => api.post('/systemconfig/initialize'),
};

export default api;
