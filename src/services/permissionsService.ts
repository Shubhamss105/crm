import { supabase } from '../lib/supabaseClient';
import { Role, RolePermissionEntry, UserPermissions, ModulePermission } from '../types'; // Assuming these types will be defined in src/types/index.ts

export const permissionsService = {
  /**
   * Fetches the user's role and then all associated permissions,
   * transforming them into a structured UserPermissions object.
   */
  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    // 1. Fetch the user's role_id from user_profiles
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role_id, roles (is_super_admin)') // Also fetch is_super_admin from the role
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile or profile not found:', profileError);
      return null;
    }

    if (!userProfile.role_id) {
      console.warn(`User ${userId} does not have a role assigned.`);
      return { modules: {}, isSuperAdmin: false }; // Return empty permissions if no role
    }

    const roleIsSuperAdmin = (userProfile.roles as any)?.is_super_admin || false;

    // If the role is is_super_admin, grant all permissions implicitly
    if (roleIsSuperAdmin) {
      // Define what "all permissions" means for a super admin.
      // This could be a predefined full permission set or a dynamic check.
      // For simplicity, we can return a flag and let the frontend handle it,
      // or construct a full permission object here.
      // Let's return a flag and the AuthContext can decide how to interpret it.
      // Or, for a more explicit permissions object:
      const allModules = ['leads', 'customers', 'opportunities', 'settings_users', 'settings_roles']; // Add all your modules
      const superAdminPermissions: UserPermissions = {
        isSuperAdmin: true,
        modules: {},
      };
      allModules.forEach(module => {
        superAdminPermissions.modules[module] = {
          view_type: 'all',
          can_create: true,
          can_edit: true,
          can_delete: true,
        };
      });
      return superAdminPermissions;
    }

    // 2. Fetch all permission entries for that role_id
    const { data: rolePermissions, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('module, view_type, can_create, can_edit, can_delete')
      .eq('role_id', userProfile.role_id);

    if (permissionsError) {
      console.error('Error fetching role permissions:', permissionsError);
      return null;
    }

    // 3. Transform into a structured UserPermissions object
    const structuredPermissions: UserPermissions = {
      isSuperAdmin: roleIsSuperAdmin,
      modules: {},
    };

    rolePermissions.forEach(p => {
      structuredPermissions.modules[p.module] = {
        view_type: p.view_type as 'all' | 'assigned' | 'none',
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      };
    });

    return structuredPermissions;
  },

  /**
   * Fetches all available roles.
   */
  async getAllRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*');

    if (error) {
      console.error('Error fetching all roles:', error);
      throw error;
    }
    return data as Role[];
  },

  /**
   * Fetches all raw permission entries for a specific role.
   */
  async getRolePermissions(roleId: string): Promise<RolePermissionEntry[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId);

    if (error) {
      console.error(`Error fetching permissions for role ${roleId}:`, error);
      throw error;
    }
    return data as RolePermissionEntry[];
  },

  /**
   * Updates (or creates) permissions for a role.
   * This will typically involve deleting existing permissions for the role and module,
   * then inserting the new ones, or using upsert.
   */
  async updateRolePermissions(
    roleId: string,
    permissionsToUpdate: Array<{
      module: string;
      view_type: 'all' | 'assigned' | 'none';
      can_create: boolean;
      can_edit: boolean;
      can_delete: boolean;
    }>
  ): Promise<RolePermissionEntry[]> {
    // Prepare data for upsert
    const upsertData = permissionsToUpdate.map(p => ({
      role_id: roleId,
      module: p.module,
      view_type: p.view_type,
      can_create: p.can_create,
      can_edit: p.can_edit,
      can_delete: p.can_delete,
      // Supabase automatically handles created_at/updated_at if not part of primary key for upsert
      // but for role_permissions, (role_id, module) is unique.
      // We might need to fetch existing `id` or let Supabase handle it if `id` is not part of conflict target.
      // For simplicity, if `id` is just a PK and not used in conflict resolution for permissions,
      // we can upsert on (role_id, module).
    }));

    const { data, error } = await supabase
      .from('role_permissions')
      .upsert(upsertData, { onConflict: 'role_id, module' })
      .select();

    if (error) {
      console.error(`Error upserting permissions for role ${roleId}:`, error);
      throw error;
    }
    return data as RolePermissionEntry[];
  },

  /**
   * Creates a new role.
   */
  async createRole(name: string, isSuperAdmin: boolean = false): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .insert([{ name, is_super_admin: isSuperAdmin }])
      .select()
      .single();

    if (error) {
      console.error('Error creating role:', error);
      throw error;
    }
    return data as Role;
  },
};

// Helper function to update timestamps - not strictly needed if DB handles it
// async function touchUpdatedAt(table: string, recordId: string) {
//   await supabase.from(table).update({ updated_at: new Date().toISOString() }).eq('id', recordId);
// }
