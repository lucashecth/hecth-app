import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';

class QueryBuilder {
  private colName: string;
  private filters: any[] = [];
  private orderField?: string;
  private orderDir: 'asc' | 'desc' = 'asc';

  constructor(colName: string) {
    this.colName = colName;
  }

  select(_fields?: string, _options?: any) {
    return this;
  }

  eq(field: string, val: any) {
    this.filters.push({ field, op: '==', val });
    return this;
  }

  neq(field: string, val: any) {
    this.filters.push({ field, op: '!=', val });
    return this;
  }

  ilike(field: string, val: string) {
    const limpo = String(val || '').replace(/_/g, '').toLowerCase().trim();
    this.filters.push({ field, op: '==', val: limpo });
    return this;
  }

  in(field: string, vals: any[]) {
    if (vals && vals.length > 0) {
      this.filters.push({ field, op: 'in', val: vals.slice(0, 30) });
    }
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderDir = (options && options.ascending === false) ? 'desc' : 'asc';
    return this;
  }

  async single(): Promise<{ data: any; error: any }> {
    const res = await this.execute();
    return { data: res.data ? res.data[0] || null : null, error: res.error };
  }

  async maybeSingle(): Promise<{ data: any; error: any }> {
    const res = await this.execute();
    return { data: res.data ? res.data[0] || null : null, error: null };
  }

  async execute(): Promise<{
    data: any[];
    error: any;
  }> {
    try {
      const colRef = collection(db, this.colName);
      let q: any = colRef;
      const firestoreConstraints: any[] = [];
      for (const f of this.filters) {
        firestoreConstraints.push(where(f.field, f.op, f.val));
      }
      if (this.orderField) {
        firestoreConstraints.push(orderBy(this.orderField, this.orderDir));
      }
      if (firestoreConstraints.length > 0) {
        q = query(colRef, ...firestoreConstraints);
      }
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

      if (this.orderField) {
        const field = this.orderField;
        const dir = this.orderDir;
        data.sort((a, b) => {
          const valA = String(a[field] || '');
          const valB = String(b[field] || '');
          const comp = valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' });
          return dir === 'desc' ? -comp : comp;
        });
      }

      return { data, error: null };
    } catch (err: any) {
      try {
        const snap = await getDocs(collection(db, this.colName));
        let items: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        for (const f of this.filters) {
          if (f.op === '==') {
            items = items.filter(it => String(it[f.field] || '').toLowerCase() === String(f.val || '').toLowerCase());
          } else if (f.op === '!=') {
            items = items.filter(it => String(it[f.field] || '').toLowerCase() !== String(f.val || '').toLowerCase());
          }
        }
        if (this.orderField) {
          const field = this.orderField;
          const dir = this.orderDir;
          items.sort((a, b) => {
            const valA = String(a[field] || '');
            const valB = String(b[field] || '');
            const comp = valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' });
            return dir === 'desc' ? -comp : comp;
          });
        }
        return { data: items, error: null };
      } catch (fallbackErr: any) {
        return { data: [], error: fallbackErr };
      }
    }

  }

  then(resolve: (value: any) => void) {
    return this.execute().then(resolve);
  }

