import supabase from '../config/supabaseClient';

export const getUserById = async (id: string) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
};

export const createUser = async (userData: Record<string, any>) => {
  const { data, error } = await supabase.from('users').insert(userData).single();
  if (error) throw new Error(error.message);
  return data;
};
