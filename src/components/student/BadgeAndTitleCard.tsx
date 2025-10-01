import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { useUserTitle } from '@/hooks/useUserTitle';
import { useAuth } from '@/hooks/useAuth';
import { Award } from 'lucide-react';

export const BadgeAndTitleCard: React.FC = () => {
  const { userProfile } = useAuth();
  const userTitleData = useUserTitle(userProfile as any);

  return (
    <Card className="border-border/40 bg-gradient-to-br from-amber-50/50 via-background to-yellow-50/30 dark:from-amber-950/20 dark:via-background dark:to-yellow-950/10 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 flex items-center justify-center">
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">الوسام والمسمى</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
        <BadgeDisplay badge={userTitleData.badgeInfo?.badge || null} size="lg" showName={false} />
        {userTitleData.title && (
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{userTitleData.title}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
