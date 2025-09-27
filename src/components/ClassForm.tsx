import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  ArrowRight, 
  Users, 
  Upload, 
  Plus, 
  X, 
  Check, 
  AlertCircle, 
  UserPlus, 
  Mail,
  Download,
  FileUp,
  HelpCircle,
  User,
  AtSign,
  Phone,
  Lock
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logging';
import { getArabicGradeName } from '@/utils/gradeMapping';

interface GradeLevel {
  id: string;
  label: string;
  code: string;
}

interface AcademicYear {
  id: string;
  name: string;
  status: string;
}

interface Class {
  id: string;
  status: string;
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
}

interface Student {
  full_name: string;
  email: string;
  phone?: string;
  password?: string;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ClassFormProps {
  editingClass?: Class | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Helper function to generate random password
const generatePassword = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const ClassForm: React.FC<ClassFormProps> = ({ editingClass, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1 form data
  const [className, setClassName] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  
  // Data for dropdowns
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  
  // Created class data
  const [createdClass, setCreatedClass] = useState<any>(null);
  
  // Step 2 - Manual student addition
  const [newStudent, setNewStudent] = useState<Student>({
    full_name: '',
    email: '',
    phone: '+972',
    password: ''
  });
  
  // Step 2 - Additional states
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(false);
  const [sendWelcomeEmailBulk, setSendWelcomeEmailBulk] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Step 2 - Import data
  const [importData, setImportData] = useState<Student[]>([]);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    valid: number;
    invalid: number;
  }>({ total: 0, valid: 0, invalid: 0 });

  useEffect(() => {
    loadInitialData();
    if (editingClass) {
      setClassName(editingClass.class_name.name);
      setSelectedGradeLevel(editingClass.grade_level.id);
      setSelectedAcademicYear(editingClass.academic_year.id);
    }
  }, [editingClass]);

  const loadInitialData = async () => {
    try {
      // Load available grade levels from school package
      let availableGrades: string[] = [];
      
      if (userProfile?.school_id) {
        const { data: gradesData, error: gradesError } = await supabase
          .rpc('get_available_grade_levels', { school_uuid: userProfile.school_id });
        
        if (gradesError) {
          logger.error('Error fetching available grades', gradesError);
          availableGrades = ['10', '11', '12']; // Fallback
        } else {
          availableGrades = gradesData || [];
        }
      }

      // Load grade levels and filter by package
      const { data: gradeLevelsData, error: gradeLevelsError } = await supabase
        .from('grade_levels')
        .select('*')
        .in('code', availableGrades.length > 0 ? availableGrades : ['10', '11', '12'])
        .order('code');

      if (gradeLevelsError) throw gradeLevelsError;
      
      if (gradeLevelsData?.length === 0) {
        toast({
          variant: "destructive",
          title: "لا توجد صفوف متاحة",
          description: "لا توجد صفوف متاحة في الباقة النشطة لهذه المدرسة"
        });
      }
      
      setGradeLevels(gradeLevelsData || []);

      // Load active academic years
      const { data: academicYearsData, error: academicYearsError } = await supabase
        .from('academic_years')
        .select('*')
        .eq('status', 'active')
        .order('start_at_utc', { ascending: false });

      if (academicYearsError) throw academicYearsError;
      setAcademicYears(academicYearsData || []);

      // Set default academic year if only one active
      if (academicYearsData?.length === 1) {
        setSelectedAcademicYear(academicYearsData[0].id);
      }
    } catch (error: unknown) {
      logger.error('Error loading initial data', error as Error);
      toast({
        variant: "destructive",
        title: "خطأ في تحميل البيانات",
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      });
    }
  };

  const handleStep1Submit = async () => {
    if (!className.trim() || !selectedGradeLevel || !selectedAcademicYear) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "يرجى تعبئة جميع الحقول المطلوبة"
      });
      return;
    }

