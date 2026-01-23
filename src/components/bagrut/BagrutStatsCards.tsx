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
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'الامتحانات المنشورة',
      value: stats?.publishedExams?.toString() || '0',
      icon: Send,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'إجمالي المحاولات',
      value: stats?.totalAttempts?.toString() || '0',
      icon: ClipboardList,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'الطلاب المتقدمون',
      value: stats?.uniqueStudents?.toString() || '0',
      icon: Users,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      title: 'المدارس المشاركة',
      value: stats?.participatingSchools?.toString() || '0',
      icon: School,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
    {
      title: 'معدل النجاح',
      value: `${stats?.averageScore || 0}%`,
      icon: TrendingUp,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-0 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-12" />
                </div>
                <Skeleton className="h-11 w-11 rounded-xl" />
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
            className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
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
