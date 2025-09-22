import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { UserCog, Plus, Trash2, Edit, Search, School } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const adminSchema = z.object({
  full_name: z.string().min(2, 'الاسم الكامل مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  school_id: z.string().min(1, 'يجب اختيار مدرسة'),
});

type AdminForm = z.infer<typeof adminSchema>;

interface SchoolAdmin {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  school_id?: string;
  school_name?: string;
  school_city?: string;
  school_plan?: string;
  school_status?: string;
  created_at: string;
  user_id: string;
  is_primary_admin?: boolean;
}

interface School {
  id: string;
  name: string;
  city?: string;
}

const SchoolAdminManagement = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<SchoolAdmin[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<SchoolAdmin | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      phone: '',
      school_id: '',
    },
  });

  const fetchSchoolAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          schools!profiles_school_id_fkey(name, city, plan, subscription_status)
        `)
        .eq('role', 'school_admin')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAdmins = data?.map(admin => ({
        id: admin.user_id,
        user_id: admin.user_id,
        full_name: admin.full_name,
        email: admin.email,
        phone: admin.phone,
        school_id: admin.school_id,
        school_name: admin.schools?.name,
        school_city: admin.schools?.city,
        school_plan: admin.schools?.plan,
        school_status: admin.schools?.subscription_status,
        created_at: admin.created_at,
        is_primary_admin: admin.is_primary_admin,
      })) || [];

      setAdmins(formattedAdmins);
    } catch (error) {
      logger.error('Error fetching school admins', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات مدراء المدارس",
        variant: "destructive",
      });
    }
  };

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, city')
        .order('name');

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      logger.error('Error fetching schools', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات المدارس",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Only load data if user has superadmin permissions
    if (userProfile?.role === 'superadmin') {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchSchoolAdmins(), fetchSchools()]);
        setLoading(false);
      };

      loadData();
    } else {
      setLoading(false);
    }
  }, [userProfile?.role]);

  const onSubmit = async (data: AdminForm) => {
    try {
      setLoading(true);

      if (editingAdmin) {
        // Update existing admin
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: data.full_name,
            phone: data.phone,
            school_id: data.school_id,
          })
          .eq('user_id', editingAdmin.user_id);

        if (updateError) throw updateError;

        toast({
          title: "تم التحديث",
          description: "تم تحديث بيانات مدير المدرسة بنجاح",
        });
      } else {
        // Create new admin using edge function
        const { data: functionData, error: functionError } = await supabase.functions.invoke('create-user-without-login', {
          body: {
            email: data.email,
            password: data.password || Math.random().toString(36).slice(-8),
            full_name: data.full_name,
            phone: data.phone,
            role: 'school_admin',
            school_id: data.school_id,
            is_primary_admin: true
          }
        });

        if (functionError) {
          logger.error('Edge function error', functionError);
          throw functionError;
        }

        if (!functionData?.success) {
          logger.error('Edge function returned error', null, { functionData });
          throw new Error(functionData?.error || 'Failed to create admin user');
        }

        toast({
          title: "تم إنشاء الحساب",
          description: "تم إنشاء مدير المدرسة بنجاح",
        });
      }

      await fetchSchoolAdmins();
      setIsDialogOpen(false);
      setEditingAdmin(null);
      form.reset();
    } catch (error: any) {
      logger.error('Error saving admin', error as Error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ بيانات مدير المدرسة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin: SchoolAdmin) => {
    setEditingAdmin(admin);
    form.reset({
      full_name: admin.full_name,
      email: admin.email,
      phone: admin.phone || '',
      school_id: admin.school_id || '',
      password: '', // Don't populate password for editing
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (admin: SchoolAdmin) => {
    if (!confirm('هل أنت متأكد من حذف هذا المدير؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    try {
      setLoading(true);

      // Delete the user (this will cascade delete the profile)
      const { error } = await supabase.auth.admin.deleteUser(admin.user_id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف مدير المدرسة بنجاح",
      });

      await fetchSchoolAdmins();
    } catch (error: any) {
      logger.error('Error deleting admin', error as Error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف مدير المدرسة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (admin.school_name && admin.school_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && admins.length === 0) {
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

  // Show permission error if not superadmin
  if (userProfile?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            ليس لديك صلاحية للوصول إلى هذه الصفحة. يجب أن تكون مدير أعلى للنظام.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="glass-card soft-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="w-12 h-12 gradient-electric rounded-full flex items-center justify-center">
                <UserCog className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">إدارة مدراء المدارس</CardTitle>
                <CardDescription>
                  إضافة وتعديل وحذف مدراء المدارس وتحديد المدرسة المكلفين بها
                </CardDescription>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-electric card-hover" onClick={() => {
                  setEditingAdmin(null);
                  form.reset();
                }}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مدير جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingAdmin ? 'تعديل مدير المدرسة' : 'إضافة مدير جديد'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAdmin ? 'تعديل بيانات مدير المدرسة' : 'إضافة مدير جديد للمدرسة'}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الكامل</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل الاسم الكامل" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="أدخل البريد الإلكتروني" 
                              {...field}
                              disabled={!!editingAdmin}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!editingAdmin && (
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="أدخل كلمة المرور (اختياري)" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل رقم الهاتف (اختياري)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="school_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المدرسة</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر المدرسة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {schools.map((school) => (
                                <SelectItem key={school.id} value={school.id}>
                                  {school.name} {school.city && `- ${school.city}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-reverse space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingAdmin(null);
                          form.reset();
                        }}
                      >
                        إلغاء
                      </Button>
                      <Button type="submit" disabled={loading} className="gradient-electric">
                        {loading ? 'جاري الحفظ...' : editingAdmin ? 'تحديث' : 'إضافة'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </div>

      {/* Search */}
      <Card className="glass-card soft-shadow">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث عن مدراء المدارس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card className="glass-card soft-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-reverse space-x-2">
            <UserCog className="w-5 h-5" />
            <span>مدراء المدارس ({filteredAdmins.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAdmins.length === 0 ? (
            <div className="text-center py-8">
              <UserCog className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد مدراء مدارس حتى الآن'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm ? 'جرب البحث بكلمات مختلفة' : 'ابدأ بإضافة مدير جديد'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">الهاتف</TableHead>
                  <TableHead className="text-right">المدرسة</TableHead>
                  <TableHead className="text-right">المدينة</TableHead>
                  <TableHead className="text-right">حالة الاشتراك</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.map((admin) => (
                  <TableRow key={admin.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-right">
                      <div className="flex items-center space-x-reverse space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {admin.full_name.charAt(0)}
                        </div>
                        <span>{admin.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm">{admin.email}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm">{admin.phone || '-'}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {admin.school_name ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                          <School className="w-3 h-3 ml-1" />
                          {admin.school_name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          غير محدد
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {admin.school_city || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {admin.school_status ? (
                        <Badge 
                          variant={admin.school_status === 'active' ? 'default' : 'secondary'}
                          className={admin.school_status === 'active' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }
                        >
                          {admin.school_status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(admin.created_at), 'dd.M.yyyy')}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-reverse space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(admin)}
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => !admin.is_primary_admin && handleDelete(admin)}
                          disabled={admin.is_primary_admin}
                          className={`h-8 w-8 p-0 ${
                            admin.is_primary_admin 
                              ? "text-muted-foreground cursor-not-allowed hover:text-muted-foreground hover:bg-muted/50" 
                              : "text-red-600 hover:text-red-700 hover:bg-red-100"
                          }`}
                          title={admin.is_primary_admin ? "لا يمكن حذف المدير الأساسي" : "حذف"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolAdminManagement;