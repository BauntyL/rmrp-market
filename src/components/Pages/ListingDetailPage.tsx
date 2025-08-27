import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Heart, Share2, MapPin, Calendar, User, Star, ChevronLeft, ChevronRight, Flag, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { ChatWindow } from '../Common/ChatWindow';
import { formatDate } from '../../lib/dateUtils';

interface ListingDetailPageProps {
  listingId: string;
  onNavigate: (page: string) => void;
}

export const ListingDetailPage: React.FC<ListingDetailPageProps> = ({ listingId, onNavigate }) => {
  const { user, isAuthenticated } = useAuth();
  const { listings, servers, createChat } = useApp();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);

  const listing = listings.find(l => l.id === listingId);
  const server = listing ? servers.find(s => s.id === listing.serverId) : null;

  // Mock seller data (in real app, would fetch from users context)
  const seller = {
    id: listing?.userId || '1',
    firstName: 'Иван',
    lastName: 'Петров',
    uniqueId: '481-295',
    rating: 4.5,
    reviewCount: 12,
    createdAt: new Date('2024-01-15'),
    isOnline: true,
    lastSeen: new Date()
  };

  if (!listing || !server) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <User size={24} className="text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Объявление не найдено
            </h1>
            <p className="text-slate-600 dark:text-neutral-400 mb-6">
              Возможно, объявление было удалено или перемещено
            </p>
            <button
              onClick={() => onNavigate('listings')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            >
              К объявлениям
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ' + currency;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;
    return `${Math.floor(diffInMinutes / 1440)} дн назад`;
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }
    
    if (!user || user.id === listing.userId) {
      return;
    }

    // Create or find existing chat
    const chat = createChat([user.id, listing.userId], listing.id);
    setActiveChat(chat);
    setShowChat(true);
    setChatMinimized(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: listing.title,
      text: `${listing.title} - ${formatPrice(listing.price, listing.currency)}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Ссылка скопирована в буфер обмена');
      } catch (err) {
        alert('Не удалось скопировать ссылку');
      }
    }
  };

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }
    setIsFavorite(!isFavorite);
    // In real app, would save to favorites
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }
    setShowReportModal(true);
  };

  const submitReport = () => {
    if (!reportReason.trim()) {
      alert('Укажите причину жалобы');
      return;
    }
    // In real app, would send report to moderation
    alert('Жалоба отправлена на рассмотрение');
    setShowReportModal(false);
    setReportReason('');
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => onNavigate('listings')}
            className="flex items-center gap-2 mb-6 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Назад к объявлениям
          </button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Images Section */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                {/* Main Image */}
                <div className="aspect-[4/3] relative group">
                  <img
                    src={listing.images[currentImageIndex] || 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg'}
                    alt={listing.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                  />
                  
                  {/* Image Navigation */}
                  {listing.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {listing.images.length > 1 && (
                    <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
                      {currentImageIndex + 1} / {listing.images.length}
                    </div>
                  )}

                  {/* Zoom Hint */}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    Нажмите для увеличения
                  </div>
                </div>
                
                {/* Thumbnail Gallery */}
                {listing.images.length > 1 && (
                  <div className="p-4">
                    <div className="flex gap-2 overflow-x-auto">
                      {listing.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            index === currentImageIndex 
                              ? 'border-blue-500 scale-105' 
                              : 'border-transparent hover:border-slate-300 dark:hover:border-neutral-600'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${listing.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 mt-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Описание товара
                </h2>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-slate-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 mt-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Дополнительная информация
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-500 dark:text-neutral-500">Категория</span>
                    <p className="font-medium text-slate-900 dark:text-white">{listing.category}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500 dark:text-neutral-500">Сервер</span>
                    <p className="font-medium text-slate-900 dark:text-white">{server?.displayName || 'Неизвестный сервер'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500 dark:text-neutral-500">Опубликовано</span>
                    <p className="font-medium text-slate-900 dark:text-white">{formatDate(listing.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500 dark:text-neutral-500">Обновлено</span>
                    <p className="font-medium text-slate-900 dark:text-white">{formatRelativeTime(listing.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Price & Actions */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                      {listing.title}
                    </h1>
                    <div className="text-3xl font-bold text-blue-600 mb-4">
                      {formatPrice(listing.price, listing.currency)}
                    </div>
                  </div>

                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={handleToggleFavorite}
                      className={`flex-1 p-3 rounded-xl transition-all ${
                        isFavorite 
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-neutral-700 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-600'
                      }`}
                      title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                    >
                      <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} className="mx-auto" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 p-3 bg-slate-100 text-slate-600 dark:bg-neutral-700 dark:text-neutral-400 rounded-xl hover:bg-slate-200 dark:hover:bg-neutral-600 transition-all"
                      title="Поделиться"
                    >
                      <Share2 size={20} className="mx-auto" />
                    </button>
                    <button
                      onClick={handleReport}
                      className="flex-1 p-3 bg-slate-100 text-slate-600 dark:bg-neutral-700 dark:text-neutral-400 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
                      title="Пожаловаться"
                    >
                      <Flag size={20} className="mx-auto" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-neutral-400">
                      <MapPin size={18} className="text-blue-500" />
                      <span className="font-medium">{server?.displayName || 'Неизвестный сервер'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 dark:text-neutral-400">
                      <Calendar size={18} className="text-green-500" />
                      <span>{formatDate(listing.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleContactSeller}
                    disabled={user?.id === listing.userId}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <MessageCircle size={20} />
                    {user?.id === listing.userId ? 'Ваше объявление' : 'Написать продавцу'}
                  </button>
                </div>

                {/* Seller Info */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">
                    Продавец
                  </h3>
                  
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <User size={24} className="text-white" />
                      </div>
                      {seller.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-neutral-800 rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 dark:text-white text-lg">
                        {seller.firstName} {seller.lastName}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-neutral-500 mb-2">
                        ID: {seller.uniqueId}
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm mb-1">
                        {seller.isOnline ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">В сети</span>
                        ) : (
                          <span className="text-slate-500 dark:text-neutral-500">
                            Был в сети {formatRelativeTime(seller.lastSeen)}
                          </span>
                        )}
                      </div>
                      
                      {seller.reviewCount > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <span className="font-bold text-slate-900 dark:text-white">{seller.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-slate-500 dark:text-neutral-500 text-sm">
                            ({seller.reviewCount} отзыв{seller.reviewCount === 1 ? '' : seller.reviewCount < 5 ? 'а' : 'ов'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500 dark:text-neutral-500 mb-4">
                    На платформе с {formatDate(seller.createdAt, { month: 'long', year: 'numeric' })}
                  </div>

                  <button
                    onClick={() => alert('Профиль продавца будет доступен в следующем обновлении')}
                    className="w-full py-2 border border-slate-300 dark:border-neutral-600 text-slate-900 dark:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors text-sm"
                  >
                    Посмотреть профиль
                  </button>
                </div>

                {/* Safety Tips */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={20} className="text-yellow-600 dark:text-yellow-400" />
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-200">
                      Безопасность сделок
                    </h3>
                  </div>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>Встречайтесь в безопасных местах на сервере</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>Проверяйте товар перед передачей денег</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>Не передавайте деньги заранее</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>Сообщайте о подозрительных объявлениях</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      {showChat && activeChat && (
        <ChatWindow
          chat={activeChat}
          onClose={() => setShowChat(false)}
          isMinimized={chatMinimized}
          onToggleMinimize={() => setChatMinimized(!chatMinimized)}
        />
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-xl"
            >
              ✕
            </button>
            <img
              src={listing.images[currentImageIndex]}
              alt={listing.title}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            {listing.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {listing.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Пожаловаться на объявление
            </h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-red-500 resize-none"
              rows={4}
              placeholder="Опишите причину жалобы..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2 border border-slate-300 dark:border-neutral-600 text-slate-900 dark:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={submitReport}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};