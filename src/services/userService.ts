import { supabase } from '../lib/supabaseClient';
import { UserProfile, Role } from '../types'; // Assuming these types will be defined/updated in src/types/index.ts

export const userService = {
  /**
   * Fetches a user's profile data.
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        roles (*)
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error.message);
      // Return null or throw error based on how you want to handle missing profiles
      // For RBAC, a user might not have a profile yet if the trigger failed or wasn't setup.
      return null;
    }
    return data as UserProfile;
  },

  /**
   * Assigns a role to a user in the user_profiles table.
   */
  async assignUserRole(userId: string, roleId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role_id: roleId, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select(`
        *,
        roles (*)
      `)
      .single();

    if (error) {
      console.error(`Error assigning role ${roleId} to user ${userId}:`, error);
      throw error;
    }
    return data as UserProfile;
  },

  /**
   * Creates a new sub-user (team member).
   * This involves creating an auth user in Supabase and then a profile in user_profiles.
   */
  async createSubUser(
    email: string,
    password: string,
    roleId: string,
    name: string | undefined,
    createdByUserId: string
  ): Promise<UserProfile | null> {
    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      // You can add options like email_confirm: true if needed
    });

    if (authError || !authData.user) {
      console.error('Error creating sub-user in Supabase Auth:', authError);
      throw authError || new Error('User creation failed in Auth.');
    }

    const newUserId = authData.user.id;

    // 2. Create the user's profile in user_profiles
    // The handle_new_user trigger should ideally create a basic profile.
    // Here, we update it or create if the trigger didn't run or needs more info.
    const profileData = {
      user_id: newUserId,
      role_id: roleId,
      name: name || email.split('@')[0], // Default name if not provided
      created_by_user_id: createdByUserId,
      updated_at: new Date().toISOString(),
    };

    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert(profileData, { onConflict: 'user_id' }) // Use upsert in case trigger already created a row
      .select(`
        *,
        roles (*)
      `)
      .single();

    if (profileError) {
      console.error('Error creating/updating user profile for sub-user:', profileError);
      // Optional: attempt to delete the auth user if profile creation fails to keep things clean
      // await supabase.auth.admin.deleteUser(newUserId); // Requires service_role key
      throw profileError;
    }

    return userProfile as UserProfile;
  },

  /**
   * Fetches all sub-users created by a specific user (e.g., Super Admin).
   */
  async getSubUsers(creatorUserId: string): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        roles (*)
      `) // Select all profile fields and join role data
      .eq('created_by_user_id', creatorUserId);

    if (error) {
      console.error('Error fetching sub-users:', error);
      throw error;
    }
    return data as UserProfile[];
  },

  /**
   * Updates a sub-user's details (e.g., role, name).
   */
  async updateSubUser(userId: string, updates: { roleId?: string; name?: string }): Promise<UserProfile | null> {
    const dataToUpdate: { role_id?: string; name?: string; updated_at: string } = {
        updated_at: new Date().toISOString(),
    };

    if (updates.roleId) {
      dataToUpdate.role_id = updates.roleId;
    }
    if (updates.name) {
      dataToUpdate.name = updates.name;
    }

    if (Object.keys(dataToUpdate).length === 1 && dataToUpdate.updated_at) {
        // Only updated_at is present, nothing else to update.
        // Fetch current profile or return null if no actual change.
        return this.getUserProfile(userId);
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(dataToUpdate)
      .eq('user_id', userId)
      .select(`
        *,
        roles (*)
      `)
      .single();

    if (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
    return data as UserProfile;
  },

  // Note: Deleting a sub-user would typically involve:
  // 1. Deleting from user_profiles (CASCADE from auth.users should handle this if FK is set up correctly)
  // 2. Deleting from Supabase Auth using admin rights: await supabase.auth.admin.deleteUser(userId)
  // This requires the `supabaseAdmin` client initialized with the service_role key.
  // async deleteSubUser(userIdToDelete: string, adminAuthClient: SupabaseClient) { ... }
};
