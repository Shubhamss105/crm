import { Lead, CommunicationRecord, ModulePermission } from '../types/index'; // Added ModulePermission
import { supabase } from '../lib/supabaseClient';


export const leadsService = {
  // Fetch paginated leads for the authenticated user, considering their permissions
  async getLeads(
    currentLoggedInUserId: string, // ID of the user making the request
    page: number,
    limit: number = 10,
    modulePermissions?: ModulePermission,
    // The original userId parameter might have been for tenancy/organization. Let's clarify.
    // For now, assuming leads are generally scoped by an org_id or similar,
    // or if not, view:all shows all. If user_id on leads table IS the creator/owner for tenancy:
    tenancyUserIdFilter?: string // This would be the ID used for the general .eq('user_id', tenancyUserIdFilter)
  ): Promise<{ data: Lead[]; total: number }> {

    if (modulePermissions?.view_type === 'none') {
      return { data: [], total: 0 };
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' });

    // Apply tenancy filter if provided (e.g., all leads created by users in the same org)
    // This is a placeholder for how multi-tenancy might be applied.
    // If your 'leads.user_id' IS the creator and 'view:all' means all by that creator,
    // then tenancyUserIdFilter would be that creator's ID.
    // If 'leads.user_id' is more like an organization_id, that logic would apply here.
    // For RBAC, the crucial part is below.
    if (tenancyUserIdFilter) { // This is the original .eq('user_id', userId) logic
        query = query.eq('user_id', tenancyUserIdFilter);
    }


    // Apply RBAC view permissions
    if (modulePermissions?.view_type === 'assigned') {
      query = query.eq('assigned_to', currentLoggedInUserId);
    }
    // For 'view:all', no additional filtering based on assignment is done here.
    // RLS policies on Supabase should enforce overall data visibility.

    query = query.order('created_at', { ascending: false }).range(start, end);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching leads:", error);
      throw new Error(error.message);
    }
    return { data: data as Lead[], total: count || 0 };
  },

  // Create a new lead
  // userId here is the creator of the lead
  async createLead(leadData: Partial<Lead>, userId: string): Promise<Lead> {
    const newLead = {
      ...leadData,
      user_id: userId,
      created_at: new Date().toISOString(),
      status: leadData.status || 'new',
      score: leadData.score || 0,
      tags: leadData.tags || [],
      assigned_to: leadData.assigned_to // Use assigned_to
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([newLead])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Lead;
  },

  // Update an existing lead
  async updateLead(leadId: string, leadData: Partial<Lead>, userId: string): Promise<Lead> {
    const updatedLead = {
      ...leadData,
      assigned_to: leadData.assigned_to // Use assigned_to
    };

    const { data, error } = await supabase
      .from('leads')
      .update(updatedLead)
      .eq('id', leadId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Lead;
  },

  // Delete a lead
  async deleteLead(leadId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  // Fetch communications for a lead
  async getCommunications(leadId: string, userId: string): Promise<CommunicationRecord[]> {
    const { data, error } = await supabase
      .from('communications')
      .select('*')
      .eq('lead_id', leadId)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw new Error(error.message);
    return data as CommunicationRecord[];
  },

  // Create a new communication
  async createCommunication(communicationData: Partial<CommunicationRecord>, userId: string): Promise<CommunicationRecord> {
    const newCommunication = {
      ...communicationData,
      user_id: userId,
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('communications')
      .insert([newCommunication])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as CommunicationRecord;
  },

  // Subscribe to real-time lead updates
  subscribeToLeads(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to real-time communication updates
  subscribeToCommunications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('communications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
};