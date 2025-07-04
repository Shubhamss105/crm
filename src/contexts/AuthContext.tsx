import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
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
}

interface Client {
  id: string;
  name: string;
  domain: string;
  settings: any;
}

interface AuthContextType {
  user: User | null;
  client: Client | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, userData: { name: string; role?: string; team?: string; clientName?: string; clientDomain?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (mounted) setLoading(false);
          return;
        }

        if (session?.user && mounted) {
          await loadUserProfile(session.user);
        } else if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, !!session?.user);

      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setClient(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Don't reload profile on token refresh if we already have user data
        if (!user) {
          await loadUserProfile(session.user);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Loading user profile for:', supabaseUser.id);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        // If profile doesn't exist, user might need to complete registration
        setLoading(false);
        return;
      }

      if (profile) {
        console.log('Profile loaded:', profile.name);
        setUser(profile);

        // Get client information
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', profile.client_id)
          .single();

        if (clientError) {
          console.error('Error loading client:', clientError);
        } else {
          console.log('Client loaded:', clientData.name);
          setClient(clientData);
        }
      }
    } catch (error) {
      console.error('Unexpected error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user);
      } else {
        setLoading(false);
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      setLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, userData: { name: string; role?: string; team?: string; clientName?: string; clientDomain?: string }) => {
    try {
      setLoading(true);

      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: userData.name
          }
        }
      });

      if (authError) {
        setLoading(false);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        setLoading(false);
        return { success: false, error: 'Failed to create user account' };
      }

      // Create or get client
      let clientId = '';
      
      if (userData.clientName && userData.clientDomain) {
        // Check if client already exists - use limit(1) instead of single()
        const { data: existingClients, error: checkError } = await supabase
          .from('clients')
          .select('id')
          .eq('domain', userData.clientDomain.toLowerCase())
          .limit(1);

        if (checkError) {
          console.error('Error checking for existing client:', checkError);
          setLoading(false);
          return { success: false, error: 'Failed to check for existing organization' };
        }

        if (existingClients && existingClients.length > 0) {
          clientId = existingClients[0].id;
        } else {
          // Create new client
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              name: userData.clientName,
              domain: userData.clientDomain.toLowerCase(),
              settings: {
                timezone: 'America/New_York',
                currency: 'USD',
                language: 'en'
              }
            })
            .select()
            .single();

          if (clientError) {
            console.error('Error creating client:', clientError);
            setLoading(false);
            return { success: false, error: 'Failed to create client organization' };
          }

          clientId = newClient.id;
        }
      } else {
        // For demo purposes, create a default client
        const { data: defaultClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: `${userData.name}'s Organization`,
            domain: `${userData.name.toLowerCase().replace(/\s+/g, '')}-${Date.now()}`,
            settings: {
              timezone: 'America/New_York',
              currency: 'USD',
              language: 'en'
            }
          })
          .select()
          .single();

        if (clientError) {
          console.error('Error creating default client:', clientError);
          setLoading(false);
          return { success: false, error: 'Failed to create organization' };
        }

        clientId = defaultClient.id;
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email.trim(),
          name: userData.name,
          role: (userData.role as any) || 'admin',
          team: userData.team || 'Management',
          client_id: clientId,
          timezone: 'America/New_York',
          language: 'en',
          date_format: 'MM/DD/YYYY'
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        setLoading(false);
        return { success: false, error: 'Failed to create user profile' };
      }

      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      setLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      setUser(null);
      setClient(null);
    } catch (error) {
      console.error('Unexpected error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);

      return { success: true };
    } catch (error) {
      console.error('Unexpected profile update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected password reset error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected password update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const value = {
    user,
    client,
    loading,
    signIn,
    signUp,
    signOut,
    logout,
    updateProfile,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};