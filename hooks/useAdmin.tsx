import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('alunos')
          .select('is_admin')
          .eq('email', user.email)
          .single();
        
        setIsAdmin(data?.is_admin || false);
      }
      setLoading(false);
    }
    checkAdmin();
  }, []);

  return { isAdmin, loading };
}