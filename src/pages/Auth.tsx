import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { AuthErrorHandler } from '@/components/auth/AuthErrorHandler';
import {
  BookOpen, Eye, EyeOff, LogIn, Lock, Mail,
  GraduationCap, Lightbulb, BarChart3, Rocket,
} from 'lucide-react';
import { sessionMonitor } from '@/lib/auth/session-monitor';

const features = [
  { icon: Lightbulb, title: 'مسارات تعليمية ذكية', desc: 'محتوى مخصص لكل طالب حسب مستواه' },
  { icon: BarChart3, title: 'متابعة مستمرة', desc: 'تقارير أداء لحظية للطلاب والمعلمين' },
  { icon: Rocket, title: 'نتائج فورية', desc: 'تصحيح تلقائي وتحليل ذكي للإجابات' },
];

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { user } = useAuth();
  const {
    enhancedSignIn,
    authError,
    loading,
    clearError,
  } = useEnhancedAuth({ maxRetries: 3, retryDelay: 1000, timeoutMs: 15000 });

  const navigate = useNavigate();

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    const logoutInProgress = localStorage.getItem('logout_in_progress');
    const recentLogout = localStorage.getItem('recent_manual_logout');

    if (user && !logoutInProgress && !recentLogout) {
      navigate('/dashboard');
    }

    if (recentLogout) {
      setTimeout(() => localStorage.removeItem('recent_manual_logout'), 2000);
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
    await enhancedSignIn(loginData.email, loginData.password);
  };

  const handleRetry = () => {
    handleLogin({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" dir="rtl">

      {/* ===== الجانب الأيمن — البراندينج ===== */}
      <div className="auth-brand-panel relative lg:w-[58%] flex flex-col justify-center overflow-hidden">
        {/* الأشكال الهندسية العائمة */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
          <div className="auth-orb auth-orb-3" />
          <div className="auth-grid-overlay" />
        </div>

        {/* المحتوى */}
        <div className="relative z-10 px-8 py-12 lg:px-16 lg:py-0">
          {/* اللوجو */}
          <div className={`flex items-center gap-3 mb-10 lg:mb-14 transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-white/90 font-bold text-lg">EduNet</span>
          </div>

          {/* العنوان الرئيسي */}
          <div className={`mb-10 lg:mb-14 transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <h1 className="text-3xl lg:text-[2.75rem] font-bold text-white leading-tight mb-4">
              منصة التعليم
              <br />
              <span className="auth-text-gradient">الذكية</span>
            </h1>
            <p className="text-white/50 text-base lg:text-lg max-w-md leading-relaxed">
              بيئة تعليمية متكاملة تجمع بين التكنولوجيا والتعليم لتحقيق أفضل النتائج
            </p>
          </div>

          {/* نقاط الميزات */}
          <div className="space-y-5 hidden lg:block">
            {features.map((feat, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
                style={{ transitionDelay: `${350 + i * 120}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/5 shrink-0 mt-0.5">
                  <feat.icon className="h-5 w-5 text-sky-300" />
                </div>
                <div>
                  <h3 className="text-white/90 font-semibold text-[15px] mb-0.5">{feat.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* تذييل البراندينج */}
        <div className={`relative z-10 px-8 lg:px-16 pb-8 lg:pb-10 mt-auto transition-all duration-700 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-3 text-white/25 text-xs">
            <GraduationCap className="h-4 w-4" />
            <span>نظام تعليمي متطور لجميع المراحل</span>
          </div>
        </div>
      </div>

      {/* ===== الجانب الأيسر — نموذج الدخول ===== */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-10 lg:px-12">
        <div className={`w-full max-w-[380px] transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

          {/* ترحيب */}
          <div className="mb-9">
            <h2 className={`text-2xl font-bold text-foreground mb-2 transition-all duration-500 delay-400 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              مرحباً بعودتك
            </h2>
            <p className={`text-muted-foreground text-sm transition-all duration-500 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              سجّل دخولك للمتابعة إلى لوحة التحكم
            </p>
          </div>

          {/* النموذج */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* البريد الإلكتروني */}
            <div className={`transition-all duration-500 delay-[550ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-2">
                البريد الإلكتروني
              </label>
              <div className={`auth-input-wrapper ${focusedField === 'email' ? 'auth-input-active' : ''}`}>
                <Mail className="auth-input-icon" />
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={e => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="auth-input"
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div className={`transition-all duration-500 delay-[650ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-2">
                كلمة المرور
              </label>
              <div className={`auth-input-wrapper ${focusedField === 'password' ? 'auth-input-active' : ''}`}>
                <Lock className="auth-input-icon" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={e => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="auth-input !pl-10"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* الأخطاء */}
            {authError && (
              <AuthErrorHandler error={authError} onRetry={handleRetry} loading={loading} />
            )}

            {/* زر الدخول */}
            <div className={`pt-1 transition-all duration-500 delay-[750ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Button
                type="submit"
                disabled={loading}
                className="auth-submit-btn w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2.5">
                    <span className="auth-spinner" />
                    جاري الدخول...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    تسجيل الدخول
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* الفوتر */}
          <div className={`mt-10 pt-6 border-t border-border/30 transition-all duration-500 delay-[850ms] ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/35">
              <Lock className="h-3 w-3" />
              <button
                onClick={() => navigate('/super-admin-auth')}
                className="hover:text-muted-foreground/50 transition-colors"
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
