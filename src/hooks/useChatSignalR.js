import { useEffect, useState, useCallback, useRef } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { useAuth } from "../contexts/AuthContext";
import { getApiBaseUrl } from "../config";

export default function useChatSignalR() {
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const messageHandlers = useRef(new Map());
  const conversationHandlers = useRef(new Set());

  const connect = useCallback(async () => {
    if (!user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const conn = new HubConnectionBuilder()
      .withUrl(`${getApiBaseUrl()}/hubs/chat?access_token=${token}`, {
        skipNegotiation: false,
        transport: 1, // WebSockets
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
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
        console.log("DEBUG: Intentando conectar ChatHub...");
        await conn.start();
        console.log("ChatHub conectado");
        setConnection(conn);
        setIsConnected(true);

        // Exponer la conexión globalmente para que otros componentes puedan escuchar eventos
        window.chatHubConnection = conn;
      } catch (err) {
        console.error("Error conectando ChatHub:", err);
        setIsConnected(false);

        // Reintentar después de 3 segundos
        setTimeout(() => {
          if (conn.state === "Disconnected") {
            console.log("DEBUG: Reintentando conexión ChatHub...");
            startConnection();
          }
        }, 3000);
      }
    };

    startConnection();

    conn.on("ReceiveChatMessage", (message) => {
      console.log("DEBUG: Mensaje de chat recibido:", message);

      // Notificar a todos los handlers registrados para esta conversación
      const handlers = messageHandlers.current.get(message.conversacionId);
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
    });

    conn.on("ReceiveNewConversation", (conversation) => {
      console.log("DEBUG: Nueva conversación recibida:", conversation);

      // Notificar a todos los handlers de conversaciones
      conversationHandlers.current.forEach(handler => handler(conversation));
    });

    conn.onclose(() => {
      console.log("ChatHub desconectado");
      setConnection(null);
      setIsConnected(false);
      window.chatHubConnection = null;
    });

    return () => {
      if (conn) {
        conn.stop();
      }
    };
  }, [user]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [connect]);

  // Función para registrar un handler de mensajes para una conversación específica
  const onMessageReceived = useCallback((conversacionId, handler) => {
    if (!messageHandlers.current.has(conversacionId)) {
      messageHandlers.current.set(conversacionId, new Set());
    }
    messageHandlers.current.get(conversacionId).add(handler);

    // Retornar función para desregistrar
    return () => {
      const handlers = messageHandlers.current.get(conversacionId);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          messageHandlers.current.delete(conversacionId);
        }
      }
    };
  }, []);

  // Función para registrar un handler de nuevas conversaciones
  const onConversationReceived = useCallback((handler) => {
    conversationHandlers.current.add(handler);

    // Retornar función para desregistrar
    return () => {
      conversationHandlers.current.delete(handler);
    };
  }, []);

  return {
    connection,
    isConnected,
    onMessageReceived,
    onConversationReceived
  };
}

