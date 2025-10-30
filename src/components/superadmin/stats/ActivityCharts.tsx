import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateChart } from '@/utils/dateFormatting';
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
    // تجميع البيانات حسب التاريخ (أرقام فقط)
    const grouped = trends.reduce((acc: Record<string, any>, item) => {
      const dateKey = formatDateChart(item.date); // dd/MM
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          students: 0,
          teachers: 0,
          duration: 0,
          count: 0,
        };
      }
      acc[dateKey].students += item.total_active_students;
      acc[dateKey].teachers += item.total_active_teachers || 0;
      acc[dateKey].duration += item.avg_session_duration || 0;
      acc[dateKey].count++;
      return acc;
    }, {});

    return Object.values(grouped).map((item: any) => ({
      ...item,
      avgDuration: item.count > 0 ? Math.round(item.duration / item.count) : 0,
      avgTeachers: item.count > 0 ? Math.round(item.teachers / item.count) : 0,
    })).sort((a: any, b: any) => {
      const [dayA, monthA] = a.date.split('/').map(Number);
      const [dayB, monthB] = b.date.split('/').map(Number);
      return monthA === monthB ? dayA - dayB : monthA - monthB;
    });
  }, [trends]);

  return (
    <div className="space-y-6">
      {/* مخطط مقارنة الطلاب والمعلمين */}
      <Card>
        <CardHeader>
          <CardTitle>نشاط الطلاب والمعلمين</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="students" 
                stroke="hsl(var(--primary))" 
                name="الطلاب النشطين"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="avgTeachers" 
                stroke="#10b981" 
                name="المعلمين النشطين"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>نشاط الطلاب اليومي</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="students" 
                  fill="hsl(var(--primary))" 
                  name="عدد الطلاب"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
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
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="avgDuration" 
                  fill="#10b981" 
                  name="متوسط المدة"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
