/**
 * StatisticsChart Component - مكون الرسوم البيانية للإحصائيات
 * 
 * رسم بياني تفاعلي لعرض إحصائيات النشاط والأداء
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  date: string;
  المستخدمين: number;
  المحتوى: number;
  المشاريع: number;
  الألعاب: number;
}

interface StatisticsChartProps {
  data: ChartDataPoint[];
}

export const StatisticsChart: React.FC<StatisticsChartProps> = ({ data }) => {
  // تخصيص الألوان للرسم البياني
  const colors = {
    المستخدمين: '#8884d8',
    المحتوى: '#82ca9d',
    المشاريع: '#ffc658',
    الألعاب: '#ff7c7c'
  };

  // تخصيص tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{`التاريخ: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: '#6b7280' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px',
              fontSize: '14px',
              color: '#6b7280'
            }}
          />
          
          <Bar 
            dataKey="المستخدمين" 
            fill={colors.المستخدمين}
            radius={[2, 2, 0, 0]}
            animationDuration={1000}
          />
          <Bar 
            dataKey="المحتوى" 
            fill={colors.المحتوى}
            radius={[2, 2, 0, 0]}
            animationDuration={1200}
          />
          <Bar 
            dataKey="المشاريع" 
            fill={colors.المشاريع}
            radius={[2, 2, 0, 0]}
            animationDuration={1400}
          />
          <Bar 
            dataKey="الألعاب" 
            fill={colors.الألعاب}
            radius={[2, 2, 0, 0]}
            animationDuration={1600}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};