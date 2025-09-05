-- Add game_identifier column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS game_identifier TEXT DEFAULT NULL;

-- Update existing tasks if needed with default game values
-- This is optional and depends on your requirements
-- UPDATE tasks SET game_identifier = 'DefaultGame' WHERE game_identifier IS NULL;
