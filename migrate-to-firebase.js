const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, getDocs } = require('firebase/firestore');

const supabase = createClient('https://dqbwzipapudrkdvvybpd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxYnd6aXBhcHVkcmtkdnZ5YnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODE3OTIsImV4cCI6MjA5MDE1Nzc5Mn0.NKjoqccORSc9FCmAvE8uM6bZg6gFDots_IdEo3EfV-k');

const firebaseConfig = {
  apiKey: 'AIzaSyCuicJZFBMWJYj5UHPCvuI5tXoqPP_u-eE',
  authDomain: 'hecthapp.firebaseapp.com',
  projectId: 'hecthapp',
  storageBucket: 'hecthapp.firebasestorage.app',
  messagingSenderId: '1056515816857',
  appId: '1:1056515816857:web:724e37e2749eeb6fcde708'
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

async function migrarTabelas() {
  console.log('--- INICIANDO EXPORTACAO DO SUPABASE ---');

  // 1. ALUNOS
  console.log('Buscando alunos...');
  const { data: alunos, error: errAlunos } = await supabase.from('alunos').select('*');
  if (errAlunos) console.error('Erro alunos:', errAlunos);
  else {
    console.log(Exportados  alunos.);
    for (const aluno of alunos) {
      const docId = aluno.email ? aluno.email.trim().toLowerCase() : String(aluno.id);
      await setDoc(doc(db, 'alunos', docId), aluno);
    }
    console.log('? Alunos importados no Firestore com sucesso!');
  }

  // 2. TURMAS
  console.log('Buscando turmas...');
  const { data: turmas, error: errTurmas } = await supabase.from('turmas').select('*');
  if (errTurmas) console.error('Erro turmas:', errTurmas);
  else {
    console.log(Exportadas  turmas.);
    for (const turma of turmas) {
      await setDoc(doc(db, 'turmas', String(turma.id)), turma);
    }
    console.log('? Turmas importadas no Firestore com sucesso!');
  }

  // 3. PRESENCAS
  console.log('Buscando presencas...');
  const { data: presencas, error: errPresencas } = await supabase.from('presencas').select('*');
  if (errPresencas) console.error('Erro presencas:', errPresencas);
  else {
    console.log(Exportadas  presencas.);
    for (const p of presencas) {
      const pId = p.id ? String(p.id) : ${p.turma_id}_;
      await setDoc(doc(db, 'presencas', pId), p);
    }
    console.log('? Presencas importadas no Firestore com sucesso!');
  }

  // 4. PRECOS
  console.log('Buscando precos...');
  const { data: precos, error: errPrecos } = await supabase.from('precos').select('*');
  if (errPrecos) console.error('Erro precos:', errPrecos);
  else if (precos && precos.length > 0) {
    for (const pr of precos) {
      await setDoc(doc(db, 'precos', String(pr.id || 'config')), pr);
    }
    console.log('? Precos importados no Firestore com sucesso!');
  }

  console.log('?? MIGRAÇÃO DE DADOS 100% CONCLUÍDA!');
  process.exit(0);
}

migrarTabelas();
