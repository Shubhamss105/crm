import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { opportunityService, OpportunityFilters } from '../../services/opportunityService';
import { KanbanBoard } from './KanbanBoard'; // Needs to accept canEdit/canDelete for cards
import { OpportunityForm } from './OpportunityForm';
import { ImportModal } from '../Common/ImportModal';
import { ExportModal } from '../Common/ExportModal';
import { AdvancedFilters } from '../Common/AdvancedFilters';
import { Opportunity } from '../../types'; // ModulePermission not directly used, helpers from useAuth are
import { Plus, Filter, BarChart3, Upload, Download, AlertTriangle } from 'lucide-react'; // Removed ChevronLeft/Right for now

// Adjusted to match Opportunity type and service filter keys
const opportunityFilterConfigs = [
  { key: 'name', label: 'Search by Name', type: 'text' as const, placeholder: 'Search opportunities...' },
  { key: 'stage', label: 'Stage', type: 'select' as const, options: [
    { value: 'prospecting', label: 'Prospecting' },
    { value: 'qualification', label: 'Qualification' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closed-won', label: 'Closed Won' },
    { value: 'closed-lost', label: 'Closed Lost' }
  ]},
  { key: 'assigned_to', label: 'Assigned To', type: 'select' as const,
    options: [
      // These should be dynamically populated from actual user_profiles in a real app
      { value: 'user_id_1_placeholder', label: 'User 1 (Placeholder)' },
      { value: 'user_id_2_placeholder', label: 'User 2 (Placeholder)' },
    ]
  },
  { key: 'min_value', label: 'Min Value', type: 'number' as const, placeholder: '0' },
  { key: 'max_value', label: 'Max Value', type: 'number' as const, placeholder: '1000000' },
  { key: 'expected_close_date_after', label: 'Expected Close After', type: 'date' as const },
  { key: 'expected_close_date_before', label: 'Expected Close Before', type: 'date' as const },
  { key: 'tags', label: 'Tags', type: 'multiselect' as const,
    options: [ // Dynamic tags would be better
      { value: 'enterprise', label: 'Enterprise' },
      { value: 'high-value', label: 'High Value' },
    ]
  }
  // Note: probability filters removed for simplicity, can be added back if needed.
];

const sampleOpportunityData = { // For import modal
  name: 'New Q2 Deal',
  value: '50000',
  currency: 'USD',
  stage: 'qualification',
  probability: '0.20', // 0.0 to 1.0
  expected_close_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Two months from now
  assigned_to: 'user_id_placeholder',
  description: 'Important deal for next quarter.',
  tags: 'strategic'
};


export const OpportunitiesPage: React.FC = () => {
  const { user, permissions, getModulePermissions, canView, can } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [activeFilters, setActiveFilters] = useState<OpportunityFilters>({
    name: '',
    stage: '',
    assigned_to: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // For Kanban, pagination is less direct. We fetch a larger set.
  // currentPage and totalOpportunities could be used if a list view is added or for total counts.
  const [currentPage, setCurrentPage] = useState(1); // Keep for potential future use
  const [totalOpportunities, setTotalOpportunities] = useState(0);
  const kanbanLimit = 200; // Fetch a larger number for Kanban

  const [sortBy, setSortBy] = useState('created_at'); // Default sort
  const [sortAsc, setSortAsc] = useState(false);

  const opportunitiesModulePermissions = getModulePermissions('opportunities');

  const fetchData = useCallback(async () => {
    if (!user || !opportunitiesModulePermissions || !canView('opportunities')) {
      setError(opportunitiesModulePermissions === undefined && user ? 'Permissions loading...' : 'Access Denied: Cannot view opportunities.');
      setLoading(false);
      setOpportunities([]);
      setTotalOpportunities(0);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Prepare UI filters for the service call
      const serviceFilters: OpportunityFilters = { ...activeFilters };
      if (activeFilters.min_value) serviceFilters.min_value = parseFloat(String(activeFilters.min_value));
      if (activeFilters.max_value) serviceFilters.max_value = parseFloat(String(activeFilters.max_value));
      // Add probability conversion if UI uses 0-100 and service expects 0-1

      const { data, total } = await opportunityService.getOpportunities(
        user.user_id, // currentLoggedInUserId
        currentPage, // For Kanban, this is typically 1 unless specific pagination is built into Kanban stages
        kanbanLimit,
        opportunitiesModulePermissions,
        serviceFilters, // Pass processed UI filters
        user.user_id, // tenancyUserIdFilter (e.g., user_id on opportunity table if it's for tenancy)
        sortBy,
        sortAsc
      );
      setOpportunities(data);
      setTotalOpportunities(total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, kanbanLimit, opportunitiesModulePermissions, canView, activeFilters, sortBy, sortAsc]);

  useEffect(() => {
    if(user && permissions) { // Ensure user and permissions context are loaded
        fetchData();
    }
  }, [user, permissions, fetchData]);

  useEffect(() => {
    if (!user || !opportunitiesModulePermissions) return;

    const subscription = opportunityService.subscribeToOpportunities(user.user_id, (payload) => {
      // More robust handling might involve checking if the changed item fits current view/filters.
      // For now, refetching is a simpler way to ensure consistency with RBAC.
      fetchData();
    });
    return () => {
      subscription?.unsubscribe();
    };
  }, [user, opportunitiesModulePermissions, fetchData]);

  const handleCreateOpportunity = async (opportunityData: Partial<Opportunity>) => {
    if (!user || !can('opportunities', 'create')) {
      setError("Permission Denied: Cannot create opportunities.");
      return;
    }
    try {
      const dataToCreate = {
        ...opportunityData,
        value: parseFloat(opportunityData.value as any || '0'),
        probability: parseFloat(opportunityData.probability as any || '0.1'), // Assuming 0-1
        assigned_to: opportunityData.assigned_to || user.user_id, // Default assign to self
      };
      await opportunityService.createOpportunity(dataToCreate, user.user_id); // user.user_id is creator
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateOpportunity = async (opportunityData: Partial<Opportunity>) => {
    if (!user || !selectedOpportunity || !can('opportunities', 'edit')) {
      setError("Permission Denied: Cannot edit this opportunity.");
      return;
    }
    try {
      const dataToUpdate = {
        ...opportunityData,
        value: opportunityData.value !== undefined ? parseFloat(opportunityData.value as any) : undefined,
        probability: opportunityData.probability !== undefined ? parseFloat(opportunityData.probability as any) : undefined,
      };
      await opportunityService.updateOpportunity(selectedOpportunity.id, dataToUpdate, user.user_id);
      setSelectedOpportunity(null);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStageChange = async (opportunityId: string, newStage: Opportunity['stage']) => {
    if (!user || !can('opportunities', 'edit')) { // Changing stage is an edit
      setError("Permission Denied: Cannot change opportunity stage.");
      return;
    }
    try {
      await opportunityService.updateOpportunity(opportunityId, { stage: newStage }, user.user_id);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!user || !can('opportunities', 'delete')) {
      setError("Permission Denied: Cannot delete opportunities.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this opportunity?')) {
        try {
          await opportunityService.deleteOpportunity(opportunityId, user.user_id);
          fetchData();
        } catch (err: any) {
          setError(err.message);
        }
    }
  };

  const handleImport = async (importedData: any[]) => {
    if (!user || !can('opportunities', 'create')) {
      setError("Permission Denied: Cannot import opportunities.");
      return;
    }
    try {
      const opportunityPromises = importedData.map(item => {
        const oppData: Partial<Opportunity> = {
          name: item.name || 'Imported Opportunity',
          value: parseFloat(item.value) || 0,
          currency: item.currency || 'USD',
          stage: item.stage || 'prospecting',
          probability: parseFloat(item.probability) || 0.1,
          expected_close_date: item.expected_close_date ? new Date(item.expected_close_date).toISOString() : new Date().toISOString(),
          assigned_to: item.assigned_to || user.user_id, // Default assign to current user
          description: item.description,
          tags: item.tags ? String(item.tags).split(',').map(tag => tag.trim()) : [],
        };
        return opportunityService.createOpportunity(oppData, user.user_id);
      });
      await Promise.all(opportunityPromises);
      setShowImport(false);
      fetchData();
    } catch (err: any) {
      setError(`Import failed: ${err.message}`);
    }
  };

  // Client-side filtering on the fetched data (mainly for search if server doesn't support it well for Kanban)
  // Server-side filters are preferred via `activeFilters` passed to `getOpportunities`.
  const clientFilteredOpportunities = opportunities.filter(opp => {
    if (activeFilters.name) {
      return opp.name.toLowerCase().includes(activeFilters.name.toLowerCase());
    }
    return true;
  });


  const totalValue = clientFilteredOpportunities.reduce((sum, opp) => sum + opp.value, 0);
  const wonValue = clientFilteredOpportunities
    .filter(opp => opp.stage === 'closed-won')
    .reduce((sum, opp) => sum + opp.value, 0);

  const activeOpportunitiesCount = clientFilteredOpportunities.filter(
    opp => !['closed-won', 'closed-lost'].includes(opp.stage)
  ).length;

  if (!user || !permissions) {
    return <div className="p-6">{loading ? 'Loading authentication...' : 'Please log in.'}</div>;
  }

  if (!canView('opportunities')) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
        <p className="text-gray-500">You do not have permission to view opportunities.</p>
      </div>
    );
  }

  if (loading && opportunities.length === 0) {
    return <div className="p-6 text-center">Loading opportunities...</div>;
  }

  if (error && opportunities.length === 0) {
    return (
        <div className="p-6 max-w-7xl mx-auto text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700">Error</h2>
            <p className="text-gray-500">{error}</p>
        </div>
     );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {error && opportunities.length > 0 && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">{error}</div>}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-600 mt-2">Manage your sales pipeline</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          {can('opportunities', 'create') && (
            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
          )}
          <button // Export usually tied to view permissions
            onClick={() => setShowExport(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
          {can('opportunities', 'create') && (
            <button
              onClick={() => {
                setSelectedOpportunity(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Opportunity</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Pipeline Value</div>
          <div className="text-2xl font-bold text-gray-900">
            ${(totalValue / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Won Opportunities</div>
          <div className="text-2xl font-bold text-green-600">
            ${(wonValue / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Active Opportunities</div>
          <div className="text-2xl font-bold text-blue-600">
            {activeOpportunitiesCount}
          </div>
        </div>
      </div>

      <KanbanBoard
        opportunities={clientFilteredOpportunities}
        onStageChange={handleStageChange}
        canEdit={can('opportunities', 'edit')} // Pass down edit permission
        onEditOpportunity={(opp) => {
          if (can('opportunities', 'edit')) {
            setSelectedOpportunity(opp);
            setShowForm(true);
          } else {
            alert("Permission Denied: Cannot edit opportunity.");
          }
        }}
        canDelete={can('opportunities', 'delete')} // Pass down delete permission
        onDeleteOpportunity={handleDeleteOpportunity}
      />

      {showForm && (can('opportunities', 'create') || (selectedOpportunity && can('opportunities', 'edit'))) && (
        <OpportunityForm
          opportunity={selectedOpportunity}
          onSubmit={selectedOpportunity ? handleUpdateOpportunity : handleCreateOpportunity}
          onCancel={() => {
            setShowForm(false);
            setSelectedOpportunity(null);
          }}
        />
      )}

      <ImportModal
        isOpen={showImport && can('opportunities', 'create')}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        entityType="opportunities"
        sampleData={sampleOpportunityData}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={clientFilteredOpportunities}
        entityType="opportunities"
      />

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={activeFilters}
        onFiltersChange={setActiveFilters}
        filterConfigs={opportunityFilterConfigs}
        onApply={() => {
            setCurrentPage(1);
            fetchData();
        }}
        onReset={() => {
          setActiveFilters({ name: '', stage: '', assigned_to: '' });
          setCurrentPage(1);
          fetchData();
        }}
      />
    </div>
  );
};