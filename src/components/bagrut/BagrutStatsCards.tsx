import { FC, memo } from 'react';
import { FileText, Send, ClipboardList, Users, School, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { BagrutStats } from '@/hooks/useBagrutStats';
import { Skeleton } from '@/components/ui/skeleton';

interface BagrutStatsCardsProps {
  stats?: BagrutStats;
  loading?: boolean;
}

export const BagrutStatsCards: FC<BagrutStatsCardsProps> = memo(({ stats, loading }) => {
  const statsConfig = [
    {
      title: 'إجمالي الامتحانات',
      value: stats?.totalExams?.toString() || '0',
      icon: FileText,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'الامتحانات المنشورة',
      value: stats?.publishedExams?.toString() || '0',
      icon: Send,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'إجمالي المحاولات',
      value: stats?.totalAttempts?.toString() || '0',
      icon: ClipboardList,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-600',
    },
    {
      title: 'الطلاب المتقدمون',
      value: stats?.uniqueStudents?.toString() || '0',
      icon: Users,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
    },
    {
      title: 'المدارس المشاركة',
      value: stats?.participatingSchools?.toString() || '0',
      icon: School,
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-600',
    },
    {
      title: 'معدل النجاح',
      value: `${stats?.averageScore || 0}%`,
      icon: TrendingUp,
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className="border bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`${stat.iconBg} p-2.5 rounded-lg shrink-0`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {stat.title}
                  </p>
                  <p className="text-xl font-bold text-foreground mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

BagrutStatsCards.displayName = 'BagrutStatsCards';
