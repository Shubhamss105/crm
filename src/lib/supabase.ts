import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'manager' | 'sales' | 'marketing';
          team: string;
          avatar_url?: string;
          phone?: string;
          location?: string;
          bio?: string;
          timezone: string;
          language: string;
          date_format: string;
          client_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'admin' | 'manager' | 'sales' | 'marketing';
          team?: string;
          avatar_url?: string;
          phone?: string;
          location?: string;
          bio?: string;
          timezone?: string;
          language?: string;
          date_format?: string;
          client_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'manager' | 'sales' | 'marketing';
          team?: string;
          avatar_url?: string;
          phone?: string;
          location?: string;
          bio?: string;
          timezone?: string;
          language?: string;
          date_format?: string;
          client_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          domain: string;
          settings: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain: string;
          settings?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string;
          settings?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone?: string;
          company?: string;
          source: 'website' | 'email' | 'social' | 'referral' | 'manual';
          score: number;
          status: 'new' | 'contacted' | 'qualified' | 'converted';
          assigned_to?: string;
          location?: string;
          notes?: string;
          tags: string[];
          client_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string;
          company?: string;
          source?: 'website' | 'email' | 'social' | 'referral' | 'manual';
          score?: number;
          status?: 'new' | 'contacted' | 'qualified' | 'converted';
          assigned_to?: string;
          location?: string;
          notes?: string;
          tags?: string[];
          client_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          company?: string;
          source?: 'website' | 'email' | 'social' | 'referral' | 'manual';
          score?: number;
          status?: 'new' | 'contacted' | 'qualified' | 'converted';
          assigned_to?: string;
          location?: string;
          notes?: string;
          tags?: string[];
          client_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}