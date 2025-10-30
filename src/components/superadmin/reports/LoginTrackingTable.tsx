import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { formatNumber, formatDuration } from '@/utils/dateFormatting';
import type { CombinedUser } from '@/hooks/useCombinedPresenceStats';

interface LoginTrackingTableProps {
  users: CombinedUser[];
}

export const LoginTrackingTable = ({ users }: LoginTrackingTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort users by login count
  const sortedUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             user.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && user.login_count > 0;
      })
      .sort((a, b) => b.login_count - a.login_count);
  }, [users, searchQuery]);

  const getRoleBadge = (role: string) => {
    const roleMap = {
      student: { label: 'Student', class: 'bg-blue-50 text-blue-700 border-blue-200' },
      teacher: { label: 'Teacher', class: 'bg-green-50 text-green-700 border-green-200' },
      school_admin: { label: 'Admin', class: 'bg-purple-50 text-purple-700 border-purple-200' }
    };
    const config = roleMap[role as keyof typeof roleMap] || { label: role, class: '' };
    return <Badge className={config.class}>{config.label}</Badge>;
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Login Count', 'Last Login', 'Total Time', 'Avg Session'];
    const rows = sortedUsers.map(user => [
      user.full_name,
      user.email,
      user.role,
      user.login_count,
      user.last_login_at ? new Date(user.last_login_at).toISOString() : 'N/A',
      formatDuration(user.total_time_minutes),
      user.login_count > 0 ? formatDuration(user.total_time_minutes / user.login_count) : 'N/A'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `login-tracking-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <LogIn className="h-5 w-5 text-blue-600" />
            Login Tracking
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Login Count</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Total Time</TableHead>
                <TableHead>Avg Session</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No login data found
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.slice(0, 20).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                        {formatNumber(user.login_count)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.last_login_at 
                        ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDuration(user.total_time_minutes)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.login_count > 0 
                        ? formatDuration(Math.round(user.total_time_minutes / user.login_count))
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {sortedUsers.length > 20 && (
          <div className="text-center text-sm text-gray-500 mt-4">
            Showing 20 of {sortedUsers.length} users
          </div>
        )}
      </CardContent>
    </Card>
  );
};
