import { FC, memo } from 'react';
import { FileText, Send, ClipboardList, Users, School, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import type { BagrutStats } from '@/hooks/useBagrutStats';

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
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
    },
    {
      title: 'الامتحانات المنشورة',
      value: stats?.publishedExams?.toString() || '0',
      icon: Send,
      gradient: 'bg-gradient-to-br from-green-500 to-green-700',
    },
    {
      title: 'إجمالي المحاولات',
      value: stats?.totalAttempts?.toString() || '0',
      icon: ClipboardList,
      gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
    },
    {
      title: 'الطلاب المتقدمون',
      value: stats?.uniqueStudents?.toString() || '0',
      icon: Users,
      gradient: 'bg-gradient-to-br from-orange-500 to-orange-700',
    },
    {
      title: 'المدارس المشاركة',
      value: stats?.participatingSchools?.toString() || '0',
      icon: School,
      gradient: 'bg-gradient-to-br from-teal-500 to-teal-700',
    },
    {
      title: 'معدل النجاح',
      value: `${stats?.averageScore || 0}%`,
      icon: TrendingUp,
      gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {statsConfig.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          gradient={stat.gradient}
          loading={loading}
        />
      ))}
    </div>
  );
});

BagrutStatsCards.displayName = 'BagrutStatsCards';
