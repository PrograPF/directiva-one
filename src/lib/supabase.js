import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('--- DEBUG SUPABASE ---');
console.log('URL definida:', !!supabaseUrl);
console.log('KEY definida:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR CRÍTICO: Faltan variables de entorno de Supabase.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
