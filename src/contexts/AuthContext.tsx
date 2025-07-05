import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "react-query";
import {
  signUpWithSupabase, // This will create an auth.users entry
  signInWithSupabase,
  signOutFromSupabase,
  onAuthStateChange,
  // getUser as getSupabaseUser, // We'll use onAuthStateChange to get the Supabase user
  // updateUserMetadata as updateSupabaseUserMetadata, // We'll update user_profiles table instead
} from "../services/authService";
import { userService } from "../services/userService"; // For user_profiles
import { permissionsService } from "../services/permissionsService"; // For permissions
import type {
  User as SupabaseUser,
  Session as SupabaseSession,
} from "@supabase/supabase-js";
import { UserProfile, UserPermissions, ModulePermission } from "../types"; // Updated types
import { supabase } from "../lib/supabaseClient";

interface AuthContextType {
  user: UserProfile | null; // Changed from AppUser
  session: SupabaseSession | null;
  permissions: UserPermissions | null; // Added permissions
  loading: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;
  isSigningOut: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  // Sign up now might not need role/team directly if default role is assigned by trigger
  // Or, if creating sub-users, that's a separate flow handled by Super Admin UI
  signUp: (
    email: string,
    password: string,
    userData: { name: string }
  ) => Promise<{ success: boolean; error?: string; userId?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (
    userId: string,
    updates: Partial<Pick<UserProfile, "name" | "avatar_url">>
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  // Permission helpers
  getModulePermissions: (module: string) => ModulePermission | undefined;
  can:
    | ((module: string, action: "create" | "edit" | "delete") => boolean)
    | ((permission: "manage_users" | "manage_roles") => boolean);
  canView: (module: string, viewTypeToMatch?: "all" | "assigned") => boolean;
  isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const queryClient = new QueryClient();

export const AuthProviderComponent: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const reactQueryClient = useQueryClient();

  const loadUserAndPermissions = useCallback(
    async (supabaseUser: SupabaseUser | null) => {
      if (supabaseUser) {
        try {
          const userProfile = await userService.getUserProfile(supabaseUser.id);
          if (userProfile) {
            setUser(userProfile);
            reactQueryClient.setQueryData(
              ["userProfile", supabaseUser.id],
              userProfile
            );

            const userPermissions = await permissionsService.getUserPermissions(
              supabaseUser.id
            );
            setPermissions(userPermissions);
            reactQueryClient.setQueryData(
              ["userPermissions", supabaseUser.id],
              userPermissions
            );
          } else {
            // Profile might not exist yet if trigger is slow or user signed up but profile creation failed
            // Or if it's a new user and trigger hasn't fired/completed.
            console.warn(
              `User profile not found for ${supabaseUser.id}. User might need to complete profile setup or trigger is pending.`
            );
            setUser(null); // Or a minimal UserProfile based on SupabaseUser
            setPermissions(null);
          }
        } catch (error) {
          console.error("Error loading user profile or permissions:", error);
          setUser(null);
          setPermissions(null);
        }
      } else {
        setUser(null);
        setPermissions(null);
      }
      setLoadingInitial(false);
    },
    [reactQueryClient]
  );

  useEffect(() => {
    // Check initial auth state
    const checkInitialAuth = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();
      setSession(initialSession);
      await loadUserAndPermissions(initialSession?.user ?? null);
    };
    checkInitialAuth();

    const { data: authListener } = onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        await loadUserAndPermissions(newSession?.user ?? null);
        reactQueryClient.invalidateQueries([
          "userProfile",
          newSession?.user?.id,
        ]);
        reactQueryClient.invalidateQueries([
          "userPermissions",
          newSession?.user?.id,
        ]);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [loadUserAndPermissions, reactQueryClient]);

  const signInMutation = useMutation(
    ({ email, password }: { email: string; password: string }) =>
      signInWithSupabase({ email, password }),
    {
      onSuccess: async (data) => {
        // onAuthStateChange will handle setting user and permissions
        // setSession(data.session); // Done by onAuthStateChange
        // await loadUserAndPermissions(data.user); // Done by onAuthStateChange
      },
      onError: (error: any) => {
        console.error("Sign in error:", error.message);
      },
    }
  );

  const signUpMutation = useMutation(
    // User metadata during Supabase signUp is for auth.users.user_metadata
    // The handle_new_user trigger should create the user_profile entry.
    // We pass name here to be potentially used by the trigger if it reads raw_user_meta_data.
    ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name: string;
    }) =>
      signUpWithSupabase({
        email,
        password,
        options: { data: { full_name: name } },
      }),
    {
      onSuccess: (data) => {
        // onAuthStateChange will handle setting user and permissions if auto-verified & logged in.
        // If email confirmation is required, user won't be set here.
        // The `userId` can be returned for UIs that might want to immediately do something,
        // but generally, rely on onAuthStateChange.
      },
      onError: (error: any) => {
        console.error("Sign up error:", error.message);
      },
    }
  );

