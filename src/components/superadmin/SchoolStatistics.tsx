import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSuperadminStats } from '@/hooks/useSuperadminStats';
import { OverviewCards } from './stats/OverviewCards';
import { SchoolsTable } from './stats/SchoolsTable';
import { ActivityCharts } from './stats/ActivityCharts';
import { ActivityStats } from './stats/ActivityStats';
import { PageLoading } from '@/components/ui/LoadingComponents';
import { BarChart, School, TrendingUp, Activity } from 'lucide-react';

export const SchoolStatistics = () => {
  const { overviewStats, schoolsStats, activityTrends, isLoading } = useSuperadminStats();

  if (isLoading) {
    return <PageLoading message="جاري تحميل الإحصائيات..." />;
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات عامة */}
      <OverviewCards stats={overviewStats} />

      {/* التابات */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            النشاط
          </TabsTrigger>
          <TabsTrigger value="schools" className="gap-2">
            <School className="h-4 w-4" />
            المدارس
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart className="h-4 w-4" />
            التحليلات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-6">
          <ActivityStats 
            schools={schoolsStats || []}
            trends={activityTrends || []}
          />
        </TabsContent>

        <TabsContent value="schools" className="mt-6">
          <SchoolsTable schools={schoolsStats || []} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <ActivityCharts trends={activityTrends || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
