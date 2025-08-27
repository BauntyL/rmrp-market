-- RLS политики для таблицы notifications
-- Этот скрипт нужно выполнить в SQL Editor в Supabase Dashboard

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

-- Дополнительные политики для администраторов (опционально)
-- CREATE POLICY "Admins can manage all notifications" ON public.notifications
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.users 
--             WHERE users.id = auth.uid() 
--             AND users.role IN ('admin', 'moderator')
--         )
--     );
