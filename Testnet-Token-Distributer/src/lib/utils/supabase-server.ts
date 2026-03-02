import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Deep no-op proxy that handles nested calls like supabase.auth.getSession()
function createNoopClient(): any {
  const handler: ProxyHandler<any> = {
    get: () => new Proxy(() => Promise.resolve({ data: { session: null, subscription: { unsubscribe: () => { } }, user: null }, error: null }), handler),
    apply: () => Promise.resolve({ data: { session: null, subscription: { unsubscribe: () => { } }, user: null }, error: null }),
  };
  return new Proxy({}, handler);
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return createNoopClient();
  }

  try {
    const cookieStore = await cookies()

    return createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Called from Server Component
            }
          },
        },
      }
    )
  } catch {
    return createNoopClient();
  }
}
