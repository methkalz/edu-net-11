import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Package, Crown, Building, Palette, Calendar, Infinity, Save, X, 
  CheckCircle, Circle, ArrowRight, ArrowDown, Sparkles, Gem, Shield, Star, Zap, 
  Globe, Rocket, Trophy, Diamond, Heart, Target, Award, Gift, Briefcase, 
  Settings, Users, School, BookOpen, GraduationCap, Layers, Box, Folder,
  Hexagon, Octagon, Square, Triangle, Pentagon, ChevronRight, ChevronLeft,
  Info, Palette as PaletteIcon, Puzzle, Eye, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { logger } from '@/lib/logger';

interface Package {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  currency: string;
  duration_days: number | null;
  icon: string;
  color: string;
  gradient: string;
  is_active: boolean;
  max_school_admins: number | null;
  max_students: number | null;
  max_teachers: number | null;
  features: any[];
  available_grade_contents?: string[];
  active_schools_count?: number;
  package_number?: number;
}

interface Plugin {
  id: string;
  name: string;
  name_ar: string;
  icon: string;
}

const iconOptions = [
  { value: 'Package', label: 'حزمة أساسية', icon: Package, category: 'basic' },
  { value: 'Crown', label: 'تاج ملكي', icon: Crown, category: 'premium' },
  { value: 'Building', label: 'مؤسسة', icon: Building, category: 'business' },
  { value: 'Gem', label: 'جوهرة', icon: Gem, category: 'premium' },
  { value: 'Shield', label: 'درع حماية', icon: Shield, category: 'security' },
  { value: 'Star', label: 'نجمة ذهبية', icon: Star, category: 'premium' },
  { value: 'Zap', label: 'صاعقة', icon: Zap, category: 'power' },
  { value: 'Globe', label: 'عالمي', icon: Globe, category: 'international' },
  { value: 'Rocket', label: 'صاروخ', icon: Rocket, category: 'advanced' },
  { value: 'Trophy', label: 'كأس', icon: Trophy, category: 'achievement' },
  { value: 'Diamond', label: 'ماسة', icon: Diamond, category: 'luxury' },
  { value: 'Heart', label: 'قلب', icon: Heart, category: 'care' },
  { value: 'Target', label: 'هدف', icon: Target, category: 'focused' },
  { value: 'Award', label: 'جائزة', icon: Award, category: 'recognition' },
  { value: 'Gift', label: 'هدية', icon: Gift, category: 'special' },
  { value: 'Briefcase', label: 'حقيبة عمل', icon: Briefcase, category: 'professional' },
  { value: 'Users', label: 'مجموعة', icon: Users, category: 'team' },
  { value: 'School', label: 'مدرسة', icon: School, category: 'education' },
  { value: 'BookOpen', label: 'كتاب مفتوح', icon: BookOpen, category: 'learning' },
  { value: 'GraduationCap', label: 'قبعة تخرج', icon: GraduationCap, category: 'academic' },
  { value: 'Layers', label: 'طبقات', icon: Layers, category: 'advanced' },
  { value: 'Box', label: 'صندوق', icon: Box, category: 'storage' },
  { value: 'Sparkles', label: 'بريق', icon: Sparkles, category: 'magic' },
  { value: 'Hexagon', label: 'سداسي', icon: Hexagon, category: 'geometric' },
  { value: 'Square', label: 'مربع', icon: Square, category: 'geometric' },
  { value: 'Triangle', label: 'مثلث', icon: Triangle, category: 'geometric' },
];

