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
      <CardContent className="flex flex-col items-center justify-start pt-2 pb-8 px-6 space-y-4">
        <div className="scale-[1.6]">
          <BadgeDisplay badge={userTitleData.badgeInfo?.badge || null} size="lg" showName={false} />
        </div>
        {userTitleData.title && (
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{userTitleData.title}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
