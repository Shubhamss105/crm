export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: 'website' | 'email' | 'social' | 'referral' | 'manual';
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  assigned_to?: string;
  created_at: Date;
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
  user_id: string; // Added user_id
  name: string;
  email: string;
  phone?: string;
  company?: string;
  addresses: Address[];
  language: string;
  currency: string;
  total_value: number; // Changed from totalValue
  created_at: string;   // Changed from createdAt, type string
  last_activity: string; // Changed from lastActivity, type string
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
  lead_id: string;
  type: 'email' | 'sms' | 'call';
  direction: 'inbound' | 'outbound';
  from_address: string;
  to_address: string;
  subject?: string;
  content: string;
  timestamp: string;
  status: string;
  attachments?: { name: string; size: string; url: string }[];
  user_id: string;
}