import React, { useState } from 'react';
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
import { mockLeads } from '../../data/mockData';
import { Lead, CommunicationRecord } from '../../types';
import { Plus, Upload, Download, Filter, MessageCircle, Users, CheckSquare } from 'lucide-react';

const leadFilterConfigs = [
  { key: 'search', label: 'Search', type: 'text' as const, placeholder: 'Search leads...' },
  { key: 'status', label: 'Status', type: 'select' as const, options: [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'converted', label: 'Converted' }
  ]},
  { key: 'source', label: 'Source', type: 'select' as const, options: [
    { value: 'website', label: 'Website' },
    { value: 'email', label: 'Email' },
    { value: 'social', label: 'Social Media' },
    { value: 'referral', label: 'Referral' },
    { value: 'manual', label: 'Manual' }
  ]},
  { key: 'assignedTo', label: 'Assigned To', type: 'select' as const, options: [
    { value: 'Alice Johnson', label: 'Alice Johnson' },
    { value: 'Bob Smith', label: 'Bob Smith' },
    { value: 'Carol Davis', label: 'Carol Davis' },
    { value: 'David Wilson', label: 'David Wilson' }
  ]},
  { key: 'scoreMin', label: 'Min Score', type: 'number' as const, placeholder: '0' },
  { key: 'scoreMax', label: 'Max Score', type: 'number' as const, placeholder: '100' },
  { key: 'createdAfter', label: 'Created After', type: 'date' as const },
  { key: 'createdBefore', label: 'Created Before', type: 'date' as const },
  { key: 'tags', label: 'Tags', type: 'multiselect' as const, options: [
    { value: 'enterprise', label: 'Enterprise' },
    { value: 'high-priority', label: 'High Priority' },
    { value: 'hot-lead', label: 'Hot Lead' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'startup', label: 'Startup' }
  ]}
];

const sampleLeadData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1-555-0123',
  company: 'Example Corp',
  source: 'website',
  score: '85',
  assignedTo: 'Alice Johnson',
  location: 'San Francisco, CA',
  tags: 'enterprise,high-priority'
};

