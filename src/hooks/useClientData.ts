import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useClientData = <T>(
  tableName: string,
  initialData: T[] = []
) => {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.client_id) {
      setLoading(false);
      return;
    }

    fetchData();
  }, [user?.client_id, tableName]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: fetchedData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('client_id', user?.client_id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setData(fetchedData || []);
    } catch (err) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Fallback to initial data on error
      setData(initialData);
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async (record: Omit<T, 'id' | 'created_at' | 'updated_at' | 'client_id'>) => {
    try {
      const { data: newRecord, error } = await supabase
        .from(tableName)
        .insert({
          ...record,
          client_id: user?.client_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setData(prev => [newRecord, ...prev]);
      return { success: true, data: newRecord };
    } catch (err) {
      console.error(`Error creating ${tableName} record:`, err);
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const updateRecord = async (id: string, updates: Partial<T>) => {
    try {
      const { data: updatedRecord, error } = await supabase
        .from(tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('client_id', user?.client_id)
        .select()
        .single();

      if (error) throw error;

      setData(prev => prev.map(item => 
        (item as any).id === id ? updatedRecord : item
      ));
      return { success: true, data: updatedRecord };
    } catch (err) {
      console.error(`Error updating ${tableName} record:`, err);
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('client_id', user?.client_id);

      if (error) throw error;

      setData(prev => prev.filter(item => (item as any).id !== id));
      return { success: true };
    } catch (err) {
      console.error(`Error deleting ${tableName} record:`, err);
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    createRecord,
    updateRecord,
    deleteRecord
  };
};