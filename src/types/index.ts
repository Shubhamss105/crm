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
  user_id: string; // Added for data ownership
  name: string;
  lead_id?: string;      // Changed from leadId
  customer_id?: string;  // Changed from customerId
  value: number;
  currency: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;    // Percentage, e.g., 0.75 for 75%
  expected_close_date: string; // Changed from expectedCloseDate, type string
  assigned_to: string;    // Changed from assignedTo (user ID or name)
  created_at: string;     // Changed from createdAt, type string
  last_activity: string;  // Changed from lastActivity, type string
  description?: string;
  lost_reason?: string;    // Changed from lostReason
  next_action?: string;    // Changed from nextAction
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

// RBAC Types
export interface Role {
  id: string; // uuid
  name: string;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface RolePermissionEntry {
  id: string; // uuid
  role_id: string; // uuid
  module: string; // e.g., 'leads', 'customers', 'settings_users'
  view_type: 'all' | 'assigned' | 'none';
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModulePermission {
  view_type: 'all' | 'assigned' | 'none';
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface UserPermissions {
  isSuperAdmin: boolean;
  modules: {
    [moduleKey: string]: ModulePermission; // e.g., modules['leads'] = { view_type: 'all', ... }
  };
}

// Represents the user profile data stored in your 'user_profiles' table
export interface UserProfile {
  user_id: string; // Corresponds to auth.users.id (PK)
  role_id?: string | null; // FK to roles table
  created_by_user_id?: string | null; // FK to auth.users.id (for sub-user tracking)
  name?: string | null;
  email?: string | null; // Usually from auth.users but can be denormalized
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  // Joined role data (optional, but often fetched together)
  roles?: Role | null;
}


// This existing User interface might be from before Supabase Auth integration or for a different context.
// I'm renaming it to OldUser to avoid conflict and will primarily use UserProfile.
// If this User type is still actively used for something specific, we'll need to assess.
export interface OldUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'sales' | 'marketing'; // This role system is now replaced by the new RBAC
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