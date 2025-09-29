import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive, Users, ArrowRight, UserPlus, Trash2 } from 'lucide-react';
import { ClassStudentsManager } from '@/components/ClassStudentsManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClassForm } from '@/components/ClassForm';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { PageLoading } from '@/components/ui/LoadingComponents';
import { logger } from '@/lib/logger';
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

interface GradeLevel {
  id: string;
  label: string;
}

interface AcademicYear {
  id: string;
  name: string;
  status: string;
}

interface Class {
  id: string;
  status: string;
  created_at_utc: string;
  grade_level: {
    id: string;
    label: string;
  };
  class_name: {
    id: string;
    name: string;
  };
  academic_year: {
    id: string;
    name: string;
  };
  student_count?: number;
}

const SchoolClasses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [managingStudents, setManagingStudents] = useState<Class | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [classes, searchTerm, selectedGradeLevel, selectedAcademicYear, selectedStatus]);

  const loadData = async () => {
    try {
      // Load available grade levels based on school package
      let availableGrades: string[] = [];
      
      // Mock package check - in real app, fetch from packages table
      availableGrades = ['10', '11', '12']; // Default to all grades for now

      // Load grade levels and filter by package
      const { data: gradeLevelsData, error: gradeLevelsError } = await supabase
        .from('grade_levels')
        .select('*')
        .in('label', availableGrades.length > 0 ? availableGrades : ['10', '11', '12'])
        .order('label');

      if (gradeLevelsError) throw gradeLevelsError;
      setGradeLevels(gradeLevelsData || []);

      // Load academic years
      const { data: academicYearsData, error: academicYearsError } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_at_utc', { ascending: false });

      if (academicYearsError) throw academicYearsError;
      setAcademicYears(academicYearsData || []);

      // Load classes with related data
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          grade_level:grade_levels(id, label),
          class_name:class_names(id, name),
          academic_year:academic_years(id, name)
        `)
        .order('created_at_utc', { ascending: false });

      if (classesError) throw classesError;

      // Get student counts for each class
      const classesWithCounts = await Promise.all(
        (classesData || []).map(async (classItem) => {
          const { count } = await supabase
            .from('class_students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classItem.id);

          return {
            ...classItem,
            student_count: count || 0
          };
        })
      );

      setClasses(classesWithCounts);
    } catch (error: any) {
      logger.error('Error loading data', error);
      toast({
        variant: "destructive",
        title: "خطأ في تحميل البيانات",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = classes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(classItem => 
        classItem.class_name.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classItem.grade_level.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by grade level
    if (selectedGradeLevel !== 'all') {
      filtered = filtered.filter(classItem => classItem.grade_level.id === selectedGradeLevel);
    }

    // Filter by academic year
    if (selectedAcademicYear !== 'all') {
      filtered = filtered.filter(classItem => classItem.academic_year.id === selectedAcademicYear);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(classItem => classItem.status === selectedStatus);
    }

    setFilteredClasses(filtered);
  };

  const handleArchiveClass = async (classId: string) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ 
          status: 'archived'
        })
        .eq('id', classId);

      if (error) throw error;

      toast({
        title: "تم أرشفة الصف بنجاح",
        description: "تم نقل الصف إلى الأرشيف"
      });

      // Refresh data
      loadData();
    } catch (error: any) {
      logger.error('Error archiving class', error);
      toast({
        variant: "destructive",
        title: "خطأ في أرشفة الصف",
        description: error.message
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      // First, delete all student enrollments for this class
      const { error: studentsError } = await supabase
        .from('class_students')
        .delete()
        .eq('class_id', classId);

      if (studentsError) throw studentsError;

      // Then delete the class
      const { error: classError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (classError) throw classError;

      toast({
        title: "تم حذف الصف بنجاح",
        description: "تم حذف الصف وجميع التسجيلات المرتبطة به نهائياً"
      });

      // Refresh data
      loadData();
    } catch (error: any) {
      logger.error('Error deleting class', error);
      toast({
        variant: "destructive",
        title: "خطأ في حذف الصف",
        description: error.message
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingClass(null);
    loadData();
  };

  const handleStudentsManagementBack = () => {
    setManagingStudents(null);
    loadData(); // Reload to get updated student counts
  };

  if (loading) {
    return <PageLoading message="Loading..." />;
  }

  if (managingStudents) {
    return (
      <ClassStudentsManager
        classData={managingStudents}
        onBack={handleStudentsManagementBack}
      />
    );
  }

  if (showForm) {
    return (
      <ClassForm
        editingClass={editingClass}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingClass(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader 
        title="الصفوف المدرسية" 
        showBackButton={true} 
        showLogout={true} 
      />
      
      <div className="container mx-auto py-6 space-y-6 flex-1">
        {/* Header Actions */}
        <div className="flex justify-end">
          <Button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة صف جديد
          </Button>
        </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث بالاسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={selectedGradeLevel} onValueChange={setSelectedGradeLevel}>
              <SelectTrigger>
                <SelectValue placeholder="نوع الصف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {gradeLevels.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger>
                <SelectValue placeholder="السنة الدراسية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع السنوات</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
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

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                لا توجد صفوف
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || selectedGradeLevel !== 'all' || selectedAcademicYear !== 'all' || selectedStatus !== 'active' 
                  ? "لا توجد صفوف تطابق المرشحات المحددة" 
                  : "لم يتم إنشاء أي صفوف بعد"}
              </p>
              {!searchTerm && selectedGradeLevel === 'all' && selectedAcademicYear === 'all' && selectedStatus === 'active' && (
                <Button onClick={() => setShowForm(true)}>
                  إضافة صف جديد
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <Card key={classItem.id} className="card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{classItem.class_name.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{classItem.grade_level.label}</p>
                  </div>
                  <Badge variant={classItem.status === 'active' ? 'default' : 'secondary'}>
                    {classItem.status === 'active' ? 'نشط' : 'مؤرشف'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">السنة الدراسية:</span>
                    <span>{classItem.academic_year.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">عدد الطلاب:</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {classItem.student_count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                    <span>{new Date(classItem.created_at_utc).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManagingStudents(classItem)}
                    className="flex-1"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    إدارة الطلاب
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingClass(classItem);
                      setShowForm(true);
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    تعديل
                  </Button>
                  {classItem.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchiveClass(classItem.id)}
                      className="flex-1"
                    >
                      <Archive className="h-3 w-3 mr-1" />
                      أرشفة
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف الصف "{classItem.class_name.name}" نهائياً؟
                          <br />
                          سيتم حذف جميع تسجيلات الطلاب في هذا الصف ولا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteClass(classItem.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          حذف نهائي
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
      
      <AppFooter />
    </div>
  );
};

export default SchoolClasses;