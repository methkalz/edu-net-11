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
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResponse>;
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
   * User Registration Function
   * 
   * Creates a new user account with email verification.
   * Sends a confirmation email with a redirect URL back to the homepage.
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
   * The auth state change listener will handle profile fetching and redirections.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with error information if sign in fails
   */
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle sign in result with user feedback
    if (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "مرحباً",
        description: "تم تسجيل الدخول بنجاح",
      });
    }

    return { error };
  };

  /**
   * User Sign Out Function
   * 
   * Signs out the current user and clears all authentication state.
   * The auth state change listener will handle cleanup and redirections.
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
    }
  };

  // Provide authentication context to all child components
  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      userProfile, 
      loading, 
      signIn, 
      signUp, 
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