import React from 'react';
import { ShoppingBag, Users, Shield, Zap } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { ListingCard } from '../Common/ListingCard';
import { ActiveChatsWidget } from '../Common/ActiveChatsWidget';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { listings, servers, getUserById } = useApp();
  const { isAuthenticated } = useAuth();
  
  // Get latest listings (limit to 6 for display)
  const latestListings = listings
    .filter(listing => listing.status === 'active')
    .slice(0, 6);

  const features = [
    {
      icon: ShoppingBag,
      title: 'Торговая площадка',
      description: 'Покупайте и продавайте игровые предметы безопасно'
    },
    {
      icon: Users,
      title: 'Сообщество игроков',
      description: 'Тысячи активных пользователей RMRP'
    },
    {
      icon: Shield,
      title: 'Безопасность сделок',
      description: 'Модерация объявлений и система отзывов'
    },
    {
      icon: Zap,
      title: 'Быстрый поиск',
      description: 'Находите нужные товары по серверам'
    }
  ];

  const handleStartSellingClick = () => {
    if (isAuthenticated) {
      onNavigate('listings');
    } else {
      onNavigate('login');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Торговая площадка
              <span className="text-blue-600 block">RMRP</span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-2xl mx-auto">
              Безопасная покупка и продажа игровых предметов. Найдите всё необходимое для вашего персонажа на любом сервере.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => onNavigate('listings')}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-colors"
              >
                Посмотреть объявления
              </button>
              
              <button
                onClick={handleStartSellingClick}
                className="px-8 py-4 border-2 border-slate-300 dark:border-neutral-600 text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-neutral-500 rounded-2xl font-medium transition-colors"
              >
                Начать продавать
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Server Selection */}
      <section className="py-16 bg-slate-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-8">
              Выберите свой сервер
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {servers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => {
                    onNavigate(`listings?server=${server.id}`);
                  }}
                  className="p-6 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-white font-bold text-xl">
                        {server.displayName[0]}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                      {server.displayName}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-neutral-400">
                      Сервер
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">
              Почему выбирают нас
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <feature.icon size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-neutral-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      {latestListings.length > 0 && (
        <section className="py-16 bg-slate-50 dark:bg-neutral-900">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Новые объявления
                </h2>
                <button
                  onClick={() => onNavigate('listings')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Смотреть все
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestListings.map((listing) => {
                  const server = servers.find(s => s.id === listing.serverId);
                  const listingOwner = getUserById(listing.userId);
                  return (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      server={server!}
                      user={listingOwner}
                      onClick={() => onNavigate(`listing/${listing.id}`)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Active Chats Widget */}
      <ActiveChatsWidget />
    </div>
  );
};
