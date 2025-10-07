-- Add policy to allow admin users to read all profiles
-- This fixes the issue where admin users cannot see user lists in the admin panel

-- Allow admin users to read all profiles
CREATE POLICY "Admins can read all profiles"
ON profiles
FOR SELECT
USING (
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'moderator')
  )
);

-- Allow admin users to update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
USING (
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'moderator')
  )
);

-- Allow admin users to delete profiles (if needed)
CREATE POLICY "Admins can delete profiles"
ON profiles
FOR DELETE
USING (
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'moderator')
  )
);

-- Also allow admin users to insert profiles
CREATE POLICY "Admins can insert profiles"
ON profiles
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'moderator')
  )
);
