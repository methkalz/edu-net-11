import React, { useState, useEffect, useMemo } from 'react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { School, Users, MapPin, Plus, X, Trash2, Edit, Search, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';

// Combined schema that handles both create and edit modes
const schoolSchema = z.object({
  name: z.string().min(2, 'اسم المدرسة مطلوب'),
  school_admin_name: z.string().min(2, 'اسم مدير المدرسة مطلوب').or(z.literal('')),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').optional().or(z.literal('')),
  city: z.string().min(1, 'المدينة مطلوبة'),
  package_id: z.string().min(1, 'يجب اختيار باقة'),
});

// Validation for create mode (strict)
const validateForCreate = (data: SchoolForm) => {
  if (!data.school_admin_name || data.school_admin_name.length < 2) {
    throw new Error('اسم مدير المدرسة مطلوب');
  }
  if (!data.email) {
    throw new Error('البريد الإلكتروني مطلوب لإنشاء مدرسة جديدة');
  }
  if (!data.password || data.password.length < 6) {
    throw new Error('كلمة المرور مطلوبة ويجب أن تكون 6 أحرف على الأقل');
  }
};

const citySchema = z.object({
  name: z.string().min(2, 'اسم المدينة مطلوب'),
});

type SchoolForm = z.infer<typeof schoolSchema>;
type CityForm = z.infer<typeof citySchema>;

interface School {
  id: string;
  name: string;
  city?: string;
  plan: string;
  created_at: string;
  updated_at_utc: string;
  package_name?: string;
}

interface City {
  id: string;
  name: string;
}

interface Package {
  id: string;
  name: string;
  name_ar: string;
  color: string;
  price: number;
  currency: string;
}

