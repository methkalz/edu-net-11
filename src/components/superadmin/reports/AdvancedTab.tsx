import { useCombinedPresenceStats } from '@/hooks/useCombinedPresenceStats';
import { LoginTrackingTable } from './LoginTrackingTable';
import { SessionDurationChart } from './SessionDurationChart';
import { PageViewsHeatmap } from './PageViewsHeatmap';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const AdvancedTab = () => {
  const { allUsers, loading, error } = useCombinedPresenceStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading advanced analytics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SessionDurationChart users={allUsers} />
        <PageViewsHeatmap users={allUsers} />
      </div>

      {/* Login Tracking Table */}
      <LoginTrackingTable users={allUsers} />
    </div>
  );
};
