import { FC } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  implemented: boolean;
  action: string;
}

const securityRecommendations: SecurityRecommendation[] = [
  {
    id: 'error-boundary',
    title: 'Error Boundary',
    description: 'تطبيق نظام التعامل مع الأخطاء على مستوى التطبيق',
    severity: 'high',
    implemented: true,
    action: 'تم التطبيق - يحمي التطبيق من تعطل React components'
  },
  {
    id: 'type-safety',
    title: 'Type Safety',
    description: 'استبدال any types بأنواع محددة وآمنة',
    severity: 'medium',
    implemented: true,
    action: 'تم التطبيق - تم إنشاء types library شامل'
  },
  {
    id: 'input-validation',
    title: 'Input Validation',
    description: 'تطبيق Zod validation على جميع المدخلات',
    severity: 'high',
    implemented: true,
    action: 'تم التطبيق - حماية من البيانات المضرة'
  },
  {
    id: 'logging-system',
    title: 'Logging System',
    description: 'نظام تسجيل متقدم للمراقبة والتشخيص',
    severity: 'medium',
    implemented: true,
    action: 'تم التطبيق - يساعد في كشف المشاكل'
  },
  {
    id: 'rls-policies',
    title: 'Row Level Security',
    description: 'مراجعة وتحسين سياسات RLS في قاعدة البيانات',
    severity: 'critical',
    implemented: false,
    action: 'مطلوب - مراجعة سياسات الوصول'
  },
  {
    id: 'rate-limiting',
    title: 'Rate Limiting',
    description: 'تطبيق قيود على عدد الطلبات لمنع الإساءة',
    severity: 'high',
    implemented: false,
    action: 'مطلوب - حماية من DOS attacks'
  },
  {
    id: 'audit-trail',
    title: 'Audit Trail',
    description: 'تتبع جميع العمليات المهمة في النظام',
    severity: 'medium',
    implemented: false,
    action: 'مطلوب - للمراقبة والامتثال'
  },
  {
    id: 'encryption',
    title: 'Data Encryption',
    description: 'تشفير البيانات الحساسة',
    severity: 'high',
    implemented: false,
    action: 'مطلوب - حماية البيانات الشخصية'
  }
];

export const SecurityDashboard: FC = () => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'high': return 'border-orange-200 bg-orange-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const implementedCount = securityRecommendations.filter(r => r.implemented).length;
  const totalCount = securityRecommendations.length;
  const securityScore = Math.round((implementedCount / totalCount) * 100);

  return (
    <div className="space-y-6" dir="rtl">
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            تقرير الأمان - المرحلة الأولى مكتملة
          </CardTitle>
          <CardDescription>
            تم تنفيذ التحسينات الأساسية للأمان وجودة الكود
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <strong>نقاط الأمان: {securityScore}/100</strong> - تم تطبيق {implementedCount} من أصل {totalCount} توصية
            </AlertDescription>
          </Alert>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${securityScore}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {securityRecommendations.map((recommendation) => (
          <Card 
            key={recommendation.id} 
            className={`${getSeverityColor(recommendation.severity)} ${
              recommendation.implemented ? 'opacity-75' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(recommendation.severity)}
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {recommendation.title}
                      {recommendation.implemented && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {recommendation.description}
                    </p>
                    <p className="text-xs mt-2 font-medium">
                      {recommendation.action}
                    </p>
                  </div>
                </div>
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${recommendation.implemented ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                `}>
                  {recommendation.implemented ? 'مطبق ✓' : 'مطلوب'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المراحل التالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm">المرحلة الثانية: تحسين الأداء وإعادة الهيكلة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span className="text-sm">المرحلة الثالثة: الأمان المتقدم والمراقبة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm">المرحلة الرابعة: الاختبارات والتوثيق</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};