const SchoolManagement = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  const schoolForm = useForm<SchoolForm>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '',
      school_admin_name: '',
      email: '',
      password: '',
      city: '',
      package_id: '',
    },
  });

  const cityForm = useForm<CityForm>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: '',
    },
  });

  // Filter cities based on search query
  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) {
      return cities;
    }
    return cities.filter(city => 
      city.name.includes(citySearchQuery.trim())
    );
  }, [cities, citySearchQuery]);

  const fetchSchools = async () => {
    try {
      // First, get all schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (schoolsError) throw schoolsError;

      // Then, get school packages with package names manually
      const { data: schoolPackagesData } = await supabase
        .from('school_packages')
        .select('school_id, package_id')
        .eq('status', 'active')
        .or('end_date.is.null,end_date.gt.now()');

      // Get package names separately
      const packageIds = schoolPackagesData?.map(sp => sp.package_id) || [];
      const { data: packagesData } = await supabase
        .from('packages')
        .select('id, name_ar')
        .in('id', packageIds);

      // Map schools with their packages
      const schoolsWithPackages = schoolsData?.map(school => {
        const schoolPackage = schoolPackagesData?.find(sp => sp.school_id === school.id);
        const packageInfo = packagesData?.find(p => p.id === schoolPackage?.package_id);
        return {
          ...school,
          package_name: packageInfo?.name_ar || null
        };
      }) || [];
      
      setSchools(schoolsWithPackages);
    } catch (error) {
      handleError(error, {
        context: 'school_management',
        action: 'fetch_schools'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      handleError(error, {
        context: 'city_management',
        action: 'fetch_cities'
      });
    }
  };

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('id, name, name_ar, color, price, currency')
        .eq('is_active', true)
        .order('name_ar');

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      handleError(error, {
        context: 'package_management',
        action: 'fetch_packages'
      });
    }
  };

  useEffect(() => {
    fetchSchools();
    fetchCities();
    fetchPackages();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmitSchool = async (data: SchoolForm) => {
    logger.debug('بدء معالجة نموذج المدرسة', { data, editingSchool: !!editingSchool });
    
    try {
      setIsSubmitting(true);

      // Validate user role
      if (userProfile?.role !== 'superadmin') {
        toast({
          variant: "destructive",
          title: "خطأ في الصلاحية",
          description: "يجب أن تكون مدير نظام لتعديل المدارس",
        });
        return;
      }

      // Validate based on mode (create vs edit)
      if (!editingSchool) {
        validateForCreate(data);
      }
      
      if (editingSchool) {
        logger.info('تحديث مدرسة موجودة', { schoolId: editingSchool.id });
        
        // Update existing school
        const { error: schoolError } = await supabase
          .from('schools')
          .update({
            name: data.name,
            city: data.city,
            updated_at_utc: new Date().toISOString(), // احتياطي إذا فشل الـ trigger
          })
          .eq('id', editingSchool.id);

        if (schoolError) {
          logger.error('خطأ في تحديث المدرسة', new Error(schoolError.message), { schoolId: editingSchool.id });
          throw schoolError;
        }
        logger.info('تم تحديث المدرسة بنجاح', { schoolId: editingSchool.id });

        // Update package if changed
        if (data.package_id) {
          logger.info('بدء تحديث باقة المدرسة', { 
            schoolId: editingSchool.id,
            newPackageId: data.package_id 
          });
          
          // Check if package exists and is active
          const { data: packageData, error: packageCheckError } = await supabase
            .from('packages')
            .select('id, name_ar, is_active')
            .eq('id', data.package_id)
            .eq('is_active', true)
            .single();

          if (packageCheckError || !packageData) {
            const errorMsg = packageCheckError?.message || 'الباقة غير موجودة';
            logger.error('الباقة المحددة غير متاحة', new Error(errorMsg), { 
              packageId: data.package_id 
            });
            toast({
              variant: "destructive",
              title: "خطأ في الباقة",
              description: `الباقة المحددة غير متاحة: ${errorMsg}`,
            });
            return;
          }

          // Get current package subscription
          const { data: currentPackage, error: currentPackageError } = await supabase
            .from('school_packages')
            .select('id, package_id, packages(name_ar)')
            .eq('school_id', editingSchool.id)
            .maybeSingle();

          if (currentPackageError) {
            logger.error('خطأ في فحص الباقة الحالية', new Error(currentPackageError.message), { 
              schoolId: editingSchool.id 
            });
            toast({
              variant: "destructive",
              title: "خطأ في فحص الباقة الحالية",
              description: `فشل في فحص الباقة: ${currentPackageError.message}`,
            });
            return;
          }

          // Check if package is actually different
          if (currentPackage && currentPackage.package_id === data.package_id) {
            toast({
              title: "تنبيه",
              description: "الباقة المحددة هي نفس الباقة الحالية",
            });
            setIsSubmitting(false);
            setDialogOpen(false);
            setEditingSchool(null);
            return;
          }

          try {
            if (currentPackage) {
              // Update existing package subscription
              logger.info('تحديث اشتراك الباقة الموجود', { 
                currentPackageId: currentPackage.package_id,
                newPackageId: data.package_id 
              });
              
              const { error: updateError } = await supabase
                .from('school_packages')
                .update({
                  package_id: data.package_id,
                  status: 'active',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', currentPackage.id);

              if (updateError) {
                logger.error('خطأ في تحديث اشتراك الباقة', new Error(updateError.message), { 
                  schoolId: editingSchool.id,
                  packageId: data.package_id 
                });
                toast({
                  variant: "destructive",
                  title: "خطأ في تحديث الباقة",
                  description: `فشل في تحديث الباقة: ${updateError.message}`,
                });
                return;
              }
              logger.info('تم تحديث اشتراك الباقة بنجاح', { 
                schoolId: editingSchool.id,
                packageId: data.package_id 
              });
            } else {
              // Create new package subscription
              logger.info('إنشاء اشتراك باقة جديد');
              
              const { error: insertError } = await supabase
                .from('school_packages')
                .insert({
                  school_id: editingSchool.id,
                  package_id: data.package_id,
                  status: 'active',
                  start_date: new Date().toISOString(),
                });

              if (insertError) {
                logger.error('خطأ في إنشاء اشتراك الباقة الجديد', new Error(insertError.message), { 
                  schoolId: editingSchool.id,
                  packageId: data.package_id 
                });
                toast({
                  variant: "destructive",
                  title: "خطأ في إنشاء اشتراك الباقة",
                  description: `فشل في إنشاء الاشتراك: ${insertError.message}`,
                });
                return;
              }
              logger.info('تم إنشاء اشتراك الباقة الجديد بنجاح', { 
                schoolId: editingSchool.id,
                packageId: data.package_id 
              });
            }
          } catch (packageError: any) {
            logger.error('خطأ عام في تحديث الباقة', packageError, { 
              schoolId: editingSchool.id,
              packageId: data.package_id 
            });
            toast({
              variant: "destructive",
              title: "خطأ في تحديث الباقة",
              description: `حدث خطأ غير متوقع: ${packageError.message || packageError}`,
            });
            return;
          }
        }

        toast({
          title: 'تم التحديث بنجاح',
          description: `تم تحديث بيانات المدرسة ${data.name} بنجاح`,
        });
      } else {
        // Create new school

        logger.info('بدء إنشاء مدرسة جديدة مع المشرف', { schoolName: data.name });
        
        // Step 0: Save current session to restore later
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        logger.debug('تم حفظ الجلسة الحالية لاستعادتها لاحقاً');
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .insert([{
            name: data.name,
            city: data.city,
          }])
          .select()
          .single();

        if (schoolError) {
          logger.error('خطأ في إنشاء المدرسة', new Error(schoolError.message), { schoolName: data.name });
          throw schoolError;
        }

        logger.info('تم إنشاء المدرسة بنجاح', { 
          schoolId: schoolData.id, 
          schoolName: schoolData.name 
        });

        // Step 2: Create admin user profile
        const adminEmail = data.email;
        
        // Create auth user for admin
        const { data: authUser, error: authError } = await supabase.auth.signUp({
          email: adminEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.school_admin_name,
              role: 'school_admin',
              school_id: schoolData.id,
              is_primary_admin: true
            }
          }
        });

        if (authError) {
          logger.error('خطأ في إنشاء حساب المشرف', new Error(authError.message), { 
            adminEmail, 
            schoolId: schoolData.id 
          });
          // If user creation fails, delete the school
          await supabase.from('schools').delete().eq('id', schoolData.id);
          throw authError;
        }

        logger.info('تم إنشاء حساب المشرف بنجاح', { 
          adminId: authUser.user?.id, 
          adminEmail,
          schoolId: schoolData.id 
        });

        // Step 3: Update the profile BEFORE restoring session
        if (authUser.user) {
          logger.debug('تحديث ملف تعريف المشرف الجديد', { 
            userId: authUser.user.id,
            schoolId: schoolData.id 
          });
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              role: 'school_admin',
              full_name: data.school_admin_name,
              school_id: schoolData.id,
              is_primary_admin: true,
              email: adminEmail
            })
            .eq('user_id', authUser.user.id);

          if (profileError) {
            logger.error('خطأ في تحديث ملف تعريف المشرف', new Error(profileError.message), { 
              userId: authUser.user.id,
              schoolId: schoolData.id 
            });
            // If profile update fails, delete the school and user
            await supabase.from('schools').delete().eq('id', schoolData.id);
            throw new Error(`فشل في تحديث بروفايل المدير: ${profileError.message}`);
          } else {
            logger.info('تم تحديث ملف تعريف المشرف بنجاح', { 
              userId: authUser.user.id,
              schoolId: schoolData.id 
            });
          }
        } else {
          logger.error('لم يتم إرجاع كائن المستخدم من إنشاء المصادقة');
          await supabase.from('schools').delete().eq('id', schoolData.id);
          throw new Error('فشل في إنشاء حساب المدير');
        }

        // Step 4: NOW restore the original session to stay logged in as superadmin
        if (currentSession) {
          await supabase.auth.setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token
          });
          logger.info('تم استعادة جلسة المدير العام الأصلية بنجاح');
        }

        // Step 5: Add package subscription if provided
        if (data.package_id) {
          const { error: packageError } = await supabase
            .from('school_packages')
            .insert({
              school_id: schoolData.id,
              package_id: data.package_id,
              status: 'active',
              start_date: new Date().toISOString(),
            });

          if (packageError) {
            logger.error('خطأ في إنشاء اشتراك الباقة', new Error(packageError.message), { 
              schoolId: schoolData.id,
              packageId: data.package_id 
            });
          } else {
            logger.info('تم إنشاء اشتراك الباقة بنجاح', { 
              schoolId: schoolData.id,
              packageId: data.package_id 
            });
          }
        }

        logger.info('تم إنشاء المدرسة والمشرف بنجاح عبر الطريقة المباشرة', { 
          schoolId: schoolData.id,
          schoolName: data.name 
        });

        toast({
          title: 'تم بنجاح',
          description: 'تم إنشاء المدرسة والحساب والباقة بنجاح',
        });
      }

      schoolForm.reset();
      setDialogOpen(false);
      setEditingSchool(null);
      setCitySearchQuery('');
      fetchSchools();
    } catch (error: any) {
      const errorMessage = error?.message || error || 'خطأ غير محدد';
      logger.error('خطأ في معالجة المدرسة', error, { 
        schoolData: data,
        editingSchool: !!editingSchool 
      });
      toast({
        variant: "destructive",
        title: "خطأ في حفظ البيانات",
        description: `حدث خطأ أثناء حفظ بيانات المدرسة: ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitCity = async (data: CityForm) => {
    try {
      const { error } = await supabase
        .from('cities')
        .insert([{ name: data.name }]);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة المدينة بنجاح',
      });

      cityForm.reset();
      setCityDialogOpen(false);
      fetchCities();
    } catch (error: any) {
      handleError(error, {
        context: 'city_management',
        action: 'create_city',
        cityName: data.name
      });
    }
  };

  const deleteCity = async (cityId: string) => {
    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', cityId);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف المدينة بنجاح',
      });

      fetchCities();
    } catch (error: any) {
      handleError(error, {
        context: 'city_management',
        action: 'delete_city',
        cityId
      });
    }
  };

  const deleteSchool = async (schoolId: string) => {
    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', schoolId);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف المدرسة بنجاح',
      });

      fetchSchools();
    } catch (error: any) {
      handleError(error, {
        context: 'school_management',
        action: 'delete_school',
        schoolId
      });
    }
  };

  const handleCitySelect = (cityName: string) => {
    schoolForm.setValue('city', cityName);
    setCitySearchQuery('');
  };

  const handleEditSchool = async (school: School) => {
    console.log('🔧 بدء تعديل المدرسة:', school.name, school.id);
    
    setEditingSchool(school);
    
    try {
      console.log('📦 جلب بيانات الباقة والمدير للمدرسة:', school.id);
      
      // Get current package for the school
      const { data: packageData } = await supabase
        .from('school_packages')
        .select('package_id')
        .eq('school_id', school.id)
        .eq('status', 'active')
        .or('end_date.is.null,end_date.gt.now()')
        .maybeSingle();
      
      console.log('📦 بيانات الباقة المستلمة:', packageData);
      
      // Get school admin data from profiles table
      const { data: adminData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('school_id', school.id)
        .eq('role', 'school_admin')
        .maybeSingle();
      
      console.log('👤 بيانات مدير المدرسة المستلمة:', adminData);
      
      schoolForm.reset({
        name: school.name,
        school_admin_name: adminData?.full_name || '',
        city: school.city || '',
        email: adminData?.email || '',
        password: '', // Always empty for editing (optional)
        package_id: packageData?.package_id || '',
      });
      
      console.log('📝 تم إعداد النموذج بنجاح مع بيانات المدير');
    } catch (error) {
      console.error('❌ خطأ في جلب بيانات المدرسة:', error);
      handleError(error, {
        context: 'school_management',
        action: 'fetch_school_data',
        schoolId: school.id,
      });
      
      // Fallback: set form without admin data
      schoolForm.reset({
        name: school.name,
        school_admin_name: '',
        city: school.city || '',
        email: '',
        password: '',
        package_id: '',
      });
    }
    
    console.log('🔓 فتح المودال...');
    setDialogOpen(true);
  };

  const handleNewSchool = () => {
    setEditingSchool(null);
    schoolForm.reset();
    setDialogOpen(true);
  };

  // Check if user is superadmin - after ALL hooks including useEffect
  console.log('👤 المستخدم الحالي:', { 
    profile: userProfile, 
    role: userProfile?.role, 
    loading 
  });
  
  if (!loading && userProfile?.role !== 'superadmin') {
    console.log('🚫 المستخدم ليس مدير عام:', userProfile?.role);
    return (
      <Alert>
        <AlertDescription>
          هذه الصفحة متاحة فقط للمديرين العامين. دورك الحالي: {userProfile?.role || 'غير محدد'}
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-3">
          <School className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gradient">إدارة المدارس</h1>
            <p className="text-muted-foreground">إدارة المدارس والمدن</p>
          </div>
        </div>
        
        <div className="flex space-x-reverse space-x-2">
          <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="card-hover">
                <MapPin className="h-4 w-4 ml-1" />
                إدارة المدن
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إدارة المدن</DialogTitle>
                <DialogDescription>
                  إضافة أو حذف المدن المتاحة
                </DialogDescription>
              </DialogHeader>
              
              <Form {...cityForm}>
                <form onSubmit={cityForm.handleSubmit(onSubmitCity)} className="space-y-4">
                  <FormField
                    control={cityForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المدينة</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسم المدينة" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full btn-elegant">
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة مدينة
                  </Button>
                </form>
              </Form>

              <div className="mt-6">
                <Label className="text-sm font-medium">المدن الحالية</Label>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-2">
                  {cities.map((city) => (
                    <div key={city.id} className="flex items-center justify-between p-2 glass-card rounded-lg">
                      <span className="text-sm">{city.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCity(city.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-elegant" onClick={handleNewSchool}>
                <Plus className="h-4 w-4 ml-1" />
                إضافة مدرسة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingSchool ? 'تعديل المدرسة' : 'إضافة مدرسة جديدة'}
                </DialogTitle>
                <DialogDescription>
                  {editingSchool 
                    ? 'تعديل بيانات المدرسة' 
                    : 'أدخل بيانات المدرسة والحساب الإداري'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <Form {...schoolForm}>
                <form onSubmit={schoolForm.handleSubmit(onSubmitSchool)} className="space-y-4">
                  <FormField
                    control={schoolForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المدرسة</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسم المدرسة" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!editingSchool && (
                    <FormField
                      control={schoolForm.control}
                      name="school_admin_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم مدير المدرسة</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل اسم مدير المدرسة" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {!editingSchool && (
                    <>
                      <FormField
                        control={schoolForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني للمدير</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="admin@school.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={schoolForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="كلمة مرور قوية" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={schoolForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المدينة</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input 
                              placeholder="ابحث عن المدينة أو اختر من القائمة" 
                              value={citySearchQuery || field.value}
                              onChange={(e) => {
                                setCitySearchQuery(e.target.value);
                                if (!e.target.value) {
                                  field.onChange('');
                                }
                              }}
                            />
                            {citySearchQuery && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Search className="h-3 w-3 ml-1" />
                                البحث في المدن
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                        
                        <div className="mt-2">
                          <Label className="text-xs text-muted-foreground">
                            {citySearchQuery ? `نتائج البحث (${filteredCities.length})` : 'المدن المتاحة:'}
                          </Label>
                          <div className="mt-1 flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                            {filteredCities.map((city) => (
                              <Badge
                                key={city.id}
                                variant={field.value === city.name ? "default" : "secondary"}
                                className="cursor-pointer hover:bg-primary/80 text-xs"
                                onClick={() => handleCitySelect(city.name)}
                              >
                                #{city.name}
                              </Badge>
                            ))}
                            {filteredCities.length === 0 && citySearchQuery && (
                              <div className="text-xs text-muted-foreground py-2">
                                لا توجد مدن تطابق البحث "{citySearchQuery}"
                              </div>
                            )}
                          </div>
                        </div>
                      </FormItem>
                    )}
                   />

                   <FormField
                     control={schoolForm.control}
                     name="package_id"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>الباقة</FormLabel>
                         <FormControl>
                           <Select value={field.value} onValueChange={field.onChange}>
                             <SelectTrigger>
                               <SelectValue placeholder="اختر الباقة" />
                             </SelectTrigger>
                             <SelectContent>
                               {packages.map((pkg) => (
                                 <SelectItem key={pkg.id} value={pkg.id}>
                                   <div className="flex items-center gap-2">
                                     <div 
                                       className="w-3 h-3 rounded-full" 
                                       style={{ backgroundColor: pkg.color }}
                                     />
                                     <span>{pkg.name_ar}</span>
                                     <span className="text-sm text-muted-foreground">
                                       ({pkg.price} {pkg.currency})
                                     </span>
                                   </div>
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <Button 
                     type="submit" 
                     className="w-full btn-elegant" 
                     disabled={isSubmitting}
                   >
                     {isSubmitting ? (
                       <div className="flex items-center gap-2">
                         <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                         {editingSchool ? "جاري التحديث..." : "جاري الإنشاء..."}
                       </div>
                     ) : (
                       <>
                         <School className="h-4 w-4 ml-1" />
                         {editingSchool ? 'تحديث المدرسة' : 'إنشاء المدرسة والحساب'}
                       </>
                     )}
                   </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <Card key={school.id} className="glass-card card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gradient">
                  {school.name}
                </CardTitle>
                <div className="flex space-x-reverse space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      console.log('🖱️ تم النقر على زر التعديل للمدرسة:', school.name);
                      handleEditSchool(school);
                    }}
                    className="text-primary hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteSchool(school.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 ml-1" />
                  {school.city || 'غير محدد'}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الباقة:</span>
                  {school.package_name ? (
                    <Badge variant="default">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {school.package_name}
                      </div>
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          غير محدد
                        </div>
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditSchool(school)}
                        className="h-6 w-6 p-0 text-primary hover:text-primary"
                        title="تحديد باقة"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">تاريخ الإنشاء:</span>
                  <span className="text-sm">
                    {format(new Date(school.created_at), 'dd.M.yyyy')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {schools.length === 0 && (
        <Card className="glass-card text-center py-12">
          <CardContent>
            <School className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد مدارس</h3>
            <p className="text-muted-foreground mb-4">
              ابدأ بإضافة أول مدرسة في النظام
            </p>
            <Button onClick={handleNewSchool} className="btn-elegant">
              <Plus className="h-4 w-4 ml-1" />
              إضافة مدرسة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SchoolManagement;