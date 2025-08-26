import React, { useState } from 'react';
import { Bell, X, Check, MessageCircle, Star, FileText, Shield } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Notification } from '../../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate 
}) => {
  const { notifications, markNotificationRead } = useApp();
  const [hoveredNotification, setHoveredNotification] = useState<string | null>(null);

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const recentNotifications = notifications.slice(0, 10);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'listing_approved':
        return <Check size={16} className="text-green-500" />;
      case 'listing_rejected':
        return <X size={16} className="text-red-500" />;
      case 'new_message':
        return <MessageCircle size={16} className="text-blue-500" />;
      case 'new_review':
        return <Star size={16} className="text-yellow-500" />;
      default:
        return <Bell size={16} className="text-slate-500" />;
    }
  };

  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;
    return `${Math.floor(diffInMinutes / 1440)} дн назад`;
  };

  const handleNotificationClick = (notification: Notification) => {
    markNotificationRead(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'listing_approved':
      case 'listing_rejected':
        onNavigate('profile');
        break;
      case 'new_message':
        onNavigate('profile?tab=messages');
        break;
      case 'new_review':
        onNavigate('profile?tab=reviews');
        break;
    }
    
    onClose();
  };

  const markAllAsRead = () => {
    const { markAllNotificationsRead } = useApp();
    markAllNotificationsRead();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-slate-200 dark:border-neutral-700 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-neutral-700">
        <h3 className="font-bold text-slate-900 dark:text-white">
          Уведомления
        </h3>
        <div className="flex items-center gap-2">
          {unreadNotifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Прочитать все
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {recentNotifications.length > 0 ? (
          <div className="p-2">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                onMouseEnter={() => setHoveredNotification(notification.id)}
                onMouseLeave={() => setHoveredNotification(null)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  !notification.isRead 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                    : 'hover:bg-slate-50 dark:hover:bg-neutral-700'
                } ${
                  hoveredNotification === notification.id ? 'scale-[1.02]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-medium text-sm ${
                        !notification.isRead 
                          ? 'text-slate-900 dark:text-white' 
                          : 'text-slate-700 dark:text-neutral-300'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    
                    <p className={`text-sm mt-1 ${
                      !notification.isRead 
                        ? 'text-slate-600 dark:text-neutral-400' 
                        : 'text-slate-500 dark:text-neutral-500'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <div className="text-xs text-slate-500 dark:text-neutral-500 mt-2">
                      {formatNotificationTime(notification.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Bell size={32} className="text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-neutral-500 text-sm">
              Нет уведомлений
            </p>
          </div>
        )}
      </div>

      {/* Футер удален */}
    </div>
  );
};