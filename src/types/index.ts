export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: 'website' | 'email' | 'social' | 'referral' | 'manual';
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  assignedTo?: string;
  createdAt: Date;
  lastActivity?: Date;
  location?: string;
  notes?: string;
  tags: string[];
}

export interface Opportunity {
  id: string;
  name: string;
  leadId?: string;
  customerId?: string;
  value: number;
  currency: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate: Date;
  assignedTo: string;
  createdAt: Date;
  lastActivity: Date;
  description?: string;
  lostReason?: string;
  nextAction?: string;
  tags: string[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  addresses: Address[];
  language: string;
  currency: string;
  totalValue: number;
  createdAt: Date;
  lastActivity: Date;
  tags: string[];
  notes?: string;
}

export interface Address {
  id: string;
  type: 'billing' | 'shipping' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary: boolean;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  title: string;
  description?: string;
  relatedTo: {
    type: 'lead' | 'opportunity' | 'customer';
    id: string;
    name: string;
  };
  assignedTo: string;
  dueDate?: Date;
  completedAt?: Date;
  status: 'pending' | 'completed' | 'overdue';
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'sales' | 'marketing';
  team: string;
  avatar?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'lead-followup' | 'opportunity-proposal' | 'welcome' | 'follow-up';
  isActive: boolean;
  createdAt: Date;
}

export interface DashboardMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  totalOpportunities: number;
  wonOpportunities: number;
  totalRevenue: number;
  avgDealSize: number;
  conversionRate: number;
  monthlyGrowth: number;
}

export interface CommunicationRecord {
  id: string;
  type: 'email' | 'sms' | 'call' | 'meeting' | 'note';
  direction: 'inbound' | 'outbound';
  leadId: string;
  from: string;
  to: string;
  subject?: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: {
    name: string;
    size: string;
    url: string;
  }[];
}