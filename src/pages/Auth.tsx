import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', fullName: '' });
  const { signIn, signUp, user } = useAuth();
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signUp(signupData.email, signupData.password, signupData.fullName);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-6" dir="rtl">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border shadow-lg relative z-10 animate-scale-in">
        <CardHeader className="text-center pb-6">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-primary-light rounded-3xl flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold font-cairo mb-2 text-foreground">
            مرحباً بك
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">ادخل إلى منصة التعليم الذكية</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-cairo">
                تسجيل الدخول
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground font-cairo">
                إنشاء حساب
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-6 animate-fade-in">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="font-cairo text-base text-foreground">البريد الإلكتروني</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="mt-2 h-12 text-lg bg-background border-input focus:border-primary ltr-content"
                      placeholder="أدخل بريدك الإلكتروني"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="font-cairo text-base text-foreground">كلمة المرور</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="mt-2 h-12 text-lg bg-background border-input focus:border-primary ltr-content"
                      placeholder="أدخل كلمة المرور"
                      dir="ltr"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-cairo rounded-xl transition-all" disabled={loading}>
                  {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-6 animate-fade-in">
              <form onSubmit={handleSignup} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name" className="font-cairo text-base text-foreground">الاسم الكامل</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                      className="mt-2 h-12 text-lg bg-background border-input focus:border-secondary"
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email" className="font-cairo text-base text-foreground">البريد الإلكتروني</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="mt-2 h-12 text-lg bg-background border-input focus:border-secondary ltr-content"
                      placeholder="أدخل بريدك الإلكتروني"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="font-cairo text-base text-foreground">كلمة المرور</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="mt-2 h-12 text-lg bg-background border-input focus:border-secondary ltr-content"
                      placeholder="أدخل كلمة مرور قوية"
                      dir="ltr"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground h-12 text-lg font-cairo rounded-xl transition-all" disabled={loading}>
                  {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;