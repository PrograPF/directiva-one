import { createClient } from '@supabase/supabase-js'

// Intentamos leer de las variables de entorno, si no, usamos el valor directo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yqhwapckkzjyaqkofvbq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4htdJtjBhyg-ghAifXRK9g_m6W1UsL2';

console.log('--- SISTEMA DE RECUPERACIÓN ACTIVADO ---');
console.log('URL de conexión establecida.');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
