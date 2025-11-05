import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSearch, History, Upload, Sparkles, GraduationCap, BookOpen } from 'lucide-react';
import ComparisonUploadZone from '@/components/pdf-comparison/ComparisonUploadZone';
import ComparisonHistory from '@/components/pdf-comparison/ComparisonHistory';
import { useAuth } from '@/hooks/useAuth';
import ModernHeader from '@/components/shared/ModernHeader';
import type { GradeLevel } from '@/hooks/usePDFComparison';

type ExtendedGradeLevel = GradeLevel | 'all';

const TeacherPDFComparisonPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('compare');
  const [gradeLevel, setGradeLevel] = useState<ExtendedGradeLevel>('all');

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
        {/* Grade Level and Tab Selection - Unified Horizontal Layout */}
        <Card className="p-6 border-0 bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            {/* Grade Selection */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={gradeLevel === 'all' ? 'default' : 'outline'}
                onClick={() => setGradeLevel('all')}
                className="min-w-24"
              >
                الكل
              </Button>
              <Button
                variant={gradeLevel === '12' ? 'default' : 'outline'}
                onClick={() => setGradeLevel('12')}
                className="min-w-32 gap-2"
              >
                <GraduationCap className="h-4 w-4" />
                الصف 12
              </Button>
              <Button
                variant={gradeLevel === '10' ? 'default' : 'outline'}
                onClick={() => setGradeLevel('10')}
                className="min-w-32 gap-2"
              >
                <BookOpen className="h-4 w-4" />
                الصف 10
              </Button>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-8 w-px bg-border/50" />

            {/* Main Tabs */}
            <div className="flex gap-2 flex-1 md:justify-end">
              <Button
                variant={activeTab === 'compare' ? 'default' : 'outline'}
                onClick={() => setActiveTab('compare')}
                className="flex-1 md:flex-none min-w-32 gap-2"
              >
                <Upload className="h-4 w-4" />
                مقارنة جديدة
              </Button>
              <Button
                variant={activeTab === 'history' ? 'default' : 'outline'}
                onClick={() => setActiveTab('history')}
                className="flex-1 md:flex-none min-w-32 gap-2"
              >
                <History className="h-4 w-4" />
                سجل المقارنات
              </Button>
            </div>
          </div>
        </Card>

        {/* Content Area */}
        <div className="space-y-4">
          {activeTab === 'compare' && <ComparisonUploadZone gradeLevel={gradeLevel === 'all' ? undefined : gradeLevel} />}
          {activeTab === 'history' && <ComparisonHistory gradeLevel={gradeLevel === 'all' ? undefined : gradeLevel} />}
        </div>
      </div>
    </div>
  );
};

export default TeacherPDFComparisonPage;
