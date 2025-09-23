import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Eye, EyeOff, Shield, Lock, Users, GraduationCap } from 'lucide-react';
const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const {
    signIn,
    user
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn(loginData.email, loginData.password);
    setLoading(false);
  };
  return <div className="min-h-screen creative-background flex items-center justify-center p-6" dir="rtl">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Light Orbs */}
        <div className="light-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
          <div className="orb orb-4"></div>
          <div className="orb orb-5"></div>
        </div>
        
        {/* Security Icons Background */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute top-20 right-20 animate-float">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div className="absolute top-40 left-32 animate-float" style={{
          animationDelay: '2s'
        }}>
            <Lock className="h-6 w-6 text-secondary" />
          </div>
          <div className="absolute bottom-32 right-40 animate-float" style={{
          animationDelay: '4s'
        }}>
            <Users className="h-7 w-7 text-primary" />
          </div>
          <div className="absolute bottom-20 left-20 animate-float" style={{
          animationDelay: '6s'
        }}>
            <GraduationCap className="h-8 w-8 text-secondary" />
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <Card className="w-full max-w-md modern-card relative z-10 animate-scale-in overflow-hidden">

        <CardHeader className="text-center pb-6 pt-12">
          <div className="w-24 h-24 mx-auto mb-6 gradient-blue rounded-full flex items-center justify-center shadow-lg">
            <BookOpen className="h-12 w-12 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold font-cairo mb-2 text-foreground text-center">
            مرحباً بك
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mb-2 text-center">
            دخول المستخدمين - منصة التعليم الذكية
          </CardDescription>
          
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              {/* Email Field */}
              <div>
                <Label htmlFor="login-email" className="font-cairo text-base text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  البريد الإلكتروني
                </Label>
                <Input id="login-email" type="email" value={loginData.email} onChange={e => setLoginData(prev => ({
                ...prev,
                email: e.target.value
              }))} required className="mt-2 h-12 text-lg bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary ltr-content transition-all duration-300 focus:shadow-lg" placeholder="أدخل بريدك الإلكتروني" dir="ltr" />
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="login-password" className="font-cairo text-base text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input id="login-password" type={showPassword ? "text" : "password"} value={loginData.password} onChange={e => setLoginData(prev => ({
                  ...prev,
                  password: e.target.value
                }))} required className="mt-2 h-12 text-lg bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary ltr-content transition-all duration-300 focus:shadow-lg pl-12" placeholder="أدخل كلمة المرور" dir="ltr" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 transform -translate-y-1/2 mt-1 text-muted-foreground hover:text-foreground transition-colors duration-200">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <Button type="submit" className="w-full gradient-blue hover:shadow-lg text-white h-12 text-lg font-cairo rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70" disabled={loading}>
              {loading ? <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  جاري تسجيل الدخول...
                </div> : <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  دخول آمن
                </div>}
            </Button>
          </form>

          {/* Footer Info */}
          <div className="text-center pt-4 border-t border-border/30">
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground/50">
              <Lock className="h-3 w-3" />
              <span>محمي بأعلى معايير 
                <button 
                  onClick={() => navigate('/superadmin-auth')} 
                  className="hover:text-muted-foreground/70 transition-colors duration-200"
                >
                  الأمان
                </button>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;