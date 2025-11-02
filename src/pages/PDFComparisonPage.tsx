import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileSearch, History, Database, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ComparisonUploadZone from '@/components/pdf-comparison/ComparisonUploadZone';
import ComparisonHistory from '@/components/pdf-comparison/ComparisonHistory';
import RepositoryManager from '@/components/pdf-comparison/RepositoryManager';
import { useAuth } from '@/hooks/useAuth';
import type { GradeLevel } from '@/hooks/usePDFComparison';

const PDFComparisonPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('compare');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('12');

  useEffect(() => {
    // التحقق من صلاحية الوصول
    if (!userProfile || !['teacher', 'school_admin', 'superadmin'].includes(userProfile.role)) {
      navigate('/dashboard');
    }
  }, [userProfile, navigate]);

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowRight className="h-4 w-4 rotate-180 ml-2" />
          العودة للوحة التحكم
        </Button>

        <div className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 creative-background opacity-40" />
          
          <Card className="relative border-0 shadow-lg backdrop-blur-md bg-gradient-to-br from-primary/20 via-primary/10 to-background/50">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Content Section */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-5 rounded-xl backdrop-blur-sm border border-white/20 bg-white/10">
                        <FileSearch className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-foreground">
                          مقارنة المشاريع PDF
                        </h1>
                        <p className="text-base text-muted-foreground">
                          قارن مشاريع الطلاب مع المستودع للتأكد من الأصالة والكشف عن التشابه
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grade Level Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>اختيار الصف الدراسي</CardTitle>
          <CardDescription>حدد الصف الذي تريد مقارنة مشاريعه</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={gradeLevel} onValueChange={(value) => setGradeLevel(value as GradeLevel)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="12">
                مشاريع نهاية - الصف الثاني عشر
              </TabsTrigger>
              <TabsTrigger value="10">
                ميني بروجكت - الصف العاشر
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="compare" className="gap-2">
            <FileSearch className="h-4 w-4" />
            مقارنة جديدة
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            سجل المقارنات
          </TabsTrigger>
          <TabsTrigger value="repository" className="gap-2">
            <Database className="h-4 w-4" />
            إدارة المستودع
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compare" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>رفع ملفات للمقارنة</CardTitle>
              <CardDescription>
                اختر ملف PDF واحد أو أكثر للمقارنة مع المستودع (حجم أقصى: 50MB لكل ملف)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComparisonUploadZone gradeLevel={gradeLevel} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <ComparisonHistory gradeLevel={gradeLevel} />
        </TabsContent>

        <TabsContent value="repository">
          <RepositoryManager gradeLevel={gradeLevel} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDFComparisonPage;
