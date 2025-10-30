import { useCombinedPresenceStats } from '@/hooks/useCombinedPresenceStats';
import { ActivityKPICards } from './ActivityKPICards';
import { RealTimeActivityChart } from './RealTimeActivityChart';
import { CombinedPresenceTable } from './CombinedPresenceTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';

export const LiveActivityTab = () => {
  const { stats, recentlyActive, allUsers, loading, error } = useCombinedPresenceStats();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (!loading) {
      setLastUpdate(new Date());
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading presence data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Last Update Info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Last updated: {formatDistanceToNow(lastUpdate, { addSuffix: true })}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <ActivityKPICards
        onlineStudents={stats.onlineStudents}
        onlineTeachers={stats.onlineTeachers}
        activeSchools={stats.activeSchools}
        avgSessionTime={stats.avgSessionTime}
      />

      {/* Real-Time Activity Chart */}
      <RealTimeActivityChart users={allUsers} />

      {/* Combined Presence Table */}
      <CombinedPresenceTable users={recentlyActive} />
    </div>
  );
};
