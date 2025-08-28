import React, { useState } from 'react';
import { Shield, Users, FileText, AlertTriangle, Settings, CheckCircle, XCircle, Ban, UserX, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

interface AdminPageProps {
  onNavigate: (page: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { listings, servers, users, moderateListing, banUser, unbanUser, deleteUser, adminDeleteListing } = useApp();
  const [activeTab, setActiveTab] = useState('moderation');
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Доступ запрещён
            </h1>
            <p className="text-slate-600 dark:text-neutral-400 mb-6">
              У вас нет прав для доступа к админ-панели
            </p>
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingListings = listings.filter(l => l.status === 'pending');
  const rejectedListings = listings.filter(l => l.status === 'rejected');

  const tabs = [
    { id: 'moderation', name: 'Модерация', icon: FileText, count: pendingListings.length },
    { id: 'users', name: 'Пользователи', icon: Users, count: users.length },
    { id: 'reports', name: 'Жалобы', icon: AlertTriangle, count: 0 },
    { id: 'settings', name: 'Настройки', icon: Settings }
  ];

  const handleApproveListing = (listingId: string) => {
    moderateListing(listingId, 'approve');
    setSelectedListing(null);
  };

  const handleRejectListing = (listingId: string) => {
    if (!rejectionReason.trim()) {
      alert('Укажите причину отклонения');
      return;
    }
    moderateListing(listingId, 'reject', rejectionReason);
    setSelectedListing(null);
    setRejectionReason('');
  };

  const handleBanUser = async (userId: string) => {
    if (!banReason.trim()) {
      alert('Укажите причину блокировки');
      return;
    }
    await banUser(userId, banReason);
    setSelectedUser(null);
    setBanReason('');
  };

  const handleUnbanUser = async (userId: string) => {
    await unbanUser(userId);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.')) {
      await deleteUser(userId);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (confirm('Вы уверены, что хотите удалить это объявление? Это действие нельзя отменить.')) {
      await adminDeleteListing(listingId);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Админ-панель
                </h1>
                <p className="text-slate-600 dark:text-neutral-400">
                  Управление платформой RMRP Marketplace
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-red-600 text-white'
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
                            : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
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
              {activeTab === 'moderation' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Модерация объявлений ({pendingListings.length})
                    </h2>
                  </div>

                  {pendingListings.length > 0 ? (
                    <div className="space-y-4">
                      {pendingListings.map((listing) => {
                        const server = servers.find(s => s.id === listing.serverId);
                        const isSelected = selectedListing === listing.id;
                        
                        return (
                          <div key={listing.id} className="bg-white dark:bg-neutral-800 rounded-2xl p-6">
                            <div className="flex gap-4">
                              <img
                                src={listing.images[0] || 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg'}
                                alt={listing.title}
                                className="w-24 h-24 object-cover rounded-xl"
                              />
                              
                              <div className="flex-1">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                                  {listing.title}
                                </h3>
                                <p className="text-slate-600 dark:text-neutral-400 text-sm mb-2 line-clamp-2">
                                  {listing.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-neutral-500">
                                  <span>{new Intl.NumberFormat('ru-RU').format(listing.price)} {listing.currency}</span>
                                  <span>{server?.displayName}</span>
                                  <span>{listing.category}</span>
                                  <span>{listing.createdAt && !isNaN(new Date(listing.createdAt).getTime()) ? new Intl.DateTimeFormat('ru-RU').format(new Date(listing.createdAt)) : 'Н/Д'}</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleApproveListing(listing.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                                >
                                  <CheckCircle size={16} />
                                  Одобрить
                                </button>
                                <button
                                  onClick={() => setSelectedListing(isSelected ? null : listing.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                                >
                                  <XCircle size={16} />
                                  Отклонить
                                </button>
                                <button
                                  onClick={() => handleDeleteListing(listing.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors"
                                >
                                  <Trash2 size={16} />
                                  Удалить
                                </button>
                              </div>
                            </div>
                            
                            {isSelected && (
                              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-neutral-700">
                                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                  Причина отклонения:
                                </label>
                                <textarea
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  className="w-full px-4 py-3 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-red-500 resize-none"
                                  rows={3}
                                  placeholder="Укажите причину отклонения объявления..."
                                />
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => handleRejectListing(listing.id)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                                  >
                                    Отклонить с причиной
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedListing(null);
                                      setRejectionReason('');
                                    }}
                                    className="px-4 py-2 border border-slate-300 dark:border-neutral-600 text-slate-900 dark:text-white rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-neutral-700"
                                  >
                                    Отмена
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 text-center">
                      <FileText size={48} className="text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        Нет объявлений на модерации
                      </h3>
                      <p className="text-slate-600 dark:text-neutral-400">
                        Все объявления проверены
                      </p>
                    </div>
                  )}

                  {/* Rejected Listings */}
                  {rejectedListings.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                        Отклонённые объявления ({rejectedListings.length})
                      </h3>
                      <div className="space-y-3">
                        {rejectedListings.map((listing) => (
                          <div key={listing.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-slate-900 dark:text-white">
                                  {listing.title}
                                </h4>
                                <p className="text-sm text-red-600 dark:text-red-400">
                                  Причина: {listing.rejectionReason}
                                </p>
                              </div>
                              <button
                                onClick={() => handleApproveListing(listing.id)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                              >
                                Одобрить
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Управление пользователями ({users.length})
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {users.map((userItem) => {
                      const isSelected = selectedUser === userItem.id;
                      const isBanned = userItem.is_banned;
                      
                      return (
                        <div key={userItem.id} className="bg-white dark:bg-neutral-800 rounded-2xl p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                                isBanned ? 'bg-red-600' : 'bg-blue-600'
                              }`}>
                                {userItem.firstName[0]}{userItem.lastName[0]}
                              </div>
                              
                              <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">
                                  {userItem.firstName} {userItem.lastName}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-neutral-500">
                                  <span>ID: {userItem.uniqueId}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    userItem.role === 'admin' 
                                      ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                      : userItem.role === 'moderator'
                                      ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                                      : 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
                                  }`}>
                                    {userItem.role === 'admin' ? 'Админ' : userItem.role === 'moderator' ? 'Модератор' : 'Пользователь'}
                                  </span>
                                  {isBanned && (
                                    <span className="px-2 py-1 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs">
                                      Заблокирован
                                    </span>
                                  )}
                                </div>
                                {isBanned && userItem.ban_reason && (
                                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                    Причина: {userItem.ban_reason}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {!isBanned ? (
                                <>
                                  <button
                                    onClick={() => setSelectedUser(isSelected ? null : userItem.id)}
                                    className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors text-sm"
                                  >
                                    <Ban size={14} />
                                    Заблокировать
                                  </button>
                                  {userItem.role !== 'admin' && (
                                    <button
                                      onClick={() => handleDeleteUser(userItem.id)}
                                      className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors text-sm"
                                    >
                                      <Trash2 size={14} />
                                      Удалить
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  onClick={() => handleUnbanUser(userItem.id)}
                                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors text-sm"
                                >
                                  <UserX size={14} />
                                  Разблокировать
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {isSelected && !isBanned && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-neutral-700">
                              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                Причина блокировки:
                              </label>
                              <textarea
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-red-500 resize-none"
                                rows={3}
                                placeholder="Укажите причину блокировки пользователя..."
                              />
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleBanUser(userItem.id)}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                                >
                                  Заблокировать с причиной
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(null);
                                    setBanReason('');
                                  }}
                                  className="px-4 py-2 border border-slate-300 dark:border-neutral-600 text-slate-900 dark:text-white rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-neutral-700"
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 text-center">
                  <AlertTriangle size={48} className="text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    Жалобы пользователей
                  </h3>
                  <p className="text-slate-600 dark:text-neutral-400">
                    Нет активных жалоб
                  </p>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Статистика и настройки
                  </h2>
                  
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-neutral-400">Всего пользователей</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{users.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                          <Users size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-neutral-400">Всего объявлений</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{listings.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                          <FileText size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-neutral-400">На модерации</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingListings.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                          <AlertTriangle size={24} className="text-yellow-600 dark:text-yellow-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-neutral-400">Активных объявлений</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {listings.filter(l => l.status === 'active').length}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                          <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Role Statistics */}
                  <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                      Статистика пользователей
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-slate-50 dark:bg-neutral-700 rounded-xl">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {users.filter(u => u.role === 'admin').length}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-neutral-400">Администраторы</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 dark:bg-neutral-700 rounded-xl">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {users.filter(u => u.role === 'moderator').length}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-neutral-400">Модераторы</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 dark:bg-neutral-700 rounded-xl">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {users.filter(u => u.role === 'user').length}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-neutral-400">Пользователи</div>
                      </div>
                    </div>
                  </div>

                  {/* Ban Statistics */}
                  <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                      Статистика блокировок
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {users.filter(u => u.is_banned).length}
                        </div>
                        <div className="text-sm text-red-600 dark:text-red-400">Заблокированные пользователи</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {users.filter(u => !u.is_banned).length}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">Активные пользователи</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Server Settings */}
                  <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                      Серверы
                    </h3>
                    <div className="space-y-3">
                      {servers.map((server) => (
                        <div key={server.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-neutral-700 rounded-xl">
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {server?.displayName || 'Неизвестный сервер'}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-neutral-500">
                              ID: {server.id}
                            </div>
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400">
                            Активен
                          </div>
                        </div>
                      ))}
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
