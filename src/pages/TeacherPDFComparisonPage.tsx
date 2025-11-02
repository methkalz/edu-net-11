import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSearch, History, Upload, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5" style={{ direction: 'rtl' }}>
      <ModernHeader 
        title="مقارنة المشاريع PDF"
        showBackButton={true}
        backPath="/dashboard"
      />
      
      <div className="container mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent backdrop-blur-sm p-8 shadow-2xl">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                نظام الكشف عن التشابه
              </h1>
              <p className="text-muted-foreground">
                قارن مشاريع الطلاب بكفاءة عالية واكتشف التشابهات باستخدام الذكاء الاصطناعي
              </p>
            </div>
          </div>
        </div>

        {/* Grade Level Selection */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <CardContent className="p-8 relative z-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm">
                    <FileSearch className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-1">اختيار الصف الدراسي</h2>
                  <p className="text-sm text-muted-foreground">حدد الصف الذي تريد مقارنة مشاريعه</p>
                </div>
              </div>
              
              <Tabs value={gradeLevel} onValueChange={(value) => setGradeLevel(value as GradeLevel)}>
                <TabsList className="grid w-full grid-cols-2 h-auto p-2 bg-gradient-to-br from-muted/80 to-muted/60 backdrop-blur-sm rounded-xl">
                  <TabsTrigger 
                    value="12"
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg py-4 text-base font-semibold transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center gap-2">
                      <FileSearch className="h-5 w-5" />
                      مشاريع نهاية - الصف الثاني عشر
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="10"
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg py-4 text-base font-semibold transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center gap-2">
                      <FileSearch className="h-5 w-5" />
                      ميني بروجكت - الصف العاشر
                    </div>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <Card className="border-0 bg-gradient-to-br from-card to-card/95 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4">
              <TabsList className="grid w-full grid-cols-2 h-auto p-2 bg-gradient-to-br from-muted/60 to-muted/40 backdrop-blur-sm rounded-xl">
                <TabsTrigger 
                  value="compare" 
                  className="gap-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl rounded-lg py-4 font-semibold transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-background/20">
                      <Upload className="h-4 w-4" />
                    </div>
                    مقارنة جديدة
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="gap-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl rounded-lg py-4 font-semibold transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-background/20">
                      <History className="h-4 w-4" />
                    </div>
                    سجل المقارنات
                  </div>
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          <TabsContent value="compare" className="space-y-6 animate-fade-in">
            <ComparisonUploadZone gradeLevel={gradeLevel} />
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
