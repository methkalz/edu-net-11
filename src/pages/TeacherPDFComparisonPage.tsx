import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSearch, History } from 'lucide-react';
import ComparisonUploadZone from '@/components/pdf-comparison/ComparisonUploadZone';
import ComparisonHistory from '@/components/pdf-comparison/ComparisonHistory';
import { useAuth } from '@/hooks/useAuth';
import ModernHeader from '@/components/shared/ModernHeader';
import type { GradeLevel } from '@/hooks/usePDFComparison';

const TeacherPDFComparisonPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('compare');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('12');

  useEffect(() => {
    // التحقق من صلاحية الوصول - المعلمون فقط
    if (!userProfile || userProfile.role !== 'teacher') {
      navigate('/dashboard');
    }
  }, [userProfile, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5" style={{ direction: 'rtl' }}>
      <ModernHeader 
        title="مقارنة المشاريع PDF"
        showBackButton={true}
        backPath="/dashboard"
      />
      
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Grade Level Selection */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
          <CardContent className="p-6 relative">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
                  <FileSearch className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">اختيار الصف الدراسي</h2>
                  <p className="text-sm text-muted-foreground">حدد الصف الذي تريد مقارنة مشاريعه</p>
                </div>
              </div>
              
              <Tabs value={gradeLevel} onValueChange={(value) => setGradeLevel(value as GradeLevel)}>
                <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50">
                  <TabsTrigger 
                    value="12"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md py-3"
                  >
                    مشاريع نهاية - الصف الثاني عشر
                  </TabsTrigger>
                  <TabsTrigger 
                    value="10"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md py-3"
                  >
                    ميني بروجكت - الصف العاشر
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs - مقارنة جديدة وسجل المقارنات فقط */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <Card className="border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50">
                <TabsTrigger 
                  value="compare" 
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm py-3"
                >
                  <FileSearch className="h-4 w-4" />
                  مقارنة جديدة
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm py-3"
                >
                  <History className="h-4 w-4" />
                  سجل المقارنات
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          <TabsContent value="compare" className="space-y-6">
            <Card className="border-0 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5 text-primary" />
                  رفع ملفات للمقارنة
                </CardTitle>
                <CardDescription>
                  اختر ملف PDF واحد أو أكثر للمقارنة مع المستودع (حجم أقصى: 50MB لكل ملف)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComparisonUploadZone gradeLevel={gradeLevel} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="animate-fade-in">
            <ComparisonHistory gradeLevel={gradeLevel} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeacherPDFComparisonPage;
