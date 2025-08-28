-- Create user_presence table for real-time online status tracking
CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

-- Enable RLS (Row Level Security)
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read all presence data
CREATE POLICY "Users can view all presence data" ON user_presence
    FOR SELECT USING (true);

-- Create policy to allow users to update only their own presence
CREATE POLICY "Users can update own presence" ON user_presence
    FOR ALL USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_user_presence_updated_at ON user_presence;
CREATE TRIGGER trigger_update_user_presence_updated_at
    BEFORE UPDATE ON user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_user_presence_updated_at();

-- Create function to automatically set users offline after inactivity
CREATE OR REPLACE FUNCTION cleanup_inactive_users()
RETURNS void AS $$
BEGIN
    UPDATE user_presence 
    SET is_online = false 
    WHERE is_online = true 
    AND last_seen < NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql;
