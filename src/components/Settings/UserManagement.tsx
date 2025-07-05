import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { permissionsService } from '../../services/permissionsService';
import { UserProfile, Role } from '../../types';
import { Plus, Edit, Trash2, Search, UserPlus, X, Save, Users } from 'lucide-react';

// AddUserModal Component
const AddUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (email: string, password: string, name: string, roleId: string) => Promise<void>;
  roles: Role[];
}> = ({ isOpen, onClose, onAddUser, roles }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles.find(r => !r.is_super_admin)?.id || roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedRoleId) {
      setError("Please select a role.");
      return;
    }
    setIsLoading(true);
    try {
      await onAddUser(email, password, name, selectedRoleId);
      onClose(); // Close modal on success
      setEmail(''); setPassword(''); setName(''); setSelectedRoleId(roles[0]?.id || '');
    } catch (err: any) {
      setError(err.message || 'Failed to add user.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Add New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
            <select id="role" value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              <option value="" disabled>Select a role</option>
              {roles.filter(r => !r.is_super_admin).map(role => ( // Super admin cannot assign super admin role
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center">
              {isLoading ? 'Adding...' : <><UserPlus size={16} className="mr-2" /> Add User</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export const UserManagement: React.FC = () => {
  const { user: currentUser, can: authCan, isSuperAdmin } = useAuth();
  const [subUsers, setSubUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // For editing role inline
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoleIdForEdit, setSelectedRoleIdForEdit] = useState<string>('');

  const fetchData = useCallback(async () => {
    if (!currentUser || !isSuperAdmin()) { // Ensure only super admin can fetch this data
        setError("Access Denied: You do not have permission to manage users.");
        setIsLoading(false);
        setSubUsers([]); // Clear users if not authorized
        return;
    }
    setIsLoading(true);
    try {
      const [fetchedUsers, fetchedRoles] = await Promise.all([
        userService.getSubUsers(currentUser.user_id),
        permissionsService.getAllRoles()
      ]);
      setSubUsers(fetchedUsers);
      setRoles(fetchedRoles.filter(r => !r.is_super_admin)); // SuperAdmins cannot manage other SuperAdmins or assign this role
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isSuperAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddUser = async (email: string, password: string, name: string, roleId: string) => {
    if (!currentUser) throw new Error("Current user not found.");
    await userService.createSubUser(email, password, roleId, name, currentUser.user_id);
    fetchData(); // Refresh the list
  };

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    setIsLoading(true); // Indicate loading state for this specific action
    try {
      await userService.updateSubUser(userId, { roleId: newRoleId });
      fetchData(); // Refresh list
    } catch (err:any) {
      setError(err.message || "Failed to update role.");
       // Potentially revert UI change or show specific error for the row
    } finally {
      setEditingUserId(null); // Exit editing mode
      setIsLoading(false); // Reset general loading if it was set for this
    }
  };

  // Placeholder for delete user functionality
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action is irreversible.')) {
      alert(`TODO: Implement delete user ${userId}. This requires admin privileges on Supabase client.`);
      // try {
      //   // await userService.deleteSubUser(userId); // This service function needs to use admin client
      //   // fetchData();
      // } catch (err: any) {
      //   setError(err.message || "Failed to delete user.");
      // }
    }
  };

  const startEditRole = (user: UserProfile) => {
    setEditingUserId(user.user_id);
    setSelectedRoleIdForEdit(user.role_id || '');
  };

  const cancelEditRole = () => {
    setEditingUserId(null);
    setSelectedRoleIdForEdit('');
  };


  if (!isSuperAdmin()) {
     // Or check authCan('settings_users', 'view_all') when that permission is defined
    return <div className="p-6 text-red-500">You do not have permission to access User Management.</div>;
  }

  if (isLoading && subUsers.length === 0) { // Show loading only on initial load
    return <div className="p-6">Loading users...</div>;
  }

  if (error && subUsers.length === 0) { // Show error only if no data could be loaded
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  const filteredUsers = subUsers.filter(u =>
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onAddUser={handleAddUser}
        roles={roles}
      />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Sub-User</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      {isLoading && <p className="text-sm text-gray-500 my-2">Updating user list...</p>}
      {error && !isLoading && <p className="text-red-500 text-sm my-2">{error}</p>}


      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((subUser) => (
              <tr key={subUser.user_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={subUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(subUser.name || subUser.email || 'U')}&background=random`}
                      alt={subUser.name || 'User'}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{subUser.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{subUser.email || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUserId === subUser.user_id ? (
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedRoleIdForEdit}
                        onChange={(e) => setSelectedRoleIdForEdit(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                      <button onClick={() => handleRoleChange(subUser.user_id, selectedRoleIdForEdit)} className="p-1 text-green-600 hover:text-green-800"><Save size={18}/></button>
                      <button onClick={cancelEditRole} className="p-1 text-gray-500 hover:text-gray-700"><X size={18}/></button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {subUser.roles?.name || 'No Role'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(subUser.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => startEditRole(subUser)}
                      disabled={editingUserId === subUser.user_id}
                      className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded disabled:opacity-50"
                      title="Edit Role"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(subUser.user_id)}
                      className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                      title="Delete User (Requires Admin Client)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
                <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                        No sub-users found.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6 text-sm text-gray-600 flex items-center">
        <Users size={16} className="mr-2" /> Total Sub-Users: {subUsers.length}
      </div>
    </div>
  );
};