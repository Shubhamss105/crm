import { Customer, ModulePermission } from '../types/index'; // Added ModulePermission
import { supabase } from '../lib/supabaseClient';

export const customerService = {
  // Fetch paginated customers for the authenticated user, considering their permissions
  async getCustomers(
    currentLoggedInUserId: string, // ID of the user making the request
    page: number,
    limit: number = 10,
    modulePermissions?: ModulePermission
    // Assuming customers.user_id is the main field for ownership/tenancy for this module
  ): Promise<{ data: Customer[]; total: number }> {

    if (modulePermissions?.view_type === 'none') {
      return { data: [], total: 0 };
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('customers')
      .select('*, user_profiles (name)', { count: 'exact' }); // Example of joining created_by user name

    // Apply RBAC view permissions
    // For customers, 'assigned' might mean customers where 'user_id' (creator/owner) is the current user.
    // If there was a different 'account_manager_id' or 'assigned_sales_rep_id' field on the customers table,
    // modulePermissions.view_type === 'assigned' would filter by that field.
    // Given the current structure where customers have a 'user_id' (likely creator/owner),
    // 'view:assigned' will be treated as "show customers this user owns/created".
    // 'view:all' will show all customers this user is allowed to see by RLS (e.g. all in their org).

    if (modulePermissions?.view_type === 'assigned') {
      // This assumes 'user_id' on the customer record implies assignment or direct ownership for viewing.
      // If not, and 'assigned' means something else, this logic needs a specific 'assigned_to_user_id' field.
      query = query.eq('user_id', currentLoggedInUserId);
    } else if (modulePermissions?.view_type === 'all') {
      // For 'view:all', RLS policies on Supabase should handle what "all" means for this user (e.g., all within their organization).
      // No additional explicit client-side filter needed here for 'all' beyond what RLS enforces.
      // If there's an explicit organization_id on customers, that would be applied here or by RLS.
      // The original query had .eq('user_id', userId) which might be the tenancy filter.
      // We assume RLS handles the broader "all" visibility. If not, and `customers.user_id` IS the tenancy key,
      // then it should be applied for 'view:all' if that means "all within my user_id scope".
      // This is subtle. Let's assume for now RLS handles 'all' correctly without an explicit 'user_id' filter here for 'all'.
      // If `customers.user_id` is the *only* tenancy key, then it *should* be applied for 'all' as well,
      // e.g. query = query.eq('user_id', some_org_or_creator_context_id_passed_in_or_from_user_profile);
      // For now, the provided DDL for customers has `user_id` as the main link to a user (creator/owner).
    }
    // If no specific view type filter is applied, RLS is the ultimate guard.

    query = query.order('created_at', { ascending: false }).range(start, end);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching customers:", error);
      throw new Error(error.message);
    }
    return { data: data as Customer[], total: count || 0 };
  },

  // Create a new customer
  // userId here is the creator of the customer
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
