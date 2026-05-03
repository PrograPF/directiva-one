import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yqhwapckkzjyaqkofvbq.supabase.co'
const SUPABASE_KEY = 'sb_publishable_4htdJtjBhyg-ghAifXRK9g_m6W1UsL2'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkTables() {
  console.log('--- Verificando Tablas para Votaciones ---')
  
  const { error: errorVotaciones } = await supabase.from('votaciones').select('*').limit(1)
  if (errorVotaciones) {
    console.log('❌ Tabla "votaciones" NO encontrada o inaccesible:', errorVotaciones.message)
  } else {
    console.log('✅ Tabla "votaciones" lista.')
  }

  const { error: errorVotos } = await supabase.from('votos_por_alumno').select('*').limit(1)
  if (errorVotos) {
    console.log('❌ Tabla "votos_por_alumno" NO encontrada:', errorVotos.message)
  } else {
    console.log('✅ Tabla "votos_por_alumno" lista.')
  }
}

checkTables()
