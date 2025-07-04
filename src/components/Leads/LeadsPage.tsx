import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Updated AuthContext
import { leadsService } from '../../services/leadsService';
import { LeadsList } from './LeadsList'; // This component will need to accept and use canEdit/canDelete props
import { LeadForm } from './LeadForm';
import { LeadFilters } from './LeadFilters';
import { WhatsAppBulkModal } from './WhatsAppBulkModal';
import { TagManager } from './TagManager';
import { EmailModal } from './EmailModal';
import { SMSModal } from './SMSModal';
import { ConversationHistory } from './ConversationHistory';
import { ImportModal } from '../Common/ImportModal';
import { ExportModal } from '../Common/ExportModal';
import { AdvancedFilters } from '../Common/AdvancedFilters';
import { Lead, CommunicationRecord, ModulePermission } from '../../types';
import { Plus, Upload, Download, Filter, MessageCircle, Users, CheckSquare, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

const leadFilterConfigs = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Search leads...' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'new', label: 'New' },
      { value: 'contacted', label: 'Contacted' },
      { value: 'qualified', label: 'Qualified' },
      { value: 'converted', label: 'Converted' }
    ]
  },
  {
    key: 'source',
    label: 'Source',
    type: 'select',
    options: [
      { value: 'website', label: 'Website' },
      { value: 'email', label: 'Email' },
      { value: 'social', label: 'Social Media' },
      { value: 'referral', label: 'Referral' },
      { value: 'manual', label: 'Manual' }
    ]
  },
  {
    key: 'assigned_to', // This filter might need dynamic options based on users in the system
    label: 'Assigned To',
    type: 'select',
    options: [
      // These should ideally be populated from actual user data
      { value: 'user_id_1', label: 'Alice Johnson (User 1)' }, // Example: use actual user IDs
      { value: 'user_id_2', label: 'Bob Smith (User 2)' },
      { value: '', label: 'Unassigned' }
    ]
  },
  { key: 'scoreMin', label: 'Min Score', type: 'number', placeholder: '0' },
  { key: 'scoreMax', label: 'Max Score', type: 'number', placeholder: '100' },
  { key: 'createdAfter', label: 'Created After', type: 'date' },
  { key: 'createdBefore', label: 'Created Before', type: 'date' },
  {
    key: 'tags',
    label: 'Tags',
    type: 'multiselect',
    options: [ // These could also be dynamic based on existing tags
      { value: 'enterprise', label: 'Enterprise' },
      { value: 'high-priority', label: 'High Priority' },
    ]
  }
];

const sampleLeadData = { // Used for import modal sample
  name: 'John Sample',
  email: 'john.sample@example.com',
  phone: '+1-555-0123',
  company: 'Sample Corp',
  source: 'website',
  score: '75',
  assigned_to: 'user_id_1', // Example user_id that should exist in your system
  tags: 'high-priority'
};

