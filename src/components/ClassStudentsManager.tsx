import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  Plus, 
  Upload, 
  Users, 
  Trash2, 
  Download,
  FileUp,
  X,
  Check,
  AlertCircle,
  UserPlus,
  Mail
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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

interface Student {
  id: string;
  full_name: string;
  username?: string;
  email?: string;
  phone?: string;
  created_at_utc: string;
  avatar_url?: string;
}

interface NewStudent {
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

interface ClassStudentsManagerProps {
  classData: any;
  onBack: () => void;
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

export const ClassStudentsManager: React.FC<ClassStudentsManagerProps> = ({ 
  classData, 
  onBack 
}) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  
  const [newStudent, setNewStudent] = useState<NewStudent>({
    full_name: '',
    email: '',
    phone: '+972',
    password: ''
  });
  
  // Import data
  const [importData, setImportData] = useState<NewStudent[]>([]);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    valid: number;
    invalid: number;
  }>({ total: 0, valid: 0, invalid: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [sendWelcomeEmailBulk, setSendWelcomeEmailBulk] = useState(true);
  const [emailStatus, setEmailStatus] = useState<{[key: string]: 'sending' | 'sent' | 'failed'}>({});

  useEffect(() => {
    loadStudents();
  }, [classData.id]);

  const sendWelcomeEmailToStudent = async (student: any, password?: string) => {
    try {
      setEmailStatus(prev => ({ ...prev, [student.id]: 'sending' }));
      
      const loginUrl = `${window.location.origin}/auth`;
      
      logger.info('Attempting to send welcome email', {
        studentId: student.id,
        studentName: student.full_name,
        studentEmail: student.email,
        schoolName: classData.school?.name || 'مدرستنا',
        username: student.username,
        loginUrl: loginUrl,
        schoolId: classData.school_id
      });
      
      const response = await supabase.functions.invoke('send-email', {
        body: {
          studentEmail: student.email,
          studentName: student.full_name,
          schoolName: classData.school?.name || 'مدرستنا',
          username: student.username,
          password: password,
          userType: 'student'
        }
      });

      logger.info('Edge function response received', { 
        success: !response.error,
        studentId: student.id 
      });

      if (response.error) {
        logger.error('Edge function returned error', null, { 
          errorMessage: response.error?.toString(),
          studentId: student.id,
          studentEmail: student.email 
        });
        throw response.error;
      }

      setEmailStatus(prev => ({ ...prev, [student.id]: 'sent' }));
      toast({
        title: "تم إرسال الرسالة الترحيبية",
        description: `تم إرسال رسالة ترحيبية إلى ${student.full_name}`,
      });
    } catch (error: any) {
      logger.error('Error sending welcome email', error, { 
        studentId: student.id,
        studentEmail: student.email
      });
      
      setEmailStatus(prev => ({ ...prev, [student.id]: 'failed' }));
      
      // More specific error messages
      let errorMessage = `فشل في إرسال الرسالة الترحيبية إلى ${student.full_name}`;
      
      if (error.message?.includes('Failed to send a request to the Edge Function') || 
          error.message?.includes('Failed to fetch')) {
        errorMessage = 'الخدمة غير متوفرة حالياً - Edge Function لم يتم نشرها بعد';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'انتهت مهلة الاتصال - حاول مرة أخرى';
      }
      
      toast({
        title: "فشل في إرسال الرسالة",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const { data: studentsData, error } = await supabase
        .from('class_students')
        .select(`
          student_id,
          students!inner(
            id,
            full_name,
            username,
            email,
            phone,
            created_at_utc
          )
        `)
        .eq('class_id', classData.id);

      if (error) throw error;

      const formattedStudents = studentsData?.map(item => ({
        id: item.students.id,
        full_name: item.students.full_name,
        username: item.students.username,
        email: item.students.email,
        phone: item.students.phone,
        created_at_utc: item.students.created_at_utc
      })) || [];

      setStudents(formattedStudents);
    } catch (error: unknown) {
      logger.error('Error loading students', error as Error, { 
        classId: classData.id 
      });
      toast({
        variant: "destructive",
        title: "خطأ في تحميل الطلاب",
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      });
    } finally {
      setLoadingStudents(false);
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

    if (!newStudent.email?.trim()) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة", 
        description: "يرجى إدخال البريد الإلكتروني"
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
      // Generate password if not provided
      const password = newStudent.password || generatePassword();

      // Check if student with this email already exists
      let studentId: string;
      let existingStudent = null;
      
      if (newStudent.email) {
        const { data } = await supabase
          .from('students')
          .select('id')
          .eq('school_id', userProfile.school_id)
          .eq('email', newStudent.email.trim())
          .single();
        existingStudent = data;
      }

      if (existingStudent) {
        studentId = existingStudent.id;
        
        // Check if already enrolled in this class
        const { data: existingEnrollment } = await supabase
          .from('class_students')
          .select('id')
          .eq('class_id', classData.id)
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
        // Create new student using Edge Function
        const { data: newStudentData, error: studentError } = await supabase.functions.invoke('create-student', {
          body: {
            school_id: userProfile.school_id,
            full_name: newStudent.full_name.trim(),
            email: newStudent.email || null,
            phone: newStudent.phone || null,
            password: password
          }
        });

        if (studentError || !newStudentData || newStudentData.error) {
          throw new Error(studentError?.message || newStudentData?.error || 'فشل في إنشاء الطالب');
        }
        studentId = newStudentData.student_id;
      }

      // Enroll student in class
      const { error: enrollmentError } = await supabase
        .from('class_students')
        .insert({
          class_id: classData.id,
          student_id: studentId
        });

      if (enrollmentError) throw enrollmentError;

      toast({
        title: "تم إضافة الطالب بنجاح",
        description: `تم إضافة ${newStudent.full_name} للصف`
      });

      // Send welcome email if requested
      if (sendWelcomeEmail && newStudent.email) {
        const studentWithId = { 
          id: studentId, 
          full_name: newStudent.full_name, 
          email: newStudent.email, 
          username: newStudent.email // Use email as username
        };
        await sendWelcomeEmailToStudent(studentWithId, password);
      }

      // Reset form and reload students
      setNewStudent({
        full_name: '',
        email: '',
        phone: '+972',
        password: ''
      });
      
      loadStudents();

    } catch (error: unknown) {
      logger.error('Error adding student', error as Error, { 
        studentName: newStudent.full_name,
        studentEmail: newStudent.email,
        classId: classData.id 
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

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`⚠️ تحذير: هل أنت متأكد من إزالة الطالب "${studentName}" من هذا الفصل؟\n\nملاحظة: هذا سيزيل الطالب من الفصل فقط وليس من النظام كاملاً.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('class_students')
        .delete()
        .eq('class_id', classData.id)
        .eq('student_id', studentId);

      if (error) throw error;

      toast({
        title: "تم إزالة الطالب من الفصل",
        description: `تم إزالة ${studentName} من الفصل بنجاح (لا يزال مسجلاً في النظام)`
      });

      loadStudents();
    } catch (error: unknown) {
      logger.error('Error removing student', error as Error, { 
        studentId,
        studentName,
        classId: classData.id 
      });
      toast({
        variant: "destructive",
        title: "خطأ في إزالة الطالب",
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
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
  }, []);

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
        const students: NewStudent[] = [];
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

          const student: NewStudent = {
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

  const handleImportStudents = async () => {
    if (importData.length === 0) {
      toast({
        variant: "destructive",
        title: "لا توجد بيانات للاستيراد",
        description: "يرجى رفع ملف يحتوي على بيانات صالحة"
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
      let successCount = 0;
      let errorCount = 0;
      const studentsWithEmails: any[] = [];

      for (const student of importData) {
        try {
          // Check if student with this email already exists
          let studentId: string;
          let isNewStudent = false;
          let existingStudent = null;
          
          if (student.email) {
            const { data } = await supabase
              .from('students')
              .select('id')
              .eq('school_id', userProfile.school_id)
              .eq('email', student.email.trim())
              .single();
            existingStudent = data;
          }

          if (existingStudent) {
            studentId = existingStudent.id;
          } else {
            // Create new student using Edge Function
            const { data: newStudentData, error: studentError } = await supabase.functions.invoke('create-student', {
              body: {
                school_id: userProfile.school_id,
                full_name: student.full_name,
                email: student.email || null,
                phone: student.phone || null,
                password: student.password || generatePassword()
              }
            });

            if (studentError || !newStudentData || newStudentData.error) {
              throw new Error(studentError?.message || newStudentData?.error || 'فشل في إنشاء الطالب');
            }
            studentId = newStudentData.student_id;
            isNewStudent = true;
          }

          // Check if already enrolled
          const { data: existingEnrollment } = await supabase
            .from('class_students')
            .select('id')
            .eq('class_id', classData.id)
            .eq('student_id', studentId)
            .single();

          if (!existingEnrollment) {
            // Enroll student in class
            const { error: enrollmentError } = await supabase
              .from('class_students')
              .insert({
                class_id: classData.id,
                student_id: studentId
              });

            if (enrollmentError) throw enrollmentError;
          }

          // Store student info for email sending
          if (sendWelcomeEmailBulk && student.email && isNewStudent) {
            studentsWithEmails.push({
              id: studentId,
              full_name: student.full_name,
              email: student.email,
              username: student.email, // Use email as username
              password: student.password
            });
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

      // Send welcome emails if requested
      if (studentsWithEmails.length > 0) {
        toast({
          title: "إرسال الرسائل الترحيبية",
          description: `جاري إرسال ${studentsWithEmails.length} رسالة ترحيبية...`,
        });

        for (const studentInfo of studentsWithEmails) {
          await sendWelcomeEmailToStudent(studentInfo, studentInfo.password);
          // Add small delay to avoid overwhelming the email service
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Clear import data and reload students
      setImportData([]);
      setImportErrors([]);
      setImportSummary({ total: 0, valid: 0, invalid: 0 });
      loadStudents();

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

  const downloadTemplate = () => {
    const csvContent = 'full_name,email,phone,password\nمحمد أحمد,mohamed@example.com,+972501234567,\nفاطمة علي,fatima@example.com,+972507654321,';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowRight className="h-4 w-4 mr-1" />
            العودة للصفوف
          </Button>
          <div>
            <h1 className="text-3xl font-bold">إدارة طلاب الصف</h1>
            <p className="text-muted-foreground">
              {classData.class_name.name} - {classData.grade_level.label}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Users className="h-3 w-3 mr-1" />
          {students.length} طالب
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Students List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                الطلاب الحاليون
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا توجد طلاب في هذا الصف</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.map((student) => (
                    <div key={student.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UniversalAvatar
                            avatarUrl={student.avatar_url}
                            userName={student.full_name}
                            size="md"
                          />
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            {student.email && (
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                            )}
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>إزالة الطالب من الصف</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من إزالة {student.full_name} من هذا الصف؟
                                سيتم إلغاء تسجيله في الصف فقط وليس حذفه من النظام.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRemoveStudent(student.id, student.full_name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                إزالة
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      
                      {student.email && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendWelcomeEmailToStudent(student)}
                          disabled={emailStatus[student.id] === 'sending'}
                          className="w-full text-xs"
                        >
                          {emailStatus[student.id] === 'sending' && (
                            <>
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
                              جاري الإرسال...
                            </>
                          )}
                          {emailStatus[student.id] === 'sent' && (
                            <>
                              <Check className="h-3 w-3 mr-1 text-green-600" />
                              تم الإرسال
                            </>
                          )}
                          {emailStatus[student.id] === 'failed' && (
                            <>
                              <X className="h-3 w-3 mr-1 text-red-600" />
                              فشل الإرسال
                            </>
                          )}
                          {!emailStatus[student.id] && (
                            <>
                              <Mail className="h-3 w-3 mr-1" />
                              إرسال رسالة ترحيبية
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Students */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>إضافة طلاب جدد</CardTitle>
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
                      <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        تحميل القالب
                      </Button>
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
                      <label htmlFor="sendWelcomeEmailBulk" className="text-sm font-medium flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        إرسال رسائل ترحيبية للطلاب الجدد (للذين لديهم بريد إلكتروني)
                      </label>
                    </div>

                    <div className="flex gap-2">
                      {importData.length > 0 && (
                        <Button 
                          onClick={handleImportStudents}
                          disabled={loading}
                          className="flex-1"
                        >
                          {loading ? 'جاري الاستيراد...' : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              استيراد {importData.length} طالب
                            </>
                          )}
                        </Button>
                      )}
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setImportData([]);
                                setImportErrors([]);
                                setImportSummary({ total: 0, valid: 0, invalid: 0 });
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              إلغاء
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};