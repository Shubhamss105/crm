import { Opportunity, ModulePermission } from '../types/index'; // Added ModulePermission
import { supabase } from '../lib/supabaseClient';

// Define a type for potential filters
// For now, using Partial<Opportunity> for flexibility, but a dedicated filter type is good practice.
export interface OpportunityFilters {
  name?: string;
  stage?: string;
  assigned_to?: string;
  min_value?: number;
  max_value?: number;
  expected_close_date_after?: string;
  expected_close_date_before?: string;
  // Add other filterable fields as needed
}

export const opportunityService = {
  // Fetch paginated opportunities
  async getOpportunities(
    currentLoggedInUserId: string, // ID of the user making the request (for 'assigned' view)
    page: number,
    limit: number = 10,
    modulePermissions?: ModulePermission,
    // Optional: Pass other filters from UI
    uiFilters?: OpportunityFilters,
    // Optional: Pass tenancy filter if opportunities.user_id is for org/tenancy rather than creator
    tenancyUserIdFilter?: string,
    sortBy: string = 'created_at',
    sortAsc: boolean = false
  ): Promise<{ data: Opportunity[]; total: number }> {

    if (modulePermissions?.view_type === 'none') {
      return { data: [], total: 0 };
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('opportunities')
      .select('*, user_profiles!opportunities_assigned_to_fkey (name), customers (name), leads (name)', { count: 'exact' });
      // Assuming 'assigned_to' is a FK to user_profiles.user_id for fetching assignee name.
      // And customer_id, lead_id are FKs for fetching their names. Adjust if FK names are different.

    // Apply tenancy filter (e.g., if opportunities.user_id is an organization_id or creator_id for overall scope)
    if (tenancyUserIdFilter) {
        query = query.eq('user_id', tenancyUserIdFilter);
    }

    // Apply RBAC view permissions
    if (modulePermissions?.view_type === 'assigned') {
      query = query.eq('assigned_to', currentLoggedInUserId);
    }
    // For 'view:all', RLS policies on Supabase should enforce overall data visibility.
    // If uiFilters are passed, they are applied regardless of 'assigned' or 'all' view,
    // but 'assigned' takes precedence for the assigned_to field.

    // Apply UI filters
    if (uiFilters) {
      if (uiFilters.name) {
        query = query.ilike('name', `%${uiFilters.name}%`);
      }
      if (uiFilters.stage) {
        query = query.eq('stage', uiFilters.stage);
      }
      // Only apply assigned_to from UI filters if view is not 'assigned' (which overrides it)
      if (modulePermissions?.view_type !== 'assigned' && uiFilters.assigned_to) {
        query = query.eq('assigned_to', uiFilters.assigned_to);
      }
      if (uiFilters.min_value !== undefined) {
        query = query.gte('value', uiFilters.min_value);
      }
      if (uiFilters.max_value !== undefined) {
        query = query.lte('value', uiFilters.max_value);
      }
      if (uiFilters.expected_close_date_after) {
        query = query.gte('expected_close_date', uiFilters.expected_close_date_after);
      }
      if (uiFilters.expected_close_date_before) {
        query = query.lte('expected_close_date', uiFilters.expected_close_date_before);
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortAsc });

    // Apply pagination
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching opportunities:', error);
      throw new Error(error.message);
    }
    return { data: data as Opportunity[], total: count || 0 };
  },

  // Create a new opportunity
  // userId here is the creator of the opportunity
  async createOpportunity(opportunityData: Partial<Opportunity>, userId: string): Promise<Opportunity> {
    const newOpportunity = {
      ...opportunityData,
      user_id: userId,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      // Ensure default values for required fields if not provided
      name: opportunityData.name || 'Untitled Opportunity',
      value: opportunityData.value || 0,
      currency: opportunityData.currency || 'USD',
      stage: opportunityData.stage || 'prospecting',
      probability: opportunityData.probability === undefined ? 0.1 : opportunityData.probability, // Default to 10% if not set
      expected_close_date: opportunityData.expected_close_date || new Date().toISOString(),
      assigned_to: opportunityData.assigned_to || '', // Or link to current user by default
      tags: opportunityData.tags || [],
    };

    const { data, error } = await supabase
      .from('opportunities')
      .insert([newOpportunity])
      .select()
      .single();

    if (error) {
      console.error('Error creating opportunity:', error);
      throw new Error(error.message);
    }
    return data as Opportunity;
  },

  // Update an existing opportunity
  async updateOpportunity(opportunityId: string, opportunityData: Partial<Opportunity>, userId: string): Promise<Opportunity> {
    const dataToUpdate = {
      ...opportunityData,
      last_activity: new Date().toISOString(),
    };

    // Remove user_id and created_at from update payload if they exist, as they shouldn't be changed
    delete (dataToUpdate as any).user_id;
    delete (dataToUpdate as any).created_at;

    const { data, error } = await supabase
      .from('opportunities')
      .update(dataToUpdate)
      .eq('id', opportunityId)
      .eq('user_id', userId) // Ensure user can only update their own opportunities
      .select()
      .single();

    if (error) {
      console.error('Error updating opportunity:', error);
      throw new Error(error.message);
    }
    return data as Opportunity;
  },

  // Delete an opportunity
  async deleteOpportunity(opportunityId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', opportunityId)
      .eq('user_id', userId); // Ensure user can only delete their own opportunities

    if (error) {
      console.error('Error deleting opportunity:', error);
      throw new Error(error.message);
    }
  },

  // Subscribe to real-time opportunity updates
  subscribeToOpportunities(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('opportunities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opportunities',
          filter: `user_id=eq.${userId}` // Filter for the current user's opportunities
        },
        callback
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Error subscribing to opportunities:', err);
        }
      });
  }
};
