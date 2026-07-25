import { createClient } from '@supabase/supabase-js';

// 从环境变量读取 Supabase 配置
// Vite 中使用 import.meta.env.VITE_ 前缀
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 如果没配置，使用占位符（开发模式会提示配置）
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';
