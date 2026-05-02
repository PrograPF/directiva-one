import { createClient } from '@supabase/supabase-js'

// USAMOS CONSTANTES PURAS SIN NADA DE VARIABLES DE ENTORNO
const SUPABASE_URL = 'https://yqhwapckkzjyaqkofvbq.supabase.co'
const SUPABASE_KEY = 'sb_publishable_4htdJtjBhyg-ghAifXRK9g_m6W1UsL2'

console.log('--- INTENTO DE CONEXIÓN FINAL ---')

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
