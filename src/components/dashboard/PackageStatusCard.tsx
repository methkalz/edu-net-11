import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, Clock, Users, GraduationCap, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SchoolPackage {
  id: string;
  name: string;
  name_ar: string;
  description_ar: string;
  max_students: number;
  max_teachers: number;
  start_date: string;
  end_date: string;
  status: string;
  features: string[];
  price: number;
  currency: string;
  duration_days: number | null;
}

interface PackageStatusCardProps {
  schoolPackage: SchoolPackage | null;
  stats: {
    totalStudents: number;
    totalTeachers: number;
  };
  loading?: boolean;
}

export const PackageStatusCard: React.FC<PackageStatusCardProps> = ({
  schoolPackage,
  stats,
  loading = false
}) => {
  if (!schoolPackage) {
    return (
      <Card className="glass-card soft-shadow border-orange-200">
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-orange-500" />
          <h3 className="text-lg font-semibold mb-2">لا توجد باقة نشطة</h3>
          <p className="text-muted-foreground">يرجى التواصل مع الإدارة لتفعيل باقة الخدمة</p>
        </CardContent>
      </Card>
    );
  }

  const getUsagePercentage = (used: number, max: number) => {
    if (!max || max <= 0) return 0;
    if (used < 0) return 0;
    return Math.min((used / max) * 100, 100);
  };

  const getDaysRemaining = () => {
    if (!schoolPackage.end_date || !schoolPackage.duration_days || schoolPackage.duration_days === -1) {
      return null;
    }
    
    try {
      const endDate = new Date(schoolPackage.end_date);
      const today = new Date();
      
      if (isNaN(endDate.getTime()) || isNaN(today.getTime())) return null;
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(diffDays, 0);
    } catch {
      return null;
    }
  };

  const getDaysRemainingDisplay = () => {
    if (!schoolPackage.duration_days || schoolPackage.duration_days === -1) {
      return "غير محدود";
    }
    const days = getDaysRemaining();
    return days !== null ? days.toString() : "0";
  };

  const getSubscriptionEndDisplay = () => {
    if (!schoolPackage.end_date) return "اشتراك دائم";
    
    const endDate = new Date(schoolPackage.end_date);
    const year = endDate.getFullYear();

    if (year <= 1970 || !schoolPackage.duration_days || schoolPackage.duration_days === -1) {
      return "اشتراك دائم";
    }
    
    return format(endDate, 'dd.M.yyyy', { locale: ar });
  };

  const getPackageStatusColor = () => {
    if (!schoolPackage) return 'gray';
    
    const daysRemaining = getDaysRemaining();
    if (daysRemaining === null) return 'green'; // Unlimited
    if (daysRemaining <= 7) return 'red';
    if (daysRemaining <= 30) return 'yellow';
    return 'green';
  };

  const getStatusBadge = () => {
    const color = getPackageStatusColor();
    const daysRemaining = getDaysRemaining();
    
    if (schoolPackage.status !== 'active') {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          غير نشطة
        </Badge>
      );
    }

    if (daysRemaining === null) {
      return (
        <Badge className="gradient-electric text-white gap-1">
          <CheckCircle className="h-3 w-3" />
          نشطة - غير محدود
        </Badge>
      );
    }

    if (color === 'red') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          تنتهي قريباً
        </Badge>
      );
    }

    if (color === 'yellow') {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 gap-1">
          <Clock className="h-3 w-3" />
          نشطة
        </Badge>
      );
    }

    return (
      <Badge className="gradient-electric text-white gap-1">
        <CheckCircle className="h-3 w-3" />
        نشطة
      </Badge>
    );
  };

  const studentsUsage = getUsagePercentage(stats.totalStudents, schoolPackage.max_students);
  const teachersUsage = getUsagePercentage(stats.totalTeachers, schoolPackage.max_teachers);

  return (
    <Card className="glass-card soft-shadow border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-3">
            <Package className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-lg">باقة الاشتراك الحالية</CardTitle>
              <CardDescription>تفاصيل الخطة والاستخدام</CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Package Info */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-lg text-primary">{schoolPackage.name_ar}</h4>
            <p className="text-sm text-muted-foreground mt-1">{schoolPackage.description_ar}</p>
          </div>
          
          {/* Expiry Info */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center space-x-reverse space-x-2">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-lg">{getDaysRemainingDisplay()}</p>
                <p className="text-sm text-muted-foreground">
                  {getDaysRemaining() === null ? 'أيام متبقية' : 'يوم متبقي'}
                </p>
              </div>
            </div>
          </div>
          
          {/* End Date */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="font-semibold text-lg">{getSubscriptionEndDisplay()}</p>
            <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="space-y-4">
          <h5 className="font-medium text-foreground">إحصائيات الاستخدام</h5>
          
          {/* Students Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">الطلاب</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {stats.totalStudents} / {schoolPackage.max_students}
              </span>
            </div>
            <Progress 
              value={studentsUsage} 
              className="h-2"
              aria-label={`استخدام الطلاب: ${studentsUsage.toFixed(1)}%`}
            />
            <p className="text-xs text-muted-foreground">
              {studentsUsage.toFixed(1)}% من الحد المسموح
            </p>
          </div>

          {/* Teachers Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium">المعلمون</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {stats.totalTeachers} / {schoolPackage.max_teachers}
              </span>
            </div>
            <Progress 
              value={teachersUsage} 
              className="h-2"
              aria-label={`استخدام المعلمين: ${teachersUsage.toFixed(1)}%`}
            />
            <p className="text-xs text-muted-foreground">
              {teachersUsage.toFixed(1)}% من الحد المسموح
            </p>
          </div>
        </div>

        {/* Features List */}
        {schoolPackage.features && schoolPackage.features.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium text-foreground">المميزات المتاحة</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {schoolPackage.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning for high usage */}
        {(studentsUsage > 90 || teachersUsage > 90) && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700">
              {studentsUsage > 90 && teachersUsage > 90
                ? 'تم الوصول لحد الطلاب والمعلمين'
                : studentsUsage > 90
                ? 'تم الوصول لحد الطلاب'
                : 'تم الوصول لحد المعلمين'
              }. يرجى ترقية الباقة.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PackageStatusCard;