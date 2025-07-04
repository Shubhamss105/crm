import { Customer } from '../types/index';
import { supabase } from '../lib/supabaseClient';

export const customerService = {
  // Fetch paginated customers for the authenticated user
  async getCustomers(userId: string, page: number, limit: number = 10): Promise<{ data: Customer[]; total: number }> {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw new Error(error.message);
    return { data: data as Customer[], total: count || 0 };
  },

  // Create a new customer
  async createCustomer(customerData: Partial<Customer>, userId: string): Promise<Customer> {
    const newCustomer = {
      ...customerData,
      user_id: userId,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(), // Initialize last_activity
      tags: customerData.tags || [],
      // Ensure default values for other potentially nullable fields if necessary
      phone: customerData.phone || null,
      company: customerData.company || null,
      notes: customerData.notes || null,
      total_value: customerData.total_value || 0,
      currency: customerData.currency || 'USD',
      language: customerData.language || 'English',
      addresses: customerData.addresses || [],
    };

    const { data, error } = await supabase
      .from('customers')
      .insert([newCustomer])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Customer;
  },

  // Update an existing customer
  async updateCustomer(customerId: string, customerData: Partial<Customer>, userId: string): Promise<Customer> {
    const updatedCustomer = {
      ...customerData,
      last_activity: new Date().toISOString(), // Update last_activity on any change
    };

    const { data, error } = await supabase
      .from('customers')
      .update(updatedCustomer)
      .eq('id', customerId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Customer;
  },

  // Delete a customer
  async deleteCustomer(customerId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  // Subscribe to real-time customer updates
  subscribeToCustomers(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
};
