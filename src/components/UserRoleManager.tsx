import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Edit, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { UniversalAvatar } from '@/components/shared/UniversalAvatar';
import { UserTitleBadge } from '@/components/shared/UserTitleBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface User {
  user_id: string;
  full_name: string;
  email: string;
  role: 'superadmin' | 'school_admin' | 'teacher' | 'student' | 'parent';
  phone?: string;
  created_at: string;
  school_id?: string;
  avatar_url?: string;
  display_title?: string;
  points?: number;
  level?: number;
}

interface UserRoleManagerProps {
  onBack: () => void;
}

const roleLabels = {
  'student': 'طالب',
  'teacher': 'معلم', 
  'school_admin': 'مدير مدرسة',
  'superadmin': 'مدير النظام',
  'parent': 'ولي أمر'
};

const roleColors = {
  'student': 'bg-blue-100 text-blue-800',
  'teacher': 'bg-green-100 text-green-800',
  'school_admin': 'bg-purple-100 text-purple-800',
  'superadmin': 'bg-red-100 text-red-800',
  'parent': 'bg-yellow-100 text-yellow-800'
};

export const UserRoleManager: React.FC<UserRoleManagerProps> = ({ onBack }) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, [userProfile?.school_id]);

  useEffect(() => {
    // Filter users based on search term
    const filtered = users.filter(user => 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const loadUsers = async () => {
    if (!userProfile?.school_id) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('user_id, full_name, email, role, phone, created_at, school_id, avatar_url, display_title, points, level')
        .order('created_at', { ascending: false });

      // If not superadmin, only show users from same school
      if (userProfile.role !== 'superadmin') {
        query = query.eq('school_id', userProfile.school_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      logger.error('Error loading users', error as Error);
      toast({
        variant: "destructive",
        title: "خطأ في تحميل البيانات",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: string, role: 'superadmin' | 'school_admin' | 'teacher' | 'student' | 'parent') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "تم تحديث الدور بنجاح",
        description: "تم تحديث دور المستخدم بنجاح"
      });

      setEditingUser(null);
      setNewRole('');
      loadUsers();
    } catch (error: any) {
      logger.error('Error updating user role', error as Error);
      toast({
        variant: "destructive",
        title: "خطأ في تحديث الدور",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (user: User) => {
    setEditingUser(user.user_id);
    setNewRole(user.role);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setNewRole('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 gradient-electric rounded-full animate-gentle-float flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">إدارة أدوار المستخدمين</h1>
            <p className="text-muted-foreground mt-1">
              إدارة وتعديل أدوار المستخدمين في النظام
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            البحث والفلترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">البحث بالاسم أو البريد الإلكتروني</Label>
              <Input
                id="search"
                type="text"
                placeholder="ابحث عن مستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>المستخدمون ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مستخدمون مطابقون للبحث</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <UniversalAvatar
                      avatarUrl={user.avatar_url}
                      userName={user.full_name}
                      size="lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{user.full_name}</h3>
                        <UserTitleBadge
                          role={user.role}
                          displayTitle={user.display_title}
                          points={user.points}
                          level={user.level}
                          size="md"
                          variant="default"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingUser === user.user_id ? (
                      <div className="flex items-center gap-2">
                        <Select value={newRole} onValueChange={setNewRole}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="اختر الدور" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">طالب</SelectItem>
                            <SelectItem value="teacher">معلم</SelectItem>
                            <SelectItem value="school_admin">مدير مدرسة</SelectItem>
                            {userProfile?.role === 'superadmin' && (
                              <SelectItem value="superadmin">مدير النظام</SelectItem>
                            )}
                            <SelectItem value="parent">ولي أمر</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleRoleUpdate(user.user_id, newRole as 'superadmin' | 'school_admin' | 'teacher' | 'student' | 'parent')}
                          disabled={!newRole || newRole === user.role}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(user)}
                        disabled={user.user_id === userProfile?.user_id}
                      >
                        <Edit className="w-4 h-4 ml-1" />
                        تعديل الدور
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-800">تنبيه مهم:</p>
              <p className="text-yellow-700 mt-1">
                تغيير دور المستخدم سيؤثر على صلاحياته في النظام. تأكد من اختيار الدور المناسب قبل الحفظ.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};