// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const { showInfo, showSuccess, showWarning, showError } = useToast();

    // ===== FUNCIONES PARA NOTIFICACIONES (Persistentes en BD) =====
    // Estas se almacenan en la base de datos y aparecen en la campanita

    const createNotification = async (notificationData) => {
        try {
            await api.post('/notifications', notificationData);
        } catch (error) {
            console.error('Error creando notificación:', error);
        }
    };

    const createNotificationForRole = async (role, notificationData) => {
        try {
            await api.post(`/notifications/role/${role}`, notificationData);
        } catch (error) {
            console.error(`Error creando notificación para rol ${role}:`, error);
        }
    };

    const createNotificationForAdmins = async (notificationData) => {
        try {
            await api.post('/notifications/admins', notificationData);
        } catch (error) {
            console.error('Error creando notificación para admins:', error);
        }
    };

    // ===== FUNCIONES PARA NOTIFICACIONES (Persistentes en BD) =====
    // Estas se almacenan en la base de datos y aparecen en la campanita

    const notifyActivoCreated = (activo) => {
        createNotification({
            userId: user?.id,
            tipo: 'asset',
            titulo: 'Nuevo activo registrado',
            mensaje: `Se ha registrado un nuevo activo: ${activo.nombre || activo.codigo}`,
            refTipo: 'Activo',
            refId: activo.id,
            ruta: `/activos/${activo.id}`
        });
    };

    const notifyActivoAssigned = (activo, usuario) => {
        if (!activo || !usuario) {
            console.warn('notifyActivoAssigned: activo o usuario es undefined');
            return;
        }

        createNotification({
            userId: usuario.id,
            tipo: 'assignment',
            titulo: 'Activo asignado',
            mensaje: `Se te ha asignado el activo: ${activo.nombre || activo.codigo}`,
            refTipo: 'Activo',
            refId: activo.id,
            ruta: `/activos/${activo.id}`
        });
    };

    const notifyTicketCreated = (ticket) => {
        createNotification({
            userId: user?.id,
            tipo: 'ticket',
            titulo: 'Nuevo ticket creado',
            mensaje: `Se ha creado un nuevo ticket: ${ticket.titulo || `#${ticket.id}`}`,
            refTipo: 'Ticket',
            refId: ticket.id,
            ruta: `/tickets/${ticket.id}`
        });
    };

    const notifyTicketAssigned = (ticket, usuario) => {
        createNotification({
            userId: usuario.id,
            tipo: 'ticket',
            titulo: 'Ticket asignado',
            mensaje: `Se te ha asignado el ticket: ${ticket.titulo || `#${ticket.id}`}`,
            refTipo: 'Ticket',
            refId: ticket.id,
            ruta: `/tickets/${ticket.id}`
        });
    };

    const notifyTicketUpdated = (ticket) => {
        createNotification({
            userId: user?.id,
            tipo: 'ticket',
            titulo: 'Ticket actualizado',
            mensaje: `El ticket ${ticket.titulo || `#${ticket.id}`} ha sido actualizado`,
            refTipo: 'Ticket',
            refId: ticket.id,
            ruta: `/tickets/${ticket.id}`
        });
    };

    const notifyUserCreated = (usuario) => {
        createNotification({
            userId: user?.id,
            tipo: 'user',
            titulo: 'Nuevo usuario registrado',
            mensaje: `Se ha registrado un nuevo usuario: ${usuario.nombre || usuario.username}`,
            refTipo: 'Usuario',
            refId: usuario.id,
            ruta: `/usuarios/${usuario.id}`
        });
    };

    const notifySystemUpdate = (message) => {
        createNotification({
            userId: user?.id,
            tipo: 'system',
            titulo: 'Actualización del sistema',
            mensaje: message,
            refTipo: 'Sistema',
            refId: null,
            ruta: null
        });
    };

    // Nueva función para notificaciones de Paz y Salvo
    const notifyPazYSalvoUploaded = (usuario, activosPendientes = []) => {
        const message = activosPendientes.length > 0
            ? `Paz y salvo subido para ${usuario.nombre}. ${activosPendientes.length} activos pendientes de devolución.`
            : `Paz y salvo subido para ${usuario.nombre}`;

        createNotification({
            userId: user?.id,
            tipo: 'pazysalvo',
            titulo: 'Paz y Salvo subido',
            mensaje: message,
            refTipo: 'PazYSalvo',
            refId: usuario.id,
            ruta: `/pazysalvo`
        });
    };

    const notifyActivoReturned = (activo, usuario) => {
        createNotification({
            userId: user?.id,
            tipo: 'return',
            titulo: 'Activo devuelto',
            mensaje: `El activo ${activo.codigo} ha sido devuelto por ${usuario.nombre}`,
            refTipo: 'Activo',
            refId: activo.id,
            ruta: `/activos/${activo.id}`
        });
    };

    // ===== FUNCIONES PARA NOTIFICACIONES DE ACTAS =====
    const notifyActaRechazada = (acta, usuario) => {
        createNotification({
            userId: usuario.id,
            tipo: 'acta',
            titulo: 'Acta rechazada',
            mensaje: `Tu acta para el activo ${acta.activo?.codigo || 'N/A'} ha sido rechazada. Revisa los comentarios y vuelve a subirla.`,
            refTipo: 'Acta',
            refId: acta.id,
            ruta: `/actas/${acta.id}`
        });
    };

    const notifyActaFirmada = (acta, usuario) => {
        createNotificationForAdmins({
            userId: 0, // Se asignará a todos los admins
            tipo: 'acta',
            titulo: 'Acta firmada por usuario',
            mensaje: `${usuario.nombre} ${usuario.apellido} ha firmado un acta para el activo ${acta.activo?.codigo || 'N/A'}`,
            refTipo: 'Acta',
            refId: acta.id,
            ruta: `/actas/${acta.id}`
        });
    };

    // ===== FUNCIONES PARA NOTIFICAR A ADMINS =====
    const notifyAdminsTicketCreated = (ticket) => {
        createNotificationForAdmins({
            userId: 0, // Se asignará a todos los admins
            tipo: 'ticket',
            titulo: 'Nuevo ticket creado',
            mensaje: `Se ha creado un nuevo ticket: ${ticket.titulo || `#${ticket.id}`} por ${ticket.nombreSolicitante}`,
            refTipo: 'Ticket',
            refId: ticket.id,
            ruta: `/tickets/${ticket.id}`
        });
    };

    const notifyAdminsActivoCreated = (activo) => {
        createNotificationForAdmins({
            userId: 0, // Se asignará a todos los admins
            tipo: 'asset',
            titulo: 'Nuevo activo registrado',
            mensaje: `Se ha registrado un nuevo activo: ${activo.nombre || activo.codigo} por ${user?.nombre || user?.username}`,
            refTipo: 'Activo',
            refId: activo.id,
            ruta: `/activos/${activo.id}`
        });
    };

    const notifyAdminsUserCreated = (usuario) => {
        createNotificationForAdmins({
            userId: 0, // Se asignará a todos los admins
            tipo: 'user',
            titulo: 'Nuevo usuario registrado',
            mensaje: `Se ha registrado un nuevo usuario: ${usuario.nombre} ${usuario.apellido} (${usuario.role})`,
            refTipo: 'Usuario',
            refId: usuario.id,
            ruta: `/usuarios/${usuario.id}`
        });
    };

    const notifyAdminsSystemEvent = (evento, descripcion) => {
        createNotificationForAdmins({
            userId: 0, // Se asignará a todos los admins
            tipo: 'system',
            titulo: evento,
            mensaje: descripcion,
            refTipo: 'System',
            refId: null,
            ruta: null
        });
    };

    // ===== FUNCIONES PARA ALERTAS (Toasts locales) =====
    // Estas NO se almacenan, solo aparecen como toasts temporales

    const alertError = (error) => {
        showError(error);
    };

    const alertSuccess = (message) => {
        showSuccess(message);
    };

    const alertWarning = (message) => {
        showWarning(message);
    };

    const alertInfo = (message) => {
        showInfo(message);
    };

    // Alertas específicas para acciones locales
    const alertFileUploaded = (fileName) => {
        showSuccess(`Archivo "${fileName}" subido correctamente`);
    };

    const alertConnectionError = () => {
        showError('No se pudo conectar al servidor. Verifica tu conexión.');
    };

    const alertSaveError = (error) => {
        showError(`Error al guardar cambios: ${error}`);
    };

    const alertRemoteConnection = (protocol, host) => {
        showInfo(`Iniciando conexión ${protocol} a ${host}...`);
    };



    const value = {
        // ===== FUNCIONES BASE =====
        createNotification,
        createNotificationForRole,
        createNotificationForAdmins,

        // ===== NOTIFICACIONES (Persistentes) =====
        notifyActivoCreated,
        notifyActivoAssigned,
        notifyTicketCreated,
        notifyTicketAssigned,
        notifyTicketUpdated,
        notifyUserCreated,
        notifySystemUpdate,
        notifyPazYSalvoUploaded,
        notifyActivoReturned,

        // ===== NOTIFICACIONES DE ACTAS =====
        notifyActaRechazada,
        notifyActaFirmada,

        // ===== NOTIFICACIONES PARA ADMINS =====
        notifyAdminsTicketCreated,
        notifyAdminsActivoCreated,
        notifyAdminsUserCreated,
        notifyAdminsSystemEvent,

        // ===== ALERTAS (Temporales) =====
        alertError,
        alertSuccess,
        alertWarning,
        alertInfo,
        alertFileUploaded,
        alertConnectionError,
        alertSaveError,
        alertRemoteConnection
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}; 