  const signOutMutation = useMutation(() => signOutFromSupabase(), {
    onSuccess: () => {
      setUser(null);
      setSession(null);
      setPermissions(null);
      reactQueryClient.clear(); // Clear all query cache on sign out
    },
    onError: (error: any) => {
      console.error("Sign out error:", error.message);
    },
  });

  // Update profile now targets user_profiles table via userService
  const updateProfileMutation = useMutation(
    ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Partial<Pick<UserProfile, "name" | "avatar_url">>;
    }) => userService.updateSubUser(userId, updates), // Using updateSubUser as it updates user_profiles
    {
      onSuccess: (updatedProfile) => {
        if (updatedProfile) {
          setUser(updatedProfile);
          reactQueryClient.setQueryData(
            ["userProfile", updatedProfile.user_id],
            updatedProfile
          );
        }
      },
      onError: (error: any) => {
        console.error("Update profile error:", error.message);
      },
    }
  );

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signInMutation.mutateAsync({ email, password });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Sign in failed" };
    }
  };

  const handleSignUp = async (
    email: string,
    password: string,
    userData: { name: string }
  ) => {
    try {
      const { data, error } = await signUpMutation.mutateAsync({
        email,
        password,
        name: userData.name,
      });
      if (error) throw error;
      return { success: true, userId: data?.user?.id };
    } catch (error: any) {
      return { success: false, error: error.message || "Sign up failed" };
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Sign out failed" };
    }
  };

  const handleUpdateProfile = async (
    userId: string,
    updates: Partial<Pick<UserProfile, "name" | "avatar_url">>
  ) => {
    try {
      await updateProfileMutation.mutateAsync({ userId, updates });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Profile update failed",
      };
    }
  };

  // Permission helper functions
  const getModulePermissions = useCallback(
    (module: string): ModulePermission | undefined => {
      if (permissions?.isSuperAdmin) {
        return {
          view_type: "all",
          can_create: true,
          can_edit: true,
          can_delete: true,
        };
      }
      return permissions?.modules?.[module];
    },
    [permissions]
  );

  const can = useCallback(
    (
      module: string,
      action: "create" | "edit" | "delete" | "manage_users" | "manage_roles"
    ): boolean => {
      if (permissions?.isSuperAdmin) return true;

      // Specific checks for meta-permissions like 'manage_users'
      if (action === "manage_users")
        return (
          permissions?.modules?.["settings_users"]?.can_create ||
          permissions?.modules?.["settings_users"]?.can_edit ||
          permissions?.modules?.["settings_users"]?.can_delete ||
          false
        );
      if (action === "manage_roles")
        return (
          permissions?.modules?.["settings_roles"]?.can_create ||
          permissions?.modules?.["settings_roles"]?.can_edit ||
          false
        );

      const modulePerms = getModulePermissions(module);
      if (!modulePerms) return false;

      switch (action) {
        case "create":
          return modulePerms.can_create;
        case "edit":
          return modulePerms.can_edit;
        case "delete":
          return modulePerms.can_delete;
        default:
          return false;
      }
    },
    [permissions, getModulePermissions]
  );

  const canView = useCallback(
    (module: string, viewTypeToMatch?: "all" | "assigned"): boolean => {
      if (permissions?.isSuperAdmin) return true;
      const modulePerms = getModulePermissions(module);
      if (!modulePerms || modulePerms.view_type === "none") return false;
      if (viewTypeToMatch) return modulePerms.view_type === viewTypeToMatch;
      return true; // If not 'none', then some view permission exists
    },
    [permissions, getModulePermissions]
  );

  const isSuperAdmin = useCallback((): boolean => {
    return permissions?.isSuperAdmin || false;
  }, [permissions]);

  const value: AuthContextType = {
    user,
    session,
    permissions,
    loading:
      loadingInitial ||
      signInMutation.isLoading ||
      signUpMutation.isLoading ||
      signOutMutation.isLoading,
    isSigningIn: signInMutation.isLoading,
    isSigningUp: signUpMutation.isLoading,
    isSigningOut: signOutMutation.isLoading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    logout: handleSignOut,
    updateProfile: handleUpdateProfile,
    getModulePermissions,
    can,
    canView,
    isSuperAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderComponent>{children}</AuthProviderComponent>
    </QueryClientProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
