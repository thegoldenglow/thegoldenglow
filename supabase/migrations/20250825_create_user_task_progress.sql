-- Create per-user task progress table used by the app to persist progress and claim status
-- This aligns with TaskProgressService expectations (columns: task_id, user_id, progress, completed, claimed, requirement, timestamps)

CREATE TABLE IF NOT EXISTS user_task_progress (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  claimed BOOLEAN DEFAULT false,
  requirement INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE user_task_progress ENABLE ROW LEVEL SECURITY;

-- Policies: users can read their own progress
CREATE POLICY IF NOT EXISTS "Users can read own task progress"
ON user_task_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert progress rows for themselves
CREATE POLICY IF NOT EXISTS "Users can insert own task progress"
ON user_task_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress rows
CREATE POLICY IF NOT EXISTS "Users can update own task progress"
ON user_task_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Helpful indexes (composite PK already indexes both, but these can aid certain queries)
CREATE INDEX IF NOT EXISTS idx_user_task_progress_user ON user_task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_task ON user_task_progress(task_id);