const LeadsPage: React.FC = () => {
  const { user, permissions, getModulePermissions, canView, can } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [communications, setCommunications] = useState<CommunicationRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [tagManagerLead, setTagManagerLead] = useState<Lead | null>(null);
  const [emailLead, setEmailLead] = useState<Lead | null>(null);
  const [smsLead, setSmsLead] = useState<Lead | null>(null);
  const [historyLead, setHistoryLead] = useState<Lead | null>(null);
  const [selectedLeadsState, setSelectedLeadsState] = useState<string[]>([]); // Renamed to avoid conflict

  const [activeFilters, setActiveFilters] = useState({ // Renamed to avoid conflict
    status: '',
    source: '',
    assigned_to: '',
    search: '',
    scoreMin: '',
    scoreMax: '',
    createdAfter: '',
    createdBefore: '',
    tags: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const limit = 10;

  const leadsModulePermissions = getModulePermissions('leads');

  const fetchData = useCallback(async () => {
    if (!user || !leadsModulePermissions || !canView('leads')) {
      setError(leadsModulePermissions === undefined && user ? 'Permissions not loaded yet. Please wait or refresh.' : 'You do not have permission to view leads.');
      setLoading(false);
      setLeads([]);
      setTotalLeads(0);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // The 'tenancyUserIdFilter' should ideally be an organization ID or similar if leads.user_id is for that.
      // If leads.user_id is purely the creator, and 'view:all' means all by that creator, then user.user_id is correct.
      // This needs to align with your data model for multi-tenancy vs. individual ownership.
      // Assuming for now that leads.user_id is a general tenancy/creator field.
      const { data, total } = await leadsService.getLeads(
        user.user_id, // currentLoggedInUserId (for 'assigned_to' checks)
        currentPage,
        limit,
        leadsModulePermissions,
        user.user_id // tenancyUserIdFilter (e.g., creator or org ID)
        // TODO: Pass server-side filters from `activeFilters` state here
      );
      setLeads(data);
      setTotalLeads(total);

      if (data.length > 0) {
        const commsPromises = data.map(lead => leadsService.getCommunications(lead.id, user.user_id));
        const commsArrays = await Promise.all(commsPromises);
        setCommunications(commsArrays.flat());
      } else {
        setCommunications([]);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, limit, leadsModulePermissions, canView, activeFilters]); // Added activeFilters if used for server-side

  useEffect(() => {
    if(user && permissions){ // Ensure user and permissions are loaded
        fetchData();
    }
  }, [user, permissions, fetchData]); // Depend on user and permissions loading

  useEffect(() => {
    if (!user || !leadsModulePermissions) return;

    const leadsSubscription = leadsService.subscribeToLeads(user.user_id, (payload) => {
      if (payload.eventType === 'INSERT') {
         // To properly handle INSERT with permissions, a refetch or more complex client-side logic is needed.
         // For example, check if the new lead matches current 'assigned_to' filter if view_type is 'assigned'.
        fetchData();
      } else if (payload.eventType === 'UPDATE') {
        setLeads((prev) => prev.map((lead) => (lead.id === payload.new.id ? payload.new as Lead : lead)));
      } else if (payload.eventType === 'DELETE') {
        setLeads((prev) => prev.filter((lead) => lead.id !== payload.old.id));
        setTotalLeads((prev) => prev - 1);
      }
    });

    // Communications subscription might also need permission considerations if sensitive
    const commsSubscription = leadsService.subscribeToCommunications(user.user_id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setCommunications((prev) => [payload.new as CommunicationRecord, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setCommunications((prev) => prev.map((comm) => (comm.id === payload.new.id ? payload.new as CommunicationRecord : comm)));
      } else if (payload.eventType === 'DELETE') {
        setCommunications((prev) => prev.filter((comm) => comm.id !== payload.old.id));
      }
    });

    return () => {
      leadsSubscription?.unsubscribe();
      commsSubscription?.unsubscribe();
    };
  }, [user, leadsModulePermissions, fetchData]);


  const handleCreateLead = async (leadData: Partial<Lead>) => {
    if (!user || !can('leads', 'create')) {
        setError("You don't have permission to create leads.");
        return;
    }
    try {
      await leadsService.createLead(
        { ...leadData, assigned_to: leadData.assigned_to || user.user_id },
        user.user_id
      );
      setShowForm(false);
      fetchData(); // Explicitly refetch to ensure correct view based on permissions
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateLead = async (leadData: Partial<Lead>) => {
    if (!user || !selectedLead || !can('leads', 'edit')) {
        setError("You don't have permission to edit this lead.");
        return;
    }
    try {
      await leadsService.updateLead(
        selectedLead.id,
        leadData,
        user.user_id
      );
      setSelectedLead(null);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!user || !can('leads', 'delete')) {
        setError("You don't have permission to delete leads.");
        return;
    }
    if (window.confirm('Are you sure you want to delete this lead?')) {
        try {
            await leadsService.deleteLead(leadId, user.user_id);
            fetchData();
            setSelectedLeadsState((prev) => prev.filter((id) => id !== leadId));
        } catch (err: any) {
            setError(err.message);
        }
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadsState((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const currentFilteredLeads = leads.filter((lead) => { // Renamed from filteredLeads
    const matchesSearch =
      !activeFilters.search ||
      lead.name.toLowerCase().includes(activeFilters.search.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(activeFilters.search.toLowerCase())) ||
      (lead.company && lead.company.toLowerCase().includes(activeFilters.search.toLowerCase()));

    const matchesStatus = !activeFilters.status || lead.status === activeFilters.status;
    const matchesSource = !activeFilters.source || lead.source === activeFilters.source;
    const matchesAssignedTo = !activeFilters.assigned_to || lead.assigned_to === activeFilters.assigned_to;
    return matchesSearch && matchesStatus && matchesSource && matchesAssignedTo;
  });


  const handleSelectAll = () => {
    if (selectedLeadsState.length === currentFilteredLeads.length) {
      setSelectedLeadsState([]);
    } else {
      setSelectedLeadsState(currentFilteredLeads.map((lead) => lead.id));
    }
  };

  const handleImport = async (importedData: any[]) => {
    if (!user || !can('leads', 'create')) {
      setError("You don't have permission to import (create) leads.");
      return;
    }
    try {
      const leadsToCreate = importedData.map((item) => ({
        name: item.name || 'Imported Lead',
        email: item.email,
        phone: item.phone,
        company: item.company,
        source: item.source || 'manual',
        score: parseInt(item.score) || 0,
        status: item.status || 'new',
        assigned_to: item.assigned_to || user.user_id,
        tags: item.tags ? String(item.tags).split(',').map((tag: string) => tag.trim()) : [],
      }));

      for (const leadData of leadsToCreate) {
        await leadsService.createLead(leadData, user.user_id);
      }
      setShowImport(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Other handlers (handleSendWhatsApp, handleManageTags, etc.) should also incorporate permission checks if they modify data or access sensitive info.
  // For brevity, these are not fully modified here but the pattern is:
  // if (!can('leads', '<relevant_action_if_any>')) { setError(...); return; }
  const handleUpdateTags = async (leadId: string, tags: string[]) => {
    if (!user || !can('leads', 'edit')) {
        setError("You don't have permission to edit lead tags.");
        return;
    }
    try {
      await leadsService.updateLead(leadId, { tags }, user.user_id);
      fetchData(); // Refresh to see updated tags
    } catch (err: any) {
      setError(err.message);
    }
  };


  const selectedLeadObjects = currentFilteredLeads.filter((lead) => selectedLeadsState.includes(lead.id));
  const leadsWithPhone = selectedLeadObjects.filter((lead) => lead.phone);
  const allTags = Array.from(new Set(leads.flatMap((lead) => lead.tags || []))).sort();
  const totalPages = Math.ceil(totalLeads / limit);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedLeadsState([]);
  };

  if (!user || !permissions) {
    return <div className="p-6">{loading ? 'Loading authentication details...' : 'Please log in.'}</div>;
  }

  if (!canView('leads')) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
        <p className="text-gray-500">You do not have permission to view this module.</p>
      </div>
    );
  }

  if (loading && leads.length === 0) {
    return <div className="p-6 text-center">Loading leads...</div>;
  }

  // Display error prominently if it occurs after initial load or if leads list is empty
  if (error && leads.length === 0) {
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
      {error && leads.length > 0 && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">{error}</div>}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-2">Manage and track your sales leads</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* WhatsApp button can be permission gated if needed */}

          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
          </button>
          {can('leads', 'create') && (
            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
          )}
          {/* Export might be tied to view permission, or a specific export permission */}
          <button
            onClick={() => setShowExport(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          {can('leads', 'create') && (
            <button
              onClick={() => {
                setSelectedLead(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </button>
          )}
        </div>
      </div>

      {selectedLeadsState.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">{selectedLeadsState.length} lead(s) selected</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <Users className="w-4 h-4" />
                <span>{leadsWithPhone.length} with phone numbers</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedLeadsState([])}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      <LeadFilters filters={activeFilters} onFiltersChange={setActiveFilters} />

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {currentFilteredLeads.length} of {totalLeads} leads
          </div>
        </div>

        <LeadsList
          leads={currentFilteredLeads}
          selectedLeads={selectedLeadsState}
          onSelectLead={handleSelectLead}
          onSelectAll={handleSelectAll}
          canEdit={can('leads', 'edit')}
          canDelete={can('leads', 'delete')}
          onEditLead={(lead) => {
            if (can('leads', 'edit')) {
              setSelectedLead(lead);
              setShowForm(true);
            } else {
              alert("You don't have permission to edit leads.");
            }
          }}
          onDeleteLead={handleDeleteLead}
          onManageTags={handleManageTags} // Tag management could be tied to 'edit'
          onSendEmail={handleSendEmail}   // Communications might have their own permissions
          onSendSMS={handleSendSMS}
          onViewHistory={handleViewHistory} // Viewing history might be tied to 'view'
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded-lg ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (can('leads', 'create') || (selectedLead !== null && can('leads', 'edit'))) && (
        <LeadForm
          lead={selectedLead}
          onSubmit={selectedLead ? handleUpdateLead : handleCreateLead}
          onCancel={() => {
            setShowForm(false);
            setSelectedLead(null);
          }}
        />
      )}

      {/* Other modals: WhatsAppBulkModal, TagManager, EmailModal, SMSModal, ConversationHistory */}
      {/* These modals should internally check permissions if they perform actions or display sensitive data */}
      {/* Example for TagManager (if it implies editing a lead):
        {showTagManager && tagManagerLead && can('leads', 'edit') && ( ... )}
      */}

      <ImportModal
        isOpen={showImport && can('leads', 'create')}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        entityType="leads"
        sampleData={sampleLeadData}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={currentFilteredLeads}
        entityType="leads"
      />

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={activeFilters}
        onFiltersChange={setActiveFilters}
        filterConfigs={leadFilterConfigs}
        onApply={() => {
            setCurrentPage(1);
            fetchData(); // Re-fetch with server-side filters if `activeFilters` is used in `getLeads`
        }}
        onReset={() => {
          setActiveFilters({
            status: '', source: '', assigned_to: '', search: '',
            scoreMin: '', scoreMax: '', createdAfter: '', createdBefore: '', tags: []
          });
          setCurrentPage(1);
          fetchData();
        }}
      />
    </div>
  );
};

export default LeadsPage;