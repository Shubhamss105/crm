import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { leadsService } from '../../services/leadsService';
import { LeadsList } from './LeadsList';
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
import { Lead, CommunicationRecord } from '../../types';
import { Plus, Upload, Download, Filter, MessageCircle, Users, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';

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
    key: 'assigned_to',
    label: 'Assigned To',
    type: 'select',
    options: [
      { value: 'Alice Johnson', label: 'Alice Johnson' },
      { value: 'Bob Smith', label: 'Bob Smith' },
      { value: 'Carol Davis', label: 'Carol Davis' },
      { value: 'David Wilson', label: 'David Wilson' },
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
    options: [
      { value: 'enterprise', label: 'Enterprise' },
      { value: 'high-priority', label: 'High Priority' },
      { value: 'hot-lead', label: 'Hot Lead' },
      { value: 'linkedin', label: 'LinkedIn' },
      { value: 'startup', label: 'Startup' }
    ]
  }
];

const sampleLeadData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1-555-0123',
  company: 'Example Corp',
  source: 'website',
  score: '85',
  assigned_to: 'Alice Johnson',
  location: 'San Francisco, CA',
  tags: 'enterprise,high-priority'
};

const LeadsPage: React.FC = () => {
  const { user } = useAuth();
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
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    assigned_to: '',
    score: '',
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

  // Fetch paginated data
  useEffect(() => {
    if (!user) {
      setError('You must be logged in to view leads.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, total } = await leadsService.getLeads(user.id, currentPage, limit);
        setLeads(data);
        setTotalLeads(total);
        // Fetch communications for leads on the current page
        const commsPromises = data.map(lead => leadsService.getCommunications(lead.id, user.id));
        const commsArrays = await Promise.all(commsPromises);
        setCommunications(commsArrays.flat());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to real-time updates
    const leadsSubscription = leadsService.subscribeToLeads(user.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setLeads((prev) => [payload.new, ...prev]);
        setTotalLeads((prev) => prev + 1);
      } else if (payload.eventType === 'UPDATE') {
        setLeads((prev) => prev.map((lead) => (lead.id === payload.new.id ? payload.new : lead)));
      } else if (payload.eventType === 'DELETE') {
        setLeads((prev) => prev.filter((lead) => lead.id !== payload.old.id));
        setTotalLeads((prev) => prev - 1);
      }
    });

    const commsSubscription = leadsService.subscribeToCommunications(user.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setCommunications((prev) => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setCommunications((prev) => prev.map((comm) => (comm.id === payload.new.id ? payload.new : comm)));
      } else if (payload.eventType === 'DELETE') {
        setCommunications((prev) => prev.filter((comm) => comm.id !== payload.old.id));
      }
    });

    return () => {
      leadsSubscription.unsubscribe();
      commsSubscription.unsubscribe();
    };
  }, [user, currentPage]);

  const handleCreateLead = async (leadData: Partial<Lead>) => {
    if (!user) return;
    try {
      const newLead = await leadsService.createLead(
        { ...leadData, assigned_to: leadData.assigned_to },
        user.id
      );
      setShowForm(false);
      setCurrentPage(1); // Reset to first page on new lead
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateLead = async (leadData: Partial<Lead>) => {
    if (!user || !selectedLead) return;
    try {
      await leadsService.updateLead(
        selectedLead.id,
        { ...leadData, assigned_to: leadData.assigned_to },
        user.id
      );
      setSelectedLead(null);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!user) return;
    try {
      await leadsService.deleteLead(leadId, user.id);
      setSelectedLeads((prev) => prev.filter((id) => id !== leadId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map((lead) => lead.id));
    }
  };

  const handleSendWhatsApp = (message: string, targetLeads: Lead[]) => {
    console.log('Sending WhatsApp messages:', { message, targetLeads });
    alert(`WhatsApp messages sent to ${targetLeads.length} leads!`);
    setSelectedLeads([]);
  };

  const handleManageTags = (lead: Lead) => {
    setTagManagerLead(lead);
    setShowTagManager(true);
  };

  const handleUpdateTags = async (leadId: string, tags: string[]) => {
    if (!user) return;
    try {
      await leadsService.updateLead(leadId, { tags }, user.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendEmail = (lead: Lead) => {
    setEmailLead(lead);
    setShowEmailModal(true);
  };

  const handleSendSMS = (lead: Lead) => {
    setSmsLead(lead);
    setShowSMSModal(true);
  };

  const handleViewHistory = (lead: Lead) => {
    setHistoryLead(lead);
    setShowConversationHistory(true);
  };

  const handleEmailSent = async (emailData: any) => {
    if (!user || !emailLead) return;
    try {
      const newCommunication: Partial<CommunicationRecord> = {
        lead_id: emailLead.id,
        type: 'email',
        direction: 'outbound',
        from_address: 'alice@crmpo.com',
        to_address: emailData.to,
        subject: emailData.subject,
        content: emailData.body,
        status: 'sent',
        attachments: emailData.attachments?.map((file: File) => ({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          url: '#'
        }))
      };
      await leadsService.createCommunication(newCommunication, user.id);
      alert('Email sent successfully!');
      setShowEmailModal(false);
      setEmailLead(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSMSSent = async (smsData: any) => {
    if (!user || !smsLead) return;
    try {
      const newCommunication: Partial<CommunicationRecord> = {
        lead_id: smsLead.id,
        type: 'sms',
        direction: 'outbound',
        from_address: '+1-555-0200',
        to_address: smsData.to,
        content: smsData.message,
        status: 'sent'
      };
      await leadsService.createCommunication(newCommunication, user.id);
      alert('SMS sent successfully!');
      setShowSMSModal(false);
      setSmsLead(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReplyFromHistory = (type: 'email' | 'sms', originalMessage?: CommunicationRecord) => {
    if (type === 'email') {
      setShowConversationHistory(false);
      setEmailLead(historyLead);
      setShowEmailModal(true);
    } else if (type === 'sms') {
      setShowConversationHistory(false);
      setSmsLead(historyLead);
      setShowSMSModal(true);
    }
  };

  const handleImport = async (importedData: any[]) => {
    if (!user) return;
    try {
      const newLeads = importedData.map((data, index) => ({
        id: `imported-${Date.now()}-${index}`,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone,
        company: data.company,
        source: data.source || 'manual',
        score: parseInt(data.score) || 0,
        status: 'new',
        assigned_to: data.assigned_to,
        created_at: new Date().toISOString(),
        location: data.location,
        notes: data.notes,
        tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
        user_id: user.id
      }));
      await Promise.all(newLeads.map((lead) => leadsService.createLead(lead, user.id)));
      setShowImport(false);
      setCurrentPage(1); // Reset to first page on import
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !filters.search ||
      lead.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.company?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus = !filters.status || lead.status === filters.status;
    const matchesSource = !filters.source || lead.source === filters.source;
    const matchesAssignedTo = !filters.assigned_to || lead.assigned_to === filters.assigned_to;
    const matchesMinScore = !filters.scoreMin || lead.score >= parseInt(filters.scoreMin);
    const matchesMaxScore = !filters.scoreMax || lead.score <= parseInt(filters.scoreMax);
    const matchesCreatedAfter =
      !filters.createdAfter || new Date(lead.created_at) >= new Date(filters.createdAfter);
    const matchesCreatedBefore =
      !filters.createdBefore || new Date(lead.created_at) <= new Date(filters.createdBefore);
    const matchesTags = filters.tags.length === 0 || filters.tags.some((tag: string) => lead.tags.includes(tag));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesSource &&
      matchesAssignedTo &&
      matchesMinScore &&
      matchesMaxScore &&
      matchesCreatedAfter &&
      matchesCreatedBefore &&
      matchesTags
    );
  });

  const selectedLeadObjects = leads.filter((lead) => selectedLeads.includes(lead.id));
  const leadsWithPhone = selectedLeadObjects.filter((lead) => lead.phone);
  const allTags = Array.from(new Set(leads.flatMap((lead) => lead.tags))).sort();
  const totalPages = Math.ceil(totalLeads / limit);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedLeads([]); // Clear selections when changing pages
  };

  if (!user) {
    return <div className="p-6 text-red-600">Please log in to access the leads page.</div>;
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-2">Manage and track your sales leads</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedLeads.length > 0 && (
            <button
              onClick={() => setShowWhatsAppModal(true)}
              disabled={leadsWithPhone.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={leadsWithPhone.length === 0 ? 'No selected leads have phone numbers' : `Send WhatsApp to ${leadsWithPhone.length} leads`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp ({leadsWithPhone.length})</span>
            </button>
          )}
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
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
        </div>
      </div>

      {selectedLeads.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">{selectedLeads.length} lead(s) selected</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <Users className="w-4 h-4" />
                <span>{leadsWithPhone.length} with phone numbers</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedLeads([])}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      <LeadFilters filters={filters} onFiltersChange={setFilters} />

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredLeads.length} of {totalLeads} leads
          </div>
        </div>

        <LeadsList
          leads={filteredLeads}
          selectedLeads={selectedLeads}
          onSelectLead={handleSelectLead}
          onSelectAll={handleSelectAll}
          onEditLead={(lead) => {
            setSelectedLead(lead);
            setShowForm(true);
          }}
          onDeleteLead={handleDeleteLead}
          onManageTags={handleManageTags}
          onSendEmail={handleSendEmail}
          onSendSMS={handleSendSMS}
          onViewHistory={handleViewHistory}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {/* Pagination Controls */}
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

      {showForm && (
        <LeadForm
          lead={selectedLead}
          onSubmit={selectedLead ? handleUpdateLead : handleCreateLead}
          onCancel={() => {
            setShowForm(false);
            setSelectedLead(null);
          }}
        />
      )}

      <WhatsAppBulkModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        selectedLeads={selectedLeadObjects}
        onSend={handleSendWhatsApp}
      />

      {showTagManager && tagManagerLead && (
        <TagManager
          isOpen={showTagManager}
          onClose={() => {
            setShowTagManager(false);
            setTagManagerLead(null);
          }}
          lead={tagManagerLead}
          onUpdateTags={handleUpdateTags}
          availableTags={allTags}
        />
      )}

      {showEmailModal && emailLead && (
        <EmailModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setEmailLead(null);
          }}
          lead={emailLead}
          onSend={handleEmailSent}
        />
      )}

      {showSMSModal && smsLead && (
        <SMSModal
          isOpen={showSMSModal}
          onClose={() => {
            setShowSMSModal(false);
            setSmsLead(null);
          }}
          lead={smsLead}
          onSend={handleSMSSent}
        />
      )}

      {showConversationHistory && historyLead && (
        <ConversationHistory
          isOpen={showConversationHistory}
          onClose={() => {
            setShowConversationHistory(false);
            setHistoryLead(null);
          }}
          lead={historyLead}
          communications={communications.filter((comm) => comm.lead_id === historyLead.id)}
          onReply={handleReplyFromHistory}
        />
      )}

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        entityType="leads"
        sampleData={sampleLeadData}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={filteredLeads}
        entityType="leads"
      />

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        filterConfigs={leadFilterConfigs}
        onApply={() => {}}
        onReset={() =>
          setFilters({
            status: '',
            source: '',
            assigned_to: '',
            score: '',
            search: '',
            scoreMin: '',
            scoreMax: '',
            createdAfter: '',
            createdBefore: '',
            tags: []
          })
        }
      />
    </div>
  );
};

export default LeadsPage;