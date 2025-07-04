import { Opportunity } from '../types/index';
import { supabase } from '../lib/supabaseClient';

// Define a type for potential filters if we want to make it more specific
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
    userId: string,
    page: number,
    limit: number = 10,
    filters?: OpportunityFilters,
    sortBy: string = 'created_at',
    sortAsc: boolean = false
  ): Promise<{ data: Opportunity[]; total: number }> {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('opportunities')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (filters) {
      if (filters.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }
      if (filters.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.min_value !== undefined) {
        query = query.gte('value', filters.min_value);
      }
      if (filters.max_value !== undefined) {
        query = query.lte('value', filters.max_value);
      }
      if (filters.expected_close_date_after) {
        query = query.gte('expected_close_date', filters.expected_close_date_after);
      }
      if (filters.expected_close_date_before) {
        query = query.lte('expected_close_date', filters.expected_close_date_before);
      }
      // Add more filters as needed
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
