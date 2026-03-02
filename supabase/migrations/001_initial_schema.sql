-- CivicPulse Database Schema
-- Run this in Supabase SQL Editor or via Supabase CLI

-- Enums
CREATE TYPE issue_type_enum AS ENUM ('pothole', 'garbage', 'streetlight', 'water_leak', 'other');
CREATE TYPE severity_enum AS ENUM ('low', 'medium', 'high');
CREATE TYPE issue_status_enum AS ENUM ('new', 'verified', 'in_progress', 'resolved');
CREATE TYPE vote_enum AS ENUM ('confirm', 'reject');
CREATE TYPE user_role_enum AS ENUM ('citizen', 'authority', 'volunteer');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role user_role_enum DEFAULT 'citizen',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issues
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  issue_type issue_type_enum NOT NULL DEFAULT 'other',
  severity severity_enum NOT NULL DEFAULT 'medium',
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  address TEXT,
  status issue_status_enum NOT NULL DEFAULT 'new',
  priority_score DECIMAL(5, 2) DEFAULT 50,
  confirmations INT DEFAULT 0,
  rejections INT DEFAULT 0,
  location_sensitivity DECIMAL(3, 2) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Verifications (one vote per user per issue)
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote vote_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(issue_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority_score DESC);
CREATE INDEX idx_issues_created ON issues(created_at);
CREATE INDEX idx_issues_location ON issues(lat, lng);
CREATE INDEX idx_verifications_issue ON verifications(issue_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, users can update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Issues: public read, authenticated insert
CREATE POLICY "Issues are viewable by everyone" ON issues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issues" ON issues FOR INSERT WITH CHECK (true);
CREATE POLICY "Authorities/volunteers can update issue status" ON issues FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('authority', 'volunteer')
    )
  );

-- Verifications: authenticated insert, public read
CREATE POLICY "Verifications are viewable by everyone" ON verifications FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add verifications" ON verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for issue images
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-images', 'issue-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow uploads
CREATE POLICY "Anyone can upload issue images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'issue-images');

CREATE POLICY "Issue images are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'issue-images');
