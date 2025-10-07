-- Add video-specific fields to ad_campaigns table
-- This allows admins to create YouTube video campaigns with reward tracking

-- Add direct_link column (for all campaign types)
ALTER TABLE ad_campaigns 
ADD COLUMN IF NOT EXISTS direct_link TEXT;

-- Add video_url column for YouTube video links
ALTER TABLE ad_campaigns 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add reward_amount column (Golden Credits users earn for watching)
ALTER TABLE ad_campaigns 
ADD COLUMN IF NOT EXISTS reward_amount INTEGER DEFAULT 50;

-- Add required_watch_percentage column (% of video user must watch)
ALTER TABLE ad_campaigns 
ADD COLUMN IF NOT EXISTS required_watch_percentage INTEGER DEFAULT 80 CHECK (required_watch_percentage >= 50 AND required_watch_percentage <= 100);

-- Add updated_at column for tracking changes
ALTER TABLE ad_campaigns 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add comments for documentation
COMMENT ON COLUMN ad_campaigns.direct_link IS 'Direct link for campaign (used for all campaign types)';
COMMENT ON COLUMN ad_campaigns.video_url IS 'YouTube video URL for Video type campaigns';
COMMENT ON COLUMN ad_campaigns.reward_amount IS 'Golden Credits users earn after watching the required percentage';
COMMENT ON COLUMN ad_campaigns.required_watch_percentage IS 'Percentage of video user must watch to earn reward (50-100%)';

-- Create an index on type and status for faster video campaign queries
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_type_status ON ad_campaigns(type, status);

-- Create a view for active video campaigns
CREATE OR REPLACE VIEW active_video_campaigns AS
SELECT 
  id,
  name,
  description,
  video_url,
  direct_link,
  reward_amount,
  required_watch_percentage,
  status,
  start_date,
  end_date,
  created_at,
  updated_at
FROM ad_campaigns
WHERE type = 'Video' 
  AND status = 'Active'
  AND (video_url IS NOT NULL OR direct_link IS NOT NULL)
  AND (start_date IS NULL OR start_date <= NOW())
  AND (end_date IS NULL OR end_date >= NOW())
ORDER BY created_at DESC;

-- Grant select on the view to authenticated users
GRANT SELECT ON active_video_campaigns TO authenticated;
GRANT SELECT ON active_video_campaigns TO anon;

