-- Create table to store simple list of ad video links
CREATE TABLE IF NOT EXISTS ad_videos (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: seed with sample row for testing (safe, ignores conflicts)
INSERT INTO ad_videos (url)
VALUES ('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
ON CONFLICT (url) DO NOTHING;