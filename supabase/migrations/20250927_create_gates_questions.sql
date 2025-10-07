-- Create gates_questions table for Gates of Knowledge game
-- This table stores quiz questions used in the Gates of Knowledge mini-game

CREATE TABLE gates_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of answer options
  correct_answer INTEGER NOT NULL DEFAULT 0, -- Index of correct answer in options array
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_gates_questions_difficulty ON gates_questions(difficulty);
CREATE INDEX idx_gates_questions_category ON gates_questions(category);

-- Enable RLS
ALTER TABLE gates_questions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read questions (for the game)
CREATE POLICY "Allow read gates_questions to everyone" ON gates_questions
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage questions (for admin)
CREATE POLICY "Allow insert gates_questions to authenticated users" ON gates_questions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow update gates_questions to authenticated users" ON gates_questions
  FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow delete gates_questions to authenticated users" ON gates_questions
  FOR DELETE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

