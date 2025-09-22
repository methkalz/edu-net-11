/**
 * Authentication Hook and Context Provider
 * 
 * This module provides comprehensive authentication functionality for the platform.
 * It manages user sessions, profiles, and role-based redirections using Supabase Auth.
 * 
 * Features:
 * - User authentication (sign in, sign up, sign out)
 * - Session management with automatic refresh
 * - User profile fetching and caching
 * - Role-based route protection and redirection
 * - Real-time auth state changes
 * - Error handling with user-friendly messages
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserProfile, AuthResponse } from '@/types/common';
import { logError, logInfo } from '@/lib/logger';

/**
 * Authentication Context Type Definition
 * 
 * Defines the shape of the authentication context that will be provided
 * to all child components throughout the application.
 */
interface AuthContextType {
  user: User | null;                    // Current authenticated user from Supabase
  session: Session | null;              // Current session information
  userProfile: UserProfile | null;     // Extended user profile with role and school info
  loading: boolean;                     // Loading state for auth operations
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * 
 * Provides authentication state and methods to all child components.
 * Handles session management, user profile fetching, and role-based redirections.
 * 
 * @param children - Child components that will have access to auth context
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Core authentication state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Role-based Redirection Logic
   * 
   * Simplified redirection logic that only handles basic authenticated user redirects.
   * Security checks for role-based access are handled in the signIn function.
   * 
   * @param profile - User profile containing role information
   */
  const redirectBasedOnRole = (profile: UserProfile | null) => {
    if (!profile) return;
    
    const currentPath = window.location.pathname;
    
    // Only redirect authenticated users away from auth pages to dashboard
    // Role-specific security is handled in signIn function
    if (['/auth', '/super-admin-auth'].includes(currentPath)) {
      window.location.href = '/dashboard';
    }
  };

  useEffect(() => {
    /**
     * Authentication State Change Listener
     * 
     * Listens for authentication state changes (sign in, sign out, token refresh)
     * and updates the local state accordingly. Also fetches user profile information
     * and handles role-based redirections.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile with school information
          // Using setTimeout to avoid blocking the auth state change
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*, schools(name, plan)')
                .eq('user_id', session.user.id)
                .single();
              setUserProfile(profile as UserProfile);
              
              // Handle role-based redirections after profile is loaded
              redirectBasedOnRole(profile as UserProfile);
            } catch (error) {
              logError('Error fetching user profile', error as Error);
            }
          }, 0);
        } else {
          // Clear profile when user signs out
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);


  
  /**
   * User Registration Function (INTERNAL USE ONLY)
   * 
   * Creates a new user account with email verification.
   * This function is kept for internal administrative use only.
   * It should NOT be exposed through the public context.
   * 
   * Only authorized administrators can create accounts through
   * dedicated management systems (UserManagement, TeacherManagement, etc.)
   * 
   * @param email - User's email address
   * @param password - User's password
   * @param fullName - User's full name for profile creation
   * @returns Promise with error information if registration fails
   */
  const signUp = async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName // This will be used to create the user profile
        }
      }
    });

    // Handle registration result with user feedback
    if (error) {
      toast({
        title: "خطأ في التسجيل",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم إنشاء الحساب",
        description: "تم إرسال رابط تأكيد البريد الإلكتروني",
      });
    }

    return { error };
  };

  /**
   * User Sign In Function
   * 
   * Authenticates a user with email and password.
   * Includes robust security checks to prevent unauthorized role-based access.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with error information if sign in fails
   */
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const currentPath = window.location.pathname;
    
    try {
      // First, attempt to sign in to get user data
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Critical security check: Verify user role immediately after login
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (profileError) {
          // If we can't get profile, sign out immediately for security
          await supabase.auth.signOut();
          logError('Critical: Cannot verify user role during sign in', profileError);
          toast({
            title: "خطأ أمني",
            description: "لا يمكن التحقق من صلاحيات الحساب",
            variant: "destructive",
          });
          return { error: { message: "Profile verification failed" } as any };
        }

        // SECURITY BARRIER: Prevent superadmin from accessing regular auth page
        if (profile?.role === 'superadmin' && currentPath === '/auth') {
          // Immediate sign out with no delays
          await supabase.auth.signOut();
          
          toast({
            title: "منع دخول أمني",
            description: "مدير النظام العليا يجب أن يدخل من اللوحة المخصصة له",
            variant: "destructive",
          });
          
          // Immediate redirect without delay to prevent any state persistence
          window.location.replace('/super-admin-auth');
          return { error: { message: "Superadmin access blocked from regular auth" } as any };
        }
        
        // SECURITY BARRIER: Prevent regular users from accessing superadmin auth page
        if (profile?.role !== 'superadmin' && currentPath === '/super-admin-auth') {
          // Immediate sign out with no delays
          await supabase.auth.signOut();
          
          toast({
            title: "منع دخول أمني", 
            description: "هذه اللوحة حصرية لمدراء النظام العليا فقط",
            variant: "destructive",
          });
          
          // Immediate redirect without delay
          window.location.replace('/auth');
          return { error: { message: "Regular user access blocked from superadmin auth" } as any };
        }
      }

      // If all security checks pass, allow the sign in
      toast({
        title: "مرحباً",
        description: "تم تسجيل الدخول بنجاح",
      });

      return { error: null };
      
    } catch (criticalError) {
      // Critical error handling - sign out immediately
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        logError('Failed to sign out after critical error', signOutError as Error);
      }
      
      logError('Critical error during sign in process', criticalError as Error);
      toast({
        title: "خطأ حرج",
        description: "حدث خطأ أمني أثناء تسجيل الدخول",
        variant: "destructive",
      });
      
      return { error: { message: "Critical sign in error" } as any };
    }
  };

  /**
   * User Sign Out Function
   * 
   * Signs out the current user and clears all authentication state.
   * Automatically redirects to the authentication page after successful logout.
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    // Handle sign out result with user feedback
    if (error) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم تسجيل الخروج",
        description: "نراك قريباً",
      });
      // Automatic redirection after successful logout
      window.location.href = '/auth';
    }
  };

  // Provide authentication context to all child components
  // Note: signUp is intentionally NOT included in the context for security reasons
  // Account creation is handled through authorized administrative systems only
  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      userProfile, 
      loading, 
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Authentication Hook
 * 
 * Custom hook to access authentication context in components.
 * Must be used within an AuthProvider component tree.
 * 
 * @returns AuthContextType - Authentication context with user data and methods
 * @throws Error if used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}