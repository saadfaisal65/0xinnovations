import { useEffect, useState } from "react";
import { createClient } from "@/lib/utils/supabase-browser";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event: string, session: Session | null) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const handleLogin = async () => {
        // Use configured site URL, or Vercel URL, or fallback to current origin
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
            || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null)
            || window.location.origin;

        await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${siteUrl}/auth/callback`
            }
        });
    };

    return { user, handleLogin, handleLogout };
}