const colorOptions = [
  { value: '#10B981', label: 'أخضر زمردي', class: 'bg-emerald-500', gradient: 'from-emerald-400 to-emerald-600' },
  { value: '#8B5CF6', label: 'بنفسجي ملكي', class: 'bg-violet-500', gradient: 'from-violet-400 to-violet-600' },
  { value: '#F59E0B', label: 'ذهبي', class: 'bg-amber-500', gradient: 'from-amber-400 to-amber-600' },
  { value: '#3B82F6', label: 'أزرق سماوي', class: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600' },
  { value: '#EF4444', label: 'أحمر ناري', class: 'bg-red-500', gradient: 'from-red-400 to-red-600' },
  { value: '#6B7280', label: 'رمادي فضي', class: 'bg-gray-500', gradient: 'from-gray-400 to-gray-600' },
  { value: '#EC4899', label: 'وردي', class: 'bg-pink-500', gradient: 'from-pink-400 to-pink-600' },
  { value: '#14B8A6', label: 'تركواز', class: 'bg-teal-500', gradient: 'from-teal-400 to-teal-600' },
  { value: '#F97316', label: 'برتقالي محروق', class: 'bg-orange-500', gradient: 'from-orange-400 to-orange-600' },
  { value: '#8B5A3C', label: 'بني', class: 'bg-amber-800', gradient: 'from-amber-700 to-amber-900' },
  { value: '#1F2937', label: 'أسود فحمي', class: 'bg-gray-800', gradient: 'from-gray-700 to-gray-900' },
  { value: '#7C3AED', label: 'بنفسجي غامق', class: 'bg-purple-600', gradient: 'from-purple-500 to-purple-700' },
];

// دالة تنسيق الأرقام بإضافة الفواصل مع الاحتفاظ بالأرقام الإنجليزية
const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'غير محدود';
  return num.toLocaleString('en-US');
};

