# Manual Database Fix Required

## Issue
The `points_earned` column is missing from the `game_sessions` table, which is preventing Telegram users from saving their game scores properly.

## Solution
You need to manually add the column using the Supabase dashboard.

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your **GoldenGlow** project

### Step 2: Open SQL Editor
1. In the left sidebar, click on **SQL Editor**
2. Click **New Query** to create a new SQL query

### Step 3: Run the SQL Command
Copy and paste this SQL command into the editor:

```sql
-- Add the missing points_earned column
ALTER TABLE game_sessions ADD COLUMN points_earned INTEGER DEFAULT 0;

-- Add a helpful comment
COMMENT ON COLUMN game_sessions.points_earned IS 'Points earned from this game session';

-- Create an index for better performance
CREATE INDEX idx_game_sessions_points_earned ON game_sessions(points_earned);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'game_sessions' 
ORDER BY ordinal_position;
```

### Step 4: Execute the Query
1. Click the **Run** button (or press Ctrl+Enter)
2. You should see a success message
3. The last SELECT statement will show all columns in the table, including the new `points_earned` column

### Step 5: Verify the Fix
After running the SQL, test the fix by running:

```bash
node test-database-with-mcp.mjs
```

This should now work without errors and show that game sessions are being saved properly.

## What This Fixes

- ✅ Telegram users can now save game sessions
- ✅ Points are properly tracked and stored
- ✅ Game score manager works for both authenticated and Telegram users
- ✅ Database schema is complete and consistent

## Project Details
- **Project ID**: luzpkuypmyidaluitvzh
- **Project Name**: GoldenGlow
- **Region**: eu-central-1
- **Status**: ACTIVE_HEALTHY

## Next Steps After Fix
1. Test the Telegram WebApp games
2. Verify points are being saved in the database
3. Check that user profiles are being updated correctly
4. Monitor for any additional issues

---

**Note**: This manual step is required because Supabase client libraries don't have permissions to modify table schemas directly. Only the dashboard SQL editor has the necessary privileges to alter table structures.