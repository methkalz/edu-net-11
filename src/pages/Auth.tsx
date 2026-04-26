import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { AuthErrorHandler } from '@/components/auth/AuthErrorHandler';
import { BookOpen, Eye, EyeOff, Shield, Lock, Mail, GraduationCap, Sparkles, PenLine } from 'lucide-react';
import { sessionMonitor } from '@/lib/auth/session-monitor';

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [mounted, setMounted] = useState(false);

  const { user } = useAuth();
  const {
    enhancedSignIn,
    retrySignIn,
    authError,
    loading,
    clearError,
  } = useEnhancedAuth({ maxRetries: 3, retryDelay: 1000, timeoutMs: 15000 });

  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const logoutInProgress = localStorage.getItem('logout_in_progress');
    const recentLogout = localStorage.getItem('recent_manual_logout');

    if (user && !logoutInProgress && !recentLogout) {
      navigate('/dashboard');
    }

    if (recentLogout) {
      setTimeout(() => {
        localStorage.removeItem('recent_manual_logout');
      }, 2000);
    }

    sessionMonitor.stopMonitoring();

    const cleanupInvalidSession = async () => {
      const isInvalid = await sessionMonitor.isInvalidSessionState();
      if (isInvalid) {
        localStorage.removeItem('logout_in_progress');
        localStorage.removeItem('recent_manual_logout');
      }
    };

    cleanupInvalidSession();
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const result = await enhancedSignIn(loginData.email, loginData.password);
    if (result.success) return;
  };

  const handleRetry = () => {
    handleLogin({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden" dir="rtl">
      {/* خلفية متدرجة متحركة */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950" />

      {/* أشكال هندسية عائمة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="auth-floating-shape auth-shape-1" />
        <div className="auth-floating-shape auth-shape-2" />
        <div className="auth-floating-shape auth-shape-3" />
        <div className="auth-floating-shape auth-shape-4" />
        <div className="auth-floating-shape auth-shape-5" />
      </div>

      {/* شبكة نقاط خفيفة */}
      <div className="absolute inset-0 auth-dot-grid" />

      {/* المحتوى الرئيسي */}
      <div className={`relative z-10 w-full max-w-[440px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* أيقونات تعليمية عائمة فوق الكارد */}
        <div className="relative h-20 mb-2">
          <div className="auth-edu-icon auth-edu-icon-1">
            <GraduationCap className="h-5 w-5 text-blue-500/60" />
          </div>
          <div className="auth-edu-icon auth-edu-icon-2">
            <PenLine className="h-4 w-4 text-indigo-500/60" />
          </div>
          <div className="auth-edu-icon auth-edu-icon-3">
            <Sparkles className="h-4 w-4 text-purple-500/60" />
          </div>
        </div>

        {/* الكارد الرئيسي */}
        <div className="auth-card rounded-2xl p-8 pb-6">
          {/* الهيدر */}
          <div className="text-center mb-8">
            <div className={`auth-logo-ring mx-auto mb-5 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
              <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <BookOpen className="h-9 w-9 text-white" />
              </div>
            </div>
            <h1 className={`text-2xl font-bold text-foreground mb-1.5 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              مرحباً بك
            </h1>
            <p className={`text-sm text-muted-foreground transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              سجّل دخولك إلى منصة التعليم الذكية
            </p>
          </div>

          {/* الفورم */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className={`space-y-4 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* البريد الإلكتروني */}
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  البريد الإلكتروني
                </Label>
                <div className="relative group">
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={e => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="h-11 bg-muted/40 border-border/40 focus:border-blue-500 focus:bg-background focus:ring-2 focus:ring-blue-500/10 transition-all duration-300 rounded-xl pl-4 pr-4"
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-indigo-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-indigo-500/5 pointer-events-none transition-all duration-500" />
                </div>
              </div>

              {/* كلمة المرور */}
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-blue-500" />
                  كلمة المرور
                </Label>
                <div className="relative group">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={e => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className="h-11 bg-muted/40 border-border/40 focus:border-blue-500 focus:bg-background focus:ring-2 focus:ring-blue-500/10 transition-all duration-300 rounded-xl pl-11 pr-4"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors duration-200 p-0.5"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-indigo-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-indigo-500/5 pointer-events-none transition-all duration-500" />
                </div>
              </div>
            </div>

            {/* الأخطاء */}
            {authError && (
              <AuthErrorHandler
                error={authError}
                onRetry={handleRetry}
                loading={loading}
              />
            )}

            {/* زر الدخول */}
            <div className={`transition-all duration-700 delay-[600ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري تسجيل الدخول...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    تسجيل الدخول
                  </div>
                )}
              </Button>
            </div>
          </form>

          {/* الفوتر */}
          <div className={`mt-6 pt-4 border-t border-border/20 transition-all duration-700 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/40">
              <Lock className="h-3 w-3" />
              <button
                onClick={() => navigate('/super-admin-auth')}
                className="hover:text-muted-foreground/60 transition-colors duration-200"
              >
                محمي بأعلى معايير الأمان
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
