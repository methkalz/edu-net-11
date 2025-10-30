import { Card, CardContent } from '@/components/ui/card';
import { School, Users, GraduationCap, Trophy } from 'lucide-react';

interface OverviewStats {
  total_schools: number;
  total_students: number;
  total_teachers: number;
  total_classes: number;
  avg_student_teacher_ratio: number;
  total_points: number;
  last_updated: string;
}

interface Props {
  stats: OverviewStats | null | undefined;
}

export const OverviewCards = ({ stats }: Props) => {
  if (!stats) return null;

  const cards = [
    {
      title: 'إجمالي المدارس',
      value: stats.total_schools.toLocaleString('ar-SA'),
      icon: School,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'إجمالي الطلاب',
      value: stats.total_students.toLocaleString('ar-SA'),
      subtitle: `نسبة ${stats.avg_student_teacher_ratio}:1 لكل معلم`,
      icon: Users,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'إجمالي المعلمين',
      value: stats.total_teachers.toLocaleString('ar-SA'),
      subtitle: `${stats.total_classes.toLocaleString('ar-SA')} صف دراسي`,
      icon: GraduationCap,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'إجمالي النقاط',
      value: stats.total_points.toLocaleString('ar-SA'),
      icon: Trophy,
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <h3 className="text-2xl font-bold">{card.value}</h3>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                  )}
                </div>
                <div className={`rounded-full p-3 bg-gradient-to-br ${card.gradient}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
