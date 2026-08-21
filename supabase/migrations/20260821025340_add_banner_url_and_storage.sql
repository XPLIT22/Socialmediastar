/*
# Add profile banner photo support

## Overview
Adds a `banner_url` column to the `profiles` table so users can upload a
background/banner photo for their profile. Also creates a storage bucket
`profile-photos` for user-uploaded avatar and banner images, with RLS
policies allowing public reads and owner-scoped writes.

## Changes
1. `profiles` table — new column:
   - `banner_url` (text, nullable) — URL to the user's banner/background image.
2. Storage bucket `profile-photos` — public bucket for avatar and banner uploads.
3. Storage policies on `storage.objects`:
   - Public read: anyone can read objects in the `profile-photos` bucket.
   - Owner insert: authenticated users can upload objects to a path
     starting with their own user ID.
   - Owner update: authenticated users can update their own objects.
   - Owner delete: authenticated users can delete their own objects.

## Security
- The `banner_url` column inherits the existing `profiles_update_own` policy
  (users can only update their own profile row), so no new table-level policy
  is needed.
- Storage policies scope writes to paths prefixed with the uploader's
  `auth.uid()` so users can only modify their own files.
*/

-- Add banner_url column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'banner_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN banner_url text;
  END IF;
END $$;

-- Create the profile-photos storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-photos bucket
DROP POLICY IF EXISTS "profile_photos_read_all" ON storage.objects;
CREATE POLICY "profile_photos_read_all" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "profile_photos_insert_own" ON storage.objects;
CREATE POLICY "profile_photos_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "profile_photos_update_own" ON storage.objects;
CREATE POLICY "profile_photos_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "profile_photos_delete_own" ON storage.objects;
CREATE POLICY "profile_photos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
