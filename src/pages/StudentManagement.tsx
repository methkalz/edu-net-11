import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Search, 
  Filter,
  UserPlus,
  School,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import AppHeader from '@/components/shared/AppHeader';
import BackButton from '@/components/shared/BackButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Student {
  id: string;
  full_name: string;
  username?: string;
  email?: string;
  phone?: string;
  created_at_utc: string;
  school_id: string;
  classes?: {
    id: string;
    class_name: string;
    grade_level: string;
  }[];
}

interface Class {
  id: string;
  class_name_id: string;
  grade_level_id: string;
  class_names: {
    name: string;
  };
  grade_levels: {
    label: string;
  };
}

export default function StudentManagement() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  
  // Edit student states
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    username: ''
  });

  // Handle edit student
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      full_name: student.full_name,
      email: student.email || '',
      phone: student.phone || '',
      username: student.username || ''
    });
    setEditDialogOpen(true);
  };

  // Save edited student
  const saveEditedStudent = async () => {
    if (!editingStudent) return;
    
    try {
      const { error } = await supabase
        .from('students')
        .update({
          full_name: editForm.full_name,
          email: editForm.email || null,
          phone: editForm.phone || null,
          username: editForm.username || null
        })
        .eq('id', editingStudent.id);

      if (error) {
        logger.error('Error updating student:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحديث بيانات الطالب",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات الطالب بنجاح",
      });

      setEditDialogOpen(false);
      setEditingStudent(null);
      loadStudents(); // Reload the data
      
    } catch (error) {
      logger.error('Error in saveEditedStudent:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive"
      });
    }
  };

  // Handle delete student
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    try {
      // First, remove student from all classes
      const { error: classError } = await supabase
        .from('class_students')
        .delete()
        .eq('student_id', studentId);

      if (classError) {
        logger.error('Error removing student from classes:', classError);
        toast({
          title: "خطأ",
          description: "فشل في إزالة الطالب من الصفوف",
          variant: "destructive"
        });
        return;
      }

      // Then delete the student
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) {
        logger.error('Error deleting student:', error);
        toast({
          title: "خطأ",
          description: "فشل في حذف الطالب",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "تم الحذف",
        description: `تم حذف الطالب ${studentName} بنجاح`,
      });

      loadStudents(); // Reload the data
      
    } catch (error) {
      logger.error('Error in handleDeleteStudent:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الطالب",
        variant: "destructive"
      });
    }
  };

  // Load students data
  const loadStudents = async () => {
    try {
      setLoading(true);
      
      if (!userProfile?.school_id) {
        toast({
          title: "خطأ",
          description: "لا يمكن تحديد المدرسة",
          variant: "destructive"
        });
        return;
      }

      // Get all students with their classes
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          username,
          email,
          phone,
          created_at_utc,
          school_id
        `)
        .eq('school_id', userProfile.school_id)
        .order('full_name');

      if (studentsError) {
        logger.error('Error loading students:', studentsError);
        toast({
          title: "خطأ",
          description: "فشل في تحميل بيانات الطلاب",
          variant: "destructive"
        });
        return;
      }

      // Get class enrollments for each student
      const studentsWithClasses = await Promise.all(
        (studentsData || []).map(async (student) => {
          const { data: classData } = await supabase
            .from('class_students')
            .select(`
              classes (
                id,
                class_names (name),
                grade_levels (label)
              )
            `)
            .eq('student_id', student.id);

          return {
            ...student,
            classes: classData?.map(item => ({
              id: item.classes.id,
              class_name: item.classes.class_names.name,
              grade_level: item.classes.grade_levels.label
            })) || []
          };
        })
      );

      setStudents(studentsWithClasses);
      
    } catch (error) {
      logger.error('Error in loadStudents:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load classes for filtering
  const loadClasses = async () => {
    try {
      if (!userProfile?.school_id) return;

      const { data: classesData, error } = await supabase
        .from('classes')
        .select(`
          id,
          class_name_id,
          grade_level_id,
          class_names (name),
          grade_levels (label)
        `)
        .eq('school_id', userProfile.school_id)
        .eq('status', 'active');

      if (error) {
        logger.error('Error loading classes:', error);
        return;
      }

      setClasses(classesData || []);
    } catch (error) {
      logger.error('Error in loadClasses:', error);
    }
  };

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, [userProfile?.school_id]);

  // Filter students based on search and selections
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === 'all' || 
      student.classes?.some(cls => cls.id === selectedClass);

    const matchesGrade = selectedGrade === 'all' || 
      student.classes?.some(cls => cls.grade_level === selectedGrade);

    return matchesSearch && matchesClass && matchesGrade;
  });

  // Get unique grade levels for filtering
  const gradeOptions = [...new Set(classes.map(cls => cls.grade_levels.label))];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-3">
            <BackButton />
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-l from-foreground to-foreground/80 bg-clip-text text-transparent">
                إدارة الطلاب
              </h1>
              <p className="text-muted-foreground mt-1">
                عرض وإدارة جميع طلاب المدرسة
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card soft-shadow hover-scale group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي الطلاب</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    {students.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card soft-shadow hover-scale group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">عدد الصفوف</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent">
                    {classes.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 group-hover:from-secondary/20 group-hover:to-secondary/10 transition-all duration-300">
                  <School className="h-8 w-8 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card soft-shadow hover-scale group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">المراحل الدراسية</p>
                  <p className="text-3xl font-bold text-primary">
                    {gradeOptions.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 glass-card soft-shadow">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="البحث عن طالب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="transition-all duration-200 hover:border-primary/40">
                  <SelectValue placeholder="اختر المرحلة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المراحل</SelectItem>
                  {gradeOptions.map(grade => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="transition-all duration-200 hover:border-primary/40">
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الصفوف</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.class_names.name} - {cls.grade_levels.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClass('all');
                  setSelectedGrade('all');
                }}
                variant="outline"
                className="hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all duration-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                إعادة تعيين
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card className="glass-card soft-shadow">
          <CardHeader className="bg-gradient-to-r from-muted/20 to-transparent border-b border-border/60">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  قائمة الطلاب ({filteredStudents.length})
                </span>
              </div>
              <Button 
                onClick={() => window.location.href = '/school-classes'}
                className="gradient-primary hover:scale-105 transition-transform duration-200"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                إضافة طلاب جدد
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-4 gradient-primary rounded-full animate-gentle-float flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-lg text-muted-foreground">جاري التحميل...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted/20 to-muted/10 border border-border/60 flex items-center justify-center">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">لا يوجد طلاب</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchTerm || selectedClass !== 'all' || selectedGrade !== 'all' 
                    ? 'لا توجد نتائج تطابق معايير البحث المحددة'
                    : 'لم يتم إضافة أي طلاب بعد في هذه المدرسة'
                  }
                </p>
                {!searchTerm && selectedClass === 'all' && selectedGrade === 'all' && (
                  <Button 
                    onClick={() => window.location.href = '/school-classes'}
                    className="gradient-primary"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    إضافة أول طالب
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50">
                      <TableHead className="text-right font-semibold">الطالب</TableHead>
                      <TableHead className="text-right font-semibold">البريد الإلكتروني</TableHead>
                      <TableHead className="text-right font-semibold">الهاتف</TableHead>
                      <TableHead className="text-right font-semibold">تاريخ التسجيل</TableHead>
                      <TableHead className="text-right font-semibold">الصفوف</TableHead>
                      <TableHead className="text-center font-semibold">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student, index) => (
                      <TableRow 
                        key={student.id} 
                        className="hover:bg-muted/30 transition-all duration-200 border-b border-border/60"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{student.full_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {student.username || 'لا يوجد اسم مستخدم'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4">
                          {student.email ? (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{student.email}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">غير محدد</span>
                          )}
                        </TableCell>
                        
                        <TableCell className="py-4">
                          {student.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{student.phone}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">غير محدد</span>
                          )}
                        </TableCell>
                        
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(student.created_at_utc).getDate()}.{new Date(student.created_at_utc).getMonth() + 1}.{new Date(student.created_at_utc).getFullYear()}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4">
                          {student.classes && student.classes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {student.classes.slice(0, 2).map((cls, clsIndex) => (
                                <Badge 
                                  key={clsIndex} 
                                  variant="outline" 
                                  className="text-xs bg-gradient-to-r from-secondary/20 to-secondary/10 border-secondary/40"
                                >
                                  {cls.class_name}
                                </Badge>
                              ))}
                              {student.classes.length > 2 && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs"
                                >
                                  +{student.classes.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <BookOpen className="h-4 w-4" />
                              <span>غير مسجل</span>
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell className="py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditStudent(student)}
                              className="hover:bg-primary/5 hover:border-primary/40"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="hover:bg-destructive/5 hover:border-destructive/40"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من حذف الطالب "{student.full_name}"؟ هذا الإجراء لا يمكن التراجع عنه.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteStudent(student.id, student.full_name)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Student Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-right">تعديل بيانات الطالب</DialogTitle>
              <DialogDescription className="text-right">
                قم بتعديل بيانات الطالب في النموذج أدناه
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name" className="text-right">الاسم الكامل</Label>
                <Input
                  id="full_name"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  className="text-right"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-right">اسم المستخدم</Label>
                <Input
                  id="username"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  className="text-right"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-right">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="text-right"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-right">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="text-right"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                إلغاء
              </Button>
              <Button
                onClick={saveEditedStudent}
                className="gradient-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}