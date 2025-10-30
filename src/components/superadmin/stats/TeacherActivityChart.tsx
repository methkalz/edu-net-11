import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  date: string;
  students: number;
  teachers: number;
  avgTeachers: number;
}

interface Props {
  data: ChartData[];
}

export const TeacherActivityChart = ({ data }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>مقارنة نشاط الطلاب والمعلمين</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="students"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorStudents)"
              name="الطلاب النشطين"
            />
            <Area
              type="monotone"
              dataKey="avgTeachers"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorTeachers)"
              name="المعلمين النشطين"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
