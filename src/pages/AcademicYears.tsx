import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive, Trash2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AcademicYearForm } from '@/components/AcademicYearForm';
import { format } from 'date-fns';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { ComponentLoading } from '@/components/ui/LoadingComponents';
import { useAuth } from '@/hooks/useAuth';

interface AcademicYear {
  id: string;
  name: string;
  start_at_utc: string;
  end_at_utc: string;
  granularity: 'year' | 'month' | 'day';
  status: 'active' | 'archived';
  created_at_utc: string;
}

const AcademicYears = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [filteredYears, setFilteredYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  // التحقق من أن المستخدم سوبر آدمن
  const isSuperAdmin = userProfile?.role === 'superadmin';

  // إعادة توجيه إذا لم يكن سوبر آدمن
  useEffect(() => {
    if (userProfile && !isSuperAdmin) {
      toast({
        title: 'غير مصرح',
        description: 'هذه الصفحة مخصصة للسوبر آدمن فقط',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [userProfile, isSuperAdmin, navigate, toast]);

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_at_utc', { ascending: false });

      if (error) throw error;
      setAcademicYears(data as AcademicYear[] || []);
      setFilteredYears(data as AcademicYear[] || []);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في جلب السنوات الدراسية',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    let filtered = academicYears;

    if (searchTerm) {
      filtered = filtered.filter(year =>
        year.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(year => year.status === statusFilter);
    }

    setFilteredYears(filtered);
  }, [academicYears, searchTerm, statusFilter]);

  const handleArchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from('academic_years')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;

      // تسجيل في audit log
      await supabase.from('audit_log').insert({
        actor_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'archive',
        entity: 'academic_year',
        entity_id: id,
        payload_json: { status: 'archived' }
      });

      toast({
        title: 'نجح',
        description: 'تم أرشفة السنة الدراسية بنجاح',
      });

      fetchAcademicYears();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في أرشفة السنة الدراسية',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف السنة الدراسية "${name}" نهائياً؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // تسجيل في audit log
      await supabase.from('audit_log').insert({
        actor_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'delete',
        entity: 'academic_year',
        entity_id: id,
        payload_json: { name }
      });

      toast({
        title: 'نجح',
        description: 'تم حذف السنة الدراسية بنجاح',
      });

      fetchAcademicYears();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف السنة الدراسية',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (year: AcademicYear) => {
    setEditingYear(year);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingYear(null);
    fetchAcademicYears();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.M.yyyy HH:mm');
  };

  const getGranularityLabel = (granularity: string) => {
    switch (granularity) {
      case 'year': return 'سنة/سنة';
      case 'month': return 'شهر/سنة';
      case 'day': return 'يوم/شهر/سنة';
      default: return granularity;
    }
  };

  if (loading || !userProfile) {
    return <ComponentLoading message="Loading..." />;
  }

  // عدم عرض الصفحة إذا لم يكن سوبر آدمن
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader 
        title="إدارة السنوات الدراسية" 
        showBackButton={true} 
        showLogout={true} 
      />
      
      <div className="container mx-auto py-6 space-y-6 flex-1">
        {/* Header Actions - فقط للسوبر آدمن */}
        {isSuperAdmin && (
          <div className="flex justify-end">
            <Button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة سنة دراسية
            </Button>
          </div>
        )}

      {/* فلاتر البحث */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في السنوات الدراسية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="archived">مؤرشف</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول السنوات الدراسية */}
      <Card>
        <CardHeader>
          <CardTitle>السنوات الدراسية ({filteredYears.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredYears.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد سنوات دراسية
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-4">اسم السنة</th>
                    <th className="text-right p-4">تاريخ البداية (UTC)</th>
                    <th className="text-right p-4">تاريخ النهاية (UTC)</th>
                    <th className="text-right p-4">الدقة</th>
                    <th className="text-right p-4">الحالة</th>
                    <th className="text-right p-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredYears.map((year) => (
                    <tr key={year.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{year.name}</td>
                      <td className="p-4">{formatDate(year.start_at_utc)}</td>
                      <td className="p-4">{formatDate(year.end_at_utc)}</td>
                      <td className="p-4">{getGranularityLabel(year.granularity)}</td>
                      <td className="p-4">
                        <Badge variant={year.status === 'active' ? 'default' : 'secondary'}>
                          {year.status === 'active' ? 'نشط' : 'مؤرشف'}
                        </Badge>
                      </td>
                       <td className="p-4">
                         {isSuperAdmin ? (
                           <div className="flex gap-2">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleEdit(year)}
                             >
                               <Edit className="h-4 w-4" />
                             </Button>
                             {year.status === 'active' && (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleArchive(year.id)}
                               >
                                 <Archive className="h-4 w-4" />
                               </Button>
                             )}
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleDelete(year.id, year.name)}
                               className="text-red-600 hover:text-red-700"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                         ) : (
                           <span className="text-muted-foreground text-sm">عرض فقط</span>
                         )}
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

       {/* نموذج إضافة/تعديل - فقط للسوبر آدمن */}
       {showForm && isSuperAdmin && (
         <AcademicYearForm
           academicYear={editingYear}
           onSuccess={handleFormSuccess}
           onCancel={() => {
             setShowForm(false);
             setEditingYear(null);
           }}
         />
       )}
      </div>
      
      <AppFooter />
    </div>
  );
};

export default AcademicYears;