// scratch/check-push-db.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dqbwzipapudrkdvvybpd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxYnd6aXBhcHVkcmtkdnZ5YnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODE3OTIsImV4cCI6MjA5MDE1Nzc5Mn0.NKjoqccORSc9FCmAvE8uM6bZg6gFDots_IdEo3EfV-k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: inscricoes, error } = await supabase.from('push_inscricoes').select('*');
  console.log('Inscrições encontradas:', inscricoes);
  if (error) {
    console.error('Erro:', error.message);
  }
}

run();
