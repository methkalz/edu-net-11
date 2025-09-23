import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { SecureStorage, RateLimiter, SecurityMonitor } from '@/lib/security';
import { toast } from 'sonner';

export const SecurityTestComponent: React.FC = () => {
  const testEncryption = () => {
    try {
      const testData = { message: 'اختبار التشفير', timestamp: Date.now() };
      SecureStorage.setSecureItem('test_data', testData);
      const decryptedData = SecureStorage.getSecureItem('test_data');
      
      if (JSON.stringify(testData) === JSON.stringify(decryptedData)) {
        toast.success('✅ نظام التشفير يعمل بشكل صحيح');
        return true;
      } else {
        toast.error('❌ فشل اختبار التشفير');
        return false;
      }
    } catch (error) {
      toast.error('❌ خطأ في نظام التشفير');
      return false;
    }
  };

  const testRateLimiting = () => {
    try {
      const testKey = `test_rate_limit_${Date.now()}`;
      
      // اختبار المحاولات المسموحة
      let successCount = 0;
      for (let i = 0; i < 3; i++) {
        if (RateLimiter.isAllowed(testKey, 2, 60000)) {
          successCount++;
        }
      }
      
      if (successCount === 2) {
        toast.success('✅ نظام Rate Limiting يعمل بشكل صحيح');
        return true;
      } else {
        toast.error('❌ فشل اختبار Rate Limiting');
        return false;
      }
    } catch (error) {
      toast.error('❌ خطأ في نظام Rate Limiting');
      return false;
    }
  };

  const testSecurityMonitor = () => {
    try {
      // تسجيل حدث اختبار
      SecurityMonitor.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'LOW',
        message: 'اختبار نظام المراقبة الأمنية',
        details: { source: 'security_test' }
      });
      
      const stats = SecurityMonitor.getSecurityStats();
      if (stats.totalEvents > 0) {
        toast.success('✅ نظام المراقبة الأمنية يعمل بشكل صحيح');
        return true;
      } else {
        toast.error('❌ فشل اختبار نظام المراقبة');
        return false;
      }
    } catch (error) {
      toast.error('❌ خطأ في نظام المراقبة الأمنية');
      return false;
    }
  };

  const runAllTests = () => {
    const encryptionResult = testEncryption();
    const rateLimitResult = testRateLimiting();
    const monitorResult = testSecurityMonitor();
    
    const allPassed = encryptionResult && rateLimitResult && monitorResult;
    
    if (allPassed) {
      toast.success('🎉 جميع اختبارات الأمان ناجحة!');
    } else {
      toast.error('⚠️ بعض اختبارات الأمان فشلت');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          اختبار أنظمة الأمان
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center space-y-2">
            <Button variant="outline" onClick={testEncryption} className="w-full">
              اختبار التشفير
            </Button>
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              AES-256
            </Badge>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <Button variant="outline" onClick={testRateLimiting} className="w-full">
              اختبار Rate Limiting
            </Button>
            <Badge variant="secondary" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              5 محاولات/دقيقة
            </Badge>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <Button variant="outline" onClick={testSecurityMonitor} className="w-full">
              اختبار المراقبة
            </Button>
            <Badge variant="secondary" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Real-time
            </Badge>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <Button onClick={runAllTests} className="w-full" variant="default">
            تشغيل جميع الاختبارات
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground text-center">
          هذه الاختبارات تتحقق من سلامة أنظمة الأمان المطبقة على ميزة الانتحال
        </div>
      </CardContent>
    </Card>
  );
};