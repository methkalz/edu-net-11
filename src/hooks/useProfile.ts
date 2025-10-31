import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  user_id: string;
  role: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  display_title?: string;
  is_primary_admin?: boolean;
  level?: number;
  login_count?: number;
  last_login_at?: string;
  created_at?: string;
  font_size?: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error in fetchProfile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { profile, loading };
};
