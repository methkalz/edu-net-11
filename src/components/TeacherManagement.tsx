import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Upload, X, Check, AlertCircle, UserPlus, Mail, Edit, Trash2, Users } from 'lucide-react';
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

interface Teacher {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  created_at: string;
  assigned_classes: Class[];
  avatar_url?: string;
  display_title?: string;
}

interface Class {
  id: string;
  class_name: {
    name: string;
  };
  grade_level: {
    label: string;
  };
  academic_year: {
    name: string;
  };
}

interface NewTeacher {
  full_name: string;
  email: string;
  phone?: string;
  password?: string;
  assigned_classes: string[];
}

interface EditTeacherForm {
  full_name: string;
  email: string;
  phone?: string;
  assigned_classes: string[];
}

interface TeacherManagementProps {
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

export const TeacherManagement: React.FC<TeacherManagementProps> = ({ onBack }) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  
  // Form state
  const [newTeacher, setNewTeacher] = useState<NewTeacher>({
    full_name: '',
    email: '',
    phone: '+972',
    password: '',
    assigned_classes: []
  });
  
  const [editForm, setEditForm] = useState<EditTeacherForm>({
    full_name: '',
    email: '',
    phone: '',
    assigned_classes: []
  });
  
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [emailErrorMessage, setEmailErrorMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [userProfile?.school_id]);

