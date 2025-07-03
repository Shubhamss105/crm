import React, { createContext, useContext, useState, useEffect } from 'react';

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
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, userData: { name: string; role?: string; team?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database
const mockUsers = [
  {
    id: '1',
    email: 'shubhamsingh.ss.1407@gmail.com',
    password: 'secret',
    name: 'Shubham Singh',
    role: 'admin' as const,
    team: 'Management',
    avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    phone: '+1-555-0100',
    location: 'San Francisco, CA',
    bio: 'CRM Administrator with 5+ years of experience',
    timezone: 'America/New_York',
    language: 'en',
    date_format: 'MM/DD/YYYY',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'alice@company.com',
    password: 'password123',
    name: 'Alice Johnson',
    role: 'manager' as const,
    team: 'Sales',
    avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    phone: '+1-555-0101',
    location: 'New York, NY',
    bio: 'Sales Manager focused on enterprise clients',
    timezone: 'America/New_York',
    language: 'en',
    date_format: 'MM/DD/YYYY',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    email: 'bob@company.com',
    password: 'password123',
    name: 'Bob Smith',
    role: 'sales' as const,
    team: 'Sales',
    avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    phone: '+1-555-0102',
    location: 'Austin, TX',
    bio: 'Sales Representative specializing in SMB accounts',
    timezone: 'America/Chicago',
    language: 'en',
    date_format: 'MM/DD/YYYY',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('crm_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('crm_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting to sign in with:', email);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = mockUsers.find(u => u.email === email.trim() && u.password === password);
      
      if (!mockUser) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = mockUser;
      
      setUser(userWithoutPassword);
      localStorage.setItem('crm_user', JSON.stringify(userWithoutPassword));
      
      console.log('Sign in successful');
      return { success: true };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: { name: string; role?: string; team?: string }) => {
    try {
      setLoading(true);
      console.log('Attempting to sign up with:', email, userData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email === email.trim());
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email: email.trim(),
        password,
        name: userData.name,
        role: (userData.role as any) || 'sales',
        team: userData.team || 'Sales',
        avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        phone: '',
        location: '',
        bio: '',
        timezone: 'America/New_York',
        language: 'en',
        date_format: 'MM/DD/YYYY',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to mock database
      mockUsers.push(newUser);

      console.log('Sign up successful');
      return { success: true };
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('Signing out...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(null);
      localStorage.removeItem('crm_user');
    } catch (error) {
      console.error('Error signing out:', error);
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

      console.log('Updating profile:', updates);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser = {
        ...user,
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Update mock database
      const userIndex = mockUsers.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        const { password, ...userWithoutPassword } = mockUsers[userIndex];
        mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates, updated_at: new Date().toISOString() };
      }

      setUser(updatedUser);
      localStorage.setItem('crm_user', JSON.stringify(updatedUser));

      return { success: true };
    } catch (error) {
      console.error('Unexpected profile update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Resetting password for:', email);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userExists = mockUsers.find(u => u.email === email.trim());
      if (!userExists) {
        return { success: false, error: 'No user found with this email address' };
      }

      // In a real app, this would send an email
      console.log('Password reset email sent (simulated)');
      return { success: true };
    } catch (error) {
      console.error('Unexpected password reset error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      console.log('Updating password...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update password in mock database
      const userIndex = mockUsers.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        mockUsers[userIndex].password = password;
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected password update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const value = {
    user,
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