import { Card, CardContent } from '@/components/ui/card';
import { Users, GraduationCap, Building2, Clock } from 'lucide-react';
import { formatNumber, formatDuration } from '@/utils/dateFormatting';

interface ActivityKPICardsProps {
  onlineStudents: number;
  onlineTeachers: number;
  activeSchools: number;
  avgSessionTime: number;
}

export const ActivityKPICards = ({
  onlineStudents,
  onlineTeachers,
  activeSchools,
  avgSessionTime
}: ActivityKPICardsProps) => {
  const cards = [
    {
      title: 'Students Online',
      value: formatNumber(onlineStudents),
      icon: GraduationCap,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Teachers Online',
      value: formatNumber(onlineTeachers),
      icon: Users,
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Active Schools',
      value: formatNumber(activeSchools),
      icon: Building2,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Avg Session',
      value: formatDuration(avgSessionTime),
      icon: Clock,
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
