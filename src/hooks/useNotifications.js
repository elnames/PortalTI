import { useEffect, useState, useCallback } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import api from "../services/api";
import { getApiBaseUrl } from "../config";

export default function useNotifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [connection, setConnection] = useState(null);
  const MAX_ITEMS = 30;

  const load = useCallback(async () => {
    try {
      // Traer últimas notificaciones (leídas y no leídas) para no perder historial reciente
      const { data } = await api.get("/notifications?take=" + MAX_ITEMS);
      setItems(Array.isArray(data) ? data : []);
      setUnread((Array.isArray(data) ? data : []).filter(n => !n.isRead).length);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    }
  }, []);

  // Desactivado recuento independiente por 500 en backend; usamos carga completa como en chat

  const markAllRead = async () => {
    try {
      const ids = items.map(x => x.id);
      if (!ids.length) return;
      await api.post("/notifications/read", { ids });
      const updated = items.map(item => ({ ...item, isRead: true }));
      setItems(updated);
      setUnread(0);
      // Limpieza progresiva: borrar en backend los más antiguos leídos si excede MAX_ITEMS
      cleanupOldRead(updated);
    } catch (error) {
      console.error("Error marcando notificaciones como leídas:", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post("/notifications/read", { ids: [id] });
      setItems(prev => {
        const next = prev.map(item => item.id === id ? { ...item, isRead: true } : item);
        setUnread(next.filter(n => !n.isRead).length);
        return next;
      });
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setItems(prev => prev.filter(n => n.id !== id));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error eliminando notificación:", error);
    }
  };

  const deleteAll = async () => {
    try {
      await api.delete('/notifications');
      setItems([]);
      setUnread(0);
    } catch (error) {
      console.error('Error eliminando todas las notificaciones:', error);
    }
  };

  // Elimina progresivamente notificaciones leídas más antiguas si excede MAX_ITEMS
  const cleanupOldRead = useCallback(async (current = items) => {
    try {
      const list = [...current];
      if (list.length <= MAX_ITEMS) return;
      const readOldest = list
        .filter(n => n.isRead)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const overflow = list.length - MAX_ITEMS;
      const toDelete = readOldest.slice(0, Math.min(overflow, 10)); // borrar como máximo 10 por ciclo
      for (const n of toDelete) {
        try { await api.delete(`/notifications/${n.id}`); } catch { }
      }
      // Refrescar lista después de limpiar
      load();
    } catch (e) {
      // silencioso
    }
  }, [items, load]);

  useEffect(() => {
    load();

    // Configurar SignalR con manejo simplificado
    const token = localStorage.getItem("token");
    if (!token) return;

    // Evitar múltiples conexiones
    if (window.notificationsHubConnection) {
      setConnection(window.notificationsHubConnection);
      return;
    }

    const conn = new HubConnectionBuilder()
      .withUrl(`${getApiBaseUrl()}/hubs/notifications?access_token=${token}`, {
        skipNegotiation: true,
        transport: 1,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount < 3) return 2000;
          return 10000;
        }
      })
      .configureLogging("error")
      .build();

    const startConnection = async () => {
      try {
        if (conn.state === "Connected" || conn.state === "Connecting") {
          return;
        }

        await conn.start();
        setConnection(conn);
        window.notificationsHubConnection = conn;
        load();
      } catch (err) {
        // Solo mostrar errores que no sean de conexión
        if (!err.message?.includes('connection was stopped') &&
          !err.message?.includes('negotiation') &&
          !err.message?.includes('AbortError') &&
          !err.message?.includes('Failed to start the HttpConnection before stop()')) {
          console.error("Error conectando NotificationsHub:", err);
        }
      }
    };

    // Intentar conectar con delay para evitar conflictos
    const connectTimeout = setTimeout(() => {
      startConnection();
    }, 1000);

    const handleReceive = (notification) => {
      setItems(prev => {
        const filtered = prev.filter(n => n.id !== notification.id);
        const next = [notification, ...filtered].slice(0, MAX_ITEMS);
        setUnread(next.filter(n => !n.isRead).length);
        return next;
      });
    };

    conn.on("ReceiveNotification", handleReceive);

    conn.onclose(() => {
      setConnection(null);
      window.notificationsHubConnection = null;
    });

    return () => {
      clearTimeout(connectTimeout);
      try {
        conn.off("ReceiveNotification", handleReceive);
      } catch { }
      try {
        if (conn.state === "Connected") {
          conn.stop();
        }
      } catch { }
    };
  }, [load]);

  // Polling de respaldo (como en chat): recargar lista periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      load();
    }, 5000);
    return () => clearInterval(interval);
  }, [load]);

  return {
    items,
    unread,
    markAllRead,
    markAsRead,
    deleteNotification,
    deleteAll,
    connection
  };
}
