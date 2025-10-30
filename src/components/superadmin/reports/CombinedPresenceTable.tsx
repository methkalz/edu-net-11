import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { formatDuration } from '@/utils/dateFormatting';
import type { CombinedUser } from '@/hooks/useCombinedPresenceStats';

interface CombinedPresenceTableProps {
  users: CombinedUser[];
}

export const CombinedPresenceTable = ({ users }: CombinedPresenceTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'school_admin'>('all');

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

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
    const headers = ['Name', 'Email', 'Role', 'Status', 'Current Page', 'Session Time', 'School', 'Last Seen'];
    const rows = filteredUsers.map(user => [
      user.full_name,
      user.email,
      user.role,
      user.is_online ? 'Online' : 'Offline',
      user.current_page || 'N/A',
      formatDuration(user.total_time_minutes),
      user.school_name || 'N/A',
      user.last_seen_at ? new Date(user.last_seen_at).toISOString() : 'N/A'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presence-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Active Users</CardTitle>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <div className="flex gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'student', 'teacher', 'school_admin'].map((filter) => (
              <Button
                key={filter}
                variant={roleFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter(filter as any)}
              >
                {filter === 'all' ? 'All' : filter === 'school_admin' ? 'Admin' : filter}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Page</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.slice(0, 20).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.is_online ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          🟢 Online
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-50 text-gray-700 border-gray-200">
                          🟠 Offline
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.current_page || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDuration(user.total_time_minutes)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.school_name || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.last_seen_at 
                        ? formatDistanceToNow(new Date(user.last_seen_at), { addSuffix: true })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filteredUsers.length > 20 && (
          <div className="text-center text-sm text-gray-500 mt-4">
            Showing 20 of {filteredUsers.length} users
          </div>
        )}
      </CardContent>
    </Card>
  );
};
