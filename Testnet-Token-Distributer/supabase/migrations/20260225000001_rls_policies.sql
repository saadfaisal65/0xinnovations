-- Enable Row Level Security
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- 1. Users can ONLY read their own claims based on GitHub ID mapped from session
CREATE POLICY "Users can view own claims" ON public.claims
    FOR SELECT
    USING (
        -- auth.uid() is the Supabase user UUID. We need the raw user_meta_data->>user_name 
        -- or provider_id from GitHub. 
        -- We will pass github_id down from the session validation in the API.
        -- BUT for true backend RLS, we can match the JWT user metadata:
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'provider_id' = github_id
               OR raw_user_meta_data->>'user_name' = github_id
        )
    );

-- 2. ONLY the Backend API Action (using Service Role Key) can insert new claims
CREATE POLICY "Service Role can insert claims" ON public.claims
    FOR INSERT 
    WITH CHECK (
        -- Requires the backend API to use the SUPABASE_SERVICE_ROLE_KEY
        -- Regular anon or authenticated web clients cannot insert rows directly
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- 3. Prevent any updates or deletes (append-only ledger of claims)
CREATE POLICY "No updates allowed" ON public.claims
    FOR UPDATE USING (false);

CREATE POLICY "No deletes allowed" ON public.claims
    FOR DELETE USING (false);
