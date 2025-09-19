-- Enable RLS and add permissive policies for demo purposes
-- NOTE: This allows public read/insert/delete. Tighten for production.

ALTER TABLE ad_videos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ad_videos' AND policyname = 'Allow read to everyone'
  ) THEN
    CREATE POLICY "Allow read to everyone" ON ad_videos
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ad_videos' AND policyname = 'Allow insert to everyone'
  ) THEN
    CREATE POLICY "Allow insert to everyone" ON ad_videos
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ad_videos' AND policyname = 'Allow delete to everyone'
  ) THEN
    CREATE POLICY "Allow delete to everyone" ON ad_videos
      FOR DELETE
      USING (true);
  END IF;
END $$;