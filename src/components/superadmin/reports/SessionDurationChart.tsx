import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';
import { formatNumber } from '@/utils/dateFormatting';
import type { CombinedUser } from '@/hooks/useCombinedPresenceStats';

interface SessionDurationChartProps {
  users: CombinedUser[];
}

export const SessionDurationChart = ({ users }: SessionDurationChartProps) => {
  const chartData = useMemo(() => {
    const buckets = [
      { name: '0-15m', min: 0, max: 15, count: 0 },
      { name: '15-30m', min: 15, max: 30, count: 0 },
      { name: '30-60m', min: 30, max: 60, count: 0 },
      { name: '1-2h', min: 60, max: 120, count: 0 },
      { name: '2h+', min: 120, max: Infinity, count: 0 }
    ];

    users.forEach(user => {
      const minutes = user.total_time_minutes;
      if (minutes > 0) {
        const bucket = buckets.find(b => minutes >= b.min && minutes < b.max);
        if (bucket) bucket.count++;
      }
    });

    return buckets;
  }, [users]);

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Session Duration Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [formatNumber(value), 'Sessions']}
            />
            <Bar 
              dataKey="count" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
