import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-semibold text-lg text-slate-900 dark:text-white">
                RMRP Marketplace
              </span>
            </div>
            <p className="text-slate-600 dark:text-neutral-400 text-sm leading-relaxed">
              Торговая площадка для игроков проекта RMRP. Безопасные сделки, удобный поиск, надёжная модерация.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-slate-900 dark:text-white mb-4">Информация</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors">
                  Правила платформы
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors">
                  Как проводить сделки
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors">
                  Часто задаваемые вопросы
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-slate-900 dark:text-white mb-4">Поддержка</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors">
                  Связаться с нами
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors">
                  Пожаловаться на объявление
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors">
                  Discord сервера
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-neutral-800 mt-8 pt-6">
          <p className="text-center text-slate-500 dark:text-neutral-500 text-sm">
            © 2024 RMRP Marketplace. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};
