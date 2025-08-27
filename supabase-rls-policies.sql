-- RLS политики для таблиц notifications, chats и messages
-- Этот скрипт нужно выполнить в SQL Editor в Supabase Dashboard

-- Включаем RLS для таблиц (если еще не включено)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

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

-- RLS политики для таблицы chats
DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON public.chats;

-- Политики для чатов: пользователи могут управлять чатами, где они участники
CREATE POLICY "Users can view own chats" ON public.chats
    FOR SELECT USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can insert own chats" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY "Users can update own chats" ON public.chats
    FOR UPDATE USING (auth.uid() = ANY(participants)) WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY "Users can delete own chats" ON public.chats
    FOR DELETE USING (auth.uid() = ANY(participants));

-- RLS политики для таблицы messages
DROP POLICY IF EXISTS "Users can view chat messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert chat messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;

-- Политики для сообщений: пользователи могут видеть сообщения в своих чатах
CREATE POLICY "Users can view chat messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = messages.chat_id 
            AND auth.uid() = ANY(chats.participants)
        )
    );

CREATE POLICY "Users can insert chat messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = messages.chat_id 
            AND auth.uid() = ANY(chats.participants)
        )
    );

CREATE POLICY "Users can update own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete own messages" ON public.messages
    FOR DELETE USING (auth.uid() = sender_id);

-- Дополнительные политики для администраторов (опционально)
-- CREATE POLICY "Admins can manage all notifications" ON public.notifications
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.users 
--             WHERE users.id = auth.uid() 
--             AND users.role IN ('admin', 'moderator')
--         )
--     );
