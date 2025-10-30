import { Card, CardContent } from '@/components/ui/card';
import { School, Users, GraduationCap, BookOpen, TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber } from '@/utils/dateFormatting';

interface OverviewStats {
  total_schools: number;
  total_students: number;
  total_teachers: number;
  total_classes: number;
  avg_student_teacher_ratio: number;
  total_points: number;
  last_updated: string;
  schools_with_activity?: number;
}

interface Props {
  stats: OverviewStats | null | undefined;
}

export const OverviewCards = ({ stats }: Props) => {
  if (!stats) return null;

  const cards = [
    {
      title: 'إجمالي المدارس',
      value: formatNumber(stats.total_schools),
      subtitle: `${formatNumber(stats.schools_with_activity)} مدرسة نشطة`,
      icon: School,
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      title: 'إجمالي الطلاب',
      value: formatNumber(stats.total_students),
      subtitle: `نسبة ${formatNumber(stats.avg_student_teacher_ratio)}:1 لكل معلم`,
      icon: Users,
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
    },
    {
      title: 'إجمالي المعلمين',
      value: formatNumber(stats.total_teachers),
      subtitle: `${formatNumber(stats.total_classes)} صف دراسي`,
      icon: GraduationCap,
      gradient: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
    },
    {
      title: 'الصفوف الدراسية',
      value: formatNumber(stats.total_classes),
      subtitle: 'إجمالي الصفوف',
      icon: BookOpen,
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-500',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`rounded-xl p-3 ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <h3 className="text-3xl font-bold tracking-tight">{card.value}</h3>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {card.subtitle}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
