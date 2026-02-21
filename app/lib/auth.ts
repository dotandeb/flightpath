import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// You'll need to add these to your .env.local:
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
  search_count: number;
  max_searches: number;
  is_admin: boolean;
}

// Magic login credentials (for admin access)
export const MAGIC_LOGIN = {
  email: 'admin@flightpath.solutions',
  password: 'FlightPath2026!',
};

// Check if user can search
export async function canUserSearch(userId: string): Promise<{ canSearch: boolean; remaining: number }> {
  if (!supabase) {
    // No database - allow searches (fallback)
    return { canSearch: true, remaining: 999 };
  }

  const { data, error } = await supabase
    .from('users')
    .select('search_count, max_searches, is_admin')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return { canSearch: false, remaining: 0 };
  }

  // Admin always has unlimited
  if (data.is_admin) {
    return { canSearch: true, remaining: 999999 };
  }

  const remaining = data.max_searches - data.search_count;
  return { canSearch: remaining > 0, remaining };
}

// Increment search count
export async function incrementSearchCount(userId: string): Promise<void> {
  if (!supabase) return;

  await supabase.rpc('increment_search_count', { user_id: userId });
}

// Sign up new user
export async function signUpUser(email: string, password: string): Promise<{ user: any; error: any }> {
  if (!supabase) {
    // Fallback - create local user
    const mockUser = {
      id: 'local-' + Date.now(),
      email,
      search_count: 0,
      max_searches: 1, // 1 free search
      is_admin: false,
    };
    return { user: mockUser, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (data.user) {
    // Create user record in database
    await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email,
      search_count: 0,
      max_searches: 1, // 1 free search on signup
      is_admin: false,
    });
  }

  return { user: data.user, error };
}

// Sign in user
export async function signInUser(email: string, password: string): Promise<{ user: any; error: any }> {
  // Check magic login first
  if (email === MAGIC_LOGIN.email && password === MAGIC_LOGIN.password) {
    const adminUser = {
      id: 'admin-' + Date.now(),
      email: MAGIC_LOGIN.email,
      search_count: 0,
      max_searches: 999999,
      is_admin: true,
    };
    return { user: adminUser, error: null };
  }

  if (!supabase) {
    return { user: null, error: { message: 'Database not configured' } };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data.user, error };
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}
