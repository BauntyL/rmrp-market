import React from 'react';
import { MessagesView } from '../Common/MessagesView';

interface MessagesPageProps {
  onNavigate: (page: string) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Сообщения
            </h1>
            <p className="text-slate-600 dark:text-neutral-400">
              Управляйте своими диалогами и общайтесь с другими пользователями
            </p>
          </div>
          
          <MessagesView onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
};
