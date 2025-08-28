import React, { useState } from 'react';
import { Search, User, Bell, Plus, Moon, Sun, Menu, X, Shield, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationDropdown } from '../Common/NotificationDropdown';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { servers, selectedServer, setSelectedServer, notifications } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.isRead);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`listings?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="fixed top-0 w-full px-4 pt-4 z-50">
      <div className="container mx-auto bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-2xl shadow-sm">
        <div className="px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onNavigate('home')}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-lg text-slate-900 dark:text-white hidden sm:block">
              RMRP Marketplace
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Server Selection */}
            <div className="flex gap-1 bg-slate-100 dark:bg-neutral-800 rounded-xl p-1">
              {servers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => setSelectedServer(selectedServer === server.id ? null : server.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedServer === server.id
                      ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {server?.displayName || server.name || 'Сервер'}
                </button>
              ))}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 bg-slate-100 dark:bg-neutral-800 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-neutral-700"
              />
            </form>
          </div>

          {/* Auth & Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {isDark ? (
                <Sun size={18} className="text-neutral-300" />
              ) : (
                <Moon size={18} className="text-slate-600" />
              )}
            </button>

            {isAuthenticated ? (
              <>
                {/* Admin Panel */}
                {(user?.role === 'admin' || user?.role === 'moderator') && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                  >
                    <Shield size={16} />
                    Админ
                  </button>
                )}

                {/* Messages */}
                <button
                  onClick={() => onNavigate('messages')}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                >
                  <MessageSquare size={16} />
                  Сообщения
                </button>

                {/* Create Listing */}
                <button
                  onClick={() => onNavigate('create-listing')}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                >
                  <Plus size={16} />
                  Создать
                </button>

                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors relative"
                  >
                    <Bell size={18} className="text-slate-600 dark:text-neutral-300" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                        {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                      </span>
                    )}
                  </button>
                  
                  <NotificationDropdown
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                    onNavigate={onNavigate}
                  />
                </div>

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => onNavigate('profile')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <User size={18} className="text-slate-600 dark:text-neutral-300" />
                    <span className="hidden sm:block text-slate-900 dark:text-white">
                      {user?.firstName}
                    </span>
                  </button>
                </div>

                <button
                  onClick={logout}
                  className="hidden sm:block text-sm text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Выйти
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Войти
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                >
                  Регистрация
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {isMenuOpen ? (
                <X size={18} className="text-slate-600 dark:text-neutral-300" />
              ) : (
                <Menu size={18} className="text-slate-600 dark:text-neutral-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-neutral-700 p-4">
            <form onSubmit={handleSearch} className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-slate-100 dark:bg-neutral-800 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500"
              />
            </form>
            
            {/* Mobile Server Selection */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {servers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => {
                    setSelectedServer(selectedServer === server.id ? null : server.id);
                    setIsMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                    selectedServer === server.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white'
                  }`}
                >
                  {server?.displayName || server.name || 'Сервер'}
                </button>
              ))}
            </div>

            {isAuthenticated && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onNavigate('messages');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                >
                  <MessageSquare size={16} />
                  Сообщения
                </button>
                
                <button
                  onClick={() => {
                    onNavigate('create-listing');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                >
                  <Plus size={16} />
                  Создать объявление
                </button>
                
                {(user?.role === 'admin' || user?.role === 'moderator') && (
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                  >
                    <Shield size={16} />
                    Админ-панель
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};