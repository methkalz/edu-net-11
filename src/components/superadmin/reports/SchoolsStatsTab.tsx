import { useCombinedPresenceStats } from '@/hooks/useCombinedPresenceStats';
import { SchoolComparisonChart } from './SchoolComparisonChart';
import { SchoolStatsCards } from './SchoolStatsCards';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const SchoolsStatsTab = () => {
  const { schoolStats, loading, error } = useCombinedPresenceStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading school statistics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* School Comparison Chart */}
      <SchoolComparisonChart schools={schoolStats} />

      {/* School Stats Cards */}
      <SchoolStatsCards schools={schoolStats} />
    </div>
  );
};
