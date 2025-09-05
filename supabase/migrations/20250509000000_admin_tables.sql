-- Tasks System Tables
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reward TEXT NOT NULL,
  status TEXT DEFAULT 'Active', -- 'Active' or 'Inactive'
  type TEXT NOT NULL, -- 'Daily', 'Weekly', 'One-time', 'Seasonal', etc.
  completions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_completions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad Management Tables
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Draft', -- 'Active', 'Scheduled', 'Draft', 'Ended'
  target TEXT NOT NULL, -- 'All Users', 'Free Users', etc.
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_impressions (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  count INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ad_clicks (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  count INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ad_stats (
  id INTEGER PRIMARY KEY DEFAULT 1, -- Only one row
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Settings Tables
CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY DEFAULT 1, -- Only one row
  app_name TEXT DEFAULT 'Golden Glow',
  environment TEXT DEFAULT 'production',
  maintenance_mode BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_health (
  id SERIAL PRIMARY KEY,
  server_status TEXT DEFAULT 'Operational',
  database_status TEXT DEFAULT 'Connected',
  cache_status TEXT DEFAULT 'Active',
  memory_usage INTEGER DEFAULT 0,
  cpu_load INTEGER DEFAULT 0,
  last_deployment TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Tables
CREATE TABLE IF NOT EXISTS analytics_users (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE DEFAULT CURRENT_DATE,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  retention_rate NUMERIC(5,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS analytics_games (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE DEFAULT CURRENT_DATE,
  total_games INTEGER DEFAULT 0,
  average_score NUMERIC(10,2) DEFAULT 0,
  average_duration INTEGER DEFAULT 0, -- in seconds
  completion_rate NUMERIC(5,2) DEFAULT 0
);

-- Insert sample data
-- Initial system config
INSERT INTO system_config (app_name, environment, maintenance_mode) 
VALUES ('Golden Glow', 'production', false)
ON CONFLICT (id) DO NOTHING;

-- Initial system health record
INSERT INTO system_health (server_status, database_status, cache_status, memory_usage, cpu_load) 
VALUES ('Operational', 'Connected', 'Active', 42, 28);

-- Initial analytics records
INSERT INTO analytics_users (total_users, active_users, new_users, conversion_rate, retention_rate)
VALUES (1200, 350, 75, 4.2, 68.5)
ON CONFLICT (date) DO NOTHING;

INSERT INTO analytics_games (total_games, average_score, average_duration, completion_rate)
VALUES (8750, 1250, 180, 72.5)
ON CONFLICT (date) DO NOTHING;

-- Initial ad stats
INSERT INTO ad_stats (total_impressions, total_clicks)
VALUES (156890, 11553)
ON CONFLICT (id) DO NOTHING;

-- Sample Tasks
INSERT INTO tasks (title, description, reward, status, type, completions) VALUES
('Daily Meditation', 'Complete a 5-minute meditation session', '10 Gold', 'Active', 'Daily', 1243),
('Share with Friends', 'Share Golden Glow with 3 friends', '50 Gold', 'Active', 'One-time', 567),
('Wellness Quiz', 'Complete the weekly wellness knowledge quiz', '25 Gold', 'Active', 'Weekly', 894),
('Premium Upgrade', 'Upgrade to premium membership', '200 Gold', 'Active', 'One-time', 152),
('Spring Challenge', 'Complete all spring wellness activities', '100 Gold', 'Inactive', 'Seasonal', 0);

-- Sample Ad Campaigns
INSERT INTO ad_campaigns (name, description, status, target, start_date, end_date) VALUES
('Summer Wellness', 'Promoting summer wellness activities and premium features', 'Active', 'All Users', NOW() - INTERVAL '1 month', NOW() + INTERVAL '1 month'),
('Premium Membership Promo', 'Special discount on premium membership upgrades', 'Active', 'Free Users', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days'),
('New Features Announcement', 'Announcing new meditation and tracking features', 'Scheduled', 'All Users', NOW() + INTERVAL '10 days', NOW() + INTERVAL '20 days'),
('Win a Yearly Subscription', 'Contest promotion for yearly subscription giveaway', 'Draft', 'All Users', NULL, NULL),
('Spring Wellness Challenge', 'Seasonal wellness challenge with premium rewards', 'Ended', 'All Users', NOW() - INTERVAL '60 days', NOW() - INTERVAL '1 day');

-- Add sample impressions and clicks for active campaigns
WITH campaign_impressions AS (
  SELECT id FROM ad_campaigns WHERE status = 'Active'
)
INSERT INTO ad_impressions (campaign_id, count)
SELECT id, FLOOR(RANDOM() * 10000) + 1000
FROM campaign_impressions;

WITH campaign_clicks AS (
  SELECT id FROM ad_campaigns WHERE status = 'Active'
)
INSERT INTO ad_clicks (campaign_id, count)
SELECT id, FLOOR(RANDOM() * 1000) + 100
FROM campaign_clicks; 