-- SECURE THE DATABASE: Enable Row Level Security (RLS) on the voter_registrations table
-- If the table doesn't exist, this script will first create it.

CREATE TABLE IF NOT EXISTS public.voter_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    cnic_number TEXT UNIQUE NOT NULL,
    hashed_cnic TEXT NOT NULL,
    uc_id INTEGER NOT NULL,
    wallet_address TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Forcefully enable RLS on the table
ALTER TABLE public.voter_registrations ENABLE ROW LEVEL SECURITY;

-- 1. DROP old policies if they exist (to ensure a clean slate)
DROP POLICY IF EXISTS "Deny all direct anon reads" ON public.voter_registrations;
DROP POLICY IF EXISTS "Deny all direct anon inserts" ON public.voter_registrations;
DROP POLICY IF EXISTS "Deny all direct anon updates" ON public.voter_registrations;
DROP POLICY IF EXISTS "Service Role Full Access" ON public.voter_registrations;

-- 2. Create policies that EXPLICITLY DENY everything to anon/public access
-- By providing NO true condition for anon users, they are locked out completely from direct client queries
CREATE POLICY "Deny all direct anon reads" ON public.voter_registrations FOR SELECT USING (false);
CREATE POLICY "Deny all direct anon inserts" ON public.voter_registrations FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all direct anon updates" ON public.voter_registrations FOR UPDATE USING (false);

-- 3. Allow only the Backend Service Role (Next.js server) full access
CREATE POLICY "Service Role Full Access" ON public.voter_registrations
    AS PERMISSIVE
    FOR ALL
    USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
    WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
