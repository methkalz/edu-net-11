import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ActivityTrend {
  date: string;
  total_active_students: number;
  avg_session_duration: number;
  peak_hour: number;
  school_name: string;
}

interface Props {
  trends: ActivityTrend[];
}

export const ActivityCharts = ({ trends }: Props) => {
  const chartData = useMemo(() => {
    // تجميع البيانات حسب التاريخ
    const grouped = trends.reduce((acc: Record<string, any>, item) => {
      const date = new Date(item.date).toLocaleDateString('ar-SA', {
        month: 'short',
        day: 'numeric'
      });
      if (!acc[date]) {
        acc[date] = {
          date,
          students: 0,
          duration: 0,
          count: 0,
        };
      }
      acc[date].students += item.total_active_students;
      acc[date].duration += item.avg_session_duration || 0;
      acc[date].count++;
      return acc;
    }, {});

    return Object.values(grouped).map((item: any) => ({
      ...item,
      avgDuration: item.count > 0 ? Math.round(item.duration / item.count) : 0,
    })).reverse();
  }, [trends]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>نشاط الطلاب اليومي</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="students" 
                stroke="hsl(var(--primary))" 
                name="عدد الطلاب النشطين"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>متوسط مدة الجلسات (دقيقة)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="avgDuration" 
                fill="hsl(var(--primary))" 
                name="متوسط المدة"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
