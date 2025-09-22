import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Database, ArrowRight } from 'lucide-react';

/**
 * Legacy Knowledge Adventure Component
 * 
 * This is the old game component that doesn't use database integration.
 * It's kept for reference but should not be used in production.
 * Use KnowledgeAdventureRealContent for the database-integrated version.
 */
const LegacyKnowledgeAdventure: React.FC = () => {
  const handleRedirect = () => {
    // In a real app, this would redirect to the new game
    window.location.href = '/content-management/grade-11';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl">إصدار قديم</CardTitle>
          <p className="text-muted-foreground">
            هذا الإصدار القديم من اللعبة لا يحفظ التقدم
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span>البيانات لا تُحفظ في قاعدة البيانات</span>
            </div>
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span>التقدم يضيع عند إعادة تحميل الصفحة</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <Database className="h-4 w-4" />
              <span>الإصدار الجديد يحفظ كل شيء</span>
            </div>
          </div>
          
          <Button 
            onClick={handleRedirect} 
            className="w-full flex items-center gap-2" 
          >
            <span>الانتقال للإصدار الجديد</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegacyKnowledgeAdventure;