import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5" style={{ direction: 'rtl' }}>
      <ModernHeader 
        title="نظام الكشف عن التشابه"
        showBackButton={true}
        backPath="/dashboard"
      />
      
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Grade Level & Main Tabs - Combined Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Grade Level Selection */}
          <Card className="border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setGradeLevel('12')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    gradeLevel === '12'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:shadow-sm'
                  }`}
                >
                  <FileSearch className="h-4 w-4" />
                  <span>مشاريع نهاية - الصف 12</span>
                </button>
                <button
                  onClick={() => setGradeLevel('10')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    gradeLevel === '10'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:shadow-sm'
                  }`}
                >
                  <FileSearch className="h-4 w-4" />
                  <span>ميني بروجكت - الصف 10</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Card className="border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('compare')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === 'compare'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:shadow-sm'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  <span>مقارنة جديدة</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === 'history'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:shadow-sm'
                  }`}
                >
                  <History className="h-4 w-4" />
                  <span>سجل المقارنات</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {activeTab === 'compare' && <ComparisonUploadZone gradeLevel={gradeLevel} />}
          {activeTab === 'history' && <ComparisonHistory gradeLevel={gradeLevel} />}
        </div>
      </div>
    </div>
  );
};

export default TeacherPDFComparisonPage;
