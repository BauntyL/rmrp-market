# Настройка Supabase для физического удаления уведомлений

## Проблема
В данный момент уведомления не удаляются физически из базы данных из-за Row Level Security (RLS) политик в Supabase.

## Решение

### Шаг 1: Откройте Supabase Dashboard
1. Перейдите на https://supabase.com/dashboard
2. Выберите ваш проект `rmrp-market`
3. Перейдите в **SQL Editor**

### Шаг 2: Выполните SQL скрипт
Скопируйте и выполните содержимое файла `supabase-rls-policies.sql`:

```sql
-- RLS политики для таблицы notifications
-- Включаем RLS для таблицы notifications (если еще не включено)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики (если есть)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Политика для чтения: пользователи могут видеть только свои уведомления
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Политика для создания: пользователи могут создавать уведомления для себя
CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политика для обновления: пользователи могут обновлять только свои уведомления
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Политика для удаления: пользователи могут удалять только свои уведомления
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);
```

### Шаг 3: Проверьте результат
После выполнения скрипта:
1. Нажмите кнопку "Очистить" в уведомлениях
2. Откройте консоль браузера (F12)
3. Вы должны увидеть: `✅ Successfully DELETED X notifications from database`
4. После перезагрузки страницы уведомления не появятся снова

## Как это работает

**До настройки RLS:**
- DELETE операция блокировалась → count: 0
- Использовалось мягкое удаление ([DELETED])

**После настройки RLS:**
- DELETE операция работает → физическое удаление из базы
- Мягкое удаление используется только как fallback

## Текущее состояние
✅ **Код исправлен** - улучшена функция clearNotifications с fallback механизмом  
✅ **Мягкое удаление работает** - уведомления помечаются как [DELETED] и скрываются  
⏳ **Физическое удаление** - требует выполнения SQL скрипта выше для полного решения

## Проверка политик RLS
Чтобы проверить текущие политики, выполните:
```sql
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```
