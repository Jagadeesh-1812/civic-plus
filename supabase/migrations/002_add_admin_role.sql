-- Add admin role and rejected status for two-tier user system
-- Run after 001_initial_schema.sql

-- Add 'admin' to user_role_enum (if not using authority as admin)
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'admin';

-- Add 'rejected' to issue_status_enum
ALTER TYPE issue_status_enum ADD VALUE IF NOT EXISTS 'rejected';

-- Update RLS: allow admin (or authority) to update issues
-- Drop existing policy and recreate to include admin
DROP POLICY IF EXISTS "Authorities/volunteers can update issue status" ON issues;
CREATE POLICY "Admins can update issue status" ON issues FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'authority', 'volunteer')
    )
  );
