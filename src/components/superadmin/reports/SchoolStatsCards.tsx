import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, Clock, FileText } from 'lucide-react';
import { formatNumber, formatDuration } from '@/utils/dateFormatting';
import type { SchoolStats } from '@/hooks/useCombinedPresenceStats';

interface SchoolStatsCardsProps {
  schools: SchoolStats[];
}

export const SchoolStatsCards = ({ schools }: SchoolStatsCardsProps) => {
  if (schools.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No school data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {schools.map((school) => (
        <Card key={school.school_id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {school.school_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Active Students */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">Active Students</span>
              </div>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                {formatNumber(school.active_students)}
              </Badge>
            </div>

            {/* Active Teachers */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-600">Active Teachers</span>
              </div>
              <Badge className="bg-green-50 text-green-700 border-green-200">
                {formatNumber(school.active_teachers)}
              </Badge>
            </div>

            {/* Average Session Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-sm text-gray-600">Avg Session</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatDuration(school.avg_session_time)}
              </span>
            </div>

            {/* Total Session Time */}
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-sm text-gray-600">Total Time</span>
              <span className="text-sm font-bold text-gray-900">
                {formatDuration(school.total_session_time)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
