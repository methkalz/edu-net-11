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
    <div className="min-h-screen bg-background" style={{ direction: 'rtl' }}>
      <ModernHeader 
        title="نظام الكشف عن التشابه"
        showBackButton={true}
        backPath="/dashboard"
      />
      
      <div className="container mx-auto px-4 py-6 space-y-4">
        {/* Grade Level Selection */}
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <Tabs value={gradeLevel} onValueChange={(value) => setGradeLevel(value as GradeLevel)}>
              <TabsList className="grid w-full grid-cols-2 bg-muted/40">
                <TabsTrigger 
                  value="12"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <FileSearch className="h-4 w-4 ml-2" />
                  مشاريع نهاية - الصف 12
                </TabsTrigger>
                <TabsTrigger 
                  value="10"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <FileSearch className="h-4 w-4 ml-2" />
                  ميني بروجكت - الصف 10
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-muted/40">
            <TabsTrigger 
              value="compare" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Upload className="h-4 w-4 ml-2" />
              مقارنة جديدة
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <History className="h-4 w-4 ml-2" />
              سجل المقارنات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compare" className="space-y-4">
            <ComparisonUploadZone gradeLevel={gradeLevel} />
          </TabsContent>

          <TabsContent value="history">
            <ComparisonHistory gradeLevel={gradeLevel} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeacherPDFComparisonPage;
