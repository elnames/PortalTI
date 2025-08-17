import { useEffect, useState, useCallback } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import api from "../services/api";

export default function useNotifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [connection, setConnection] = useState(null);

  const load = useCallback(async () => {
    try {
      console.log("DEBUG: Cargando notificaciones...");
      const { data } = await api.get("/notifications?isRead=false&take=20");
      console.log("DEBUG: Notificaciones cargadas:", data);
      setItems(data);
      setUnread(data.length);
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
      setUnread(0);
      setItems(prev => prev.map(item => ({ ...item, isRead: true })));
    } catch (error) {
      console.error("Error marcando notificaciones como leídas:", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post("/notifications/read", { ids: [id] });
      setUnread(prev => Math.max(0, prev - 1));
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, isRead: true } : item
      ));
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
    }
  };

  useEffect(() => {
    load();

    // Configurar SignalR (idéntico al patrón de chat): conexión global + reconexión
    const token = localStorage.getItem("token");
    if (!token) return;

    const conn = new HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_API_URL || 'http://localhost:5266'}/hubs/notifications?access_token=${token}`, {
        skipNegotiation: false,
        transport: 1
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount < 3) return 2000;
          return 10000;
        }
      })
      .configureLogging("warn")
      .build();

    const startConnection = async () => {
      try {
        console.log("DEBUG: Intentando conectar NotificationsHub...");
        await conn.start();
        console.log("NotificationsHub conectado");
        setConnection(conn);
        // Exponer global para depuración y listeners externos (mismo patrón que chat)
        window.notificationsHubConnection = conn;
        // Refrescar lista al conectar (patrón chat)
        load();
      } catch (err) {
        console.error("Error conectando NotificationsHub:", err);
        setTimeout(() => {
          if (conn.state === "Disconnected") startConnection();
        }, 3000);
      }
    };

    startConnection();

    const handleReceive = (notification) => {
      console.log("DEBUG: Notificación recibida en frontend:", notification);
      setItems(prev => [notification, ...prev]);
      setUnread(prev => prev + 1);
    };

    conn.on("ReceiveNotification", handleReceive);

    conn.onclose(() => {
      console.log("NotificationsHub desconectado");
      setConnection(null);
      window.notificationsHubConnection = null;
    });

    return () => {
      try { conn.off("ReceiveNotification", handleReceive); } catch {}
      try { conn.stop(); } catch {}
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
    connection
  };
}
