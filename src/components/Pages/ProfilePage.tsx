import React, { useState } from 'react';
import { User, MessageSquare, Star, Settings, FileText, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { ListingCard } from '../Common/ListingCard';
import { MessagesView } from '../Common/MessagesView';
import { formatDate } from '../../lib/dateUtils';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { listings = [], servers = [], notifications = [], markNotificationRead, markAllNotificationsRead } = useApp();
  const [activeTab, setActiveTab] = useState(() => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    return urlParams.get('tab') || 'listings';
  });

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Войдите в аккаунт
            </h1>
            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Проверяем, что все необходимые данные существуют
  const userListings = Array.isArray(listings) ? listings.filter(listing => listing && listing.userId === user.id) : [];
  const unreadNotifications = Array.isArray(notifications) ? notifications.filter(n => n && !n.isRead) : [];

  const tabs = [
    { id: 'listings', name: 'Мои объявления', icon: FileText, count: userListings.length },
    { id: 'messages', name: 'Сообщения', icon: MessageSquare, count: 0 },
    { id: 'reviews', name: 'Отзывы', icon: Star, count: user.reviewCount },
    { id: 'notifications', name: 'Уведомления', icon: Bell, count: unreadNotifications.length },
    { id: 'settings', name: 'Настройки', icon: Settings }
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Update URL without triggering navigation
    const currentHash = window.location.hash.split('?')[0];
    window.history.replaceState(null, '', `${currentHash}?tab=${tabId}`);
  };

  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;
    return `${Math.floor(diffInMinutes / 1440)} дн назад`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'listing_approved':
        return '✅';
      case 'listing_rejected':
        return '❌';
      case 'new_message':
        return '💬';
      case 'new_review':
        return '⭐';
      default:
        return '📢';
    }
  };

  // Добавляем проверку на наличие всех необходимых данных перед рендерингом
  if (!user || !Array.isArray(listings) || !Array.isArray(notifications)) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Загрузка данных...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {user.firstName} {user.lastName}
                </h1>
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-neutral-400 mb-4">
                  <span>ID: {user.uniqueId || 'Н/Д'}</span>
                  <span>Роль: {user.role === 'admin' ? 'Администратор' : user.role === 'moderator' ? 'Модератор' : 'Пользователь'}</span>
                  <span>Регистрация: {formatDate(user.createdAt)}</span>
                </div>
                
                {user.reviewCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      ⭐ <span className="ml-1 font-medium">{(user.rating || 0).toFixed(1)}</span>
                    </div>
                    <span className="text-slate-600 dark:text-neutral-400">
                      ({user.reviewCount} отзыв{user.reviewCount === 1 ? '' : user.reviewCount < 5 ? 'а' : 'ов'})
                    </span>
                  </div>
                )}
              </div>
              
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <LogOut size={16} />
                Выйти
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <tab.icon size={18} />
                        <span>{tab.name}</span>
                      </div>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          activeTab === tab.id 
                            ? 'bg-white/20 text-white' 
                            : 'bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-400'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === 'listings' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Мои объявления ({userListings.length})
                    </h2>
                    <button
                      onClick={() => onNavigate('create-listing')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                    >
                      Создать объявление
                    </button>
                  </div>

                  {userListings.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {userListings.map((listing) => {
                        const server = servers.find(s => s.id === listing.serverId);
                        return (
                          <ListingCard
                            key={listing.id}
                            listing={listing}
                            server={server!}
                            user={user}
                            onClick={() => onNavigate(`listing/${listing.id}`)}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 text-center">
                      <FileText size={48} className="text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        Нет объявлений
                      </h3>
                      <p className="text-slate-600 dark:text-neutral-400 mb-4">
                        Создайте своё первое объявление, чтобы начать продавать
                      </p>
                      <button
                        onClick={() => onNavigate('create-listing')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                      >
                        Создать объявление
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'messages' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                    Сообщения
                  </h2>
                  <MessagesView onNavigate={onNavigate} />
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 text-center">
                  <Star size={48} className="text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    Нет отзывов
                  </h3>
                  <p className="text-slate-600 dark:text-neutral-400">
                    Здесь будут отображаться отзывы о ваших сделках
                  </p>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Уведомления
                    </h2>
                    {unreadNotifications.length > 0 && (
                      <button
                        onClick={() => markAllNotificationsRead()}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Прочитать все
                      </button>
                    )}
                  </div>
                  
                  {notifications.length > 0 ? (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`bg-white dark:bg-neutral-800 rounded-xl p-4 transition-all ${
                            !notification.isRead 
                              ? 'border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' 
                              : 'border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className={`font-medium ${
                                  !notification.isRead 
                                    ? 'text-slate-900 dark:text-white' 
                                    : 'text-slate-700 dark:text-neutral-300'
                                }`}>
                                  {notification.title}
                                </h3>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                              <p className={`text-sm mt-1 ${
                                !notification.isRead 
                                  ? 'text-slate-600 dark:text-neutral-400' 
                                  : 'text-slate-500 dark:text-neutral-500'
                              }`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-slate-500 dark:text-neutral-500">
                                  {formatNotificationTime(notification.createdAt)}
                                </span>
                                {!notification.isRead && (
                                  <button
                                    onClick={() => markNotificationRead(notification.id)}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    Отметить как прочитанное
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 text-center">
                      <Bell size={48} className="text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        Нет уведомлений
                      </h3>
                      <p className="text-slate-600 dark:text-neutral-400">
                        Здесь будут отображаться важные уведомления
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Настройки
                  </h2>
                  
                  <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                      Смена пароля
                    </h3>
                    
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                          Текущий пароль
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                          Новый пароль
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                          Подтвердите пароль
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                      >
                        Сохранить
                      </button>
                    </form>
                  </div>

                  <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                      Настройки уведомлений
                    </h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-900 dark:text-white">Новые сообщения</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-900 dark:text-white">Статус объявлений</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-900 dark:text-white">Новые отзывы</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};