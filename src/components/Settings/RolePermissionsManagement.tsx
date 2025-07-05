import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { permissionsService } from '../../services/permissionsService';
import { Role, RolePermissionEntry, ModulePermission } from '../../types';
import { Plus, Save, Edit, Trash2, ShieldCheck, ShieldOff, Eye, EyeOff, Edit3, CheckSquare, Square } from 'lucide-react';

interface ManageableModule {
  key: string;
  displayName: string;
}

const MANAGEABLE_MODULES: ManageableModule[] = [
  { key: 'leads', displayName: 'Leads' },
  { key: 'customers', displayName: 'Customers' },
  { key: 'opportunities', displayName: 'Opportunities' },
  { key: 'settings_users', displayName: 'User Management (Sub-users)' },
  // Add other modules here. 'settings_roles' could be one, but manage its assignment carefully.
];

// --- CreateRoleModal ---
interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRole: (name: string) => Promise<void>;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ isOpen, onClose, onCreateRole }) => {
  const [roleName, setRoleName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!roleName.trim()) {
      setError("Role name cannot be empty.");
      return;
    }
    setIsLoading(true);
    try {
      await onCreateRole(roleName.trim());
      setRoleName('');
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create role.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4">Create New Role</h3>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Enter role name (e.g., Sales Manager)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm bg-gray-200 rounded-md hover:bg-gray-300" disabled={isLoading}>Cancel</button>
            <button type="submit" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- RolePermissionsManagement ---
export const RolePermissionsManagement: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, ModulePermission>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);

  const fetchRolesAndPermissions = useCallback(async () => {
    if (!isSuperAdmin()) {
      setError("Access Denied. You must be a Super Admin.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedRoles = await permissionsService.getAllRoles();
      setRoles(fetchedRoles);
      if (fetchedRoles.length > 0) {
        // Select the first non-superadmin role by default, or the first role
        const defaultRole = fetchedRoles.find(r => !r.is_super_admin) || fetchedRoles[0];
        if (defaultRole) {
            handleRoleSelect(defaultRole);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch roles.");
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, [fetchRolesAndPermissions]);

  const handleRoleSelect = async (role: Role) => {
    setSelectedRole(role);
    if (role.is_super_admin) {
      // Super Admin has all permissions implicitly
      const allPermissions: Record<string, ModulePermission> = {};
      MANAGEABLE_MODULES.forEach(module => {
        allPermissions[module.key] = { view_type: 'all', can_create: true, can_edit: true, can_delete: true };
      });
      setRolePermissions(allPermissions);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedPermissions = await permissionsService.getRolePermissions(role.id);
      const structured: Record<string, ModulePermission> = {};
      MANAGEABLE_MODULES.forEach(module => {
        const perm = fetchedPermissions.find(p => p.module === module.key);
        structured[module.key] = {
          view_type: perm?.view_type || 'none',
          can_create: perm?.can_create || false,
          can_edit: perm?.can_edit || false,
          can_delete: perm?.can_delete || false,
        };
      });
      setRolePermissions(structured);
    } catch (err: any) {
      setError(err.message || `Failed to fetch permissions for role ${role.name}.`);
      setRolePermissions({});
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (
    moduleKey: string,
    field: keyof ModulePermission,
    value: boolean | 'all' | 'assigned' | 'none'
  ) => {
    setRolePermissions(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [field]: value,
      },
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRole || selectedRole.is_super_admin) {
      alert("Cannot modify Super Admin permissions here or no role selected.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const permissionsToUpdate = MANAGEABLE_MODULES.map(module => ({
        module: module.key,
        ...rolePermissions[module.key],
      }));
      await permissionsService.updateRolePermissions(selectedRole.id, permissionsToUpdate);
      alert(`Permissions for role '${selectedRole.name}' updated successfully!`);
    } catch (err: any) {
      setError(err.message || "Failed to save permissions.");
      alert(`Error: ${err.message || "Failed to save permissions."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async (name: string) => {
    setError(null);
    try {
      await permissionsService.createRole(name, false); // New roles are not super admin by default
      fetchRolesAndPermissions(); // Refresh roles list
       alert(`Role '${name}' created successfully!`);
    } catch (err: any) {
      console.error("Create role error:", err);
      throw err; // Re-throw to be caught by modal
    }
  };

  if (!isSuperAdmin()) {
    return <div className="p-6 text-red-500 font-semibold">Access Denied: This section is for Super Admins only.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <CreateRoleModal
        isOpen={showCreateRoleModal}
        onClose={() => setShowCreateRoleModal(false)}
        onCreateRole={handleCreateRole}
      />
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Role & Permissions Management</h2>
        <button
          onClick={() => setShowCreateRoleModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 text-sm"
        >
          <Plus size={18} />
          <span>New Role</span>
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Roles List */}
        <div className="md:col-span-1 bg-white p-4 rounded-lg border">
          <h3 className="text-md font-semibold mb-3 text-gray-700">Roles</h3>
          {isLoading && roles.length === 0 && <p className="text-sm text-gray-500">Loading roles...</p>}
          <ul className="space-y-1">
            {roles.map(role => (
              <li key={role.id}>
                <button
                  onClick={() => handleRoleSelect(role)}
                  disabled={isLoading}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between
                                ${selectedRole?.id === role.id ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-600'}
                                ${role.is_super_admin ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  <span className="flex items-center">
                    {role.is_super_admin ? <ShieldCheck size={16} className="mr-2 text-yellow-500"/> : <ShieldOff size={16} className="mr-2 text-gray-400"/>}
                    {role.name}
                  </span>
                  {selectedRole?.id === role.id && <Edit3 size={14} />}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Permissions Editor */}
        <div className="md:col-span-3 bg-white p-4 rounded-lg border">
          {selectedRole ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-semibold text-gray-800">
                  Permissions for <span className="text-blue-600">{selectedRole.name}</span>
                  {selectedRole.is_super_admin && <span className="ml-2 text-xs text-yellow-600">(Super Admin - All Permissions Implicit)</span>}
                </h3>
                {!selectedRole.is_super_admin && (
                  <button
                    onClick={handleSavePermissions}
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center disabled:opacity-50"
                  >
                    <Save size={16} className="mr-1.5" />
                    {isSaving ? 'Saving...' : 'Save Permissions'}
                  </button>
                )}
              </div>

              {isLoading && !rolePermissions['leads'] && <p className="text-sm text-gray-500">Loading permissions...</p>}

              <div className="space-y-3">
                {MANAGEABLE_MODULES.map(module => (
                  <div key={module.key} className="border-b pb-3 last:border-b-0">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{module.displayName}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                      {/* View Type */}
                      <div className="col-span-2 sm:col-span-4">
                        <label className="block text-xs font-medium text-gray-600 mb-0.5">View Access</label>
                        <select
                          value={rolePermissions[module.key]?.view_type || 'none'}
                          onChange={(e) => handlePermissionChange(module.key, 'view_type', e.target.value as 'all' | 'assigned' | 'none')}
                          disabled={selectedRole.is_super_admin || isSaving}
                          className="w-full sm:w-1/2 p-1.5 border border-gray-300 rounded-md text-xs focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        >
                          <option value="none">None</option>
                          <option value="assigned">Assigned Only</option>
                          <option value="all">All Records</option>
                        </select>
                      </div>
                      {/* Action Flags */}
                      {[
                        { key: 'can_create', label: 'Create' },
                        { key: 'can_edit', label: 'Edit' },
                        { key: 'can_delete', label: 'Delete' },
                      ].map(action => (
                        <label key={action.key} className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rolePermissions[module.key]?.[action.key as keyof ModulePermission] as boolean || false}
                            onChange={(e) => handlePermissionChange(module.key, action.key as keyof ModulePermission, e.target.checked)}
                            disabled={selectedRole.is_super_admin || isSaving || rolePermissions[module.key]?.view_type === 'none'}
                            className="h-3.5 w-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className={`text-xs ${rolePermissions[module.key]?.view_type === 'none' ? 'text-gray-400': 'text-gray-700'}`}>{action.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShieldCheck size={40} className="mb-3" />
              <p className="text-md">Select a role to view or edit its permissions.</p>
              <p className="text-xs mt-1">Super Admin role has all permissions by default and cannot be modified here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
