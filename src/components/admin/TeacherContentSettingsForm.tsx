/**
 * Teacher Content Settings Form Component
 * 
 * Allows Super Admins to manage content access settings for teachers
 * in each school. Controls whether teachers see only their assigned
 * grade content or all available content.
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  School, 
  Users, 
  BookOpen, 
  Save, 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface School {
  id: string;
  name: string;
  active_package?: {
    name: string;
    available_grade_contents: any;
  };
}

interface TeacherContentSettings {
  id?: string;
  school_id: string;
  restrict_to_assigned_grades: boolean;
  allow_cross_grade_access: boolean;
  show_all_package_content: boolean;
}

export const TeacherContentSettingsForm: React.FC = () => {
  const { userProfile } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [settings, setSettings] = useState<TeacherContentSettings>({
    school_id: '',
    restrict_to_assigned_grades: true,
    allow_cross_grade_access: false,
    show_all_package_content: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    if (selectedSchoolId) {
      loadSchoolSettings(selectedSchoolId);
    }
  }, [selectedSchoolId]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      
      // جلب المدارس مع بيانات الباقات الفعلية
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select(`
          id, 
          name,
          school_packages!inner(
            id,
            status,
            packages!inner(
              id,
              name_ar,
              available_grade_contents
            )
          )
        `)
        .eq('school_packages.status', 'active')
        .order('name');

      if (schoolsError) throw schoolsError;

      // تحويل البيانات إلى الشكل المطلوب
      const schoolsWithPackages = (schoolsData || []).map((school: any) => {
        const activePackage = school.school_packages?.[0]?.packages;
        
        return {
          id: school.id,
          name: school.name,
          active_package: activePackage ? {
            name: activePackage.name_ar,
            available_grade_contents: activePackage.available_grade_contents || []
          } : null
        };
      });

      // إضافة المدارس التي لا تملك باقات نشطة
      const { data: allSchoolsData, error: allSchoolsError } = await supabase
        .from('schools')
        .select('id, name')
        .order('name');

      if (allSchoolsError) throw allSchoolsError;

      // دمج المدارس مع الباقات والمدارس بدون باقات
      const allSchoolsWithPackages = (allSchoolsData || []).map((school: any) => {
        const schoolWithPackage = schoolsWithPackages.find(s => s.id === school.id);
        return schoolWithPackage || {
          id: school.id,
          name: school.name,
          active_package: null
        };
      });

      setSchools(allSchoolsWithPackages);
    } catch (error) {
      logger.error('Error loading schools with packages', error as Error);
      toast({
        variant: "destructive",
        title: "خطأ في تحميل المدارس",
        description: "فشل في جلب قائمة المدارس والباقات"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSchoolSettings = async (schoolId: string) => {
    try {
      setLoading(true);
      const { data: settingsData, error } = await supabase
        .from('teacher_content_settings')
        .select('*')
        .eq('school_id', schoolId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is OK
        throw error;
      }

      if (settingsData) {
        setSettings(settingsData);
      } else {
        // Create default settings for this school
        setSettings({
          school_id: schoolId,
          restrict_to_assigned_grades: true,
          allow_cross_grade_access: false,
          show_all_package_content: false
        });
      }
    } catch (error) {
      logger.error('Error loading school settings', error as Error);
      toast({
        variant: "destructive",
        title: "خطأ في تحميل الإعدادات",
        description: "فشل في جلب إعدادات المدرسة"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!selectedSchoolId || !userProfile?.user_id) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "يرجى اختيار مدرسة أولاً"
      });
      return;
    }

    try {
      setSaving(true);

      const dataToSave = {
        school_id: selectedSchoolId,
        restrict_to_assigned_grades: settings.restrict_to_assigned_grades,
        allow_cross_grade_access: settings.allow_cross_grade_access,
        show_all_package_content: settings.show_all_package_content,
        created_by: userProfile.user_id
      };

      const { error } = await supabase
        .from('teacher_content_settings')
        .upsert(dataToSave, { 
          onConflict: 'school_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات المضامين التعليمية للمدرسة",
        action: (
          <CheckCircle className="h-4 w-4 text-green-500" />
        )
      });

      // Reload settings to get the updated data
      loadSchoolSettings(selectedSchoolId);
    } catch (error) {
      logger.error('Error saving teacher content settings', error as Error);
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: "فشل في حفظ إعدادات المضامين التعليمية"
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedSchool = schools.find(school => school.id === selectedSchoolId);

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات المضامين التعليمية للمعلمين
          </CardTitle>
          <CardDescription>
            تحكم في وصول المعلمين للمضامين التعليمية حسب الصفوف المخصصة لهم أو جميع المضامين المتاحة في الباقة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* اختيار المدرسة */}
          <div className="space-y-2">
            <Label className="text-base font-medium">اختر المدرسة</Label>
            <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر مدرسة لإدارة إعداداتها" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4" />
                      {school.name}
                      {school.active_package && (
                        <Badge variant="outline" className="text-xs">
                          {school.active_package.name}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSchool && (
            <>
              <Separator />
              
              {/* معلومات الباقة */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  معلومات الباقة النشطة
                </h4>
                {selectedSchool.active_package ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      اسم الباقة: <span className="font-medium">{selectedSchool.active_package.name}</span>
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-sm text-muted-foreground">الصفوف المتاحة:</span>
                      {selectedSchool.active_package.available_grade_contents.map((grade) => (
                        <Badge key={grade} variant="secondary" className="text-xs">
                          الصف {grade}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      لا توجد باقة نشطة لهذه المدرسة
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* إعدادات الوصول */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  إعدادات وصول المعلمين للمضامين
                </h4>

                {/* فلترة حسب الصفوف المخصصة */}
                <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base">عرض مضامين الصفوف المخصصة فقط</Label>
                    <p className="text-sm text-muted-foreground">
                      عند التفعيل، سيرى المعلم مضامين الصفوف المخصصة له فقط
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {settings.restrict_to_assigned_grades ? (
                      <EyeOff className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-green-500" />
                    )}
                    <Switch
                      checked={settings.restrict_to_assigned_grades}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, restrict_to_assigned_grades: checked }))
                      }
                    />
                  </div>
                </div>

                {/* السماح بالوصول المتقاطع */}
                <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base">السماح بالوصول لصفوف أخرى</Label>
                    <p className="text-sm text-muted-foreground">
                      السماح للمعلم برؤية مضامين صفوف أخرى غير المخصصة له
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_cross_grade_access}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, allow_cross_grade_access: checked }))
                    }
                    disabled={!settings.restrict_to_assigned_grades}
                  />
                </div>

                {/* عرض جميع مضامين الباقة */}
                <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base">عرض جميع مضامين الباقة</Label>
                    <p className="text-sm text-muted-foreground">
                      عرض جميع المضامين المتاحة في الباقة بغض النظر عن تخصيص الصفوف
                    </p>
                  </div>
                  <Switch
                    checked={settings.show_all_package_content}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ 
                        ...prev, 
                        show_all_package_content: checked,
                        // إذا تم تفعيل عرض جميع المضامين، تعطيل الفلترة
                        restrict_to_assigned_grades: checked ? false : prev.restrict_to_assigned_grades
                      }))
                    }
                  />
                </div>
              </div>

              {/* معاينة الإعدادات */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>معاينة الإعدادات:</strong>
                  <br />
                  {settings.show_all_package_content 
                    ? "المعلمون سيرون جميع مضامين الباقة النشطة"
                    : settings.restrict_to_assigned_grades
                      ? "المعلمون سيرون مضامين الصفوف المخصصة لهم فقط"
                      : "المعلمون سيرون جميع مضامين الباقة بغض النظر عن التخصيص"
                  }
                  {settings.allow_cross_grade_access && settings.restrict_to_assigned_grades && 
                    " + إمكانية الوصول لصفوف أخرى"
                  }
                </AlertDescription>
              </Alert>

              {/* أزرار الحفظ */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  onClick={saveSettings}
                  disabled={saving || loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};