  async insert(items: any[]) {
    try {
      for (const item of items) {
        let docId = item.id ? String(item.id) : (item.email ? item.email.trim().toLowerCase() : String(Date.now()));
        if (this.colName === 'presencas') {
          docId = String(item.turma_id) + '_' + String(item.aluno_email);
        }
        await setDoc(doc(db, this.colName, docId), { ...item, created_at: item.created_at || new Date().toISOString() });
      }
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  }

  update(fields: any) {
    return {
      eq: async (field: string, val: any) => {
        try {
          const valStr = String(val).toLowerCase().trim();
          
          // 1. Tenta atualizar direto pelo docId (ex: quando val é email)
          if (field === 'email' || (typeof val === 'string' && val.includes('@'))) {
            try {
              await updateDoc(doc(db, this.colName, valStr), fields);
              return { error: null };
            } catch (err) {}
          }

          // 2. Busca o documento no Firestore pelo campo (ex: 'id', 'email', etc)
          const snap = await getDocs(collection(db, this.colName));
          const matchedDocs = snap.docs.filter(d => {
            const data = d.data();
            if (d.id.toLowerCase() === valStr) return true;
            if (String(data[field]).toLowerCase() === valStr) return true;
            if (field === 'id' && String(data.id) === String(val)) return true;
            return false;
          });

          if (matchedDocs.length > 0) {
            for (const d of matchedDocs) {
              await updateDoc(doc(db, this.colName, d.id), fields);
            }
            return { error: null };
          }

          // 3. Fallback: tenta atualizar direto caso docId seja exatamente o val
          try {
            await updateDoc(doc(db, this.colName, valStr), fields);
            return { error: null };
          } catch (e: any) {
            return { error: e };
          }
        } catch (e: any) {
          return { error: e };
        }
      }
    };
  }

  delete() {
    return {
      eq: async (field: string, val: any) => {
        try {
          const valStr = String(val).toLowerCase().trim();
          
          // 1. Busca os documentos correspondentes
          const snap = await getDocs(collection(db, this.colName));
          const matchedDocs = snap.docs.filter(d => {
            const data = d.data();
            if (d.id.toLowerCase() === valStr) return true;
            if (String(data[field]).toLowerCase() === valStr) return true;
            if (field === 'id' && String(data.id) === String(val)) return true;
            return false;
          });

          if (matchedDocs.length > 0) {
            for (const d of matchedDocs) {
              await deleteDoc(doc(db, this.colName, d.id));
            }
            return { error: null };
          }

          // 2. Fallback direto pelo docId
          try {
            await deleteDoc(doc(db, this.colName, valStr));
          } catch (e) {}

          return { error: null };
        } catch (e: any) {
          return { error: e };
        }
      },
      match: async (filterObj: any) => {
        try {
          if (this.colName === 'presencas' && filterObj.turma_id && filterObj.aluno_email) {
            const docId = String(filterObj.turma_id) + '_' + String(filterObj.aluno_email);
            await deleteDoc(doc(db, 'presencas', docId));
          }
          return { error: null };
        } catch (e: any) {
          return { error: e };
        }
      }
    };
  }


}

export const supabase: any = {
  from(colName: string) {
    return new QueryBuilder(colName);
  },

  auth: {
    async getSession() {
      const user = auth.currentUser;
      return { data: { session: user ? { user: { email: user.email, id: user.uid } } : null } };
    },

    async getUser() {
      const user = auth.currentUser;
      return { data: { user: user ? { email: user.email, id: user.uid } : null } };
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        const session = user ? { user: { email: user.email, id: user.uid } } : null;
        callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      });
      return { data: { subscription: { unsubscribe } } };
    },

    async signInWithPassword({ email, password }: any) {
      const emailLimpo = email.trim().toLowerCase();
      try {
        const cred = await signInWithEmailAndPassword(auth, emailLimpo, password);
        return { data: { user: cred.user }, error: null };
      } catch (err: any) {
        // Se a conta de Auth ainda não existe no Firebase, mas o aluno já está cadastrado no banco:
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
          try {
            // Verifica se o aluno existe no banco Firestore
            const snap = await getDocs(query(collection(db, 'alunos'), where('email', '==', emailLimpo)));
            if (!snap.empty) {
              // Cria a conta do aluno no Firebase Auth na hora com a senha digitada
              const novaCred = await createUserWithEmailAndPassword(auth, emailLimpo, password);
              return { data: { user: novaCred.user }, error: null };
            }
          } catch (autoErr: any) {
            // Se falhar a criação automática (ex: já existia e a senha digitada estava errada)
            return { data: null, error: { message: 'E-mail ou senha incorretos.' } };
          }
        }
        return { data: null, error: { message: err.message } };
      }
    },


    async signUp({ email, password }: any) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        return { data: { user: cred.user }, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },

    async signOut() {
      await signOut(auth);
      return { error: null };
    },

    async updateUser({ password }: any) {
      try {
        if (auth.currentUser && password) {
          await updatePassword(auth.currentUser, password);
        }
        return { error: null };
      } catch (e: any) {
        return { error: e };
      }
    },

    async resetPasswordForEmail(email: string) {
      try {
        await sendPasswordResetEmail(auth, email.trim().toLowerCase());
        return { error: null };
      } catch (e: any) {
        return { error: e };
      }
    },

    async exchangeCodeForSession(_code: string) {
      return { data: null, error: null };
    }
  },

  storage: {
    from(_bucket: string) {
      return {
        async upload(_fileName: string, _file: File) {
          return { error: null };
        },
        getPublicUrl(fileName: string) {
          return { data: { publicUrl: '/avatares/' + fileName } };
        }
      };
    }
  },

  channel(_channelName: string) {
    return {
      on(_event: string, _opts: any, _cb: any) {
        return this;
      },
      subscribe() {
        return this;
      }
    };
  },

  removeChannel(_ch: any) {}
};