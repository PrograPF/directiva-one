import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function testCalendar() {
  console.log('Probando tabla calendario...')
  const { data, error } = await supabase
    .from('calendario')
    .select('*')
    .limit(1)

  if (error) {
    console.log('Error o tabla no existe:', error.message)
    console.log('CÓDIGO SQL PARA CREAR LA TABLA:')
    console.log(`
CREATE TABLE calendario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'Evento',
  description TEXT,
  time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE calendario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura a todos" ON calendario FOR SELECT USING (true);
CREATE POLICY "Permitir todo a autenticados" ON calendario FOR ALL USING (true);
    `)
  } else {
    console.log('La tabla existe correctamente.')
  }
}

testCalendar()
