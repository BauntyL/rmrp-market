import React, { useState, useEffect } from 'react';
import { Filter, Search, Grid, List } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ListingCard } from '../Common/ListingCard';
import { Listing } from '../../types';

interface ListingsPageProps {
  onNavigate: (page: string) => void;
}

export const ListingsPage: React.FC<ListingsPageProps> = ({ onNavigate }) => {
  const { listings, servers, selectedServer, setSelectedServer, getUserById } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Get URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const search = urlParams.get('search');
    const server = urlParams.get('server');
    
    if (search) {
      setSearchQuery(search);
    }
    if (server) {
      setSelectedServer(server);
    }
  }, [setSelectedServer]);

  const categories = ['Автомобили', 'Оружие', 'Недвижимость', 'Одежда', 'Аксессуары'];

  // Filter and sort listings
  const filteredListings = listings
    .filter(listing => {
      if (listing.status !== 'active') return false;
      
      if (selectedServer && listing.serverId !== selectedServer) return false;
      
      if (searchQuery && !listing.title.toLowerCase().includes(searchQuery.toLowerCase()) 
          && !listing.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      if (selectedCategory && listing.category !== selectedCategory) return false;
      
      if (priceRange.min && listing.price < parseFloat(priceRange.min)) return false;
      if (priceRange.max && listing.price > parseFloat(priceRange.max)) return false;
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const clearFilters = () => {
    setSelectedServer(null);
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('date');
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Объявления
          </h1>
          
          {/* Mobile filters toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-neutral-800 rounded-xl text-slate-900 dark:text-white"
            >
              <Filter size={16} />
              Фильтры
            </button>
          </div>

          {/* Search and sort bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск по названию или описанию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 w-full bg-slate-100 dark:bg-neutral-800 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-slate-100 dark:bg-neutral-800 border-0 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Сначала новые</option>
              <option value="price-asc">Сначала дешевые</option>
              <option value="price-desc">Сначала дорогие</option>
              <option value="title">По алфавиту</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-80`}>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 sticky top-28">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Фильтры
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Очистить
                </button>
              </div>

              {/* Server Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-slate-900 dark:text-white mb-3">
                  Сервер
                </h4>
                <div className="space-y-2">
                  {servers.map((server) => (
                    <label key={server.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="server"
                        checked={selectedServer === server.id}
                        onChange={() => setSelectedServer(server.id)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-slate-600 dark:text-neutral-400">
                        {server?.displayName || server.name || 'Неизвестный сервер'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-slate-900 dark:text-white mb-3">
                  Категория
                </h4>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-neutral-700 border-0 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Все категории</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-3">
                  Цена (₽)
                </h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="От"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-neutral-700 border-0 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-neutral-700 border-0 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-slate-600 dark:text-neutral-400">
                Найдено {filteredListings.length} объявлени{filteredListings.length === 1 ? 'е' : filteredListings.length < 5 ? 'я' : 'й'}
              </p>
            </div>

            {filteredListings.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6' 
                : 'space-y-4'
              }>
                {filteredListings.map((listing) => {
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
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Search size={24} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Объявления не найдены
                </h3>
                <p className="text-slate-600 dark:text-neutral-400 mb-6">
                  Попробуйте изменить критерии поиска или создайте первое объявление
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                >
                  Очистить фильтры
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
