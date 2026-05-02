import { createClient } from '@supabase/supabase-js'

// CLAVAMOS LAS LLAVES DIRECTO (SOLUCIÓN DE FUERZA BRUTA)
const URL_FINAL = 'https://yqhwapckkzjyaqkofvbq.supabase.co';
const KEY_FINAL = 'sb_publishable_4htdJtjBhyg-ghAifXRK9g_m6W1UsL2';

console.log('--- FORZANDO CONEXIÓN DIRECTA ---');

export const supabase = createClient(URL_FINAL, KEY_FINAL);
