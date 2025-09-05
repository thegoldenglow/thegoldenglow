-- Fix for Telegram points not saving issue
-- This addresses the schema mismatches and missing columns

-- 1. Add missing points_earned column to game_sessions table
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
COMMENT ON COLUMN game_sessions.points_earned IS 'Points earned from this game session';

-- 2. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_points_earned ON game_sessions(points_earned);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_created ON game_sessions(user_id, created_at);

-- 3. Create a function to handle Telegram user game sessions
-- This allows saving sessions even when auth_user_id is missing
CREATE OR REPLACE FUNCTION save_telegram_game_session(
  p_profile_id INTEGER,
  p_game_type TEXT,
  p_score INTEGER DEFAULT 0,
  p_points_earned INTEGER DEFAULT 0,
  p_duration INTEGER DEFAULT 0,
  p_completed BOOLEAN DEFAULT true,
  p_game_data JSONB DEFAULT '{}'
) RETURNS TABLE(
  session_id INTEGER,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_auth_user_id UUID;
  v_session_id INTEGER;
BEGIN
  -- Get the auth_user_id for this profile
  SELECT auth_user_id INTO v_auth_user_id
  FROM profiles
  WHERE id = p_profile_id;
  
  -- If no auth_user_id, we'll use a special handling
  IF v_auth_user_id IS NULL THEN
    -- For Telegram users without proper auth linkage,
    -- we'll create a placeholder UUID based on profile ID
    v_auth_user_id := ('00000000-0000-0000-0000-' || LPAD(p_profile_id::TEXT, 12, '0'))::UUID;
  END IF;
  
  -- Insert the game session
  INSERT INTO game_sessions (
    user_id,
    game_type,
    score,
    points_earned,
    duration,
    completed,
    data,
    ended_at
  ) VALUES (
    v_auth_user_id,
    p_game_type,
    p_score,
    p_points_earned,
    p_duration,
    p_completed,
    p_game_data,
    NOW()
  ) RETURNING id INTO v_session_id;
  
  -- Update user points
  UPDATE profiles
  SET points = COALESCE(points, 0) + p_points_earned
  WHERE id = p_profile_id;
  
  -- Return success
  RETURN QUERY SELECT v_session_id, true, 'Game session saved successfully';
  
EXCEPTION WHEN OTHERS THEN
  -- Return error
  RETURN QUERY SELECT NULL::INTEGER, false, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION save_telegram_game_session TO authenticated;
GRANT EXECUTE ON FUNCTION save_telegram_game_session TO anon;

-- 5. Create a view for easier game session queries that works with both auth and non-auth users
CREATE OR REPLACE VIEW user_game_sessions AS
SELECT 
  gs.id,
  gs.game_type,
  gs.score,
  gs.points_earned,
  gs.duration,
  gs.completed,
  gs.data,
  gs.created_at,
  gs.ended_at,
  p.id as profile_id,
  p.username,
  p.telegram_username,
  p.points as total_points
FROM game_sessions gs
JOIN profiles p ON (
  p.auth_user_id = gs.user_id OR 
  ('00000000-0000-0000-0000-' || LPAD(p.id::TEXT, 12, '0'))::UUID = gs.user_id
)
ORDER BY gs.created_at DESC;

-- Grant access to the view
GRANT SELECT ON user_game_sessions TO authenticated;
GRANT SELECT ON user_game_sessions TO anon;

-- 6. Update RLS policies to handle the new function
CREATE POLICY "Allow telegram game session function" ON game_sessions
FOR INSERT TO authenticated, anon
USING (true);

-- 7. Create a helper function to get user sessions by profile ID
CREATE OR REPLACE FUNCTION get_user_game_sessions(p_profile_id INTEGER, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  id INTEGER,
  game_type TEXT,
  score INTEGER,
  points_earned INTEGER,
  duration INTEGER,
  completed BOOLEAN,
  data JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ugs.id,
    ugs.game_type,
    ugs.score,
    ugs.points_earned,
    ugs.duration,
    ugs.completed,
    ugs.data,
    ugs.created_at
  FROM user_game_sessions ugs
  WHERE ugs.profile_id = p_profile_id
  ORDER BY ugs.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_game_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_game_sessions TO anon;

-- 8. Test the fix with BananBenBadr user
-- This will verify that the system works
DO $$
DECLARE
  v_profile_id INTEGER;
  v_result RECORD;
BEGIN
  -- Get BananBenBadr profile ID
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE username = 'BananBenBadr';
  
  IF v_profile_id IS NOT NULL THEN
    -- Test saving a game session
    SELECT * INTO v_result
    FROM save_telegram_game_session(
      v_profile_id,
      'test-fix',
      500,
      5,
      60,
      true,
      '{"test": true}'
    );
    
    IF v_result.success THEN
      RAISE NOTICE 'SUCCESS: Test game session created for BananBenBadr (session_id: %)', v_result.session_id;
      
      -- Clean up the test session
      DELETE FROM game_sessions WHERE id = v_result.session_id;
      
      -- Restore original points (subtract the test points)
      UPDATE profiles SET points = points - 5 WHERE id = v_profile_id;
      
      RAISE NOTICE 'Test session cleaned up successfully';
    ELSE
      RAISE NOTICE 'FAILED: %', v_result.message;
    END IF;
  ELSE
    RAISE NOTICE 'BananBenBadr profile not found';
  END IF;
END;
$$;