  const loadData = async () => {
    if (!userProfile?.school_id) return;
    
    setLoading(true);
    try {
      // Load teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone, created_at, avatar_url, display_title')
        .eq('school_id', userProfile.school_id)
        .eq('role', 'teacher')
        .order('created_at', { ascending: false });

      if (teachersError) throw teachersError;

      // Load classes for the school
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          class_name:class_names(name),
          grade_level:grade_levels(label),
          academic_year:academic_years(name)
        `)
        .eq('school_id', userProfile.school_id)
        .eq('status', 'active')
        .order('created_at_utc', { ascending: false });

      if (classesError) throw classesError;
      setClasses(classesData || []);

      // Load teacher assignments and build teachers with their assigned classes
      if (teachersData && teachersData.length > 0) {
        const teacherIds = teachersData.map(t => t.user_id);
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('teacher_classes')
          .select('teacher_id, class_id')
          .in('teacher_id', teacherIds);

        if (assignmentsError) {
          logger.error('Error loading assignments', assignmentsError);
        }

        // Get class details for assigned classes
        const assignedClassIds = assignmentsData?.map(a => a.class_id) || [];
        let assignedClassesDetails: Class[] = [];
        
        if (assignedClassIds.length > 0) {
          const { data: classDetails, error: classDetailsError } = await supabase
            .from('classes')
            .select(`
              id,
              class_name:class_names(name),
              grade_level:grade_levels(label),
              academic_year:academic_years(name)
            `)
            .in('id', assignedClassIds);

          if (!classDetailsError && classDetails) {
            assignedClassesDetails = classDetails;
          }
        }

        // Map teachers with their assigned classes
        const teachersWithClasses = teachersData.map(teacher => {
          const teacherAssignments = assignmentsData?.filter(
            assignment => assignment.teacher_id === teacher.user_id
          ) || [];
          
          const teacherClasses = teacherAssignments.map(assignment => 
            assignedClassesDetails.find(cls => cls.id === assignment.class_id)
          ).filter(Boolean) as Class[];
          
          return {
            ...teacher,
            assigned_classes: teacherClasses
          };
        });

        setTeachers(teachersWithClasses);
      } else {
        setTeachers([]);
      }
    } catch (error: any) {
      logger.error('Error loading data', error as Error);
      toast({
        variant: "destructive",
        title: "خطأ في تحميل البيانات",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.full_name.trim() || !newTeacher.email.trim()) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "يرجى إدخال الاسم والبريد الإلكتروني"
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
    if (sendWelcomeEmail) {
      setEmailStatus('sending');
      setEmailErrorMessage('');
    }

    try {
      // Generate password if not provided
      const password = newTeacher.password || generatePassword();

      // Use the secure create-teacher edge function
      const { data, error } = await supabase.functions.invoke('create-teacher', {
        body: {
          email: newTeacher.email.trim(),
          password: password,
          fullName: newTeacher.full_name.trim(),
          phone: newTeacher.phone || null,
          classIds: newTeacher.assigned_classes,
          sendWelcomeEmail: sendWelcomeEmail
        }
      });

      if (error) {
        logger.error('Error creating teacher', error);
        if (sendWelcomeEmail) {
          setEmailStatus('error');
          setEmailErrorMessage('فشل في إرسال البريد الإلكتروني');
        }
        
        // Handle specific error cases
        if (error.message?.includes('موجود مسبقاً')) {
          // This means user exists with incompatible role
          const errorMessage = error.message || "المستخدم موجود مسبقاً";
          toast({
            variant: "destructive",
            title: "خطأ في إنشاء المعلم",
            description: errorMessage
          });
          return; // Don't throw, just show error and return
        }
        
        throw new Error(error.message || "فشل في إنشاء المعلم");
      }

      if (!data?.success) {
        if (sendWelcomeEmail) {
          setEmailStatus('error');
          setEmailErrorMessage(data?.emailError || 'فشل في إرسال البريد الإلكتروني');
        }
        throw new Error(data?.error || "فشل في إنشاء المعلم");
      }

      // Determine if this was a conversion or new user creation
      const isConversion = data?.isExistingUser || false;
      const actionVerb = isConversion ? "تم تحويل" : "تم إضافة";
      const actionDescription = isConversion ? "من طالب إلى معلم" : "كمعلم جديد";

      // Check email status from response
      if (sendWelcomeEmail) {
        if (data?.emailSent) {
          setEmailStatus('success');
          toast({
            title: `${actionVerb} المستخدم بنجاح`,
            description: `${actionVerb} ${newTeacher.full_name} ${actionDescription} وتم إرسال بريد ترحيبي إلى ${newTeacher.email}`
          });
          
          // Keep the success status visible for a moment before resetting
          setTimeout(() => {
            setEmailStatus('idle');
            setEmailErrorMessage('');
            setShowAddForm(false);
          }, 3000);
        } else {
          setEmailStatus('error');
          setEmailErrorMessage(data?.emailError || 'فشل في إرسال البريد الإلكتروني');
          
          // Show warning about email failure and Resend limitations
          const emailErrorDetails = data?.emailError?.includes('methkal88@gmail.com') 
            ? 'في البيئة التجريبية، يمكن إرسال الإيميلات فقط إلى البريد المسجل في Resend (methkal88@gmail.com). لإرسال إيميلات لعناوين أخرى، يجب تفعيل نطاق مخصص في Resend.'
            : data?.emailError || 'فشل في إرسال البريد الإلكتروني';
          
          toast({
            title: `${actionVerb} المستخدم بنجاح`,
            description: `${actionVerb} ${newTeacher.full_name} ${actionDescription} ولكن فشل في إرسال البريد الإلكتروني: ${emailErrorDetails}`,
            variant: "destructive"
          });
          
          // Keep the form open on email error so user can see the status
          setTimeout(() => {
            setEmailStatus('idle');
            setEmailErrorMessage('');
          }, 8000);
        }
      } else {
        toast({
          title: `${actionVerb} المستخدم بنجاح`, 
          description: `${actionVerb} ${newTeacher.full_name} ${actionDescription}`
        });
        
        // Reset form immediately if no email was sent
        setShowAddForm(false);
      }

      // Reset form data
      setNewTeacher({
        full_name: '',
        email: '',
        phone: '+972',
        password: '',
        assigned_classes: []
      });
      setSendWelcomeEmail(true);
      
      // Only close form immediately if no email was sent or email was successful
      if (!sendWelcomeEmail || data?.emailSent) {
        // Form closure is handled above with setTimeout for email success
      }
      
      // Reload data
      loadData();

    } catch (error: any) {
      logger.error('Error adding teacher', error as Error);
      toast({
        variant: "destructive",
        title: "خطأ في إضافة المعلم",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    setLoading(true);
    try {
      // Use the secure delete-user-completely edge function
      const { data, error } = await supabase.functions.invoke('delete-user-completely', {
        body: {
          userId: teacherId,
          userType: 'teacher'
        }
      });

      if (error) {
        logger.error('Error deleting teacher', error);
        throw new Error(error.message || "فشل في حذف المعلم");
      }

      if (!data?.success) {
        throw new Error(data?.message || "فشل في حذف المعلم");
      }

      toast({
        title: "تم حذف المعلم بنجاح",
        description: "تم حذف المعلم وجميع البيانات المرتبطة به من النظام"
      });

      // Reload data
      loadData();
    } catch (error: any) {
      logger.error('Error deleting teacher', error as Error);
      toast({
        variant: "destructive",
        title: "خطأ في حذف المعلم",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelection = (classId: string, checked: boolean) => {
    if (checked) {
      setNewTeacher(prev => ({
        ...prev,
        assigned_classes: [...prev.assigned_classes, classId]
      }));
    } else {
      setNewTeacher(prev => ({
        ...prev,
        assigned_classes: prev.assigned_classes.filter(id => id !== classId)
      }));
    }
  };

  const handleEditClassSelection = (classId: string, checked: boolean) => {
    if (checked) {
      setEditForm(prev => ({
        ...prev,
        assigned_classes: [...prev.assigned_classes, classId]
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        assigned_classes: prev.assigned_classes.filter(id => id !== classId)
      }));
    }
  };

  const handleEditTeacher = async () => {
    if (!editForm.full_name.trim() || !editForm.email.trim() || !editingTeacher) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "يرجى إدخال الاسم والبريد الإلكتروني"
      });
      return;
    }

    setLoading(true);

    try {
      // Update teacher profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone || null
        })
        .eq('user_id', editingTeacher.user_id);

      if (profileError) throw profileError;

      // Update teacher class assignments
      // First, remove existing assignments
      const { error: deleteError } = await supabase
        .from('teacher_classes')
        .delete()
        .eq('teacher_id', editingTeacher.user_id);

      if (deleteError) throw deleteError;

      // Then add new assignments
      if (editForm.assigned_classes.length > 0) {
        const assignments = editForm.assigned_classes.map(classId => ({
          teacher_id: editingTeacher.user_id,
          class_id: classId
        }));

        const { error: insertError } = await supabase
          .from('teacher_classes')
          .insert(assignments);

        if (insertError) throw insertError;
      }

      toast({
        title: "تم تحديث المعلم بنجاح",
        description: `تم تحديث بيانات ${editForm.full_name} بنجاح`
      });

      setEditingTeacher(null);
      setEditForm({
        full_name: '',
        email: '',
        phone: '',
        assigned_classes: []
      });
      
      // Reload data
      loadData();

    } catch (error: any) {
      logger.error('Error updating teacher', error as Error);
      toast({
        variant: "destructive",
        title: "خطأ في تحديث المعلم",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditingTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditForm({
      full_name: teacher.full_name,
      email: teacher.email,
      phone: teacher.phone || '',
      assigned_classes: teacher.assigned_classes.map(c => c.id)
    });
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
        <div className="flex items-center space-x-reverse space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 ml-1" />
            العودة
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة المعلمين</h1>
            <p className="text-muted-foreground">إضافة وإدارة معلمي المدرسة</p>
          </div>
        </div>

        {!showAddForm && (
          <Button 
            onClick={() => setShowAddForm(true)}
            className="gradient-primary"
          >
            <UserPlus className="h-4 w-4 ml-1" />
            إضافة معلم جديد
          </Button>
        )}
      </div>

      {/* Add Teacher Form */}
      {showAddForm && (
        <Card className="glass-card soft-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-reverse space-x-3">
                <UserPlus className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>إضافة معلم جديد</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    أدخل بيانات المعلم وحدد الصفوف المخصصة له
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-right flex items-center">
                  الاسم الكامل <span className="text-red-500 mr-1">*</span>
                </Label>
                <Input
                  id="full_name"
                  value={newTeacher.full_name}
                  onChange={(e) => setNewTeacher(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="أدخل الاسم الكامل"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-right flex items-center">
                  البريد الإلكتروني <span className="text-red-500 mr-1">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="example@school.com"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-right">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newTeacher.phone}
                  onChange={(e) => setNewTeacher(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+972"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-right">كلمة المرور (اختياري)</Label>
                <Input
                  id="password"
                  type="password"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="ستُنشأ تلقائياً إذا تُركت فارغة"
                  className="text-right"
                />
              </div>
            </div>

            <Separator />

            {/* Class Assignment */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">تخصيص الصفوف</Label>
              <p className="text-sm text-muted-foreground">
                اختر الصفوف التي سيقوم المعلم بتدريسها
              </p>
              
              {classes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                  {classes.map((classItem) => (
                    <div 
                      key={classItem.id} 
                      className="flex items-center space-x-reverse space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={newTeacher.assigned_classes.includes(classItem.id)}
                        onCheckedChange={(checked) => handleClassSelection(classItem.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{classItem.class_name.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {classItem.grade_level.label} - {classItem.academic_year.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  لا توجد صفوف نشطة متاحة للتخصيص
                </p>
              )}
            </div>

            <Separator />

            {/* Welcome Email Option */}
            <div className="space-y-3">
              <div className="flex items-center space-x-reverse space-x-3">
                <Checkbox
                  checked={sendWelcomeEmail}
                  onCheckedChange={(checked) => setSendWelcomeEmail(checked === true)}
                />
                <div className="flex items-center space-x-reverse space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                 <Label>إرسال بريد ترحيبي مع بيانات الدخول</Label>
               </div>
             </div>
             
             {/* Email Status Display */}
             {sendWelcomeEmail && emailStatus !== 'idle' && (
               <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                 emailStatus === 'sending' ? 'bg-blue-50 border-blue-300 shadow-blue-100' :
                 emailStatus === 'success' ? 'bg-green-50 border-green-300 shadow-green-100' :
                 'bg-red-50 border-red-300 shadow-red-100'
               } shadow-lg`}>
                 <div className="flex items-center space-x-reverse space-x-3">
                   {emailStatus === 'sending' && (
                     <>
                       <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                       <div>
                         <p className="text-sm text-blue-700 font-medium">جاري إرسال البريد الإلكتروني...</p>
                         <p className="text-xs text-blue-600 mt-1">يرجى الانتظار</p>
                       </div>
                     </>
                   )}
                   {emailStatus === 'success' && (
                     <>
                       <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                         <Check className="h-3 w-3 text-green-600" />
                       </div>
                       <div>
                         <p className="text-sm text-green-700 font-medium">✅ تم إرسال البريد الإلكتروني بنجاح</p>
                         <p className="text-xs text-green-600 mt-1">تم إرسال بيانات الدخول إلى المعلم</p>
                       </div>
                     </>
                   )}
                   {emailStatus === 'error' && (
                     <>
                       <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                         <AlertCircle className="h-3 w-3 text-red-600" />
                       </div>
                       <div className="flex-1">
                         <p className="text-sm text-red-700 font-medium">❌ فشل في إرسال البريد الإلكتروني</p>
                         {emailErrorMessage && (
                           <p className="text-xs text-red-600 mt-1">{emailErrorMessage}</p>
                         )}
                         <p className="text-xs text-red-500 mt-2">يمكن للمعلم استخدام بيانات الدخول يدوياً</p>
                       </div>
                     </>
                   )}
                 </div>
               </div>
             )}
           </div>

           <div className="flex gap-3">
             <Button 
               onClick={handleAddTeacher}
               disabled={loading || !newTeacher.full_name.trim() || !newTeacher.email.trim()}
               className="flex-1"
             >
               {loading ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-1"></div>
                   جاري الإضافة...
                 </>
               ) : (
                 <>
                   <Check className="h-4 w-4 ml-1" />
                   إضافة المعلم
                 </>
               )}
             </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Teacher Form */}
      {editingTeacher && (
        <Card className="glass-card soft-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-reverse space-x-3">
                <Edit className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>تعديل بيانات المعلم</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    تعديل بيانات {editingTeacher.full_name}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditingTeacher(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name" className="text-right flex items-center">
                  الاسم الكامل <span className="text-red-500 mr-1">*</span>
                </Label>
                <Input
                  id="edit_full_name"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="أدخل الاسم الكامل"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_email" className="text-right flex items-center">
                  البريد الإلكتروني <span className="text-red-500 mr-1">*</span>
                </Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="example@school.com"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_phone" className="text-right">رقم الهاتف</Label>
                <Input
                  id="edit_phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+972"
                  className="text-right"
                />
              </div>
            </div>

            <Separator />

            {/* Class Assignment */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">تخصيص الصفوف</Label>
              <p className="text-sm text-muted-foreground">
                اختر الصفوف التي سيقوم المعلم بتدريسها
              </p>
              
              {classes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                  {classes.map((classItem) => (
                    <div 
                      key={classItem.id} 
                      className="flex items-center space-x-reverse space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={editForm.assigned_classes.includes(classItem.id)}
                        onCheckedChange={(checked) => handleEditClassSelection(classItem.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{classItem.class_name.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {classItem.grade_level.label} - {classItem.academic_year.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  لا توجد صفوف نشطة متاحة للتخصيص
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleEditTeacher}
                disabled={loading || !editForm.full_name.trim() || !editForm.email.trim()}
                className="flex-1"
              >
                <Check className="h-4 w-4 ml-1" />
                تحديث البيانات
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingTeacher(null)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teachers List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">قائمة المعلمين</h2>
          <Badge variant="secondary">{teachers.length} معلم</Badge>
        </div>

        {teachers.length === 0 ? (
          <Card className="glass-card soft-shadow">
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-center">لا يوجد معلمون بعد</h3>
              <p className="text-muted-foreground mb-4 text-center">
                ابدأ بإضافة معلمين للمدرسة
              </p>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="gradient-primary"
              >
                <UserPlus className="h-4 w-4 ml-1" />
                إضافة معلم جديد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((teacher) => (
              <Card key={teacher.user_id} className="group relative overflow-hidden bg-gradient-to-br from-card via-card to-card/80 border border-border/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/20 flex flex-col h-full">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardHeader className="relative pb-4 bg-gradient-to-r from-muted/20 to-transparent">
                  <div className="flex items-start gap-4">
                    <UniversalAvatar
                      avatarUrl={teacher.avatar_url}
                      userName={teacher.full_name}
                      size="lg"
                      className="flex-shrink-0"
                    />
                    <div className="flex items-start justify-between flex-1">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl font-bold bg-gradient-to-l from-foreground to-foreground/80 bg-clip-text text-transparent">
                            {teacher.full_name}
                          </CardTitle>
                          <UserTitleBadge
                            role="teacher"
                            displayTitle={teacher.display_title}
                            size="sm"
                            variant="secondary"
                          />
                        </div>
                        <div className="flex items-center space-x-reverse space-x-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <p className="text-sm">{teacher.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    {/* Phone number - only show if exists and has at least 10 digits */}
                    {teacher.phone && teacher.phone.replace(/\D/g, '').length >= 10 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <span className="text-sm text-muted-foreground">الهاتف:</span>
                        <span className="text-sm font-medium">{teacher.phone}</span>
                      </div>
                    )}
                    
                    {/* Classes assigned */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-sm text-muted-foreground">الصفوف المخصصة:</span>
                      <Badge variant="outline" className="bg-background/50">
                        {teacher.assigned_classes.length} صف
                      </Badge>
                    </div>

                    {/* Class badges */}
                    {teacher.assigned_classes.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-medium">الصفوف:</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {teacher.assigned_classes.map((classItem) => (
                            <Badge 
                              key={classItem.id} 
                              variant="outline" 
                              className="text-xs bg-gradient-to-r from-secondary/20 to-secondary/10 border-secondary/40 hover:from-secondary/30 hover:to-secondary/20 transition-all duration-200"
                            >
                              {classItem.class_name.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Creation date */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-sm text-muted-foreground">تاريخ الإضافة:</span>
                      <span className="text-sm font-medium">
                        {new Date(teacher.created_at).getDate()}.{new Date(teacher.created_at).getMonth() + 1}.{new Date(teacher.created_at).getFullYear()}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Action buttons - Fixed at bottom */}
                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 group/btn hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all duration-200"
                      onClick={() => startEditingTeacher(teacher)}
                    >
                      <Edit className="h-4 w-4 ml-1 group-hover/btn:scale-110 transition-transform duration-200" />
                      تعديل
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3 hover:bg-destructive/5 hover:border-destructive/40 hover:text-destructive transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gradient-to-br from-background to-background/95">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-right">تأكيد الحذف</AlertDialogTitle>
                          <AlertDialogDescription className="text-right">
                            هل أنت متأكد من حذف المعلم "<span className="font-semibold text-foreground">{teacher.full_name}</span>" نهائياً؟
                            <br />
                            سيتم حذف جميع التخصيصات المرتبطة به ولا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="space-x-reverse space-x-2">
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteTeacher(teacher.user_id)}
                            className="bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive text-destructive-foreground"
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
    </div>
  );
};