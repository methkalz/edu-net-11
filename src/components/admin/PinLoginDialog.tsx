import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, Shield, User, Copy, ExternalLink, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PinLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: {
    user_id: string;
    full_name: string;
    role: string;
    email: string;
  } | null;
}

export const PinLoginDialog: React.FC<PinLoginDialogProps> = ({
  open,
  onOpenChange,
  targetUser
}) => {
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [pinExpiresAt, setPinExpiresAt] = useState<string | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const { toast } = useToast();

  // Real-time countdown
  useEffect(() => {
    if (!pinExpiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(pinExpiresAt);
      const diff = expires.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('منتهي الصلاحية');
        setGeneratedPin(null);
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [pinExpiresAt]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setGeneratedPin(null);
      setPinExpiresAt(null);
      setEnteredPin('');
      setTimeRemaining('');
    }
  }, [open]);

  const generatePin = async () => {
    if (!targetUser) return;

    setIsGeneratingPin(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-access-pin', {
        body: { targetUserId: targetUser.user_id }
      });

      if (error) throw error;

      setGeneratedPin(data.pin);
      setPinExpiresAt(data.expiresAt);
      
      toast({
        title: "تم إنشاء رمز PIN بنجاح",
        description: `الرمز صالح لمدة 15 دقيقة`,
      });
    } catch (error) {
      console.error('Error generating PIN:', error);
      toast({
        title: "خطأ في إنشاء رمز PIN",
        description: "حدث خطأ أثناء إنشاء رمز الدخول",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPin(false);
    }
  };

  const copyPin = () => {
    if (generatedPin) {
      navigator.clipboard.writeText(generatedPin);
      toast({
        title: "تم نسخ الرمز",
        description: "تم نسخ رمز PIN إلى الحافظة",
      });
    }
  };

  const loginWithPin = async () => {
    if (!enteredPin || enteredPin.length !== 6) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم PIN صحيح مكون من 6 أرقام",
        variant: "destructive",
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      console.log('Starting PIN login process...');
      
      const { data, error } = await supabase.functions.invoke('login-with-pin', {
        body: { pinCode: enteredPin }
      });

      console.log('PIN login response:', data);

      if (error) {
        throw new Error(`خطأ في الخادم: ${error.message}`);
      }

      if (data?.success && data?.magicLink) {
        console.log('PIN validated, redirecting to magic link...');
        
        toast({
          title: "تم التحقق من الرمز بنجاح",
          description: `جاري تسجيل الدخول كـ: ${data.targetUser?.name}`,
        });

        // Redirect to magic link in same window
        window.location.href = data.magicLink;
        
      } else {
        throw new Error(data?.error || 'فشل في التحقق من الرمز');
      }
    } catch (error: any) {
      console.error('PIN login error:', error);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "حدث خطأ أثناء محاولة تسجيل الدخول",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const isExpired = timeRemaining === 'منتهي الصلاحية';
  const isTimeWarning = timeRemaining.includes('0:') && !isExpired;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-emerald-600" />
            <DialogTitle className="text-right text-lg">تسجيل الدخول الإداري</DialogTitle>
          </div>
        </DialogHeader>

        {targetUser && (
          <div className="space-y-4">
            {/* Target User Info Card */}
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-emerald-600" />
                  <span>المستخدم المستهدف</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الاسم:</span>
                    <span className="font-medium">{targetUser.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">البريد:</span>
                    <span className="font-medium text-xs">{targetUser.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">الدور:</span>
                    <Badge variant="secondary" className="text-xs">{targetUser.role}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Warning */}
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-right text-sm">
                <strong className="text-amber-700">تحذير أمني:</strong> ستحصل على وصول كامل لحساب هذا المستخدم. 
                سيتم تسجيل جميع الأنشطة. للأغراض الإدارية فقط.
              </AlertDescription>
            </Alert>

            <Separator />

            {/* PIN Generation/Entry Section */}
            {!generatedPin ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                      <KeyRound className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">إنشاء رمز الدخول</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        سيتم إنشاء رمز PIN آمن صالح لمدة 15 دقيقة
                      </p>
                    </div>
                    <Button 
                      onClick={generatePin} 
                      disabled={isGeneratingPin}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      size="lg"
                    >
                      {isGeneratingPin ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          جاري الإنشاء...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <KeyRound className="h-4 w-4" />
                          إنشاء رمز PIN
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Generated PIN Display */}
                <Card className={`transition-all duration-300 ${isExpired ? 'border-red-300 bg-red-50' : isTimeWarning ? 'border-amber-300 bg-amber-50' : 'border-green-300 bg-green-50'}`}>
                  <CardContent className="pt-4">
                    <div className="text-center space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className={`h-5 w-5 ${isExpired ? 'text-red-600' : 'text-green-600'}`} />
                        <span className="font-medium">رمز PIN المُنشأ</span>
                      </div>
                      
                      <div className={`text-3xl font-mono tracking-wider p-3 rounded-lg border-2 ${isExpired ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-green-300 text-green-700'} transition-all duration-300`}>
                        {isExpired ? '------' : generatedPin}
                      </div>
                      
                      <div className="flex items-center justify-center gap-2">
                        <Clock className={`h-4 w-4 ${isExpired ? 'text-red-600' : isTimeWarning ? 'text-amber-600' : 'text-green-600'}`} />
                        <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : isTimeWarning ? 'text-amber-600' : 'text-green-600'}`}>
                          {timeRemaining}
                        </span>
                      </div>
                      
                      {!isExpired && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={copyPin}
                          className="text-xs"
                        >
                          <Copy className="h-3 w-3 ml-1" />
                          نسخ الرمز
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* PIN Entry Section */}
                {!isExpired && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <Label htmlFor="pin-input" className="text-center block font-medium">
                          أدخل رمز PIN للدخول
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="pin-input"
                            type="text"
                            maxLength={6}
                            value={enteredPin}
                            onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="text-center font-mono text-xl py-3 border-2 focus:border-emerald-500"
                            disabled={isLoggingIn}
                          />
                          <Button 
                            onClick={loginWithPin}
                            disabled={isLoggingIn || enteredPin.length !== 6}
                            className="bg-emerald-600 hover:bg-emerald-700 px-6"
                            size="lg"
                          >
                            {isLoggingIn ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {enteredPin.length > 0 && enteredPin.length < 6 && (
                          <p className="text-xs text-muted-foreground text-center">
                            {6 - enteredPin.length} أرقام متبقية
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isExpired && (
                  <Button 
                    onClick={() => {
                      setGeneratedPin(null);
                      setPinExpiresAt(null);
                      setEnteredPin('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    إنشاء رمز جديد
                  </Button>
                )}
              </div>
            )}

            {/* Instructions */}
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="pt-4">
                <div className="text-xs text-slate-600 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>الرمز صالح لمدة 15 دقيقة ويُستخدم مرة واحدة فقط</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>سيتم تسجيل الدخول بأمان عبر Magic Link</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>بانر إداري سيظهر مع زر العودة للحساب الأصلي</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>جميع الأنشطة مُسجلة في سجل التدقيق الأمني</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};