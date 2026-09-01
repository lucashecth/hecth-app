const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyCuicJZFBMWJYj5UHPCvuI5tXoqPP_u-eE',
  authDomain: 'hecthapp.firebaseapp.com',
  projectId: 'hecthapp',
  storageBucket: 'hecthapp.firebasestorage.app',
  messagingSenderId: '1056515816857',
  appId: '1:1056515816857:web:724e37e2749eeb6fcde708'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function criarContasParaTodos() {
  console.log('--- INICIANDO CRIACAO DE USUARIOS NO FIREBASE AUTH ---');
  const snap = await getDocs(collection(db, 'alunos'));
  console.log('Total de alunos para criar Auth:', snap.size);

  let criados = 0;
  let jaExistiam = 0;
  let erros = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (!data.email) continue;

    const email = data.email.trim().toLowerCase();
    // Senha padrao inicial: hecth123 (ou senha de gestor se for lucas)
    const senha = (email === 'lucas.hecth@gmail.com') ? '10filhotes' : 'hecth123';

    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      criados++;
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        jaExistiam++;
      } else {
        console.error('Erro ao criar conta:', email, e.code);
        erros++;
      }
    }
  }

  console.log(? Contas Criadas: , Já Existiam: , Erros: );
  console.log('?? TODOS OS ALUNOS AGORA POSSUEM LOGIN NO FIREBASE AUTH!');
  process.exit(0);
}

criarContasParaTodos();