const PackageManagementPage = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [deletingPackage, setDeletingPackage] = useState<Package | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [packageData, setPackageData] = useState({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    price: 0,
    currency: 'ILS',
    duration_days: null as number | null,
    icon: 'Package',
    color: '#3B82F6',
    gradient: 'gradient-primary',
    is_active: true,
    max_school_admins: null as number | null,
    max_students: null as number | null,
    max_teachers: null as number | null,
    features: [] as string[],
    plugins: [] as string[],
    available_grade_contents: [] as string[]
  });

  const [isUnlimited, setIsUnlimited] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  // قائمة الميزات المقترحة
  const suggestedFeatures = [
    'دعم فني 24/7',
    'تخصيص كامل',
    'إدارة متقدمة للطلاب',
    'تقارير تفصيلية', 
    'إدارة الامتحانات',
    'نسخ احتياطية يومية',
    'أمان متقدم',
    'تكامل مع أنظمة خارجية',
    'إشعارات فورية',
    'تطبيق هاتف',
    'لوحة تحكم تفاعلية',
    'دعم متعدد اللغات',
    'تحليلات متقدمة',
    'إدارة المحتوى',
    'مراقبة الأداء',
    'عدد لامحدود من المستخدمين',
    'دروس تفاعلية',
    'مكتبة موارد تعليمية',
    'إدارة الحضور والغياب',
    'نظام المكافآت والشهادات'
  ];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (userProfile?.role !== 'superadmin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, userProfile, navigate]);

  const fetchData = async () => {
    try {
      logger.info('Starting package data fetch with schools validation');
      
      // جلب الباقات أولاً
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .order('created_at');

      if (packagesError) throw packagesError;

      // حساب عدد المدارس النشطة الصحيح لكل باقة
      const packagesWithCorrectCounts = [];
      
      for (let i = 0; i < (packagesData || []).length; i++) {
        const pkg = packagesData[i];
        logger.debug('Processing package', { packageName: pkg.name_ar, packageId: pkg.id });
        
        // جلب اشتراكات الباقة النشطة
        const { data: subs } = await supabase
          .from('school_packages')
          .select('school_id')
          .eq('package_id', pkg.id)
          .eq('status', 'active')
          .or('end_date.is.null,end_date.gt.now()');

        let actualCount = 0;
        
        if (subs && subs.length > 0) {
          logger.debug('Package subscription count', { 
            packageName: pkg.name_ar, 
            activeSubscriptions: subs.length 
          });
          
          // التحقق من المدارس الموجودة فعلياً في النظام (دون التحقق من is_active)
          const schoolIds: string[] = subs.map((s: any) => s.school_id);
          
          try {
            // البحث عن المدارس الموجودة فعلياً بشكل فردي لتجنب مشاكل TypeScript
            let validSchoolsCount = 0;
            
            // فحص كل مدرسة بشكل منفصل
            for (const schoolId of schoolIds) {
              const { data: school, error: schoolError } = await supabase
                .from('schools')
                .select('id')
                .eq('id', schoolId)
                .single();
                
              if (!schoolError && school) {
                validSchoolsCount++;
              }
            }
            
            actualCount = validSchoolsCount;
          } catch (error) {
            logger.error('Error in school validation query', error);
            actualCount = 0;
          }
        } else {
          logger.debug('Package has no active subscriptions', { packageName: pkg.name_ar });
        }

        packagesWithCorrectCounts.push({
          ...pkg,
          features: Array.isArray(pkg.features) ? pkg.features : 
                    typeof pkg.features === 'string' ? [pkg.features] : [],
          available_grade_contents: Array.isArray(pkg.available_grade_contents) ? pkg.available_grade_contents : [],
          active_schools_count: actualCount,
          package_number: i + 1,
          max_school_admins: pkg.max_schools || null
        });
      }

      const { data: pluginsData, error: pluginsError } = await supabase
        .from('plugins')
        .select('id, name, name_ar, icon')
        .order('name_ar');

      if (pluginsError) throw pluginsError;

      setPackages(packagesWithCorrectCounts);
      setPlugins(pluginsData || []);
      
      logger.info('Package data fetch completed successfully', { packagesCount: packagesWithCorrectCounts.length });
    } catch (error) {
      logger.error('Error fetching packages data', error as Error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في جلب البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPackageData({
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      price: 0,
      currency: 'ILS',
      duration_days: null,
      icon: 'Package',
      color: '#3B82F6',
      gradient: 'gradient-primary',
      is_active: true,
      max_school_admins: null,
      max_students: null,
      max_teachers: null,
      features: [],
      plugins: [],
      available_grade_contents: []
    });
    setIsUnlimited(false);
    setNewFeature('');
    setEditingPackage(null);
    setCurrentStep(1);
  };

  const openEditDialog = async (pkg: Package) => {
    setEditingPackage(pkg);
    
    const { data: packagePlugins } = await supabase
      .from('package_plugins')
      .select('plugin_id')
      .eq('package_id', pkg.id);

    setPackageData({
      name: pkg.name,
      name_ar: pkg.name_ar,
      description: pkg.description || '',
      description_ar: pkg.description_ar || '',
      price: pkg.price,
      currency: pkg.currency,
      duration_days: pkg.duration_days,
      icon: pkg.icon,
      color: pkg.color,
      gradient: pkg.gradient,
      is_active: pkg.is_active,
      max_school_admins: pkg.max_school_admins,
      max_students: pkg.max_students,
      max_teachers: pkg.max_teachers,
      features: pkg.features || [],
      plugins: packagePlugins?.map(pp => pp.plugin_id) || [],
      available_grade_contents: pkg.available_grade_contents || []
    });
    setIsUnlimited(pkg.duration_days === null);
    setCurrentStep(1);
    setIsDialogOpen(true);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return packageData.name_ar && packageData.name && packageData.price > 0;
      case 2:
        return true;
      case 3:
        return packageData.icon && packageData.color;
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const savePackage = async () => {
    try {
      setLoading(true);
      
      // إعداد بيانات الباقة الأساسية (بدون البلاجنز)
      const { plugins, max_school_admins, ...packageToSaveBase } = {
        ...packageData,
        duration_days: isUnlimited ? null : packageData.duration_days,
        created_by: user?.id
      };

      // تحويل max_school_admins إلى max_schools لقاعدة البيانات
      const packageToSave = {
        ...packageToSaveBase,
        max_schools: max_school_admins
      };

      let savedPackage;

      // الخطوة الأولى: حفظ/تحديث بيانات الباقة الأساسية
      if (editingPackage) {
        const { data, error } = await supabase
          .from('packages')
          .update(packageToSave)
          .eq('id', editingPackage.id)
          .select()
          .single();

        if (error) {
          logger.error('Error updating package', error);
          throw new Error('فشل في تحديث بيانات الباقة');
        }
        savedPackage = data;
      } else {
        const { data, error } = await supabase
          .from('packages')
          .insert(packageToSave)
          .select()
          .single();

        if (error) {
          logger.error('Error creating package', error);
          throw new Error('فشل في إنشاء الباقة');
        }
        savedPackage = data;
      }

      // الخطوة الثانية: إدارة البلاجنز المرتبطة بالباقة
      if (editingPackage) {
        // حذف البلاجنز القديمة أولاً
        const { error: deleteError } = await supabase
          .from('package_plugins')
          .delete()
          .eq('package_id', editingPackage.id);

        if (deleteError) {
          logger.error('Error deleting old package plugins', deleteError as Error);
          throw new Error('فشل في تحديث البلاجنز');
        }
      }

      // إضافة البلاجنز الجديدة
      if (packageData.plugins.length > 0) {
        const pluginInserts = packageData.plugins.map(pluginId => ({
          package_id: savedPackage.id,
          plugin_id: pluginId,
          is_included: true,
          settings: {}
        }));

        const { error: insertError } = await supabase
          .from('package_plugins')
          .insert(pluginInserts);

        if (insertError) {
          logger.error('Error inserting package plugins', insertError);
          throw new Error('فشل في ربط البلاجنز بالباقة');
        }
      }

      // إظهار رسالة النجاح
      toast({
        title: "تم الحفظ بنجاح",
        description: editingPackage 
          ? `تم تحديث الباقة "${savedPackage.name}" مع ${packageData.plugins.length} بلاجن`
          : `تم إنشاء الباقة "${savedPackage.name}" مع ${packageData.plugins.length} بلاجن`,
      });

      // إغلاق النموذج وإعادة تحميل البيانات
      setIsDialogOpen(false);
      resetForm();
      await fetchData();
      
    } catch (error) {
      logger.error('Error saving package', error as Error);
      toast({
        title: "خطأ في الحفظ",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع في حفظ الباقة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePackage = async (pkg: Package) => {
    try {
      setLoading(true);
      
      // التحقق من وجود مدارس نشطة تستخدم هذه الباقة
      const { count: activeSchoolsCount } = await supabase
        .from('school_packages')
        .select('*', { count: 'exact', head: true })
        .eq('package_id', pkg.id)
        .eq('status', 'active')
        .or('end_date.is.null,end_date.gt.now()');

      if (activeSchoolsCount && activeSchoolsCount > 0) {
        toast({
          title: "لا يمكن حذف الباقة",
          description: `هذه الباقة مرتبطة بـ ${activeSchoolsCount} مدرسة نشطة. يجب إلغاء اشتراك جميع المدارس أولاً قبل حذف الباقة.`,
          variant: "destructive",
        });
        return;
      }

      // أولاً: حذف البلاجنز المرتبطة بالباقة
      const { error: deletePluginsError } = await supabase
        .from('package_plugins')
        .delete()
        .eq('package_id', pkg.id);

        if (deletePluginsError) {
          logger.error('Error deleting package plugins', deletePluginsError);
          throw new Error('فشل في حذف البلاجنز المرتبطة بالباقة');
      }

      // ثانياً: حذف الباقة نفسها
      const { error: deletePackageError } = await supabase
        .from('packages')
        .delete()
        .eq('id', pkg.id);

        if (deletePackageError) {
          logger.error('Error deleting package', deletePackageError);
          throw new Error('فشل في حذف الباقة');
      }

      // إظهار رسالة النجاح
      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف الباقة "${pkg.name_ar}" نهائياً`,
      });

      // إعادة تحميل البيانات
      await fetchData();
      
    } catch (error) {
      logger.error('Error deleting package', error as Error);
      toast({
        title: "خطأ في الحذف",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع في حذف الباقة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeletingPackage(null);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setPackageData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setPackageData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addSuggestedFeature = (feature: string) => {
    if (!packageData.features.includes(feature)) {
      setPackageData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
    }
  };

  const togglePlugin = (pluginId: string) => {
    setPackageData(prev => ({
      ...prev,
      plugins: prev.plugins.includes(pluginId)
        ? prev.plugins.filter(id => id !== pluginId)
        : [...prev.plugins, pluginId]
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name_ar">اسم الباقة (عربي) *</Label>
                <Input
                  id="name_ar"
                  value={packageData.name_ar}
                  onChange={(e) => setPackageData(prev => ({ ...prev, name_ar: e.target.value }))}
                  placeholder="مثال: الباقة الذهبية"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">اسم الباقة (إنجليزي) *</Label>
                <Input
                  id="name"
                  value={packageData.name}
                  onChange={(e) => setPackageData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Example: Gold Package"
                  dir="ltr" className="ltr-content"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="description_ar">الوصف (عربي)</Label>
                <Textarea
                  id="description_ar"
                  value={packageData.description_ar}
                  onChange={(e) => setPackageData(prev => ({ ...prev, description_ar: e.target.value }))}
                  placeholder="وصف تفصيلي للباقة باللغة العربية"
                  className="text-right min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">الوصف (إنجليزي)</Label>
                <Textarea
                  id="description"
                  value={packageData.description}
                  onChange={(e) => setPackageData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description in English"
                  dir="ltr" 
                  className="min-h-[80px] ltr-content"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">السعر *</Label>
                <Input
                  id="price"
                  type="number"
                  value={packageData.price}
                  onChange={(e) => setPackageData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">العملة</Label>
                <div className="h-10 px-3 py-2 border border-input bg-muted rounded-md flex items-center text-sm">
                  شيكل (₪)
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="unlimited"
                checked={isUnlimited}
                onCheckedChange={setIsUnlimited}
              />
              <Label htmlFor="unlimited" className="text-lg font-medium">باقة غير محدودة المدة</Label>
            </div>

            {!isUnlimited && (
              <div className="space-y-2">
                <Label htmlFor="duration">مدة الاشتراك (بالأيام)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={packageData.duration_days || ''}
                  onChange={(e) => setPackageData(prev => ({ 
                    ...prev, 
                    duration_days: e.target.value ? Number(e.target.value) : null 
                  }))}
                  placeholder="30"
                  min="1"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="max_school_admins">الحد الأقصى لإداريين المدارس</Label>
                <Input
                  id="max_school_admins"
                  type="number"
                  value={packageData.max_school_admins || ''}
                  onChange={(e) => setPackageData(prev => ({ 
                    ...prev, 
                    max_school_admins: e.target.value ? Number(e.target.value) : null 
                  }))}
                  placeholder="غير محدود"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_students">الحد الأقصى للطلاب</Label>
                <Input
                  id="max_students"
                  type="number"
                  value={packageData.max_students || ''}
                  onChange={(e) => setPackageData(prev => ({ 
                    ...prev, 
                    max_students: e.target.value ? Number(e.target.value) : null 
                  }))}
                  placeholder="غير محدود"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_teachers">الحد الأقصى للمعلمين</Label>
                <Input
                  id="max_teachers"
                  type="number"
                  value={packageData.max_teachers || ''}
                  onChange={(e) => setPackageData(prev => ({ 
                    ...prev, 
                    max_teachers: e.target.value ? Number(e.target.value) : null 
                  }))}
                  placeholder="غير محدود"
                  min="1"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-medium mb-4 block">اختيار الأيقونة</Label>
              <div className="grid grid-cols-6 gap-4">
                {iconOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div
                      key={option.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                        packageData.icon === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setPackageData(prev => ({ ...prev, icon: option.value }))}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <IconComponent className="h-6 w-6" />
                        <span className="text-xs text-center">{option.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-lg font-medium mb-4 block">اختيار اللون</Label>
              <div className="grid grid-cols-6 gap-4">
                {colorOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`w-12 h-12 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 ${
                      packageData.color === option.value
                        ? 'ring-4 ring-primary ring-offset-2'
                        : ''
                    }`}
                    style={{ backgroundColor: option.value }}
                    onClick={() => setPackageData(prev => ({ ...prev, color: option.value }))}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            {packageData.icon && packageData.color && (
              <div className="p-6 border rounded-lg bg-gradient-to-r from-background to-muted">
                <Label className="text-lg font-medium mb-4 block">معاينة</Label>
                <div className="flex items-center gap-4">
                  <div 
                    className="p-4 rounded-xl shadow-lg"
                    style={{ backgroundColor: packageData.color }}
                  >
                    {React.createElement(
                      iconOptions.find(opt => opt.value === packageData.icon)?.icon || Package,
                      { className: "h-8 w-8 text-white" }
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{packageData.name_ar || 'اسم الباقة'}</h3>
                    <p className="text-muted-foreground">{packageData.description_ar || 'وصف الباقة'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-medium mb-4 block">إضافة ميزة جديدة</Label>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="أدخل ميزة جديدة..."
                  onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                />
                <Button onClick={addFeature} disabled={!newFeature.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-lg font-medium mb-4 block">الميزات المقترحة</Label>
              <div className="grid grid-cols-2 gap-2">
                {suggestedFeatures.map((feature, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => addSuggestedFeature(feature)}
                    disabled={packageData.features.includes(feature)}
                    className="justify-start text-right"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    {feature}
                  </Button>
                ))}
              </div>
            </div>

            {packageData.features.length > 0 && (
              <div>
                <Label className="text-lg font-medium mb-4 block">الميزات المضافة ({packageData.features.length})</Label>
                <div className="space-y-2">
                  {packageData.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span>{feature}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-medium mb-4 block">اختيار مضامين الصفوف المتاحة</Label>
              <p className="text-sm text-muted-foreground mb-6">
                اختر المضامين التعليمية التي ستكون متاحة للمدارس والمعلمين والطلاب في هذه الباقة
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    packageData.available_grade_contents.includes('grade10')
                      ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                      : 'border-border hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                  onClick={() => {
                    const newContents = packageData.available_grade_contents.includes('grade10')
                      ? packageData.available_grade_contents.filter(c => c !== 'grade10')
                      : [...packageData.available_grade_contents, 'grade10'];
                    setPackageData(prev => ({ ...prev, available_grade_contents: newContents }));
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Checkbox
                      checked={packageData.available_grade_contents.includes('grade10')}
                    />
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                      <h4 className="font-semibold text-lg">الصف العاشر</h4>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• مقاطع فيديو تعليمية</p>
                    <p>• ملفات وورد للعمل عليها</p>
                    <p>• معاينة المحتوى للطلاب</p>
                    <p>• إدارة شاملة للوسائط</p>
                  </div>
                </div>

                <div
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    packageData.available_grade_contents.includes('grade11')
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-border hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                  onClick={() => {
                    const newContents = packageData.available_grade_contents.includes('grade11')
                      ? packageData.available_grade_contents.filter(c => c !== 'grade11')
                      : [...packageData.available_grade_contents, 'grade11'];
                    setPackageData(prev => ({ ...prev, available_grade_contents: newContents }));
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Checkbox
                      checked={packageData.available_grade_contents.includes('grade11')}
                    />
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-lg">الصف الحادي عشر</h4>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• دروس نصية منظمة</p>
                    <p>• ألعاب تفاعلية ومسابقات</p>
                    <p>• اختبارات وامتحانات</p>
                    <p>• مكتبة ملفات ومقاطع فيديو</p>
                  </div>
                </div>

                <div
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    packageData.available_grade_contents.includes('grade12')
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-border hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                  onClick={() => {
                    const newContents = packageData.available_grade_contents.includes('grade12')
                      ? packageData.available_grade_contents.filter(c => c !== 'grade12')
                      : [...packageData.available_grade_contents, 'grade12'];
                    setPackageData(prev => ({ ...prev, available_grade_contents: newContents }));
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Checkbox
                      checked={packageData.available_grade_contents.includes('grade12')}
                    />
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-lg">الصف الثاني عشر</h4>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• مشاريع التخرج النهائية</p>
                    <p>• محرر المستندات المتقدم</p>
                    <p>• مكتبة الملفات المساعدة</p>
                    <p>• أدوات التخرج</p>
                  </div>
                </div>
              </div>

              {packageData.available_grade_contents.length > 0 && (
                <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <h5 className="font-medium text-primary mb-2">المضامين المختارة:</h5>
                  <div className="flex flex-wrap gap-2">
                    {packageData.available_grade_contents.map((grade) => (
                      <Badge key={grade} variant="secondary" className="bg-primary/20 text-primary">
                        {grade === 'grade10' && 'الصف العاشر'}
                        {grade === 'grade11' && 'الصف الحادي عشر'}
                        {grade === 'grade12' && 'الصف الثاني عشر'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-medium mb-4 block">اختيار البلاجنز</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plugins.map((plugin) => (
                  <div
                    key={plugin.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      packageData.plugins.includes(plugin.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => togglePlugin(plugin.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={packageData.plugins.includes(plugin.id)}
                      />
                      <div>
                        <h4 className="font-medium">{plugin.name_ar}</h4>
                        <p className="text-sm text-muted-foreground">{plugin.name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border rounded-lg bg-gradient-to-r from-background to-muted">
              <Label className="text-lg font-medium mb-4 block">مراجعة نهائية للباقة</Label>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">اسم الباقة:</span>
                  <span>{packageData.name_ar}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">السعر:</span>
                  <span>₪{formatNumber(packageData.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">المدة:</span>
                  <span>{isUnlimited ? 'غير محدود' : `${packageData.duration_days} يوم`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">الحد الأقصى لإداريين المدارس:</span>
                  <span>{formatNumber(packageData.max_school_admins)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">الحد الأقصى للطلاب:</span>
                  <span>{formatNumber(packageData.max_students)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">الحد الأقصى للمعلمين:</span>
                  <span>{formatNumber(packageData.max_teachers)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">مضامين الصفوف المتاحة:</span>
                  <span>{packageData.available_grade_contents.length} صف</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">عدد الميزات:</span>
                  <span>{packageData.features.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">عدد البلاجنز:</span>
                  <span>{packageData.plugins.length}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader 
        title="إدارة الباقات" 
        showBackButton={true} 
        showLogout={true} 
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">باقات الاشتراك</h2>
            <p className="text-muted-foreground">إنشاء وتحرير باقات الاشتراك</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                إضافة باقة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
              <div className="flex flex-col h-full min-h-0">
                <div className="flex-shrink-0 p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">
                      {editingPackage ? 'تحرير الباقة' : 'إضافة باقة جديدة'}
                    </DialogTitle>
                    <DialogDescription>
                      خطوة {currentStep} من {totalSteps}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="flex items-center mt-4 space-x-2 space-x-reverse">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-110 ${
                            step === currentStep
                              ? 'bg-primary text-primary-foreground shadow-lg'
                              : step < currentStep
                              ? 'bg-primary/20 text-primary hover:bg-primary/30'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                          onClick={() => setCurrentStep(step)}
                          title={`الانتقال إلى المرحلة ${step}`}
                        >
                          {step < currentStep ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            step
                          )}
                        </div>
                        {step < totalSteps && (
                          <div className={`w-8 h-px ${step < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {renderStepContent()}
                </div>

                <div className="flex-shrink-0 border-t p-6">
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                    >
                      <ChevronRight className="h-4 w-4 ml-1" />
                      السابق
                    </Button>
                    
                    <div className="flex gap-3">
                      {/* زر الحفظ متاح في كل مرحلة */}
                      <Button
                        onClick={savePackage}
                        disabled={loading}
                        variant="default"
                        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
                      >
                        <Save className="h-4 w-4 ml-2" />
                        حفظ
                      </Button>
                      
                      {/* زر التالي فقط إذا لم نكن في المرحلة الأخيرة */}
                      {currentStep < totalSteps && (
                        <Button
                          onClick={nextStep}
                          disabled={!canProceedToNextStep()}
                          variant="outline"
                        >
                          التالي
                          <ChevronLeft className="h-4 w-4 mr-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const IconComponent = iconOptions.find(opt => opt.value === pkg.icon)?.icon || Package;
            const colorOption = colorOptions.find(opt => opt.value === pkg.color);
            
            return (
              <Card key={pkg.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${colorOption?.gradient || 'from-primary to-primary'}`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: pkg.color }}
                      >
                        <IconComponent className="h-7 w-7 text-white" />
                      </div>
                       <div>
                         <CardTitle className="text-xl">{pkg.name_ar}</CardTitle>
                         <CardDescription className="text-sm">{pkg.description_ar}</CardDescription>
                          {pkg.active_schools_count !== undefined && (
                            <div className="flex items-center gap-1 mt-1">
                              <School className="h-3 w-3 text-blue-500" />
                              <span className="text-xs text-blue-600 font-medium">
                                {pkg.active_schools_count === 0 ? 'لا توجد مدارس نشطة' : `${pkg.active_schools_count} مدرسة نشطة`}
                              </span>
                            </div>
                          )}
                       </div>
                     </div>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => openEditDialog(pkg)}
                       >
                         <Edit className="h-4 w-4" />
                       </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={pkg.active_schools_count !== undefined && pkg.active_schools_count > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>تأكيد حذف الباقة</AlertDialogTitle>
                             <AlertDialogDescription>
                               هل أنت متأكد من حذف الباقة "{pkg.name_ar}"؟ 
                               <br />
                               <span className="font-medium text-destructive">
                                 هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البلاجنز المرتبطة بالباقة.
                               </span>
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>إلغاء</AlertDialogCancel>
                             <AlertDialogAction 
                               onClick={() => deletePackage(pkg)}
                               className="bg-destructive hover:bg-destructive/90"
                             >
                               حذف نهائياً
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                     </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-3xl font-bold"
                        style={{ color: pkg.color }}
                      >
                        ₪{formatNumber(pkg.price)}
                      </span>
                      <div className="flex items-center gap-2">
                        {pkg.duration_days ? (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {pkg.duration_days} يوم
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Infinity className="h-3 w-3" />
                            غير محدود
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center mx-auto items-center justify-center">
                       <div className="p-3 rounded-lg bg-muted/50 text-center">
                         <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                         <p className="text-sm font-medium text-center">{formatNumber(pkg.max_school_admins)}</p>
                         <p className="text-xs text-muted-foreground text-center">إداري مدرسة</p>
                       </div>
                       <div className="p-3 rounded-lg bg-muted/50 text-center">
                         <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                         <p className="text-sm font-medium text-center">{formatNumber(pkg.max_students)}</p>
                         <p className="text-xs text-muted-foreground text-center">طالب</p>
                       </div>
                       <div className="p-3 rounded-lg bg-muted/50 text-center">
                         <GraduationCap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                         <p className="text-sm font-medium text-center">{formatNumber(pkg.max_teachers)}</p>
                         <p className="text-xs text-muted-foreground text-center">معلم</p>
                       </div>
                    </div>

                     {pkg.available_grade_contents && pkg.available_grade_contents.length > 0 && (
                       <div className="space-y-2">
                         <p className="text-sm font-medium flex items-center gap-2">
                           <BookOpen className="h-4 w-4" />
                           مضامين الصفوف المتاحة
                         </p>
                         <div className="flex flex-wrap gap-1">
                           {pkg.available_grade_contents.map((grade) => (
                             <Badge 
                               key={grade} 
                               variant="secondary" 
                               className={`text-xs ${
                                 grade === 'grade10' ? 'bg-emerald-100 text-emerald-700' :
                                 grade === 'grade11' ? 'bg-blue-100 text-blue-700' :
                                 'bg-purple-100 text-purple-700'
                               }`}
                             >
                               {grade === 'grade10' && 'الصف العاشر'}
                               {grade === 'grade11' && 'الحادي عشر'}
                               {grade === 'grade12' && 'الثاني عشر'}
                             </Badge>
                           ))}
                         </div>
                       </div>
                     )}

                     {pkg.features && pkg.features.length > 0 && (
                       <div className="space-y-2">
                         <p className="text-sm font-medium flex items-center gap-2">
                           <Sparkles className="h-4 w-4" />
                           الميزات المتاحة ({pkg.features.length})
                         </p>
                         <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-hide">
                           {pkg.features.slice(0, 2).map((feature, index) => (
                             <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                               <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                               <span className="line-clamp-1">{feature}</span>
                             </div>
                           ))}
                           {pkg.features.length > 2 && (
                             <p className="text-xs text-muted-foreground">+{pkg.features.length - 2} ميزة أخرى</p>
                           )}
                         </div>
                       </div>
                     )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {packages.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Package className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">لا توجد باقات</h3>
            <p className="text-muted-foreground mb-6">ابدأ بإنشاء باقة جديدة لعرضها للمدارس</p>
            <Button 
              onClick={() => { resetForm(); setIsDialogOpen(true); }}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة باقة جديدة
            </Button>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
};

export default PackageManagementPage;