// Mock communication data
const mockCommunications: CommunicationRecord[] = [
  {
    id: '1',
    type: 'email',
    direction: 'outbound',
    leadId: '1',
    from: 'alice@crmpo.com',
    to: 'john.doe@techcorp.com',
    subject: 'Introduction - CRM Pro Solutions',
    content: 'Dear John,\n\nI hope this email finds you well. My name is Alice Johnson, and I\'m reaching out from CRM Pro.\n\nI noticed your interest in our solutions and wanted to personally introduce myself. We specialize in helping companies like TechCorp Inc. streamline their operations and achieve their business goals.\n\nI\'d love to schedule a brief 15-minute call to learn more about your current challenges and see how we might be able to help.\n\nWould you be available for a quick conversation this week?\n\nBest regards,\nAlice Johnson\nCRM Pro\nalice@crmpo.com',
    timestamp: new Date(2024, 0, 22, 10, 30),
    status: 'sent'
  },
  {
    id: '2',
    type: 'email',
    direction: 'inbound',
    leadId: '1',
    from: 'john.doe@techcorp.com',
    to: 'alice@crmpo.com',
    subject: 'Re: Introduction - CRM Pro Solutions',
    content: 'Hi Alice,\n\nThank you for reaching out. I\'m definitely interested in learning more about your solutions.\n\nWe\'re currently evaluating different CRM options for our growing team. Would Thursday afternoon work for a call?\n\nBest,\nJohn',
    timestamp: new Date(2024, 0, 22, 14, 15),
    status: 'read'
  },
  {
    id: '3',
    type: 'sms',
    direction: 'outbound',
    leadId: '1',
    from: '+1-555-0200',
    to: '+1-555-0123',
    content: 'Hi John, this is Alice from CRM Pro. Just confirming our call for Thursday at 2 PM. Looking forward to speaking with you!',
    timestamp: new Date(2024, 0, 24, 9, 0),
    status: 'delivered'
  },
  {
    id: '4',
    type: 'call',
    direction: 'outbound',
    leadId: '1',
    from: 'Alice Johnson',
    to: 'John Doe',
    subject: 'Discovery Call',
    content: 'Had a great 30-minute discovery call with John. Discussed their current challenges with lead management and demonstrated our key features. John is very interested and wants to see a proposal. Next steps: Send proposal by Friday.',
    timestamp: new Date(2024, 0, 24, 14, 0),
    status: 'sent'
  },
  {
    id: '5',
    type: 'email',
    direction: 'outbound',
    leadId: '1',
    from: 'alice@crmpo.com',
    to: 'john.doe@techcorp.com',
    subject: 'Proposal for TechCorp Inc. - CRM Pro Solutions',
    content: 'Dear John,\n\nThank you for the great conversation yesterday. As promised, I\'m attaching our detailed proposal for TechCorp Inc.\n\nOur solution includes:\n✓ Complete CRM setup and configuration\n✓ Data migration from your current system\n✓ Team training for up to 20 users\n✓ 90 days of premium support\n\nThe proposal includes detailed pricing, implementation timeline, and terms.\n\nI\'m confident this solution will help TechCorp achieve its growth goals. Please review and let me know if you have any questions.\n\nBest regards,\nAlice Johnson',
    timestamp: new Date(2024, 0, 25, 11, 0),
    status: 'sent',
    attachments: [
      { name: 'CRM_Pro_Proposal_TechCorp.pdf', size: '2.3 MB', url: '#' },
      { name: 'Implementation_Timeline.pdf', size: '1.1 MB', url: '#' }
    ]
  }
];

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
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
  const [communications, setCommunications] = useState<CommunicationRecord[]>(mockCommunications);
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    assignedTo: '',
    score: '',
    search: '',
    scoreMin: '',
    scoreMax: '',
    createdAfter: '',
    createdBefore: '',
    tags: []
  });

  const handleCreateLead = (leadData: Partial<Lead>) => {
    const newLead: Lead = {
      id: Date.now().toString(),
      name: leadData.name || '',
      email: leadData.email || '',
      phone: leadData.phone,
      company: leadData.company,
      source: leadData.source || 'manual',
      score: leadData.score || 0,
      status: 'new',
      assignedTo: leadData.assignedTo,
      createdAt: new Date(),
      location: leadData.location,
      notes: leadData.notes,
      tags: leadData.tags || []
    };
    setLeads([newLead, ...leads]);
    setShowForm(false);
  };

  const handleUpdateLead = (leadData: Partial<Lead>) => {
    if (selectedLead) {
      setLeads(leads.map(lead => 
        lead.id === selectedLead.id 
          ? { ...lead, ...leadData }
          : lead
      ));
      setSelectedLead(null);
      setShowForm(false);
    }
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads(leads.filter(lead => lead.id !== leadId));
    setSelectedLeads(selectedLeads.filter(id => id !== leadId));
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
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

  const handleUpdateTags = (leadId: string, tags: string[]) => {
    setLeads(leads.map(lead => 
      lead.id === leadId 
        ? { ...lead, tags }
        : lead
    ));
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

  const handleEmailSent = (emailData: any) => {
    // Add email to communications history
    const newCommunication: CommunicationRecord = {
      id: Date.now().toString(),
      type: 'email',
      direction: 'outbound',
      leadId: emailLead!.id,
      from: 'alice@crmpo.com',
      to: emailData.to,
      subject: emailData.subject,
      content: emailData.body,
      timestamp: new Date(),
      status: 'sent',
      attachments: emailData.attachments?.map((file: File) => ({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        url: '#'
      }))
    };
    
    setCommunications(prev => [newCommunication, ...prev]);
    console.log('Email sent:', emailData);
    alert('Email sent successfully!');
  };

  const handleSMSSent = (smsData: any) => {
    // Add SMS to communications history
    const newCommunication: CommunicationRecord = {
      id: Date.now().toString(),
      type: 'sms',
      direction: 'outbound',
      leadId: smsLead!.id,
      from: '+1-555-0200',
      to: smsData.to,
      content: smsData.message,
      timestamp: new Date(),
      status: 'sent'
    };
    
    setCommunications(prev => [newCommunication, ...prev]);
    console.log('SMS sent:', smsData);
    alert('SMS sent successfully!');
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

  const handleImport = (importedData: any[]) => {
    const newLeads: Lead[] = importedData.map((data, index) => ({
      id: `imported-${Date.now()}-${index}`,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone,
      company: data.company,
      source: data.source || 'manual',
      score: parseInt(data.score) || 0,
      status: 'new',
      assignedTo: data.assignedTo,
      createdAt: new Date(),
      location: data.location,
      notes: data.notes,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : []
    }));
    setLeads([...newLeads, ...leads]);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !filters.search || 
      lead.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.company?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || lead.status === filters.status;
    const matchesSource = !filters.source || lead.source === filters.source;
    const matchesAssignedTo = !filters.assignedTo || lead.assignedTo === filters.assignedTo;
    
    const matchesMinScore = !filters.scoreMin || lead.score >= parseInt(filters.scoreMin);
    const matchesMaxScore = !filters.scoreMax || lead.score <= parseInt(filters.scoreMax);
    
    const matchesCreatedAfter = !filters.createdAfter || 
      new Date(lead.createdAt) >= new Date(filters.createdAfter);
    const matchesCreatedBefore = !filters.createdBefore || 
      new Date(lead.createdAt) <= new Date(filters.createdBefore);
    
    const matchesTags = filters.tags.length === 0 || 
      filters.tags.some((tag: string) => lead.tags.includes(tag));

    return matchesSearch && matchesStatus && matchesSource && matchesAssignedTo && 
           matchesMinScore && matchesMaxScore && matchesCreatedAfter && 
           matchesCreatedBefore && matchesTags;
  });

  const selectedLeadObjects = leads.filter(lead => selectedLeads.includes(lead.id));
  const leadsWithPhone = selectedLeadObjects.filter(lead => lead.phone);
  
  // Get all unique tags from all leads
  const allTags = Array.from(new Set(leads.flatMap(lead => lead.tags))).sort();

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

      {/* Selection Summary */}
      {selectedLeads.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedLeads.length} lead(s) selected
                </span>
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
            Showing {filteredLeads.length} of {leads.length} leads
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
        />
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
          communications={communications.filter(comm => comm.leadId === historyLead.id)}
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
        onReset={() => setFilters({
          status: '',
          source: '',
          assignedTo: '',
          score: '',
          search: '',
          scoreMin: '',
          scoreMax: '',
          createdAfter: '',
          createdBefore: '',
          tags: []
        })}
      />
    </div>
  );
};