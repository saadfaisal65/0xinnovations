import { createBrowserClient } from '@supabase/ssr'

// Deep no-op proxy that handles nested calls like supabase.auth.getSession()
function createNoopClient(): any {
  const handler: ProxyHandler<any> = {
    get: () => new Proxy(() => Promise.resolve({ data: { session: null, subscription: { unsubscribe: () => { } }, user: null }, error: null }), handler),
    apply: () => Promise.resolve({ data: { session: null, subscription: { unsubscribe: () => { } }, user: null }, error: null }),
  };
  return new Proxy({}, handler);
}

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return createNoopClient();
  }

  try {
    cachedClient = createBrowserClient(supabaseUrl, supabaseKey);
    return cachedClient;
  } catch {
    return createNoopClient();
  }
}
