import { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Award,
  BarChart3,
  Activity
} from 'lucide-react';

interface QuickActionProps {
  name: string;
  icon: React.ElementType;
  path: string;
  onClick: () => void;
}

const QuickActionCard: FC<QuickActionProps> = ({ name, icon: Icon, onClick }) => (
  <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-primary/50">
    <CardContent className="p-4" onClick={onClick}>
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-medium text-sm">{name}</h3>
      </div>
    </CardContent>
  </Card>
);

interface QuickActionsGridProps {
  actions: Array<{
    name: string;
    icon: React.ElementType;
    path: string;
  }>;
  onActionClick: (path: string) => void;
}

export const QuickActionsGrid: FC<QuickActionsGridProps> = ({ actions, onActionClick }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>الإجراءات السريعة</CardTitle>
        <CardDescription>الوصول السريع للوظائف الأساسية</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <QuickActionCard
              key={index}
              {...action}
              onClick={() => onActionClick(action.path)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface RecentActivityItem {
  title: string;
  time: string;
  color: string;
  icon: React.ElementType;
}

interface RecentActivitiesProps {
  activities: RecentActivityItem[];
}

export const RecentActivities: FC<RecentActivitiesProps> = ({ activities }) => {
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      'green-neon': 'bg-green-100 text-green-800 border-green-200',
      'blue-electric': 'bg-blue-100 text-blue-800 border-blue-200',
      'orange-fire': 'bg-orange-100 text-orange-800 border-orange-200',
      'purple-mystic': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          الأنشطة الأخيرة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getColorClasses(activity.color)}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface PerformanceMetric {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

interface PerformanceCardsProps {
  metrics: PerformanceMetric[];
}

export const PerformanceCards: FC<PerformanceCardsProps> = ({ metrics }) => {
  const getGradientClass = (color: string) => {
    const gradientMap: Record<string, string> = {
      'blue-electric': 'gradient-electric',
      'orange-fire': 'gradient-fire',
      'green-neon': 'gradient-neon',
      'purple-mystic': 'gradient-sunset'
    };
    return gradientMap[color] || 'gradient-primary';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="border-0 overflow-hidden hover:scale-105 transition-transform duration-300">
          <CardContent className="p-0">
            <div className={`${getGradientClass(metric.color)} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">{metric.title}</p>
                  <h3 className="text-2xl font-bold">{metric.value}</h3>
                </div>
                <metric.icon className="h-8 w-8 opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};