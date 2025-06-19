import supabase from './supabaseClient';

export const fetchNotes = async () => {
  const { data, error } = await supabase.from('notes').select('*');
  if (error) throw error;
  return data;
};

export const insertNote = async (note) => {
  const { error } = await supabase.from('notes').insert([note]);
  if (error) throw error;
};

export const updateNote = async (note) => {
  const { error } = await supabase
    .from('notes')
    .update(note)
    .eq('id', note.id);
  if (error) throw error;
};

export const deleteNoteDB = async (id) => {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
};
