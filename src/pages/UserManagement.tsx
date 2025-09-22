import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { UserRoleManager } from '@/components/UserRoleManager';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Eye,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Download,
  Upload,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Mail,
  Phone,
  Activity,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash,
  Settings,
  UserMinus,
  Award,
  LogIn
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { PageLoading, DataLoading } from '@/components/ui/LoadingComponents';
import { logger } from '@/lib/logger';
import { PinLoginDialog } from '@/components/admin/PinLoginDialog';
import { OrphanedUsersCleanup } from '@/components/admin/OrphanedUsersCleanup';

interface User {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'superadmin' | 'school_admin' | 'teacher' | 'student' | 'parent';
  school_id?: string;
  is_primary_admin: boolean;
  created_at: string;
  updated_at: string;
  schools?: {
    name: string;
    plan: string;
  };
}

interface UserStats {
  totalUsers: number;
  superAdmins: number;
  schoolAdmins: number;
  teachers: number;
  students: number;
  parents: number;
  activeUsers: number;
  inactiveUsers: number;
}

const UserManagement: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    superAdmins: 0,
    schoolAdmins: 0,
    teachers: 0,
    students: 0,
    parents: 0,
    activeUsers: 0,
    inactiveUsers: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showPinLoginDialog, setShowPinLoginDialog] = useState(false);
  const [selectedUserForPin, setSelectedUserForPin] = useState<User | null>(null);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [editUserData, setEditUserData] = useState<{
    user_id: string;
    full_name: string;
    email: string;
    phone: string;
    role: 'superadmin' | 'school_admin' | 'teacher' | 'student' | 'parent';
  }>({
    user_id: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'student'
  });
  
  const usersPerPage = 10;

  // Redirect if not super admin
  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== 'superadmin')) {
      navigate('/dashboard');
    }
  }, [user, userProfile, loading, navigate]);

  // Fetch users and statistics
  useEffect(() => {
    if (userProfile?.role === 'superadmin') {
      fetchUsers();
    }
  }, [userProfile]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          email,
          phone,
          role,
          school_id,
          is_primary_admin,
          created_at,
          updated_at,
          schools (
            name,
            plan
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedUsers = usersData || [];
      setUsers(processedUsers);
      setFilteredUsers(processedUsers);
      
      // Calculate statistics
      const statsData: UserStats = {
        totalUsers: processedUsers.length,
        superAdmins: processedUsers.filter(u => u.role === 'superadmin').length,
        schoolAdmins: processedUsers.filter(u => u.role === 'school_admin').length,
        teachers: processedUsers.filter(u => u.role === 'teacher').length,
        students: processedUsers.filter(u => u.role === 'student').length,
        parents: processedUsers.filter(u => u.role === 'parent').length,
        activeUsers: processedUsers.length, // Assuming all users are active for now
        inactiveUsers: 0
      };
      
      setStats(statsData);
    } catch (error) {
      logger.error('Error fetching users', error as Error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات المستخدمين",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // School filter
    if (schoolFilter !== 'all') {
      filtered = filtered.filter(user => user.school_id === schoolFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, schoolFilter, statusFilter, users]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const getRoleBadge = (role: string) => {
    const badges = {
      superadmin: { label: 'مدير النظام الرئيسي', variant: 'destructive' as const },
      school_admin: { label: 'مدير مدرسة', variant: 'default' as const },
      teacher: { label: 'معلم', variant: 'secondary' as const },
      student: { label: 'طالب', variant: 'outline' as const },
      parent: { label: 'ولي أمر', variant: 'outline' as const }
    };
    
    return badges[role as keyof typeof badges] || { label: role, variant: 'outline' as const };
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.M.yyyy');
  };

  const handleUserAction = async (action: string, userId: string) => {
    try {
      // Check if user is superadmin and action is delete
      const userToDelete = users.find(u => u.user_id === userId);
      if (action === 'delete' && userToDelete?.role === 'superadmin') {
        toast({
          title: "خطأ",
          description: "لا يمكن حذف حسابات مدراء النظام الرئيسيين",
          variant: "destructive",
        });
        return;
      }

      switch (action) {
        case 'edit':
          // Open edit dialog/form
          setEditUserData({
            user_id: userId,
            full_name: userToDelete?.full_name || '',
            email: userToDelete?.email || '',
            phone: userToDelete?.phone || '',
            role: userToDelete?.role || 'student'
          });
          setShowEditDialog(true);
          break;
          
        case 'reset_password':
          // Send password reset email
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            userToDelete?.email || '', 
            { redirectTo: `${window.location.origin}/auth` }
          );
          
          if (resetError) throw resetError;
          
          toast({
            title: "تم إرسال الرابط",
            description: `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${userToDelete?.email}`,
          });
          break;
          
        case 'suspend':
          // Update user status to suspended
          const { error: suspendError } = await supabase
            .from('profiles')
            .update({ 
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
            
          if (suspendError) throw suspendError;
          
          toast({
            title: "تم إيقاف المستخدم",
            description: "تم إيقاف المستخدم مؤقتاً بنجاح",
          });
          
          fetchUsers();
          break;
          
        case 'activate':
          // Update user status to active
          const { error: activateError } = await supabase
            .from('profiles')
            .update({ 
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
            
          if (activateError) throw activateError;
          
          toast({
            title: "تم تفعيل المستخدم",
            description: "تم تفعيل المستخدم بنجاح",
          });
          
          fetchUsers();
          break;
          
        case 'delete':
          // Show confirmation dialog for deletion  
          setUserToDelete(userId);
          setShowDeleteDialog(true);
          break;
      }
    } catch (error) {
      logger.error('Error performing user action', error as Error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تنفيذ العملية",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      // Find user details first
      const userDetails = users.find(u => u.user_id === userToDelete);
      
      console.log('Deleting user:', userDetails);
      
      // إذا كان المستخدم طالب، احذفه من جدول students أولاً (cascade delete سيحذف من class_students)
      if (userDetails?.role === 'student') {
        console.log('Deleting from students table...');
        const { error: studentError } = await supabase
          .from('students')
          .delete()
          .eq('user_id', userToDelete);

        if (studentError) {
          console.error('Error deleting from students:', studentError);
          throw studentError;
        }
        
        // Also delete by email as fallback
        const { error: studentEmailError } = await supabase
          .from('students')
          .delete()
          .eq('email', userDetails?.email);

        if (studentEmailError) {
          console.error('Error deleting student by email:', studentEmailError);
        }
      }
      
      // Delete user profile (this will cascade to other related data)
      console.log('Deleting from profiles table...');
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userToDelete);
      
      if (error) {
        console.error('Error deleting from profiles:', error);
        throw error;
      }
      
      // Delete from auth.users using admin API
      console.log('Deleting from auth.users...');
      const { error: authError } = await supabase.auth.admin.deleteUser(userToDelete);
      
      if (authError) {
        console.error('Error deleting from auth.users:', authError);
        // Don't throw error for auth deletion as it might not be critical
      }
      
      toast({
        title: "تم حذف المستخدم نهائياً",
        description: "تم حذف المستخدم وجميع بياناته بشكل نهائي",
      });
      
      setShowDeleteDialog(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      logger.error('Error deleting user', error as Error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف المستخدم",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editUserData.full_name,
          phone: editUserData.phone,
          role: editUserData.role,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', editUserData.user_id);
      
      if (error) throw error;
      
      toast({
        title: "تم تحديث المستخدم",
        description: "تم تحديث بيانات المستخدم بنجاح",
      });
      
      setShowEditDialog(false);
      fetchUsers();
    } catch (error) {
      logger.error('Error updating user', error as Error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث المستخدم",
        variant: "destructive",
      });
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map(user => user.user_id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Filter out superadmin users
      const superAdminUsers = selectedUsers.filter(userId => {
        const user = users.find(u => u.user_id === userId);
        return user?.role === 'superadmin';
      });

      const nonSuperAdminUsers = selectedUsers.filter(userId => {
        const user = users.find(u => u.user_id === userId);
        return user?.role !== 'superadmin';
      });

      if (superAdminUsers.length > 0) {
        toast({
          title: "تحذير",
          description: `تم تجاهل ${superAdminUsers.length} من حسابات مدراء النظام الرئيسيين`,
          variant: "destructive",
        });
      }

      if (nonSuperAdminUsers.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا توجد مستخدمين قابلين للحذف في التحديد",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('user_id', nonSuperAdminUsers);

      if (error) throw error;

      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف ${nonSuperAdminUsers.length} مستخدم`,
      });

      setSelectedUsers([]);
      setShowBulkDeleteDialog(false);
      fetchUsers();
    } catch (error) {
      logger.error('Error bulk deleting users', error as Error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف المستخدمين",
        variant: "destructive",
      });
    }
  };

  if (loading || userProfile?.role !== 'superadmin') {
    return <PageLoading message="Loading..." />;
  }

  const statsCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'مدراء النظام',
      value: stats.superAdmins,
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'مدراء المدارس',
      value: stats.schoolAdmins,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'المعلمين',
      value: stats.teachers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'الطلاب',
      value: stats.students,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'أولياء الأمور',
      value: stats.parents,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'المستخدمين النشطين',
      value: stats.activeUsers,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  // Show role manager if requested
  if (showRoleManager) {
    return <UserRoleManager onBack={() => setShowRoleManager(false)} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader 
        title="إدارة المستخدمين" 
        showBackButton={true} 
        showLogout={true} 
      />

      <div className="container mx-auto px-6 py-6 space-y-6 arabic-text">{/* Statistics Cards */}
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {statsCards.map((stat, index) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Orphaned Users Cleanup - Superadmin Only */}
          {userProfile?.role === 'superadmin' && (
            <OrphanedUsersCleanup />
          )}
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4" dir="rtl">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث بالاسم أو الإيميل أو رقم الهاتف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 text-right"
                    dir="rtl"
                  />
                </div>
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="فلترة حسب الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  <SelectItem value="superadmin">مدير النظام الرئيسي</SelectItem>
                  <SelectItem value="school_admin">مدير مدرسة</SelectItem>
                  <SelectItem value="teacher">معلم</SelectItem>
                  <SelectItem value="student">طالب</SelectItem>
                  <SelectItem value="parent">ولي أمر</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchUsers}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl">قائمة المستخدمين</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredUsers.length} مستخدم • الصفحة {currentPage} من {totalPages}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRoleManager(true)}
                  className="h-8"
                >
                  <Settings className="h-3 w-3 ml-1" />
                  إدارة الأدوار
                </Button>
                {selectedUsers.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg animate-in slide-in-from-top-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedUsers.length} محدد
                    </Badge>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setShowBulkDeleteDialog(true)}
                      className="h-8"
                    >
                      <Trash className="h-3 w-3 ml-1" />
                      حذف المحدد
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-20 text-center">
                      <Checkbox
                        checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="تحديد الكل"
                      />
                    </TableHead>
                    <TableHead className="text-right w-80 pr-[30px]">المستخدم</TableHead>
                    <TableHead className="text-right w-36">الدور</TableHead>
                    <TableHead className="text-right w-36">المدرسة</TableHead>
                    <TableHead className="text-right w-32">تاريخ التسجيل</TableHead>
                    <TableHead className="text-right w-20">الحالة</TableHead>
                    <TableHead className="text-center w-24">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-3">
                          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                          <p className="text-muted-foreground">جاري التحميل...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : currentUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-3">
                          <Users className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">لا توجد نتائج</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentUsers.map((user) => (
                      <TableRow key={user.user_id} className="hover:bg-muted/50">
                        <TableCell className="text-center">
                          <div className="flex justify-center items-center">
                            <Checkbox
                              checked={selectedUsers.includes(user.user_id)}
                              onCheckedChange={() => handleSelectUser(user.user_id)}
                              aria-label={`تحديد ${user.full_name}`}
                              disabled={user.role === 'superadmin'}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="pr-[30px]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{user.full_name || 'غير محدد'}</p>
                              <p className="text-xs text-muted-foreground flex items-center mt-1 truncate">
                                <Mail className="h-3 w-3 ml-1 flex-shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </p>
                              {user.phone && (
                                <p className="text-xs text-muted-foreground flex items-center mt-1">
                                  <Phone className="h-3 w-3 ml-1 flex-shrink-0" />
                                  <span className="truncate">{user.phone}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                         <TableCell>
                           <div className="space-y-1">
                             <Badge variant={getRoleBadge(user.role).variant} className="text-xs">
                               {getRoleBadge(user.role).label}
                             </Badge>
                             {user.is_primary_admin && (
                               <Badge variant="outline" className="text-xs block">
                                 رئيسي
                               </Badge>
                             )}
                           </div>
                         </TableCell>
                         <TableCell>
                           <span className="text-sm">
                             {user.schools?.name || 'غير مرتبط'}
                           </span>
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center text-xs text-muted-foreground">
                             <Calendar className="h-3 w-3 ml-1" />
                             <span>{formatDate(user.created_at)}</span>
                           </div>
                         </TableCell>
                         <TableCell>
                           <Badge variant="outline" className="text-green-600 text-xs">
                             <CheckCircle className="h-3 w-3 ml-1" />
                             نشط
                           </Badge>
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center justify-center gap-1">
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => {
                                 setSelectedUser(user);
                                 setShowUserDetails(true);
                               }}
                               className="h-8 w-8 p-0"
                               title="عرض التفاصيل"
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => {
                                 setSelectedUserForPin(user);
                                 setShowPinLoginDialog(true);
                               }}
                               className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                               title="الدخول للحساب"
                             >
                               <LogIn className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleUserAction('delete', user.user_id)}
                               className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                               disabled={user.role === 'superadmin'}
                               title="حذف المستخدم"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                         </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t px-6 py-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">تأكيد الحذف الجماعي</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              هل أنت متأكد من حذف {selectedUsers.length} مستخدم؟ 
              {selectedUsers.some(id => users.find(u => u.user_id === id)?.role === 'superadmin') && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-amber-800 text-sm">
                    تنبيه: سيتم تجاهل حسابات مدراء النظام الرئيسيين من عملية الحذف
                  </p>
                </div>
              )}
              <br />
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 justify-center">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh]" dir="rtl">
          <DialogHeader className="text-center">
            <DialogTitle>تفاصيل المستخدم</DialogTitle>
            <DialogDescription>
              معلومات مفصلة عن المستخدم المحدد
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
                  <TabsTrigger value="details">التفاصيل</TabsTrigger>
                  <TabsTrigger value="actions">الإجراءات</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 mt-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Profile Section */}
                      <div className="md:col-span-1 text-center">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg mb-4">
                          <Users className="h-12 w-12 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">{selectedUser.full_name || 'غير محدد'}</h3>
                        <Badge variant={getRoleBadge(selectedUser.role).variant} className="text-sm px-3 py-1">
                          {getRoleBadge(selectedUser.role).label}
                        </Badge>
                        {selectedUser.is_primary_admin && (
                          <Badge variant="outline" className="text-xs mt-2 block w-fit mx-auto">
                            🏆 مدير رئيسي
                          </Badge>
                        )}
                      </div>
                      
                      {/* Contact Information */}
                      <div className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Mail className="h-4 w-4 text-blue-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-600">البريد الإلكتروني</p>
                            </div>
                            <p className="font-semibold text-gray-800 text-sm break-all">{selectedUser.email}</p>
                          </div>
                          
                          {selectedUser.phone && (
                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                  <Phone className="h-4 w-4 text-green-600" />
                                </div>
                                <p className="text-sm font-medium text-gray-600">رقم الهاتف</p>
                              </div>
                              <p className="font-semibold text-gray-800 text-sm">{selectedUser.phone}</p>
                            </div>
                          )}
                          
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Shield className="h-4 w-4 text-purple-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-600">نوع الحساب</p>
                            </div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {selectedUser.is_primary_admin ? '👑 مدير رئيسي' : '👤 مستخدم عادي'}
                            </p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-orange-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-600">تاريخ الانضمام</p>
                            </div>
                            <p className="font-semibold text-gray-800 text-sm">{formatDate(selectedUser.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6 mt-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* School Information Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                            <Shield className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">معلومات المدرسة</h3>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Shield className="h-4 w-4 text-emerald-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-600">اسم المدرسة</p>
                            </div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {selectedUser.schools?.name || '🏫 غير مرتبط بمدرسة'}
                            </p>
                          </div>
                          
                          {selectedUser.schools?.plan && (
                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                  <Award className="h-4 w-4 text-purple-600" />
                                </div>
                                <p className="text-sm font-medium text-gray-600">خطة المدرسة</p>
                              </div>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                📦 {selectedUser.schools.plan}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Activity Information Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                            <Activity className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">معلومات النشاط</h3>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-blue-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-600">تاريخ التسجيل</p>
                            </div>
                            <p className="font-semibold text-gray-800 text-sm">
                              📅 {formatDate(selectedUser.created_at)}
                            </p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <RefreshCw className="h-4 w-4 text-indigo-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-600">آخر تحديث</p>
                            </div>
                            <p className="font-semibold text-gray-800 text-sm">
                              🔄 {formatDate(selectedUser.updated_at)}
                            </p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-600">حالة الحساب</p>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              ✅ نشط
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold mb-2">إجراءات المستخدم</h4>
                      <p className="text-muted-foreground text-sm">
                        يمكنك تنفيذ الإجراءات التالية على هذا المستخدم
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              setShowUserDetails(false);
                              handleUserAction('edit', selectedUser.user_id);
                            }}
                          >
                            <Edit className="h-4 w-4 ml-2" />
                            تعديل المعلومات
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            تعديل البيانات الأساسية للمستخدم
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              setShowUserDetails(false);
                              handleUserAction('reset_password', selectedUser.user_id);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 ml-2" />
                            إعادة تعيين كلمة المرور
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            إرسال رابط إعادة تعيين كلمة المرور
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              setShowUserDetails(false);
                              handleUserAction('suspend', selectedUser.user_id);
                            }}
                          >
                            <UserX className="h-4 w-4 ml-2" />
                            إيقاف مؤقت
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            تجميد الحساب مؤقتاً
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-red-200">
                        <CardContent className="p-4">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              setShowUserDetails(false);
                              handleUserAction('delete', selectedUser.user_id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف المستخدم
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            حذف المستخدم نهائياً من النظام
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4" dir="rtl">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-amber-800">تنبيه مهم</h5>
                          <p className="text-sm text-amber-700 mt-1">
                            بعض الإجراءات مثل حذف المستخدم لا يمكن التراجع عنها. تأكد من صحة الإجراء قبل التنفيذ.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Individual Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">تأكيد حذف المستخدم</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 justify-center">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تحرير بيانات المستخدم</DialogTitle>
            <DialogDescription>
              قم بتحديث المعلومات الأساسية للمستخدم
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">الاسم الكامل</label>
              <Input
                value={editUserData.full_name}
                onChange={(e) => setEditUserData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="الاسم الكامل"
                className="mt-1"
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-sm font-medium">رقم الهاتف</label>
              <Input
                value={editUserData.phone}
                onChange={(e) => setEditUserData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="رقم الهاتف"
                className="mt-1"
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الدور</label>
              <Select 
                value={editUserData.role} 
                onValueChange={(value: any) => setEditUserData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">طالب</SelectItem>
                  <SelectItem value="teacher">معلم</SelectItem>
                  <SelectItem value="parent">ولي أمر</SelectItem>
                  <SelectItem value="school_admin">مدير مدرسة</SelectItem>
                  <SelectItem value="superadmin">مدير النظام</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowEditDialog(false)} variant="outline" className="flex-1">
                إلغاء
              </Button>
              <Button onClick={handleEditUser} className="flex-1">
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Login Dialog */}
      <PinLoginDialog
        open={showPinLoginDialog}
        onOpenChange={setShowPinLoginDialog}
        targetUser={selectedUserForPin}
      />
      
      <AppFooter />
    </div>
  );
};

export default UserManagement;