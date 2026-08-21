/*
# Update handle_new_user trigger

## Overview
Updates the `handle_new_user` trigger function to read `full_name` from the
sign-up metadata (`raw_user_meta_data`) instead of falling back to the email
address. The username is derived from the email prefix.

## Changes
- `handle_new_user()` now reads `NEW.raw_user_meta_data->>'full_name'` for the
  display name, falling back to the email if not provided.
- Username is derived from the email prefix (before the @), with a fallback
  to a truncated user ID to guarantee uniqueness.

## Security
- No security changes. The function remains SECURITY DEFINER with search_path
  set to public.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
BEGIN
  v_username := split_part(NEW.email, '@', 1);
  IF v_username = '' OR v_username IS NULL THEN
    v_username := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;

  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    v_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User')
  );
  RETURN NEW;
END;
$$;
