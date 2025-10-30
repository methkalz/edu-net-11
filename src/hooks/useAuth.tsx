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
import { sessionMonitor } from '@/lib/auth/session-monitor';
import { authErrorHandler } from '@/lib/error-handling/handlers/auth-error-handler';
import { useImpersonation } from './useImpersonation.ts';

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
  refreshProfile: () => Promise<void>;  // Function to refresh user profile
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
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { isImpersonating, getEffectiveUser, getEffectiveUserProfile } = useImpersonation();

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

  // Handle PIN login and magic link authentication
  useEffect(() => {
    const handleAuthentication = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Handle magic link authentication with admin access parameters
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const adminAccess = urlParams.get('admin_access');
      const pinLogin = urlParams.get('pin_login');

      if (accessToken && refreshToken && (adminAccess || pinLogin)) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (!error) {
            // Clean the URL but keep admin access parameters
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('access_token');
            cleanUrl.searchParams.delete('refresh_token');
            cleanUrl.searchParams.delete('type');
            
            // Keep admin access indicators
            if (adminAccess) cleanUrl.searchParams.set('admin_access', 'true');
            if (pinLogin) cleanUrl.searchParams.set('pin_login', 'true');
            
            window.history.replaceState({}, '', cleanUrl.toString());
            
            toast({
              title: "تم تسجيل الدخول بنجاح",
              description: "تم الدخول بصلاحيات إدارية مؤقتة",
            });
            
            // Refresh to ensure proper session loading
            setTimeout(() => window.location.reload(), 500);
          }
        } catch (error) {
          console.error('Session setting error:', error);
        }
      }
    };

    handleAuthentication();
  }, []);

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
        // Don't process auth changes during manual logout
        if (isSigningOut || localStorage.getItem('logout_in_progress')) {
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && event !== 'SIGNED_OUT') {
          // بدء مراقبة الجلسة عند تسجيل الدخول
          sessionMonitor.startMonitoring();
          
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
          // إيقاف مراقبة الجلسة عند تسجيل الخروج
          sessionMonitor.stopMonitoring();
          
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
      
      // بدء المراقبة إذا كانت هناك جلسة نشطة
      if (session?.user) {
        sessionMonitor.startMonitoring();
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
      sessionMonitor.stopMonitoring();
    };
  }, [isSigningOut]);


  
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
   * Records login timestamp for tracking purposes.
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
          
          // Show generic error message to hide super admin existence
          toast({
            title: "خطأ في تسجيل الدخول",
            description: "بيانات الدخول غير صحيحة",
            variant: "destructive",
          });
          
          // Return generic error without revealing super admin information
          return { error: { message: "Invalid credentials" } as any };
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


        // تحديث login_count و last_login_at مباشرة
        console.log('🔵 Starting login tracking for user:', data.user.id);
        try {
          const now = new Date().toISOString();
          
          // جلب login_count الحالي
          console.log('🔵 Fetching current profile...');
          const { data: currentProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('login_count')
            .eq('user_id', data.user.id)
            .single();
          
          if (fetchError) {
            console.error('🔴 Error fetching profile:', fetchError);
            logError('Error fetching profile', fetchError);
          }
          
          console.log('🔵 Current profile:', currentProfile);
          const newLoginCount = (currentProfile?.login_count || 0) + 1;
          console.log('🔵 New login count will be:', newLoginCount);
          
          // تحديث البيانات
          console.log('🔵 Updating profile with:', { last_login_at: now, login_count: newLoginCount });
          const { data: updateData, error: updateError } = await supabase
            .from('profiles')
            .update({
              last_login_at: now,
              login_count: newLoginCount
            })
            .eq('user_id', data.user.id)
            .select();
          
          if (updateError) {
            console.error('🔴 Error updating login count:', updateError);
            logError('Error updating login count', updateError);
          } else {
            console.log('✅ Login tracked successfully!', { 
              userId: data.user.id, 
              loginCount: newLoginCount,
              updateData 
            });
            logInfo('Login tracked successfully', { 
              userId: data.user.id, 
              loginCount: newLoginCount 
            });
          }
          
          // تسجيل في audit log
          setTimeout(async () => {
            try {
              const { auditLogger, AUDIT_ACTIONS, AUDIT_ENTITIES } = await import('@/lib/audit');
              await auditLogger.log({
                action: AUDIT_ACTIONS.USER_LOGIN,
                entity: AUDIT_ENTITIES.USER,
                entity_id: data.user.id,
                actor_user_id: data.user.id,
                payload_json: {
                  timestamp: now,
                  method: 'password_login',
                  login_count: newLoginCount
                }
              });
            } catch (auditError) {
              console.error('🔴 Error logging audit entry:', auditError);
              logError('Error logging audit entry', auditError as Error);
            }
          }, 0);
        } catch (loginTrackingError) {
          console.error('🔴 Error tracking login:', loginTrackingError);
          logError('Error tracking login', loginTrackingError as Error);
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
   * Handles expired/missing sessions gracefully.
   */
  const signOut = async () => {
    try {
      // Prevent multiple simultaneous sign out attempts
      if (isSigningOut) return;
      setIsSigningOut(true);
      
      // Mark logout in progress to prevent auto-redirect
      localStorage.setItem('logout_in_progress', 'true');
      
      // Clear local state immediately to prevent UI confusion
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      // Try to sign out from Supabase (but don't depend on it)
      try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          // استخدام معالج الأخطاء المتخصص
          authErrorHandler.handleLogoutError(error, { 
            component: 'useAuth',
            action: 'manual_logout' 
          });
          return; // لا نحتاج للمتابعة، معالج الأخطاء سيتولى الأمر
        }
      } catch (supabaseError) {
        // استخدام معالج الأخطاء المتخصص
        authErrorHandler.handleLogoutError(supabaseError, {
          component: 'useAuth', 
          action: 'manual_logout',
          type: 'supabase_exception'
        });
        return;
      }
      
      // إذا نجح تسجيل الخروج، قم بالتنظيف العادي
      try {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        
        // Clear any persistent session data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('session')) {
            localStorage.removeItem(key);
          }
        });
      } catch (storageError) {
        console.warn('Storage clearing error:', storageError);
      }
      
      // Show success message
      toast({
        title: "تم تسجيل الخروج",
        description: "نراك قريباً",
      });
      
      // Small delay then redirect
      setTimeout(() => {
        localStorage.removeItem('logout_in_progress');
        setIsSigningOut(false);
        window.location.href = '/auth';
      }, 500);
      
    } catch (criticalError) {
      console.error('Critical error during sign out:', criticalError);
      
      // استخدام معالج الأخطاء المتخصص للحالات الطارئة
      authErrorHandler.handleLogoutError(criticalError, {
        component: 'useAuth',
        action: 'manual_logout', 
        type: 'critical_error'
      });
    }
  };

  /**
   * Refresh User Profile Function
   * 
   * Manually refreshes the current user's profile data from the database.
   * Useful for updating the UI after profile changes like avatar updates.
   */
  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, schools(name, plan)')
        .eq('user_id', user.id)
        .single();
        
      if (!error && profile) {
        setUserProfile(profile as UserProfile);
      }
    } catch (error) {
      logError('Error refreshing user profile', error as Error);
    }
  };

  // Provide authentication context to all child components
  // Note: signUp is intentionally NOT included in the context for security reasons
  // Account creation is handled through authorized administrative systems only
  // Get effective user and profile based on impersonation status
  const effectiveUser = isImpersonating ? getEffectiveUser() : user;
  const effectiveUserProfile = isImpersonating ? getEffectiveUserProfile() : userProfile;

  return (
    <AuthContext.Provider value={{ 
      user: effectiveUser as User, 
      session, 
      userProfile: effectiveUserProfile, 
      loading: loading || isSigningOut, 
      signIn, 
      signOut,
      refreshProfile
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