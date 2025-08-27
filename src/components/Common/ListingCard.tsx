import React from 'react';
import { Listing, Server, User } from '../../types';
import { Clock, MapPin, Eye, Heart } from 'lucide-react';
import { formatDate } from '../../lib/dateUtils';

interface ListingCardProps {
  listing: Listing;
  server: Server;
  user?: User;
  onClick: () => void;
  showFavorite?: boolean;
  compact?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({ 
  listing, 
  server, 
  user, 
  onClick, 
  showFavorite = false,
  compact = false 
}) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ' + currency;
  };

  const formatCardDate = (date: Date | string | undefined) => {
    return formatDate(date, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement favorite functionality
    console.log('Toggle favorite for listing:', listing.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden border border-transparent hover:border-blue-200 dark:hover:border-blue-800 ${
        compact ? 'flex gap-4 p-4' : ''
      }`}
    >
      {/* Image */}
      <div className={`${compact ? 'w-32 h-24 flex-shrink-0' : 'aspect-[4/3]'} overflow-hidden ${compact ? 'rounded-xl' : ''} relative`}>
        <img
          src={listing.images[0] || 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg'}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Image overlay with actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-full p-2">
              <Eye size={16} className="text-slate-700 dark:text-neutral-300" />
            </div>
            {showFavorite && (
              <button
                onClick={handleFavoriteClick}
                className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-full p-2 hover:bg-white dark:hover:bg-neutral-700 transition-colors"
              >
                <Heart size={16} className="text-slate-700 dark:text-neutral-300" />
              </button>
            )}
          </div>
        </div>

        {/* Status badge */}
        {listing.status !== 'active' && (
          <div className="absolute top-2 left-2">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              listing.status === 'pending' 
                ? 'bg-yellow-500 text-white'
                : listing.status === 'rejected'
                ? 'bg-red-500 text-white'
                : 'bg-gray-500 text-white'
            }`}>
              {listing.status === 'pending' ? 'На модерации' : 
               listing.status === 'rejected' ? 'Отклонено' : 
               'Продано'}
            </span>
          </div>
        )}

        {/* Image count indicator */}
        {listing.images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            +{listing.images.length - 1}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={compact ? 'flex-1 min-w-0' : 'p-4'}>
        {/* Price */}
        <div className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {formatPrice(listing.price, listing.currency)}
        </div>

        {/* Title */}
        <h3 className="font-medium text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {listing.title}
        </h3>

        {/* Description */}
        <p className={`text-sm text-slate-600 dark:text-neutral-400 mb-3 ${compact ? 'line-clamp-1' : 'line-clamp-2'}`}>
          {listing.description}
        </p>

        {/* Category badge */}
        <div className="mb-3">
          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
            {listing.category}
          </span>
        </div>

        {/* Meta Info */}
        <div className={`flex items-center ${compact ? 'justify-between' : 'gap-4'} text-xs text-slate-500 dark:text-neutral-500 mb-3`}>
          <div className="flex items-center gap-1">
            <MapPin size={12} />
            <span>{server?.displayName || server?.name || 'Неизвестный сервер'}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatDate(listing.createdAt)}</span>
          </div>
        </div>

        {/* Seller */}
        {user && !compact && (
          <div className="pt-3 border-t border-slate-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-slate-500 dark:text-neutral-500">
                  ID: {user.uniqueId}
                </div>
              </div>
              
              {user.reviewCount > 0 && (
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    ⭐ {user.rating.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-neutral-500">
                    {user.reviewCount} отзыв{user.reviewCount === 1 ? '' : user.reviewCount < 5 ? 'а' : 'ов'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compact seller info */}
        {user && compact && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-500">
            <span>{user.firstName} {user.lastName}</span>
            {user.reviewCount > 0 && (
              <>
                <span>•</span>
                <span>⭐ {user.rating.toFixed(1)}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};