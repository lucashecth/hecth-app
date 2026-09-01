import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email) {
        const emailLimpo = user.email.trim().toLowerCase();
        if (emailLimpo === 'lucas.hecth@gmail.com') {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from('alunos')
          .select('is_admin, nivel')
          .eq('email', emailLimpo)
          .maybeSingle();
        
        const nivel = String(data?.nivel || '').toLowerCase();
        setIsAdmin(Boolean(data?.is_admin || nivel.includes('gerencia')));
      }

      setLoading(false);
    }
    checkAdmin();
  }, []);

  return { isAdmin, loading };
}