import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { opportunityService, OpportunityFilters } from '../../services/opportunityService';
import { KanbanBoard } from './KanbanBoard';
import { OpportunityForm } from './OpportunityForm';
import { ImportModal } from '../Common/ImportModal';
import { ExportModal } from '../Common/ExportModal';
import { AdvancedFilters } from '../Common/AdvancedFilters';
import { Opportunity } from '../../types';
import { Plus, Filter, BarChart3, Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react';

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
    // These options should ideally come from a list of users
    options: [
      { value: 'user_id_1', label: 'Alice Johnson' }, // Example user_id
      { value: 'user_id_2', label: 'Bob Smith' },
    ]
  },
  { key: 'min_value', label: 'Min Value', type: 'number' as const, placeholder: '0' },
  { key: 'max_value', label: 'Max Value', type: 'number' as const, placeholder: '1000000' },
  // Probability is 0-1 in service, but UI might show 0-100. Assuming UI handles conversion if needed.
  // For service, it's better to use 0-1 if probability is stored as decimal.
  // If service expects 0-100, then this is fine. Let's assume service handles it.
  { key: 'probability_min', label: 'Min Probability (%)', type: 'number' as const, placeholder: '0' },
  { key: 'probability_max', label: 'Max Probability (%)', type: 'number' as const, placeholder: '100' },
  { key: 'expected_close_date_after', label: 'Expected Close After', type: 'date' as const },
  { key: 'expected_close_date_before', label: 'Expected Close Before', type: 'date' as const },
  { key: 'tags', label: 'Tags', type: 'multiselect' as const,
    // These options should ideally be dynamic
    options: [
      { value: 'enterprise', label: 'Enterprise' },
      { value: 'high-value', label: 'High Value' },
    ]
  }
];

// Adjusted sample data to match Opportunity type
const sampleOpportunityData = {
  name: 'New Q1 Deal',
  value: '75000', // service expects number
  currency: 'USD',
  stage: 'qualification',
  probability: '25', // service expects number (0-1 or 0-100 based on its logic)
  expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next month
  assigned_to: 'user_id_1', // Example user_id
  description: 'Promising new deal for Q1.',
  tags: 'high-value,strategic' // service expects string[]
};


