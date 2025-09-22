import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Database, Trash2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Game Cleanup Status Component
 * 
 * Shows the current status of local storage cleanup for games
 */
const GameCleanupStatus: React.FC = () => {
  const cleanupItems = [
    {
      id: 'legacy-game',
      title: 'اللعبة القديمة',
      description: 'تم تحويل KnowledgeAdventure إلى Legacy component',
      status: 'completed',
      icon: Trash2
    },
    {
      id: 'localstorage-backup',
      title: 'إزالة النسخ الاحتياطي المحلي',
      description: 'تم إزالة localStorage backup من useGrade11Game',
      status: 'completed',
      icon: Database
    },
    {
      id: 'database-only',
      title: 'الاعتماد على قاعدة البيانات فقط',
      description: 'جميع بيانات الألعاب تُحفظ في قاعدة البيانات',
      status: 'completed',
      icon: Shield
    },
    {
      id: 'modern-game',
      title: 'اللعبة الحديثة',
      description: 'KnowledgeAdventureRealContent تستخدم قاعدة البيانات بالكامل',
      status: 'completed',
      icon: CheckCircle
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">حالة تنظيف الألعاب</h2>
        <p className="text-muted-foreground">
          تم إزالة جميع الاعتمادات على التخزين المحلي من الألعاب
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cleanupItems.map((item) => {
          const ItemIcon = item.icon;
          
          return (
            <Card key={item.id} className="border border-green-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ItemIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      مكتمل ✓
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-green-800 mb-2">
            تم تنظيف الألعاب بنجاح
          </h3>
          <p className="text-green-700 text-sm">
            جميع الألعاب تستخدم قاعدة البيانات حصرياً ولا تعتمد على التخزين المحلي
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameCleanupStatus;