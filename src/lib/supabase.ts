import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 型定義
export interface User {
  id: string;
  email: string;
  family_group_id?: string;
}

export interface FamilyGroup {
  id: string;
  group_code: string;
  member_count: number;
  created_at: string;
}