export const OpportunitiesPage: React.FC = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [filters, setFilters] = useState<OpportunityFilters>({
    // Initial filter state - keys should match OpportunityFilters in service
    name: '',
    stage: '',
    assigned_to: '',
    // min_value, max_value will be numbers if set
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // For Kanban, we might fetch more items, or implement virtual scrolling later.
  // For now, let's use a higher limit and page 1. Pagination controls can be added if a list view is also present.
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOpportunities, setTotalOpportunities] = useState(0);
  const kanbanLimit = 100; // Fetch more for Kanban view initially

  const [sortBy, setSortBy] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);


  const fetchData = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to view opportunities.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const currentFilters: OpportunityFilters = { ...filters };
      // Ensure numeric filters are numbers or undefined
      if (filters.min_value && typeof filters.min_value === 'string') currentFilters.min_value = parseFloat(filters.min_value);
      if (filters.max_value && typeof filters.max_value === 'string') currentFilters.max_value = parseFloat(filters.max_value);
      // Handle probability if UI uses 0-100 but service expects 0-1
      // if (filters.probability_min) currentFilters.probability_min = parseFloat(filters.probability_min) / 100;
      // if (filters.probability_max) currentFilters.probability_max = parseFloat(filters.probability_max) / 100;


      const { data, total } = await opportunityService.getOpportunities(
        user.id,
        currentPage, // Use currentPage for pagination if needed, for Kanban maybe just 1
        kanbanLimit,    // Higher limit for Kanban
        currentFilters,
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
  }, [user, currentPage, filters, sortBy, sortAsc, kanbanLimit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user) return;

    const subscription = opportunityService.subscribeToOpportunities(user.id, (payload) => {
      console.log('Opportunity subscription payload:', payload);
      if (payload.eventType === 'INSERT') {
        setOpportunities((prev) => [payload.new as Opportunity, ...prev]);
        setTotalOpportunities(prev => prev + 1);
      } else if (payload.eventType === 'UPDATE') {
        setOpportunities((prev) =>
          prev.map((opp) => (opp.id === payload.new.id ? (payload.new as Opportunity) : opp))
        );
      } else if (payload.eventType === 'DELETE') {
        setOpportunities((prev) => prev.filter((opp) => opp.id !== payload.old.id));
        setTotalOpportunities(prev => prev - 1);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleCreateOpportunity = async (opportunityData: Partial<Opportunity>) => {
    if (!user) return;
    try {
      // Ensure numeric fields are numbers
      const dataToCreate = {
        ...opportunityData,
        value: parseFloat(opportunityData.value as any || '0'),
        probability: parseFloat(opportunityData.probability as any || '0.1'), // Assuming 0-1
      };
      await opportunityService.createOpportunity(dataToCreate, user.id);
      setShowForm(false);
      fetchData(); // Refetch to see new data sorted/filtered correctly
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateOpportunity = async (opportunityData: Partial<Opportunity>) => {
    if (!user || !selectedOpportunity) return;
    try {
      const dataToUpdate = {
        ...opportunityData,
        value: opportunityData.value !== undefined ? parseFloat(opportunityData.value as any) : undefined,
        probability: opportunityData.probability !== undefined ? parseFloat(opportunityData.probability as any) : undefined,
      };
      await opportunityService.updateOpportunity(selectedOpportunity.id, dataToUpdate, user.id);
      setSelectedOpportunity(null);
      setShowForm(false);
      // Data will update via subscription, or refetch if preferred: fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStageChange = async (opportunityId: string, newStage: Opportunity['stage']) => {
    if (!user) return;
    try {
      await opportunityService.updateOpportunity(opportunityId, { stage: newStage }, user.id);
      // Data will update via subscription
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!user) return;
    try {
      await opportunityService.deleteOpportunity(opportunityId, user.id);
      // Data will update via subscription
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleImport = async (importedData: any[]) => {
    if (!user) return;
    try {
      const opportunityPromises = importedData.map(item => {
        const oppData: Partial<Opportunity> = {
          name: item.name || 'Imported Opportunity',
          value: parseFloat(item.value) || 0,
          currency: item.currency || 'USD',
          stage: item.stage || 'prospecting',
          probability: parseFloat(item.probability) || 0.1, // Assuming 0-1
          expected_close_date: item.expected_close_date ? new Date(item.expected_close_date).toISOString() : new Date().toISOString(),
          assigned_to: item.assigned_to || '', // Should be a valid user ID or identifier
          description: item.description,
          tags: item.tags ? String(item.tags).split(',').map(tag => tag.trim()) : [],
          lead_id: item.lead_id,
          customer_id: item.customer_id,
          lost_reason: item.lost_reason,
          next_action: item.next_action,
        };
        return opportunityService.createOpportunity(oppData, user.id);
      });
      await Promise.all(opportunityPromises);
      setShowImport(false);
      fetchData(); // Refetch after import
    } catch (err: any) {
      setError(`Import failed: ${err.message}`);
    }
  };

  // Client-side filtering applied on already fetched data for Kanban
  // For true server-side filtering, `fetchData` would be called when filters change.
  const filteredOpportunitiesForDisplay = opportunities; // Using 'opportunities' directly as fetchData applies filters

  const totalValue = filteredOpportunitiesForDisplay.reduce((sum, opp) => sum + opp.value, 0);
  const wonValue = filteredOpportunitiesForDisplay
    .filter(opp => opp.stage === 'closed-won')
    .reduce((sum, opp) => sum + opp.value, 0);

  const activeOpportunitiesCount = filteredOpportunitiesForDisplay.filter(
    opp => !['closed-won', 'closed-lost'].includes(opp.stage)
  ).length;

  // Basic pagination logic if we were to use it (e.g., for a list view)
  // const totalPages = Math.ceil(totalOpportunities / kanbanLimit);
  // const handlePageChange = (page: number) => {
  //   if (page >= 1 && page <= totalPages) {
  //     setCurrentPage(page);
  //   }
  // };

  if (!user && !loading) {
    return <div className="p-6 text-red-600">Please log in to access opportunities.</div>;
  }

  if (loading) {
    return <div className="p-6 text-center">Loading opportunities...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          {/* Analytics button functionality to be implemented if needed */}
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
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
        </div>
      </div>

      {/* Pipeline Summary */}
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
        opportunities={filteredOpportunitiesForDisplay} // Data is already filtered by service
        onStageChange={handleStageChange}
        onEditOpportunity={(opp) => {
          setSelectedOpportunity(opp);
          setShowForm(true);
        }}
        onDeleteOpportunity={handleDeleteOpportunity}
      />

      {/* Add Pagination controls here if a list view is also implemented or needed */}
      {/* Example:
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
          </div>
        </div>
      )}
      */}

      {showForm && (
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
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        entityType="opportunities"
        sampleData={sampleOpportunityData}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={filteredOpportunitiesForDisplay} // Exporting displayed data
        entityType="opportunities"
      />

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filters}
        onFiltersChange={setFilters} // This updates local filter state
        filterConfigs={opportunityFilterConfigs}
        onApply={() => {
            setCurrentPage(1); // Reset to page 1 when applying new filters
            fetchData(); // Explicitly refetch data with new filters
        }}
        onReset={() => {
          setFilters({
            name: '',
            stage: '',
            assigned_to: '',
          });
          setCurrentPage(1);
          fetchData(); // Refetch with cleared filters
        }}
      />
    </div>
  );
};