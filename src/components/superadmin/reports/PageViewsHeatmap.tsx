import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { formatNumber } from '@/utils/dateFormatting';
import type { CombinedUser } from '@/hooks/useCombinedPresenceStats';

interface PageViewsHeatmapProps {
  users: CombinedUser[];
}

export const PageViewsHeatmap = ({ users }: PageViewsHeatmapProps) => {
  const pageStats = useMemo(() => {
    const pageMap = new Map<string, number>();

    users.forEach(user => {
      if (user.current_page && user.is_online) {
        const count = pageMap.get(user.current_page) || 0;
        pageMap.set(user.current_page, count + 1);
      }
    });

    return Array.from(pageMap.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [users]);

  const maxCount = Math.max(...pageStats.map(s => s.count), 1);

  const getIntensityColor = (count: number) => {
    const intensity = count / maxCount;
    if (intensity > 0.7) return 'bg-green-600 text-white';
    if (intensity > 0.4) return 'bg-green-400 text-white';
    if (intensity > 0.2) return 'bg-green-200 text-gray-900';
    return 'bg-green-50 text-gray-700';
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Top Pages (Current Activity)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pageStats.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No page view data available
          </div>
        ) : (
          <div className="space-y-3">
            {pageStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-6">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-900 truncate">
                    {stat.page}
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-md ${getIntensityColor(stat.count)}`}>
                  <span className="text-sm font-bold">
                    {formatNumber(stat.count)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
