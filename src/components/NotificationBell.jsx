import React from "react";
import { Badge, Popover, List } from "antd";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../hooks/useNotifications";

export default function NotificationBell() {
  const { items, unread, markAllRead, markAsRead, deleteNotification, deleteAll } = useNotifications();
  const navigate = useNavigate();

  // Debug logging
  console.log("DEBUG: NotificationBell render - items:", items.length, "unread:", unread);

  const handleNotificationClick = (notification) => {
    let target = notification.ruta || '/dashboard';
    // Regla: los usuarios (role 'usuario') solo pueden ir a sus rutas de usuario
    const role = localStorage.getItem('role');
    if (role === 'usuario') {
      if (target.startsWith('/gestion-actas')) {
        target = '/actas';
      } else if (target.startsWith('/tickets/')) {
        target = '/mis-tickets';
      } else if (target.startsWith('/activos/')) {
        target = '/mis-activos';
      }
    }
    navigate(target);
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const content = (
    <div className="w-72 sm:w-80 md:w-96 max-w-[calc(100vw-32px)]">
      <div className="flex justify-between items-center mb-3 px-1">
        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Notificaciones</span>
        {items.length > 0 && (
          <button
            className="text-xs px-2 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors whitespace-nowrap"
            onClick={(e) => { e.stopPropagation(); deleteAll(); }}
            title="Borrar todas"
          >
            Borrar todas
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay notificaciones
        </div>
      ) : (
        <div className="max-h-64 sm:max-h-72 overflow-y-auto pr-1">
          <List
            dataSource={items}
            renderItem={(notification) => (
              <List.Item
                className={`cursor-pointer rounded-lg my-1.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <List.Item.Meta
                  title={
                    <span className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${!notification.isRead ? 'font-semibold' : ''}`}>
                      {notification.titulo}
                    </span>
                  }
                  description={
                    <div className="mt-1">
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {notification.mensaje}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString('es-ES')}
                      </div>
                    </div>
                  }
                />
                <button
                  className="text-sm text-gray-400 hover:text-red-500 ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                  title="Eliminar"
                >
                  ×
                </button>
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      content={content}
      onOpenChange={(open) => {
        if (open && unread > 0) {
          markAllRead();
        }
      }}
      overlayClassName="notification-popover"
      overlayStyle={{
        maxWidth: 'calc(100vw - 32px)',
        width: 'auto',
        left: 'auto !important',
        right: '8px !important'
      }}
    >
      <Badge count={unread} size="small" offset={[-2, 2]}>
        <button className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200">
          <Bell size={22} />
        </button>
      </Badge>
    </Popover>
  );
}
