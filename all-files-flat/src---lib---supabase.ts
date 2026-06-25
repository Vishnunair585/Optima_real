import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use a mock client if credentials are missing to prevent crashing the dev environment
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase URL and Key are required.') }),
        signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase URL and Key are required.') }),
        signInWithOAuth: async () => ({ data: { provider: null, url: null }, error: new Error('Supabase URL and Key are required.') }),
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ data: null, error: new Error('Supabase URL and Key are required.') }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    } as any;
