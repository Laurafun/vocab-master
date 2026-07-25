import { createClient } from '@supabase/supabase-js';

// Supabase 配置 - 直接写入（部署到任何平台都不需要配置环境变量）
const supabaseUrl = 'https://uowcxcoxqbnxyghit.supabase.co';
const supabaseAnonKey = 'sb_publishable_WmN4C_DCLoU14NHI1wd1GA_FNMbjO3c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = true;
