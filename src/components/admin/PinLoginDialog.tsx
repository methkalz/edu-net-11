import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield, User, Copy, ExternalLink } from 'lucide-react';
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
  const { toast } = useToast();

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
    if (enteredPin.length !== 6) {
      toast({
        title: "رمز PIN غير صالح",
        description: "يجب أن يتكون الرمز من 6 أرقام",
        variant: "destructive"
      });
      return;
    }

    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.functions.invoke('login-with-pin', {
        body: { pinCode: enteredPin }
      });

      if (error) throw error;

      toast({
        title: "تم الدخول بنجاح",
        description: `سيتم توجيهك إلى لوحة تحكم ${data.targetUser.name}`,
      });

      // Redirect to the target user's dashboard
      if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank');
      }
      
      onOpenChange(false);
      setEnteredPin('');
      setGeneratedPin(null);
      setPinExpiresAt(null);
    } catch (error) {
      console.error('Error logging in with PIN:', error);
      toast({
        title: "خطأ في الدخول",
        description: "رمز PIN غير صالح أو منتهي الصلاحية",
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const formatTimeRemaining = () => {
    if (!pinExpiresAt) return '';
    
    const now = new Date();
    const expires = new Date(pinExpiresAt);
    const diff = expires.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (diff <= 0) return 'منتهي الصلاحية';
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">الدخول إلى حساب المستخدم</DialogTitle>
        </DialogHeader>

        {targetUser && (
          <div className="space-y-6">
            {/* Target User Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                <span className="font-medium">معلومات المستخدم المستهدف</span>
              </div>
              <div className="space-y-1 text-sm">
                <div>الاسم: {targetUser.full_name}</div>
                <div>البريد الإلكتروني: {targetUser.email}</div>
                <div className="flex items-center gap-2">
                  الدور: <Badge variant="outline">{targetUser.role}</Badge>
                </div>
              </div>
            </div>

            {/* Security Warning */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-right">
                <strong>تحذير أمني:</strong> ستتمكن من الوصول إلى حساب هذا المستخدم بالكامل. 
                سيتم تسجيل جميع الأنشطة في سجل التدقيق. استخدم هذه الخاصية بحذر وللأغراض الإدارية فقط.
              </AlertDescription>
            </Alert>

            {/* PIN Generation Section */}
            {!generatedPin ? (
              <div className="space-y-4">
                <Button 
                  onClick={generatePin} 
                  disabled={isGeneratingPin}
                  className="w-full"
                >
                  {isGeneratingPin ? 'جاري إنشاء الرمز...' : 'إنشاء رمز PIN للدخول'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Generated PIN Display */}
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">رمز PIN المُنشأ:</span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{formatTimeRemaining()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-2xl font-mono bg-background p-2 rounded border">
                      {generatedPin}
                    </code>
                    <Button size="sm" variant="outline" onClick={copyPin}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* PIN Entry Section */}
                <div className="space-y-2">
                  <Label htmlFor="pin-input">أدخل رمز PIN للدخول:</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pin-input"
                      type="text"
                      maxLength={6}
                      value={enteredPin}
                      onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="text-center font-mono text-lg"
                    />
                    <Button 
                      onClick={loginWithPin}
                      disabled={isLoggingIn || enteredPin.length !== 6}
                    >
                      {isLoggingIn ? 'جاري الدخول...' : <ExternalLink className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• الرمز صالح لمدة 15 دقيقة فقط</p>
              <p>• يمكن استخدام الرمز مرة واحدة فقط</p>
              <p>• سيتم فتح نافذة جديدة للدخول إلى حساب المستخدم</p>
              <p>• يمكنك العودة لحسابك الأصلي في أي وقت</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};