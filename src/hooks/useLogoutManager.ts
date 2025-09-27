/**
 * Logout Manager Hook
 * 
 * يدير حالة تسجيل الخروج ويمنع الحلقات اللا نهائية
 * ويضمن تنظيف جميع البيانات المحلية بشكل صحيح
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LogoutManagerState {
  isLoggingOut: boolean;
  logoutAttempts: number;
  lastLogoutTime: number | null;
}

export const useLogoutManager = () => {
  const [state, setState] = useState<LogoutManagerState>({
    isLoggingOut: false,
    logoutAttempts: 0,
    lastLogoutTime: null
  });

  // تنظيف شامل للبيانات المحلية
  const forceLocalCleanup = useCallback(() => {
    try {
      // تنظيف localStorage
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('session') ||
        key.includes('token')
      );
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // تنظيف sessionStorage
      sessionStorage.clear();
      
      // إضافة علامة التنظيف
      localStorage.setItem('recent_manual_logout', Date.now().toString());
      
    } catch (error) {
      console.warn('Error during local cleanup:', error);
    }
  }, []);

  // فحص ما إذا كان يجب منع محاولة تسجيل الخروج
  const shouldPreventLogout = useCallback(() => {
    const now = Date.now();
    const timeSinceLastLogout = state.lastLogoutTime ? now - state.lastLogoutTime : Infinity;
    
    // منع المحاولات المتكررة خلال 3 ثواني
    if (timeSinceLastLogout < 3000) {
      return true;
    }
    
    // منع أكثر من 5 محاولات في الدقيقة
    if (state.logoutAttempts >= 5) {
      return true;
    }
    
    return false;
  }, [state.lastLogoutTime, state.logoutAttempts]);

  // تنفيذ تسجيل خروج آمن
  const safeLogout = useCallback(async (): Promise<boolean> => {
    if (shouldPreventLogout() || state.isLoggingOut) {
      return false;
    }

    setState(prev => ({
      ...prev,
      isLoggingOut: true,
      logoutAttempts: prev.logoutAttempts + 1,
      lastLogoutTime: Date.now()
    }));

    try {
      // محاولة تسجيل الخروج من Supabase مع timeout
      const logoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      );

      await Promise.race([logoutPromise, timeoutPromise]);
      
    } catch (error) {
      console.warn('Supabase logout failed, proceeding with local cleanup:', error);
    }

    // تنظيف محلي في جميع الأحوال
    forceLocalCleanup();
    
    setState(prev => ({
      ...prev,
      isLoggingOut: false
    }));

    return true;
  }, [shouldPreventLogout, state.isLoggingOut, forceLocalCleanup]);

  // إعادة تعيين حالة محاولات تسجيل الخروج
  const resetLogoutAttempts = useCallback(() => {
    setState(prev => ({
      ...prev,
      logoutAttempts: 0
    }));
  }, []);

  // فحص ما إذا كان تسجيل الخروج يتم حالياً
  const isLogoutInProgress = useCallback(() => {
    return Boolean(localStorage.getItem('logout_in_progress')) || state.isLoggingOut;
  }, [state.isLoggingOut]);

  return {
    isLoggingOut: state.isLoggingOut,
    logoutAttempts: state.logoutAttempts,
    safeLogout,
    resetLogoutAttempts,
    forceLocalCleanup,
    isLogoutInProgress,
    shouldPreventLogout
  };
};