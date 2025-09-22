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
   * Automatically redirects users based on their role and current location.
   * Ensures users are on the correct authentication pages and prevents
   * unauthorized access to admin areas.
   * 
   * @param profile - User profile containing role information
   */
  const redirectBasedOnRole = (profile: UserProfile | null) => {
    if (!profile) return;
    
    const currentPath = window.location.pathname;
    
    // Prevent non-superadmins from accessing super admin auth page
    if (currentPath === '/super-admin-auth' && profile.role !== 'superadmin') {
      window.location.href = '/auth';
      return;
    }
    
    // Redirect superadmins to their dedicated auth page
    if (currentPath === '/auth' && profile.role === 'superadmin') {
      window.location.href = '/super-admin-auth';
      return;
    }
    
    // Redirect authenticated users away from auth pages to dashboard
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
   * Includes security check to prevent superadmins from signing in from regular auth page.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with error information if sign in fails
   */
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
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

    // If sign in successful, check user role for security
    if (data.user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        const currentPath = window.location.pathname;
        
        // Security check: Prevent superadmin from signing in from regular auth page
        if (profile?.role === 'superadmin' && currentPath === '/auth') {
          // Sign out immediately to prevent unauthorized access
          await supabase.auth.signOut();
          
          toast({
            title: "وصول غير مسموح",
            description: "السوبر آدمن يجب أن يسجل الدخول من لوحته الخاصة",
            variant: "destructive",
          });
          
          // Redirect to superadmin auth page
          setTimeout(() => {
            window.location.href = '/super-admin-auth';
          }, 1500);
          
          return { error: { message: "Unauthorized access for superadmin" } as any };
        }
        
        // Security check: Prevent regular users from accessing superadmin auth page
        if (profile?.role !== 'superadmin' && currentPath === '/super-admin-auth') {
          // Sign out immediately
          await supabase.auth.signOut();
          
          toast({
            title: "وصول غير مسموح",
            description: "هذه اللوحة مخصصة للسوبر آدمن فقط",
            variant: "destructive",
          });
          
          // Redirect to regular auth page
          setTimeout(() => {
            window.location.href = '/auth';
          }, 1500);
          
          return { error: { message: "Unauthorized access for regular user" } as any };
        }
        
      } catch (profileError) {
        logError('Error checking user role during sign in', profileError as Error);
        // Sign out if we can't verify the role
        await supabase.auth.signOut();
        toast({
          title: "خطأ في التحقق",
          description: "حدث خطأ في التحقق من صلاحيات المستخدم",
          variant: "destructive",
        });
        return { error: { message: "Profile verification failed" } as any };
      }
    }

    // If all security checks pass, allow the sign in
    toast({
      title: "مرحباً",
      description: "تم تسجيل الدخول بنجاح",
    });

    return { error: null };
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