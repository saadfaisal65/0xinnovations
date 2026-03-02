-- Run this after running the main profile creation script to backfill any existing users
-- that already signed up via GitHub before the trigger was created.

INSERT INTO public.profiles (id, github_id, username, avatar_url)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'provider_id', raw_user_meta_data->>'user_name'),
  raw_user_meta_data->>'user_name',
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
