import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff, KeyRound } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Supabase places recovery tokens in the URL hash and the SDK auto-parses them,
    // firing a PASSWORD_RECOVERY event. We wait for that to know the session is ready.
    const hash = window.location.hash || '';
    const isRecovery = hash.includes('type=recovery');

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });

    // Fallback: if user already has an active session (e.g. returning), allow reset
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    if (!isRecovery) {
      // Give the SDK a moment; if still no session, show a helpful message
      setTimeout(() => {
        supabase.auth.getSession().then(({ data }) => {
          if (!data.session) {
            toast({
              title: 'رابط غير صالح',
              description: 'الرابط منتهي الصلاحية أو غير صحيح. يرجى طلب رابط جديد.',
              variant: 'destructive',
            });
          }
        });
      }, 1500);
    }

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: 'كلمة مرور قصيرة', description: 'يجب ألا تقل عن 8 أحرف', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'عدم تطابق', description: 'كلمتا المرور غير متطابقتين', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم', description: 'تم تحديث كلمة المرور بنجاح' });
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6" dir="rtl">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <KeyRound className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">إعادة تعيين كلمة المرور</CardTitle>
          <CardDescription className="text-slate-300">
            أدخل كلمة المرور الجديدة الخاصة بك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="pwd" className="text-slate-200">كلمة المرور الجديدة</Label>
              <div className="relative mt-2">
                <Input
                  id="pwd"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={!ready}
                  className="h-11 bg-slate-700/50 border-slate-600 text-white pr-12"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm" className="text-slate-200">تأكيد كلمة المرور</Label>
              <Input
                id="confirm"
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                disabled={!ready}
                className="h-11 mt-2 bg-slate-700/50 border-slate-600 text-white"
                dir="ltr"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !ready}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {loading ? 'جاري الحفظ...' : ready ? 'حفظ كلمة المرور' : 'جاري التحقق من الرابط...'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="w-full text-slate-400"
            >
              العودة لتسجيل الدخول
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
