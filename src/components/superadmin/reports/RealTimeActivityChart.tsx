import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import { formatDateChart } from '@/utils/dateFormatting';
import type { CombinedUser } from '@/hooks/useCombinedPresenceStats';

interface RealTimeActivityChartProps {
  users: CombinedUser[];
}

export const RealTimeActivityChart = ({ users }: RealTimeActivityChartProps) => {
  const chartData = useMemo(() => {
    // Group users by hour for the last 24 hours
    const now = new Date();
    const last24Hours = Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return {
        hour: time.getHours(),
        time: formatDateChart(time, 'time'),
        students: 0,
        teachers: 0,
        admins: 0
      };
    });

    users.forEach(user => {
      if (!user.last_seen_at) return;
      
      const lastSeen = new Date(user.last_seen_at);
      const hoursDiff = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60));
      
      if (hoursDiff < 24 && hoursDiff >= 0) {
        const dataIndex = 23 - hoursDiff;
        if (user.role === 'student') {
          last24Hours[dataIndex].students++;
        } else if (user.role === 'teacher') {
          last24Hours[dataIndex].teachers++;
        } else if (user.role === 'school_admin') {
          last24Hours[dataIndex].admins++;
        }
      }
    });

    return last24Hours;
  }, [users]);

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Real-Time Activity (Last 24 Hours)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
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
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="students" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              name="Students"
            />
            <Line 
              type="monotone" 
              dataKey="teachers" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              name="Teachers"
            />
            <Line 
              type="monotone" 
              dataKey="admins" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
              name="Admins"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
