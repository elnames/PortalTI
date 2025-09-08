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
    <div className="w-80 sm:w-96 lg:w-[28rem] max-w-[calc(100vw-32px)]">
      <div className="flex justify-between items-center mb-4 px-2">
        <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">Notificaciones</span>
        {items.length > 0 && (
          <button
            className="text-sm px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors whitespace-nowrap font-medium"
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
        <div className="max-h-80 lg:max-h-96 overflow-y-auto pr-2">
          <List
            dataSource={items}
            renderItem={(notification) => (
              <List.Item
                className={`cursor-pointer rounded-xl my-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <List.Item.Meta
                  title={
                    <span className={`text-sm font-semibold text-gray-900 dark:text-gray-100 ${!notification.isRead ? 'text-blue-900 dark:text-blue-100' : ''}`}>
                      {notification.titulo}
                    </span>
                  }
                  description={
                    <div className="mt-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed block">
                        {notification.mensaje}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium">
                        {new Date(notification.createdAt).toLocaleString('es-ES')}
                      </div>
                    </div>
                  }
                />
                <button
                  className="text-lg text-gray-400 hover:text-red-500 ml-3 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
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
        width: 'auto'
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
