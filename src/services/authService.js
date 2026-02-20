import { supabase } from '../lib/supabase';

export const authService = {
  async signUp(email, password, fullName, avatarUrl) {
    const { data, error } = await supabase?.auth?.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          avatar_url: avatarUrl || '',
          role: 'user'
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await supabase?.auth?.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    const { data, error } = await supabase?.auth?.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location?.origin}/contract-dashboard`
      }
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase?.auth?.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase?.auth?.getUser();
    if (error) throw error;
    return user;
  },

  async updatePassword(newPassword) {
    const { data, error } = await supabase?.auth?.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  }
};