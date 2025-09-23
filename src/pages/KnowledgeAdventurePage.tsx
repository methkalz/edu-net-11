import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KnowledgeAdventureRealContent from '@/components/games/KnowledgeAdventureRealContent';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Knowledge Adventure Game Page
 * 
 * Dedicated page for the Knowledge Adventure game for Grade 11 students.
 * Provides a full-screen gaming experience with navigation back to dashboard.
 */
const KnowledgeAdventurePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" dir="rtl">
      {/* Header with back button */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="w-4 h-4" />
                العودة للوحة التحكم
              </Button>
            </div>
            
            <div className="text-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                مغامرة المعرفة
              </h1>
              <p className="text-sm text-muted-foreground">
                استكشف عالم التقنية في رحلة تعليمية ممتعة
              </p>
            </div>
            
            <div className="w-24"></div> {/* Spacer for center alignment */}
          </div>
        </div>
      </div>

      {/* Game Container */}
      <div className="container mx-auto p-4">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-2">
            <div className="min-h-[calc(100vh-200px)]">
              <KnowledgeAdventureRealContent />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KnowledgeAdventurePage;