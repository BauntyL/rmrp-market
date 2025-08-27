-- Additional schema updates for chat functionality
-- Run this after the main schema.sql

-- Add missing columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS is_edited boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS read_by uuid[] NOT NULL DEFAULT '{}';

-- Create blocked users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Add index for blocked users
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users (blocker_id);

-- Create storage bucket for attachments (run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);