    if (!userProfile?.school_id) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "لم يتم العثور على معرف المدرسة"
      });
      return;
    }

    setLoading(true);

    try {
      // Check if class name already exists for this school
      const { data: existingClassName } = await supabase
        .from('class_names')
        .select('id')
        .eq('school_id', userProfile.school_id)
        .eq('name', className.trim())
        .single();

      let classNameId: string;

      if (existingClassName) {
        classNameId = existingClassName.id;
      } else {
        // Create new class name
        const { data: newClassName, error: classNameError } = await supabase
          .from('class_names')
          .insert({
            name: className.trim(),
            school_id: userProfile.school_id
          })
          .select()
          .single();

        if (classNameError) throw classNameError;
        classNameId = newClassName.id;
      }

      // Allow duplicate class names - no validation needed for name combinations

      if (editingClass) {
        // Update existing class
        const { data: updatedClass, error: updateError } = await supabase
          .from('classes')
          .update({
            academic_year_id: selectedAcademicYear,
            grade_level_id: selectedGradeLevel,
            class_name_id: classNameId
          })
          .eq('id', editingClass.id)
          .select()
          .single();

        if (updateError) throw updateError;
        
        toast({
          title: "تم تحديث الصف بنجاح",
          description: "تم حفظ التغييرات"
        });
        
        onSuccess();
        return;
      } else {
        // Create new class
        const { data: newClass, error: classError } = await supabase
          .from('classes')
          .insert({
            school_id: userProfile.school_id,
            academic_year_id: selectedAcademicYear,
            grade_level_id: selectedGradeLevel,
            class_name_id: classNameId,
            created_by: userProfile.user_id,
            status: 'active'
          })
          .select(`
            *,
            grade_level:grade_levels(id, label),
            class_name:class_names(id, name),
            academic_year:academic_years(id, name)
          `)
          .single();

        if (classError) throw classError;
        
        // Link the teacher to the created class
        const { error: teacherClassError } = await supabase
          .from('teacher_classes')
          .insert({
            teacher_id: userProfile.user_id,
            class_id: newClass.id
          });

        if (teacherClassError) {
          logger.error('Error linking teacher to class', teacherClassError);
          // Don't throw here - class was created successfully, just log the error
        }
        
        setCreatedClass(newClass);
        setCurrentStep(2);
        
        toast({
          title: "تم إنشاء الصف بنجاح",
          description: "يمكنك الآن إضافة الطلاب للصف"
        });
      }
    } catch (error: unknown) {
      logger.error('Error creating class', error as Error, { 
        className,
        gradeLevel: selectedGradeLevel,
        academicYear: selectedAcademicYear 
      });
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء الصف",
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.full_name.trim()) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "يرجى إدخال اسم الطالب"
      });
      return;
    }

    if (!newStudent.email.trim()) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة", 
        description: "يرجى إدخال البريد الإلكتروني"
      });
      return;
    }

    if (!createdClass || !userProfile?.school_id) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "لم يتم العثور على بيانات الصف"
      });
      return;
    }

    setLoading(true);

    try {
      // Check if student already exists
      let studentId: string;
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', userProfile.school_id)
        .or(`full_name.eq.${newStudent.full_name.trim()},email.eq.${newStudent.email || ''}`)
        .single();

      if (existingStudent) {
        studentId = existingStudent.id;
        
        // Check if already enrolled in this class
        const { data: existingEnrollment } = await supabase
          .from('class_students')
          .select('id')
          .eq('class_id', createdClass.id)
          .eq('student_id', studentId)
          .single();

        if (existingEnrollment) {
          toast({
            variant: "destructive",
            title: "الطالب مسجل مسبقاً",
            description: "هذا الطالب مسجل بالفعل في هذا الصف"
          });
          return;
        }
      } else {
        // Create new student (without password)
        const { data: newStudentData, error: studentError } = await supabase
          .from('students')
          .insert({
            school_id: userProfile.school_id,
            full_name: newStudent.full_name.trim(),
            username: newStudent.email || null, // Use email as username
            email: newStudent.email || null,
            phone: newStudent.phone || null
          })
          .select()
          .single();

        if (studentError) throw studentError;
        studentId = newStudentData.id;
      }

      // Enroll student in class
      const { error: enrollmentError } = await supabase
        .from('class_students')
        .insert({
          class_id: createdClass.id,
          student_id: studentId
        });

      if (enrollmentError) throw enrollmentError;

      toast({
        title: "تم إضافة الطالب بنجاح",
        description: `تم إضافة ${newStudent.full_name} للصف`
      });

      // Reset form
      setNewStudent({
        full_name: '',
        email: '',
        phone: '+972',
        password: ''
      });

    } catch (error: unknown) {
      logger.error('Error adding student', error as Error, { 
        studentName: newStudent.full_name,
        studentEmail: newStudent.email,
        classId: createdClass?.id?.toString() 
      });
      toast({
        variant: "destructive",
        title: "خطأ في إضافة الطالب",
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      processFile(file);
    } else {
      toast({
        variant: "destructive",
        title: "نوع ملف غير مدعوم",
        description: "يرجى رفع ملف CSV فقط"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          toast({
            variant: "destructive",
            title: "ملف فارغ",
            description: "الملف المحدد فارغ"
          });
          return;
        }

        // Parse CSV data
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const students: Student[] = [];
        const errors: ImportError[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          
          if (values.every(v => !v)) continue; // Skip empty rows
          
          if (values.length !== headers.length) {
            errors.push({
              row: i + 1,
              field: 'general',
              message: 'عدد الأعمدة غير متطابق'
            });
            continue;
          }

          const student: Student = {
            full_name: '',
            email: '',
            phone: '+972',
            password: ''
          };

          let hasError = false;

          headers.forEach((header, index) => {
            const value = values[index];
            
            switch (header) {
              case 'full_name':
              case 'الاسم الكامل':
              case 'اسم':
              case 'name':
                if (!value) {
                  errors.push({
                    row: i + 1,
                    field: 'full_name',
                    message: 'الاسم الكامل مطلوب'
                  });
                  hasError = true;
                } else {
                  student.full_name = value;
                }
                break;
              case 'email':
              case 'البريد الإلكتروني':
              case 'ايميل':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                  errors.push({
                    row: i + 1,
                    field: 'email',
                    message: 'صيغة البريد الإلكتروني غير صحيحة'
                  });
                  hasError = true;
                } else {
                  student.email = value;
                }
                break;
              case 'phone':
              case 'رقم الهاتف':
              case 'هاتف':
                student.phone = value;
                break;
              case 'password':
              case 'كلمة المرور':
                student.password = value;
                break;
            }
          });

          if (!hasError && student.full_name) {
            if (!student.password) {
              student.password = generatePassword();
            }
            students.push(student);
          }
        }

        setImportData(students);
        setImportErrors(errors);
        setImportSummary({
          total: lines.length - 1,
          valid: students.length,
          invalid: errors.length
        });

        toast({
          title: "تم تحليل الملف",
          description: `تم العثور على ${students.length} طالب صالح و ${errors.length} خطأ`
        });

      } catch (error: unknown) {
        logger.error('Error parsing file', error as Error);
        toast({
          variant: "destructive",
          title: "خطأ في قراءة الملف",
          description: "تأكد من أن الملف بصيغة CSV صحيحة"
        });
      }
    };

    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    // Create CSV content with proper Arabic support
    const csvHeaders = 'full_name,email,phone,password';
    const csvSampleData = [
      'أحمد محمد الأحمد,ahmed.mohamed@school.edu,+972501234567,',
      'فاطمة علي السالم,fatima.ali@school.edu,+972507654321,',
      'خالد حسن المحمود,khalid.hassan@school.edu,+972509876543,',
      'سارة يوسف القاسم,sara.youssef@school.edu,+972505555555,'
    ].join('\n');
    
    const csvContent = csvHeaders + '\n' + csvSampleData;
    
    // Add BOM for proper Arabic encoding support
    const BOM = '\uFEFF';
    const fullContent = BOM + csvContent;
    
    // Create blob with explicit UTF-8 encoding
    const blob = new Blob([fullContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'قالب_الطلاب_students_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "تم تحميل القالب",
      description: "تم تحميل قالب إضافة الطلاب بنجاح. يرجى ملء البيانات وحفظ الملف بصيغة CSV."
    });
  };


  const handleImportStudents = async () => {
    if (importData.length === 0) {
      toast({
        variant: "destructive",
        title: "لا توجد بيانات للاستيراد",
        description: "يرجى رفع ملف يحتوي على بيانات صالحة"
      });
      return;
    }

    if (!createdClass || !userProfile?.school_id) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "لم يتم العثور على بيانات الصف"
      });
      return;
    }

    setLoading(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const student of importData) {
        try {
          // Check if student already exists
          let studentId: string;
          const { data: existingStudent } = await supabase
            .from('students')
            .select('id')
            .eq('school_id', userProfile.school_id)
            .or(`full_name.eq.${student.full_name},email.eq.${student.email || ''}`)
            .single();

          if (existingStudent) {
            studentId = existingStudent.id;
          } else {
            // Create new student
            const { data: newStudentData, error: studentError } = await supabase
              .from('students')
              .insert({
                school_id: userProfile.school_id,
                full_name: student.full_name,
                username: student.email || null, // Use email as username
                email: student.email || null,
                phone: student.phone || null,
                password_hash: student.password || generatePassword()
              })
              .select()
              .single();

            if (studentError) throw studentError;
            studentId = newStudentData.id;
          }

          // Check if already enrolled
          const { data: existingEnrollment } = await supabase
            .from('class_students')
            .select('id')
            .eq('class_id', createdClass.id)
            .eq('student_id', studentId)
            .single();

          if (!existingEnrollment) {
            // Enroll student in class
            const { error: enrollmentError } = await supabase
              .from('class_students')
              .insert({
                class_id: createdClass.id,
                student_id: studentId
              });

            if (enrollmentError) throw enrollmentError;
          }

          successCount++;
        } catch (error) {
          logger.error('Error importing student', error, { 
            studentName: student.full_name 
          });
          errorCount++;
        }
      }

      toast({
        title: "تم الاستيراد",
        description: `تم استيراد ${successCount} طالب بنجاح، ${errorCount} أخطاء`
      });

      // Clear import data
      setImportData([]);
      setImportErrors([]);
      setImportSummary({ total: 0, valid: 0, invalid: 0 });

    } catch (error: unknown) {
      logger.error('Error importing students', error as Error);
      toast({
        variant: "destructive",
        title: "خطأ في الاستيراد",
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      });
    } finally {
      setLoading(false);
    }
  };

  if (academicYears.length === 0 && !loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد سنة دراسية نشطة</h3>
              <p className="text-sm text-muted-foreground mb-4">
                يجب وجود سنة دراسية نشطة واحدة على الأقل لإنشاء الصفوف
              </p>
              <Button onClick={onCancel}>العودة</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onCancel}>
            <ArrowRight className="h-4 w-4 mr-1" />
            إلغاء
          </Button>
          <h1 className="text-3xl font-bold">
            {editingClass ? 'تعديل الصف' : 'إضافة صف جديد'}
          </h1>
        </div>
      </div>

      {/* Progress Steps */}
      {!editingClass && (
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            currentStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            <div className="w-6 h-6 rounded-full bg-white text-primary flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span>تفاصيل الصف</span>
          </div>
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            currentStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            <div className="w-6 h-6 rounded-full bg-white text-primary flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span>إضافة الطلاب</span>
          </div>
        </div>
      )}

      {/* Step 1: Class Details */}
      {(currentStep === 1 || editingClass) && (
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل الصف الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="className">اسم الصف *</Label>
                <Input
                  id="className"
                  placeholder="مثال: عاشر/أ، 11/علمي-1"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeLevel">نوع الصف *</Label>
                <Select value={selectedGradeLevel} onValueChange={setSelectedGradeLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="academicYear">السنة الدراسية *</Label>
                <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السنة الدراسية" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleStep1Submit} 
                disabled={loading}
                className="min-w-32"
              >
                {loading ? 'جاري الحفظ...' : editingClass ? 'حفظ التغييرات' : 'حفظ وإنشاء الصف'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Add Students */}
      {currentStep === 2 && createdClass && (
        <div className="space-y-6">
          {/* Created Class Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                تم إنشاء الصف بنجاح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">اسم الصف:</span>
                  <p className="font-medium">{createdClass.class_name.name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">نوع الصف:</span>
                  <p className="font-medium">{createdClass.grade_level.label}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">السنة الدراسية:</span>
                  <p className="font-medium">{createdClass.academic_year.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Students */}
          <Card>
            <CardHeader>
              <CardTitle>إضافة الطلاب (اختياري)</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">إضافة يدوية</TabsTrigger>
                  <TabsTrigger value="import">استيراد ملف</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-6">
                  <div className="text-center mb-6">
                    <UserPlus className="h-12 w-12 text-primary mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-foreground">إضافة طالب جديد</h3>
                    <p className="text-sm text-muted-foreground">أدخل بيانات الطالب أدناه</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentName" className="text-right flex items-center gap-1">
                        الاسم الكامل <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="studentName"
                        placeholder="أدخل اسم الطالب الكامل"
                        value={newStudent.full_name}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, full_name: e.target.value }))}
                        className="text-right"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentEmail" className="text-right flex items-center gap-1">
                        البريد الإلكتروني <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="studentEmail"
                        type="email"
                        placeholder="student@example.com"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                         className="ltr-content"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentPhone" className="text-right">رقم الهاتف</Label>
                      <Input
                        id="studentPhone"
                        type="tel"
                        placeholder="+972501234567"
                        value={newStudent.phone}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, phone: e.target.value }))}
                        className="ltr-content"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentPassword" className="text-right">كلمة المرور</Label>
                      <Input
                        id="studentPassword"
                        placeholder="اتركها فارغة لتوليد كلمة مرور تلقائياً"
                        value={newStudent.password}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, password: e.target.value }))}
                        className="text-right"
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        إذا تركت الحقل فارغاً، سيتم توليد كلمة مرور تلقائياً
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-2 space-x-reverse mb-4">
                      <Checkbox
                        id="sendWelcomeEmail"
                        checked={sendWelcomeEmail}
                        onCheckedChange={(checked) => setSendWelcomeEmail(checked as boolean)}
                      />
                      <Label htmlFor="sendWelcomeEmail" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        إرسال رسالة ترحيبية بالبريد الإلكتروني
                      </Label>
                    </div>
                    
                    <Button 
                      onClick={handleAddStudent} 
                      disabled={loading || !newStudent.full_name.trim() || !newStudent.email.trim()}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      size="lg"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          جاري الإضافة...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          إضافة الطالب للصف
                        </div>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="import" className="space-y-4">
                  <div className="space-y-4">
                    {/* Template Download */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div>
                        <h4 className="font-medium">قالب ملف الطلاب</h4>
                        <p className="text-sm text-muted-foreground">
                          حمل القالب الجاهز لملء بيانات الطلاب
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-2">
                              <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-right flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-primary" />
                                تعليمات ملء البيانات
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 text-right">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                  <User className="h-5 w-5 text-green-600 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-green-800 dark:text-green-200">full_name</p>
                                    <p className="text-sm text-green-600 dark:text-green-300">الاسم الكامل للطالب (مطلوب)</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                  <AtSign className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-blue-800 dark:text-blue-200">email</p>
                                    <p className="text-sm text-blue-600 dark:text-blue-300">البريد الإلكتروني (مطلوب)</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                  <Phone className="h-5 w-5 text-gray-600 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">phone</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">رقم الهاتف (اختياري)</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                  <Lock className="h-5 w-5 text-gray-600 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">password</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">كلمة المرور (اختياري - سيتم إنشاء كلمة مرور عشوائية إذا تركت فارغة)</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline" onClick={downloadTemplate}>
                          <Download className="h-4 w-4 mr-2" />
                          تحميل القالب
                        </Button>
                      </div>
                    </div>

                    {/* Drag & Drop Area */}
                    <div
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center transition-colors
                        ${isDragOver 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted-foreground/25 hover:border-primary/50'
                        }
                      `}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <FileUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">اسحب وأفلت ملف CSV هنا</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        أو انقر لاختيار ملف من جهازك
                      </p>
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label htmlFor="file-upload">
                        <Button variant="outline" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            اختيار ملف
                          </span>
                        </Button>
                      </Label>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p className="mb-1">متطلبات الملف:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>نوع الملف: CSV</li>
                        <li>الأعمدة المطلوبة: full_name, email</li>
                        <li>الأعمدة الاختيارية: phone, password</li>
                        <li>ترميز الملف: UTF-8</li>
                      </ul>
                    </div>

                    {importSummary.total > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">ملخص الاستيراد</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-center mb-4">
                            <div>
                              <div className="text-2xl font-bold">{importSummary.total}</div>
                              <div className="text-sm text-muted-foreground">إجمالي السجلات</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-600">{importSummary.valid}</div>
                              <div className="text-sm text-muted-foreground">سجلات صالحة</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-red-600">{importSummary.invalid}</div>
                              <div className="text-sm text-muted-foreground">أخطاء</div>
                            </div>
                          </div>

                          {importErrors.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                الأخطاء:
                              </h4>
                              <div className="space-y-1 max-h-32 overflow-y-auto bg-red-50 dark:bg-red-950 p-3 rounded">
                                {importErrors.map((error, index) => (
                                  <div key={index} className="text-sm text-red-600">
                                    الصف {error.row}: {error.message}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 space-x-reverse mb-4">
                            <Checkbox
                              id="sendWelcomeEmailBulk"
                              checked={sendWelcomeEmailBulk}
                              onCheckedChange={(checked) => setSendWelcomeEmailBulk(checked as boolean)}
                            />
                            <Label htmlFor="sendWelcomeEmailBulk" className="text-sm font-medium flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              إرسال رسائل ترحيبية للطلاب الجدد
                            </Label>
                          </div>

                          <Button 
                            onClick={handleImportStudents}
                            disabled={loading || importData.length === 0}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                            size="lg"
                          >
                            {loading ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                جاري الاستيراد...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                استيراد {importData.length} طالب
                              </div>
                            )}
                           </Button>
                         </CardContent>
                       </Card>
                     )}
                   </div>
                 </TabsContent>
               </Tabs>

              <Separator className="my-6" />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  العودة للخطوة السابقة
                </Button>
                <Button onClick={onSuccess}>
                  إنهاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};