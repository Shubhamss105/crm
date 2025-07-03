import React, { useState } from 'react';
import { KanbanBoard } from './KanbanBoard';
import { OpportunityForm } from './OpportunityForm';
import { ImportModal } from '../Common/ImportModal';
import { ExportModal } from '../Common/ExportModal';
import { AdvancedFilters } from '../Common/AdvancedFilters';
import { mockOpportunities } from '../../data/mockData';
import { Opportunity } from '../../types';
import { Plus, Filter, BarChart3, Upload, Download } from 'lucide-react';

const opportunityFilterConfigs = [
  { key: 'search', label: 'Search', type: 'text' as const, placeholder: 'Search opportunities...' },
  { key: 'stage', label: 'Stage', type: 'select' as const, options: [
    { value: 'prospecting', label: 'Prospecting' },
    { value: 'qualification', label: 'Qualification' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closed-won', label: 'Closed Won' },
    { value: 'closed-lost', label: 'Closed Lost' }
  ]},
  { key: 'assignedTo', label: 'Assigned To', type: 'select' as const, options: [
    { value: 'Alice Johnson', label: 'Alice Johnson' },
    { value: 'Bob Smith', label: 'Bob Smith' },
    { value: 'Carol Davis', label: 'Carol Davis' },
    { value: 'David Wilson', label: 'David Wilson' }
  ]},
  { key: 'valueMin', label: 'Min Value', type: 'number' as const, placeholder: '0' },
  { key: 'valueMax', label: 'Max Value', type: 'number' as const, placeholder: '1000000' },
  { key: 'probabilityMin', label: 'Min Probability', type: 'number' as const, placeholder: '0' },
  { key: 'probabilityMax', label: 'Max Probability', type: 'number' as const, placeholder: '100' },
  { key: 'expectedCloseAfter', label: 'Expected Close After', type: 'date' as const },
  { key: 'expectedCloseBefore', label: 'Expected Close Before', type: 'date' as const },
  { key: 'tags', label: 'Tags', type: 'multiselect' as const, options: [
    { value: 'enterprise', label: 'Enterprise' },
    { value: 'high-value', label: 'High Value' },
    { value: 'custom', label: 'Custom' },
    { value: 'integration', label: 'Integration' },
    { value: 'recurring', label: 'Recurring' }
  ]}
];

const sampleOpportunityData = {
  name: 'Enterprise Deal',
  value: '125000',
  currency: 'USD',
  stage: 'proposal',
  probability: '75',
  expectedCloseDate: '2024-02-28',
  assignedTo: 'Alice Johnson',
  description: 'Enterprise software solution',
  tags: 'enterprise,high-value'
};

export const OpportunitiesPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [showForm, setShowForm] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    stage: '',
    assignedTo: '',
    valueMin: '',
    valueMax: '',
    probabilityMin: '',
    probabilityMax: '',
    expectedCloseAfter: '',
    expectedCloseBefore: '',
    tags: []
  });

  const handleCreateOpportunity = (opportunityData: Partial<Opportunity>) => {
    const newOpportunity: Opportunity = {
      id: Date.now().toString(),
      name: opportunityData.name || '',
      value: opportunityData.value || 0,
      currency: opportunityData.currency || 'USD',
      stage: 'prospecting',
      probability: opportunityData.probability || 25,
      expectedCloseDate: opportunityData.expectedCloseDate || new Date(),
      assignedTo: opportunityData.assignedTo || '',
      createdAt: new Date(),
      lastActivity: new Date(),
      description: opportunityData.description,
      nextAction: opportunityData.nextAction,
      tags: opportunityData.tags || []
    };
    setOpportunities([newOpportunity, ...opportunities]);
    setShowForm(false);
  };

  const handleUpdateOpportunity = (opportunityData: Partial<Opportunity>) => {
    if (selectedOpportunity) {
      setOpportunities(opportunities.map(opp => 
        opp.id === selectedOpportunity.id 
          ? { ...opp, ...opportunityData, lastActivity: new Date() }
          : opp
      ));
      setSelectedOpportunity(null);
      setShowForm(false);
    }
  };

  const handleStageChange = (opportunityId: string, newStage: Opportunity['stage']) => {
    setOpportunities(opportunities.map(opp => 
      opp.id === opportunityId 
        ? { ...opp, stage: newStage, lastActivity: new Date() }
        : opp
    ));
  };

  const handleDeleteOpportunity = (opportunityId: string) => {
    setOpportunities(opportunities.filter(opp => opp.id !== opportunityId));
  };

  const handleImport = (importedData: any[]) => {
    const newOpportunities: Opportunity[] = importedData.map((data, index) => ({
      id: `imported-${Date.now()}-${index}`,
      name: data.name || '',
      value: parseFloat(data.value) || 0,
      currency: data.currency || 'USD',
      stage: data.stage || 'prospecting',
      probability: parseInt(data.probability) || 25,
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : new Date(),
      assignedTo: data.assignedTo || '',
      createdAt: new Date(),
      lastActivity: new Date(),
      description: data.description,
      nextAction: data.nextAction,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : []
    }));
    setOpportunities([...newOpportunities, ...opportunities]);
  };

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = !filters.search || 
      opp.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      opp.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStage = !filters.stage || opp.stage === filters.stage;
    const matchesAssignedTo = !filters.assignedTo || opp.assignedTo === filters.assignedTo;
    
    const matchesMinValue = !filters.valueMin || opp.value >= parseFloat(filters.valueMin);
    const matchesMaxValue = !filters.valueMax || opp.value <= parseFloat(filters.valueMax);
    
    const matchesMinProbability = !filters.probabilityMin || opp.probability >= parseInt(filters.probabilityMin);
    const matchesMaxProbability = !filters.probabilityMax || opp.probability <= parseInt(filters.probabilityMax);
    
    const matchesExpectedCloseAfter = !filters.expectedCloseAfter || 
      new Date(opp.expectedCloseDate) >= new Date(filters.expectedCloseAfter);
    const matchesExpectedCloseBefore = !filters.expectedCloseBefore || 
      new Date(opp.expectedCloseDate) <= new Date(filters.expectedCloseBefore);
    
    const matchesTags = filters.tags.length === 0 || 
      filters.tags.some((tag: string) => opp.tags.includes(tag));

    return matchesSearch && matchesStage && matchesAssignedTo && 
           matchesMinValue && matchesMaxValue && matchesMinProbability && 
           matchesMaxProbability && matchesExpectedCloseAfter && 
           matchesExpectedCloseBefore && matchesTags;
  });

  const totalValue = filteredOpportunities.reduce((sum, opp) => sum + opp.value, 0);
  const wonValue = filteredOpportunities
    .filter(opp => opp.stage === 'closed-won')
    .reduce((sum, opp) => sum + opp.value, 0);

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
            {filteredOpportunities.filter(opp => !['closed-won', 'closed-lost'].includes(opp.stage)).length}
          </div>
        </div>
      </div>

      <KanbanBoard
        opportunities={filteredOpportunities}
        onStageChange={handleStageChange}
        onEditOpportunity={(opp) => {
          setSelectedOpportunity(opp);
          setShowForm(true);
        }}
        onDeleteOpportunity={handleDeleteOpportunity}
      />

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
        data={filteredOpportunities}
        entityType="opportunities"
      />

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        filterConfigs={opportunityFilterConfigs}
        onApply={() => {}}
        onReset={() => setFilters({
          search: '',
          stage: '',
          assignedTo: '',
          valueMin: '',
          valueMax: '',
          probabilityMin: '',
          probabilityMax: '',
          expectedCloseAfter: '',
          expectedCloseBefore: '',
          tags: []
        })}
      />
    </div>
  );
};