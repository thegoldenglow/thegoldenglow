-- Add RLS policies for admin tables that are missing them
-- This fixes the API access issues for ad_campaigns and related tables

-- Enable RLS for ad_campaigns table
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

-- Add permissive policies for ad_campaigns (demo purposes - tighten for production)
CREATE POLICY "Allow read ad_campaigns to everyone" ON ad_campaigns
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert ad_campaigns to authenticated users" ON ad_campaigns
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow update ad_campaigns to authenticated users" ON ad_campaigns
  FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow delete ad_campaigns to authenticated users" ON ad_campaigns
  FOR DELETE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Enable RLS for ad_impressions table
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

-- Add permissive policies for ad_impressions
CREATE POLICY "Allow read ad_impressions to everyone" ON ad_impressions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert ad_impressions to authenticated users" ON ad_impressions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Enable RLS for ad_clicks table
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

-- Add permissive policies for ad_clicks
CREATE POLICY "Allow read ad_clicks to everyone" ON ad_clicks
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert ad_clicks to authenticated users" ON ad_clicks
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Enable RLS for ad_stats table
ALTER TABLE ad_stats ENABLE ROW LEVEL SECURITY;

-- Add permissive policies for ad_stats
CREATE POLICY "Allow read ad_stats to everyone" ON ad_stats
  FOR SELECT
  USING (true);

CREATE POLICY "Allow update ad_stats to authenticated users" ON ad_stats
  FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Enable RLS for tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Add permissive policies for tasks
CREATE POLICY "Allow read tasks to everyone" ON tasks
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert tasks to authenticated users" ON tasks
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow update tasks to authenticated users" ON tasks
  FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Enable RLS for system_config table
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Add policies for system_config (read-only for most users)
CREATE POLICY "Allow read system_config to everyone" ON system_config
  FOR SELECT
  USING (true);

CREATE POLICY "Allow update system_config to service role" ON system_config
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Enable RLS for system_health table
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Add policies for system_health
CREATE POLICY "Allow read system_health to everyone" ON system_health
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert system_health to service role" ON system_health
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Enable RLS for analytics tables
ALTER TABLE analytics_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_games ENABLE ROW LEVEL SECURITY;

-- Add policies for analytics tables
CREATE POLICY "Allow read analytics_users to everyone" ON analytics_users
  FOR SELECT
  USING (true);

CREATE POLICY "Allow read analytics_games to everyone" ON analytics_games
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert analytics_users to service role" ON analytics_users
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow insert analytics_games to service role" ON analytics_games
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');