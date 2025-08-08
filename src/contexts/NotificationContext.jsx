// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const { showInfo, showSuccess, showWarning, showError } = useToast();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Polling de respaldo para notificaciones si WebSocket no está disponible
    useEffect(() => {
        if (!user) return;
        let pollingInterval;
        pollingInterval = setInterval(async () => {
            try {
                // Ajusta la URL a tu endpoint real de notificaciones
                const res = await fetch(`/api/notifications?userId=${user.id}&role=${user.role}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        data.forEach(n => {
                            if (!notifications.some(local => local.externalId === n.externalId)) {
                                addNotification(n);
                            }
                        });
                    }
                }
            } catch (e) {
                // Error de red o backend
            }
        }, 10000); // cada 10 segundos
        return () => clearInterval(pollingInterval);
    }, [user, notifications]);

    // Cargar notificaciones desde localStorage y limpiar al cambiar de usuario
    useEffect(() => {
        if (user) {
            const stored = localStorage.getItem(`notifications_${user.id}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                setNotifications(parsed);
                setUnreadCount(parsed.filter(n => !n.read).length);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user]);

    // Guardar notificaciones en localStorage cuando cambien
    useEffect(() => {
        if (user) {
            localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
        }
    }, [notifications, user]);

    // Añade una notificación solo si corresponde al usuario/rol activo
    const addNotification = useCallback((notification) => {
        // Si la notificación tiene destinatarios, verifica si el usuario actual debe recibirla
        if (notification.to && Array.isArray(notification.to)) {
            if (!notification.to.includes(user?.id) && !notification.to.includes(user?.role)) return;
        }
        // Evita duplicados por id externo
        if (notification.externalId && notifications.some(n => n.externalId === notification.externalId)) return;
        const newNotification = {
            id: Date.now(),
            ...notification,
            timestamp: new Date().toISOString(),
            read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        // Mostrar toast según tipo
        if (notification.type === 'success') showSuccess(notification.message);
        else if (notification.type === 'error') showError(notification.message);
        else if (notification.type === 'warning') showWarning(notification.message);
        else showInfo(notification.message);
    }, [user, notifications, showSuccess, showError, showWarning, showInfo]);

    const markAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
    };

    const removeNotification = (notificationId) => {
        setNotifications(prev => {
            const notification = prev.find(n => n.id === notificationId);
            if (notification && !notification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            return prev.filter(n => n.id !== notificationId);
        });
    };

    const clearAllNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    // Funciones para notificaciones específicas de acciones
    const notifyActivoCreated = (activo) => {
        addNotification({
            type: 'asset',
            message: `Nuevo activo registrado: ${activo.nombre || activo.codigo}`,
            icon: '💻',
            data: { activoId: activo.id, tipo: 'creado' }
        });
    };

    const notifyActivoAssigned = (activo, usuario) => {
        if (!activo || !usuario) {
            console.warn('notifyActivoAssigned: activo o usuario es undefined');
            return;
        }

        addNotification({
            type: 'assignment',
            message: `Activo ${activo.nombre || activo.codigo} asignado a ${usuario.nombre || usuario.username || 'Usuario'}`,
            icon: '📋',
            data: { activoId: activo.id, usuarioId: usuario.id, tipo: 'asignado' }
        });
    };

    const notifyTicketCreated = (ticket) => {
        addNotification({
            type: 'ticket',
            message: `Nuevo ticket creado: ${ticket.titulo || `#${ticket.id}`}`,
            icon: '🎫',
            data: { ticketId: ticket.id, tipo: 'creado' }
        });
    };

    const notifyTicketAssigned = (ticket, usuario) => {
        addNotification({
            type: 'ticket',
            message: `Ticket ${ticket.titulo || `#${ticket.id}`} asignado a ${usuario.nombre || usuario.username}`,
            icon: '🎫',
            data: { ticketId: ticket.id, usuarioId: usuario.id, tipo: 'asignado' }
        });
    };

    const notifyTicketUpdated = (ticket) => {
        addNotification({
            type: 'ticket',
            message: `Ticket ${ticket.titulo || `#${ticket.id}`} actualizado`,
            icon: '🔄',
            data: { ticketId: ticket.id, tipo: 'actualizado' }
        });
    };

    const notifyUserCreated = (usuario) => {
        addNotification({
            type: 'user',
            message: `Nuevo usuario registrado: ${usuario.nombre || usuario.username}`,
            icon: '👤',
            data: { usuarioId: usuario.id, tipo: 'creado' }
        });
    };

    const notifySystemUpdate = (message) => {
        addNotification({
            type: 'system',
            message: message,
            icon: '⚙️',
            data: { tipo: 'sistema' }
        });
    };

    const notifyError = (error) => {
        addNotification({
            type: 'error',
            message: `Error: ${error}`,
            icon: '❌',
            data: { tipo: 'error' }
        });
        showError(error);
    };

    const notifySuccess = (message) => {
        addNotification({
            type: 'success',
            message: message,
            icon: '✅',
            data: { tipo: 'exito' }
        });
        showSuccess(message);
    };

    const notifyWarning = (message) => {
        addNotification({
            type: 'warning',
            message: message,
            icon: '⚠️',
            data: { tipo: 'advertencia' }
        });
        showWarning(message);
    };

    // WebSocket para notificaciones en tiempo real (deshabilitado temporalmente)
    useEffect(() => {
        if (!user) return;
        // TODO: Implementar WebSocket cuando el backend lo soporte
        // let ws;
        // const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5266/ws/notifications';
        // try {
        //     ws = new window.WebSocket(wsUrl + `?userId=${user.id}&role=${user.role}`);
        // } catch (e) {
        //     return;
        // }
        // ws.onopen = () => {
        //     // console.log('WebSocket conectado');
        // };
        // ws.onmessage = (event) => {
        //     try {
        //         const data = JSON.parse(event.data);
        //         if (Array.isArray(data)) {
        //             data.forEach(addNotification);
        //         } else {
        //             addNotification(data);
        //         }
        //     } catch (e) {
        //         // console.log('Error parseando notificación:', e);
        //     }
        // };
        // ws.onerror = (err) => {
        //     // console.log('Error en WebSocket:', err);
        // };
        // ws.onclose = () => {
        //     // console.log('WebSocket cerrado');
        // };
        // return () => {
        //     if (ws) ws.close();
        // };
    }, [user, addNotification]);

    const value = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        // Funciones específicas
        notifyActivoCreated,
        notifyActivoAssigned,
        notifyTicketCreated,
        notifyTicketAssigned,
        notifyTicketUpdated,
        notifyUserCreated,
        notifySystemUpdate,
        notifyError,
        notifySuccess,
        notifyWarning
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}; 