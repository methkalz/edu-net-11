import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { formatNumber } from '@/utils/dateFormatting';

interface SchoolStats {
  school_id: string;
  school_name: string;
  city: string;
  package_name: string;
  total_students: number;
  total_teachers: number;
  total_classes: number;
  student_teacher_ratio: number;
  avg_student_points: number;
  total_points: number;
}

interface Props {
  schools: SchoolStats[];
}

export const SchoolsTable = ({ schools }: Props) => {
  const [search, setSearch] = useState('');

  const filteredSchools = schools.filter(school =>
    school.school_name.includes(search) || school.city?.includes(search)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>إحصائيات المدارس</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن مدرسة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-3 font-semibold">المدرسة</th>
                <th className="text-right py-3 font-semibold">المدينة</th>
                <th className="text-right py-3 font-semibold">الباقة</th>
                <th className="text-right py-3 font-semibold">الطلاب</th>
                <th className="text-right py-3 font-semibold">المعلمين</th>
                <th className="text-right py-3 font-semibold">الصفوف</th>
                <th className="text-right py-3 font-semibold">النسبة</th>
                <th className="text-right py-3 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map((school) => (
                <tr 
                  key={school.school_id}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 font-medium">{school.school_name}</td>
                  <td className="py-3">{school.city || '-'}</td>
                  <td className="py-3">
                    <Badge variant="outline">{school.package_name || '-'}</Badge>
                  </td>
                  <td className="py-3">{formatNumber(school.total_students)}</td>
                  <td className="py-3">{formatNumber(school.total_teachers)}</td>
                  <td className="py-3">{formatNumber(school.total_classes)}</td>
                  <td className="py-3">
                    <Badge variant="secondary">
                      {school.student_teacher_ratio}:1
                    </Badge>
                  </td>
                  <td className="py-3">
                    {school.total_students > 0 ? (
                      <Badge variant="default" className="bg-green-500">
                        نشطة
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        غير نشطة
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSchools.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    لا توجد مدارس
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
