import React, { useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

interface CreateListingPageProps {
  onNavigate: (page: string) => void;
}

export const CreateListingPage: React.FC<CreateListingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { servers, createListing } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: '₽',
    category: '',
    serverId: '',
    images: [] as string[]
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['Автомобили', 'Оружие', 'Недвижимость', 'Одежда', 'Аксессуары'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Необходимо войти в аккаунт');
      return;
    }

    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.serverId) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      setError('Цена должна быть больше нуля');
      return;
    }

    setIsLoading(true);

    try {
      createListing({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        category: formData.category,
        serverId: formData.serverId,
        images: formData.images.length > 0 ? formData.images : ['https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg'],
        status: 'pending'
      });

      onNavigate('profile');
    } catch (err) {
      setError('Произошла ошибка при создании объявления');
    } finally {
      setIsLoading(false);
    }
  };

  const addImageUrl = () => {
    const url = prompt('Введите URL изображения:');
    if (url && url.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

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

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Plus size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Создать объявление
              </h1>
              <p className="text-slate-600 dark:text-neutral-400">
                Заполните информацию о товаре
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Название товара *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: BMW M5 F90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Описание *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Подробное описание товара..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Цена *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Валюта
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="₽">₽ (Рубли)</option>
                    <option value="$">$ (Доллары)</option>
                    <option value="€">€ (Евро)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Категория *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Сервер *
                </label>
                <select
                  required
                  value={formData.serverId}
                  onChange={(e) => setFormData({ ...formData, serverId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите сервер</option>
                  {servers.map((server) => (
                    <option key={server.id} value={server.id}>
                      {server.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Изображения
                </label>
                
                <div className="space-y-3">
                  {formData.images.map((image, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-neutral-700 rounded-xl">
                      <img
                        src={image}
                        alt={`Изображение ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg';
                        }}
                      />
                      <div className="flex-1 text-sm text-slate-600 dark:text-neutral-400 truncate">
                        {image}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-neutral-600 rounded-xl text-slate-600 dark:text-neutral-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Upload size={20} />
                    Добавить изображение по URL
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('profile')}
                  className="flex-1 py-3 border border-slate-300 dark:border-neutral-600 text-slate-900 dark:text-white rounded-xl font-medium transition-colors hover:bg-slate-50 dark:hover:bg-neutral-700"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors"
                >
                  {isLoading ? 'Создание...' : 'Создать объявление'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
