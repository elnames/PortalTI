import React from "react";
import { Badge, Popover, List, Button } from "antd";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../hooks/useNotifications";

export default function NotificationBell() {
  const { items, unread, markAllRead, markAsRead } = useNotifications();
  const navigate = useNavigate();

  // Debug logging
  console.log("DEBUG: NotificationBell render - items:", items.length, "unread:", unread);

  const handleNotificationClick = (notification) => {
    if (notification.ruta) {
      navigate(notification.ruta);
    }
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const content = (
    <div className="w-80">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Notificaciones</span>
        {unread > 0 && (
          <Button size="small" onClick={markAllRead}>
            Marcar leídas
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay notificaciones
        </div>
      ) : (
        <List
          dataSource={items}
          renderItem={(notification) => (
            <List.Item
              className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <List.Item.Meta
                title={
                  <span className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                    {notification.titulo}
                  </span>
                }
                description={
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {notification.mensaje}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString('es-ES')}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      content={content}
      overlayClassName="notification-popover"
    >
      <Badge count={unread} size="small" offset={[-2, 2]}>
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Bell size={18} />
        </button>
      </Badge>
    </Popover>
  );
}
