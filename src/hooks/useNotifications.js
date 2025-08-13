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

    // Configurar SignalR
    const token = localStorage.getItem("token");
    if (!token) return;

    const conn = new HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_API_URL || 'http://localhost:5266'}/hubs/notifications?access_token=${token}`, {
        skipNegotiation: false,
        transport: 1 // WebSockets
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          if (retryContext.previousRetryCount === 0) {
            return 0;
          }
          if (retryContext.previousRetryCount < 3) {
            return 2000; // 2 segundos
          }
          return 10000; // 10 segundos
        }
      })
      .configureLogging("warn")
      .build();

    const startConnection = async () => {
      try {
        console.log("DEBUG: Intentando conectar SignalR...");
        console.log("DEBUG: URL:", `${process.env.REACT_APP_API_URL || 'http://localhost:5266'}/hubs/notifications?access_token=${token}`);
        console.log("DEBUG: Token presente:", !!token);

        await conn.start();
        console.log("SignalR conectado para notificaciones");
        setConnection(conn);
      } catch (err) {
        console.error("Error conectando SignalR:", err);
        console.error("DEBUG: Estado de conexión:", conn.state);
        console.error("DEBUG: Detalles del error:", {
          name: err.name,
          message: err.message,
          stack: err.stack
        });

        // Reintentar después de 3 segundos
        setTimeout(() => {
          if (conn.state === "Disconnected") {
            console.log("DEBUG: Reintentando conexión SignalR...");
            startConnection();
          }
        }, 3000);
      }
    };

    startConnection();

    conn.on("ReceiveNotification", (notification) => {
      console.log("DEBUG: Notificación recibida en frontend:", notification);
      console.log("DEBUG: Estado actual de items:", items);
      setItems(prev => {
        console.log("DEBUG: Actualizando items, prev length:", prev.length);
        const newItems = [notification, ...prev];
        console.log("DEBUG: Nuevos items length:", newItems.length);
        return newItems;
      });
      setUnread(prev => {
        console.log("DEBUG: Actualizando unread, prev:", prev);
        const newUnread = prev + 1;
        console.log("DEBUG: Nuevo unread:", newUnread);
        return newUnread;
      });
    });

    conn.onclose(() => {
      console.log("SignalR desconectado");
      setConnection(null);
    });

    return () => {
      if (conn) {
        conn.stop();
      }
    };
  }, [load]);

  return {
    items,
    unread,
    markAllRead,
    markAsRead,
    connection
  };
}
