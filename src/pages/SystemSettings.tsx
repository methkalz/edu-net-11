import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Layout as HeaderIcon, 
  Globe, 
  Image as ImageIcon, 
  Type, 
  Palette, 
  Save,
  Upload,
  Eye,
  Monitor,
  Layout,
  Plus,
  Trash2,
  Droplets,
  Layers,
  GripVertical,
  RotateCcw,
  Play,
  Pause,
  RotateCw,
  FileText
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { useSharedLottieSettings } from '@/hooks/useSharedLottieSettings';
import { LottieLoader } from '@/components/ui/LottieLoader';
import { logger } from '@/lib/logger';
import { TeacherContentSettingsForm } from '@/components/admin/TeacherContentSettingsForm';

interface HeaderSettings {
  id?: string;
  logo_url: string;
  logo_size: 'small' | 'medium' | 'large';
  title_text: string;
  title_color: string;
  title_size: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  show_logo: boolean;
  show_title: boolean;
  background_color: string;
  text_color: string;
  background_opacity: number;
  blur_intensity: number;
  enable_glass_effect: boolean;
}

interface DashboardHeaderSettings {
  id?: string;
  logo_url: string;
  logo_size: 'small' | 'medium' | 'large';
  title_text: string;
  title_color: string;
  title_size: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  show_logo: boolean;
  show_title: boolean;
  background_color: string;
  text_color: string;
  background_opacity: number;
  blur_intensity: number;
  enable_glass_effect: boolean;
}

interface SiteSettings {
  id?: string;
  site_title: string;
  site_description: string;
  favicon_url: string;
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'auto';
}

interface FooterSettings {
  id?: string;
  show_footer: boolean;
  footer_text: string;
  footer_background_color: string;
  footer_text_color: string;
  show_copyright: boolean;
  copyright_text: string;
  show_links: boolean;
  links: Array<{
    title: string;
    url: string;
  }>;
  social_links: Array<{
    platform: string;
    url: string;
    icon: string;
  }>;
}

const SystemSettings = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { 
    lottieSettings, 
    saveLottieSettings, 
    isLoading: lottieLoading,
    isSaving: lottieSaving
  } = useSharedLottieSettings();
  const [lottieFile, setLottieFile] = useState<File | null>(null);
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>({
    logo_url: '/lovable-uploads/f942a38c-ddca-45fc-82fc-239e22268abe.png',
    logo_size: 'medium',
    title_text: 'نظام إدارة المدارس',
    title_color: '#2563eb',
    title_size: '2xl',
    show_logo: true,
    show_title: true,
    background_color: '#ffffff',
    text_color: '#1f2937',
    background_opacity: 0.95,
    blur_intensity: 10,
    enable_glass_effect: true
  });

  const [dashboardHeaderSettings, setDashboardHeaderSettings] = useState<DashboardHeaderSettings>({
    logo_url: '/lovable-uploads/f942a38c-ddca-45fc-82fc-239e22268abe.png',
    logo_size: 'medium',
    title_text: 'لوحة التحكم الرئيسية',
    title_color: '#2563eb',
    title_size: '2xl',
    show_logo: true,
    show_title: true,
    background_color: '#ffffff',
    text_color: '#1f2937',
    background_opacity: 0.95,
    blur_intensity: 10,
    enable_glass_effect: true
  });
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_title: 'منصة التعليم الذكية - Multi Learn Verse',
    site_description: 'منصة التعليم الذكية - نظام إدارة التعلم الشامل',
    favicon_url: '/lovable-uploads/f942a38c-ddca-45fc-82fc-239e22268abe.png',
    language: 'ar',
    theme: 'auto'
  });

  const [footerSettings, setFooterSettings] = useState<FooterSettings>({
    show_footer: true,
    footer_text: 'نظام إدارة المدارس الذكي',
    footer_background_color: '#1f2937',
    footer_text_color: '#ffffff',
    show_copyright: true,
    copyright_text: '© 2024 جميع الحقوق محفوظة',
    show_links: true,
    links: [
      { title: 'الصفحة الرئيسية', url: '/' },
      { title: 'من نحن', url: '/about' },
      { title: 'اتصل بنا', url: '/contact' }
    ],
    social_links: [
      { platform: 'Facebook', url: '#', icon: 'facebook' },
      { platform: 'Twitter', url: '#', icon: 'twitter' },
      { platform: 'Instagram', url: '#', icon: 'instagram' }
    ]
  });

  // إعدادات السحب والإفلات
  const [draggedLinkIndex, setDraggedLinkIndex] = useState<number | null>(null);
  const [draggedSocialIndex, setDraggedSocialIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // جلب إعدادات هيدر الصفحات الداخلية
        const headerData = localStorage.getItem('header_settings');
        if (headerData) {
          setHeaderSettings(JSON.parse(headerData));
        }

        // جلب إعدادات هيدر الصفحة الرئيسية
        const dashboardHeaderData = localStorage.getItem('dashboard_header_settings');
        if (dashboardHeaderData) {
          setDashboardHeaderSettings(JSON.parse(dashboardHeaderData));
        }

        // جلب إعدادات الموقع
        const siteData = localStorage.getItem('site_settings');
        if (siteData) {
          setSiteSettings(JSON.parse(siteData));
        }

        // جلب إعدادات الفوتر
        const footerData = localStorage.getItem('footer_settings');
        if (footerData) {
          setFooterSettings(JSON.parse(footerData));
        }
      } catch (error) {
        logger.error('Error fetching system settings', error as Error);
      }
    };

    fetchSettings();
  }, []);

  // التحقق من الصلاحيات
  if (userProfile?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">غير مصرح</CardTitle>
            <CardDescription className="text-center">
              ليس لديك صلاحية للوصول إلى إعدادات النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full"
            >
              العودة للوحة التحكم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const saveHeaderSettings = async () => {
    try {
      setLoading(true);
      localStorage.setItem('header_settings', JSON.stringify(headerSettings));
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات هيدر الصفحات الداخلية بنجاح",
      });
      
      // إعادة تحميل الصفحة لتطبيق التغييرات
      window.location.reload();
    } catch (error) {
      logger.error('Error saving header settings', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ إعدادات هيدر الصفحات الداخلية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDashboardHeaderSettings = async () => {
    try {
      setLoading(true);
      localStorage.setItem('dashboard_header_settings', JSON.stringify(dashboardHeaderSettings));
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات هيدر الصفحة الرئيسية بنجاح",
      });
      
      // إعادة تحميل الصفحة لتطبيق التغييرات
      window.location.reload();
    } catch (error) {
      logger.error('Error saving dashboard header settings', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ إعدادات هيدر الصفحة الرئيسية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveFooterSettings = async () => {
    try {
      setLoading(true);
      localStorage.setItem('footer_settings', JSON.stringify(footerSettings));
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات الفوتر بنجاح",
      });
      
      // إعادة تحميل الصفحة لتطبيق التغييرات
      window.location.reload();
    } catch (error) {
      logger.error('Error saving footer settings', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ إعدادات الفوتر",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSiteSettings = async () => {
    try {
      setLoading(true);
      localStorage.setItem('site_settings', JSON.stringify(siteSettings));
      
      // تحديث عنوان الصفحة
      document.title = siteSettings.site_title;
      
      // تحديث الوصف
      const descriptionMeta = document.querySelector('meta[name="description"]');
      if (descriptionMeta) {
        descriptionMeta.setAttribute('content', siteSettings.site_description);
      }
      
      // تحديث الفافيكون
      const faviconLink = document.querySelector('link[rel="icon"]') || document.createElement('link');
      faviconLink.setAttribute('rel', 'icon');
      faviconLink.setAttribute('href', siteSettings.favicon_url);
      faviconLink.setAttribute('type', 'image/png');
      if (!document.querySelector('link[rel="icon"]')) {
        document.head.appendChild(faviconLink);
      }
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات الموقع بنجاح",
      });
    } catch (error) {
      logger.error('Error saving site settings', error as Error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ إعدادات الموقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logoSizeOptions = [
    { value: 'small', label: 'صغير (32px)' },
    { value: 'medium', label: 'متوسط (48px)' },
    { value: 'large', label: 'كبير (64px)' }
  ];

  const titleSizeOptions = [
    { value: 'sm', label: 'صغير جداً' },
    { value: 'base', label: 'صغير' },
    { value: 'lg', label: 'متوسط' },
    { value: 'xl', label: 'كبير' },
    { value: '2xl', label: 'كبير جداً' },
    { value: '3xl', label: 'ضخم' }
  ];

  // دوال السحب والإفلات للروابط العادية
  const handleLinkDragStart = (e: React.DragEvent, index: number) => {
    setDraggedLinkIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLinkDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleLinkDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedLinkIndex === null || draggedLinkIndex === targetIndex) {
      setDraggedLinkIndex(null);
      return;
    }

    const newLinks = [...footerSettings.links];
    const draggedItem = newLinks[draggedLinkIndex];
    newLinks.splice(draggedLinkIndex, 1);
    newLinks.splice(targetIndex, 0, draggedItem);

    setFooterSettings(prev => ({ ...prev, links: newLinks }));
    setDraggedLinkIndex(null);
  };

  // دوال السحب والإفلات لروابط وسائل التواصل
  const handleSocialDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSocialIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSocialDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSocialDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSocialIndex === null || draggedSocialIndex === targetIndex) {
      setDraggedSocialIndex(null);
      return;
    }

    const newSocialLinks = [...footerSettings.social_links];
    const draggedItem = newSocialLinks[draggedSocialIndex];
    newSocialLinks.splice(draggedSocialIndex, 1);
    newSocialLinks.splice(targetIndex, 0, draggedItem);

    setFooterSettings(prev => ({ ...prev, social_links: newSocialLinks }));
    setDraggedSocialIndex(null);
  };

  // إعادة تعيين ترتيب الروابط
  const resetLinksOrder = () => {
    setFooterSettings(prev => ({
      ...prev,
      links: [
        { title: 'الصفحة الرئيسية', url: '/' },
        { title: 'من نحن', url: '/about' },
        { title: 'اتصل بنا', url: '/contact' }
      ]
    }));
  };

  const resetSocialLinksOrder = () => {
    setFooterSettings(prev => ({
      ...prev,
      social_links: [
        { platform: 'Facebook', url: '#', icon: 'facebook' },
        { platform: 'Twitter', url: '#', icon: 'twitter' },
        { platform: 'Instagram', url: '#', icon: 'instagram' }
      ]
    }));
  };

  // دوال إدارة ملفات Lottie
  const handleLottieFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast({
          title: "خطأ",
          description: "يجب أن يكون الملف من نوع JSON",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          const animationData = JSON.parse(result);
          
          saveLottieSettings({
            lottie_data: animationData,
            file_name: file.name,
            enabled: true,
            speed: lottieSettings.speed,
            loop: lottieSettings.loop
          });
          
          setLottieFile(file);
          
          toast({
            title: "تم الرفع والحفظ",
            description: `تم رفع وحفظ ملف ${file.name} بنجاح وسيظهر لجميع المستخدمين`,
          });
        } catch (error) {
          toast({
            title: "خطأ",
            description: "فشل في قراءة ملف Lottie",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRemoveLottieFile = () => {
    saveLottieSettings({
      lottie_data: null,
      file_name: undefined,
      enabled: false,
      speed: lottieSettings.speed,
      loop: lottieSettings.loop
    });
    setLottieFile(null);
    
    toast({
      title: "تم الحذف",
      description: "تم حذف ملف Lottie وسيختفي من جميع المستخدمين",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader 
        title="إعدادات النظام" 
        showBackButton={true} 
        showLogout={true} 
      />
      
      <div className="container mx-auto py-6" dir="rtl">
        <Tabs defaultValue="site" className="space-y-6 animate-fade-in">
          <TabsList className="grid w-full grid-cols-5 transition-all duration-300 hover:shadow-lg">
            <TabsTrigger value="site" className="gap-2 text-right" dir="rtl">
              <Globe className="h-4 w-4" />
              إعدادات الموقع
            </TabsTrigger>
            <TabsTrigger value="lottie" className="gap-2 text-right" dir="rtl">
              <Play className="h-4 w-4" />
              إعدادات Lottie
            </TabsTrigger>
            <TabsTrigger value="internal-header" className="gap-2 text-right" dir="rtl">
              <HeaderIcon className="h-4 w-4" />
              إعدادات هيدر الصفحات الداخلية
            </TabsTrigger>
            <TabsTrigger value="dashboard-header" className="gap-2 text-right" dir="rtl">
              <Monitor className="h-4 w-4" />
              إعدادات هيدر الصفحة الرئيسية
            </TabsTrigger>
            <TabsTrigger value="footer" className="gap-2 text-right" dir="rtl">
              <Layout className="h-4 w-4" />
              إعدادات الفوتر
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2 text-right" dir="rtl">
              <FileText className="h-4 w-4" />
              المضامين التعليمية
            </TabsTrigger>
          </TabsList>

          {/* تبويب إعدادات Lottie */}
          <TabsContent value="lottie" className="space-y-6 animate-fade-in" dir="rtl">
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2 justify-start text-right">
                  <Play className="h-5 w-5" />
                  إعدادات أنيميشن التحميل (Lottie)
                </CardTitle>
                <CardDescription className="text-right">
                  تحكم في أنيميشن التحميل المخصص باستخدام ملفات Lottie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6" dir="rtl">
                {/* معاينة الأنيميشن الحالي */}
                <div className="space-y-4">
                  <Label className="text-base font-medium text-right block">معاينة الأنيميشن الحالي</Label>
                  <Card className="p-6 bg-muted/50">
                    <div className="flex items-center justify-center min-h-[150px]">
                      <LottieLoader
                        animationData={lottieSettings.lottie_data}
                        text="Loading..."
                        size="lg"
                        speed={lottieSettings.speed}
                        loop={lottieSettings.loop}
                      />
                    </div>
                  </Card>
                </div>

                {/* رفع ملف Lottie */}
                <div className="space-y-4">
                  <Label className="text-base font-medium text-right block">رفع ملف Lottie جديد</Label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleLottieFileUpload}
                      className="hidden"
                      id="lottie-upload"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => document.getElementById('lottie-upload')?.click()}
                        variant="outline"
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        رفع ملف Lottie (.json)
                      </Button>
                      {lottieSettings.file_name && (
                        <Button
                          onClick={handleRemoveLottieFile}
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف الملف
                        </Button>
                      )}
                    </div>
                    {lottieSettings.file_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>الملف الحالي: {lottieSettings.file_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* إعدادات الأنيميشن */}
                <div className="space-y-4">
                  <Label className="text-base font-medium text-right block">إعدادات الأنيميشن</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-right block">تفعيل أنيميشن Lottie</Label>
                      <div className="flex items-center gap-2 justify-end">
                        <Switch
                          checked={lottieSettings.enabled}
                          onCheckedChange={(checked) => 
                            saveLottieSettings({ 
                              ...lottieSettings,
                              enabled: checked 
                            })
                          }
                        />
                        <Label className="text-right">
                          {lottieSettings.enabled ? 'مفعل' : 'معطل'}
                        </Label>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-right block">تكرار الأنيميشن</Label>
                      <div className="flex items-center gap-2 justify-end">
                        <Switch
                          checked={lottieSettings.loop}
                          onCheckedChange={(checked) => 
                            saveLottieSettings({ 
                              ...lottieSettings,
                              loop: checked 
                            })
                          }
                        />
                        <Label className="text-right">
                          {lottieSettings.loop ? 'متكرر' : 'مرة واحدة'}
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-right block">
                      سرعة الأنيميشن: {lottieSettings.speed}x
                    </Label>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={lottieSettings.speed}
                      onChange={(e) => 
                        saveLottieSettings({ 
                          ...lottieSettings,
                          speed: parseFloat(e.target.value) 
                        })
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>0.1x (بطيء جداً)</span>
                      <span>3x (سريع جداً)</span>
                    </div>
                  </div>
                </div>

                {/* إعادة تعيين الإعدادات */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => saveLottieSettings({
                      enabled: false,
                      lottie_data: null,
                      speed: 1,
                      loop: true,
                      file_name: undefined
                    })}
                    variant="outline"
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    إعادة تعيين الإعدادات
                  </Button>
                </div>

                {/* معلومات الحفظ التلقائي */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <div className="text-sm text-muted-foreground text-center">
                    {lottieSaving ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        جاري الحفظ...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-green-600">
                        <Save className="h-4 w-4" />
                        يتم الحفظ تلقائياً ويظهر لجميع المستخدمين
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="internal-header" className="space-y-6 animate-fade-in" dir="rtl">
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2 justify-start text-right">
                  <HeaderIcon className="h-5 w-5" />
                  إعدادات هيدر الصفحات الداخلية
                </CardTitle>
                <CardDescription className="text-right">
                  تحكم في مظهر الهيدر في صفحات إدارة النظام الداخلية (إدارة المدارس، المستخدمين، إلخ)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6" dir="rtl">
                {/* إعدادات الشعار */}
                <div className="space-y-4">
                  <Label className="text-base font-medium text-right block">إعدادات الشعار</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-right block">رابط الشعار</Label>
                      <Input
                        value={headerSettings.logo_url}
                        onChange={(e) => setHeaderSettings(prev => ({ ...prev, logo_url: e.target.value }))}
                        placeholder="رابط الشعار"
                        className="text-right"
                        dir="rtl"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-right block">حجم الشعار</Label>
                      <Select 
                        value={headerSettings.logo_size}
                        onValueChange={(value: 'small' | 'medium' | 'large') => 
                          setHeaderSettings(prev => ({ ...prev, logo_size: value }))
                        }
                      >
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          {logoSizeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value} className="text-right">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-end">
                    <Label className="text-right">إظهار الشعار</Label>
                    <Switch
                      checked={headerSettings.show_logo}
                      onCheckedChange={(checked) => 
                        setHeaderSettings(prev => ({ ...prev, show_logo: checked }))
                      }
                    />
                  </div>
                </div>

                {/* إعدادات النص */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">إعدادات النص</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نص العنوان</Label>
                      <Input
                        value={headerSettings.title_text}
                        onChange={(e) => setHeaderSettings(prev => ({ ...prev, title_text: e.target.value }))}
                        placeholder="نص العنوان"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>حجم النص</Label>
                      <Select 
                        value={headerSettings.title_size}
                        onValueChange={(value: any) => 
                          setHeaderSettings(prev => ({ ...prev, title_size: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {titleSizeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>لون النص</Label>
                      <Input
                        type="color"
                        value={headerSettings.title_color}
                        onChange={(e) => setHeaderSettings(prev => ({ ...prev, title_color: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>لون خلفية الهيدر</Label>
                      <Input
                        type="color"
                        value={headerSettings.background_color}
                        onChange={(e) => setHeaderSettings(prev => ({ ...prev, background_color: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      checked={headerSettings.show_title}
                      onCheckedChange={(checked) => 
                        setHeaderSettings(prev => ({ ...prev, show_title: checked }))
                      }
                    />
                    <Label>إظهار نص العنوان</Label>
                  </div>
                </div>

                {/* إعدادات التأثيرات البصرية */}
                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    التأثيرات البصرية والشفافية
                  </Label>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        checked={headerSettings.enable_glass_effect}
                        onCheckedChange={(checked) => 
                          setHeaderSettings(prev => ({ ...prev, enable_glass_effect: checked }))
                        }
                      />
                      <Label>تفعيل تأثير الزجاج (Glass Effect)</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>شفافية الخلفية: {Math.round(headerSettings.background_opacity * 100)}%</Label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={headerSettings.background_opacity}
                        onChange={(e) => setHeaderSettings(prev => ({ ...prev, background_opacity: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>قوة الـ Blur: {headerSettings.blur_intensity}px</Label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={headerSettings.blur_intensity}
                        onChange={(e) => setHeaderSettings(prev => ({ ...prev, blur_intensity: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* معاينة الهيدر مع التأثيرات */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">معاينة الهيدر مع التأثيرات</Label>
                  <div className="relative">
                    {/* خلفية مُلونة لإظهار تأثير الشفافية */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-lg"></div>
                    <div 
                      className={`relative border rounded-lg p-4 flex items-center gap-3 ${
                        headerSettings.enable_glass_effect ? 'backdrop-blur-sm border-white/20' : ''
                      }`}
                      style={{ 
                        backgroundColor: `${headerSettings.background_color}${Math.round(headerSettings.background_opacity * 255).toString(16).padStart(2, '0')}`,
                        backdropFilter: headerSettings.enable_glass_effect ? `blur(${headerSettings.blur_intensity}px)` : 'none'
                      }}
                    >
                      {headerSettings.show_logo && (
                        <img 
                          src={headerSettings.logo_url} 
                          alt="شعار النظام" 
                          className={`w-auto ${
                            headerSettings.logo_size === 'small' ? 'h-8' :
                            headerSettings.logo_size === 'medium' ? 'h-12' : 'h-16'
                          }`}
                        />
                      )}
                      {headerSettings.show_title && (
                        <h1 
                          className={`font-bold font-cairo text-${headerSettings.title_size}`}
                          style={{ color: headerSettings.title_color }}
                        >
                          {headerSettings.title_text}
                        </h1>
                      )}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={saveHeaderSettings} 
                  disabled={loading}
                  className="w-full text-right"
                  dir="rtl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  حفظ إعدادات هيدر الصفحات الداخلية
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard-header" className="space-y-6 animate-fade-in" dir="rtl">
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2 justify-start text-right">
                  <Monitor className="h-5 w-5" />
                  إعدادات هيدر الصفحة الرئيسية
                </CardTitle>
                <CardDescription className="text-right">
                  تحكم في مظهر الهيدر في لوحة التحكم الرئيسية للنظام
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6" dir="rtl">
                {/* إعدادات الشعار */}
                <div className="space-y-4">
                  <Label className="text-base font-medium text-right block">إعدادات الشعار</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رابط الشعار</Label>
                      <Input
                        value={dashboardHeaderSettings.logo_url}
                        onChange={(e) => setDashboardHeaderSettings(prev => ({ ...prev, logo_url: e.target.value }))}
                        placeholder="رابط الشعار"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>حجم الشعار</Label>
                      <Select 
                        value={dashboardHeaderSettings.logo_size}
                        onValueChange={(value: 'small' | 'medium' | 'large') => 
                          setDashboardHeaderSettings(prev => ({ ...prev, logo_size: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {logoSizeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      checked={dashboardHeaderSettings.show_logo}
                      onCheckedChange={(checked) => 
                        setDashboardHeaderSettings(prev => ({ ...prev, show_logo: checked }))
                      }
                    />
                    <Label>إظهار الشعار</Label>
                  </div>
                </div>

                {/* إعدادات النص */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">إعدادات النص</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نص العنوان</Label>
                      <Input
                        value={dashboardHeaderSettings.title_text}
                        onChange={(e) => setDashboardHeaderSettings(prev => ({ ...prev, title_text: e.target.value }))}
                        placeholder="نص العنوان"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>حجم النص</Label>
                      <Select 
                        value={dashboardHeaderSettings.title_size}
                        onValueChange={(value: any) => 
                          setDashboardHeaderSettings(prev => ({ ...prev, title_size: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {titleSizeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>لون النص</Label>
                      <Input
                        type="color"
                        value={dashboardHeaderSettings.title_color}
                        onChange={(e) => setDashboardHeaderSettings(prev => ({ ...prev, title_color: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>لون خلفية الهيدر</Label>
                      <Input
                        type="color"
                        value={dashboardHeaderSettings.background_color}
                        onChange={(e) => setDashboardHeaderSettings(prev => ({ ...prev, background_color: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      checked={dashboardHeaderSettings.show_title}
                      onCheckedChange={(checked) => 
                        setDashboardHeaderSettings(prev => ({ ...prev, show_title: checked }))
                      }
                    />
                    <Label>إظهار نص العنوان</Label>
                  </div>
                </div>

                {/* إعدادات التأثيرات البصرية */}
                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    التأثيرات البصرية والشفافية
                  </Label>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        checked={dashboardHeaderSettings.enable_glass_effect}
                        onCheckedChange={(checked) => 
                          setDashboardHeaderSettings(prev => ({ ...prev, enable_glass_effect: checked }))
                        }
                      />
                      <Label>تفعيل تأثير الزجاج (Glass Effect)</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>شفافية الخلفية: {Math.round(dashboardHeaderSettings.background_opacity * 100)}%</Label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={dashboardHeaderSettings.background_opacity}
                        onChange={(e) => setDashboardHeaderSettings(prev => ({ ...prev, background_opacity: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>قوة الـ Blur: {dashboardHeaderSettings.blur_intensity}px</Label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={dashboardHeaderSettings.blur_intensity}
                        onChange={(e) => setDashboardHeaderSettings(prev => ({ ...prev, blur_intensity: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* معاينة الهيدر مع التأثيرات */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">معاينة هيدر الصفحة الرئيسية مع التأثيرات</Label>
                  <div className="relative">
                    {/* خلفية مُلونة لإظهار تأثير الشفافية */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-lg"></div>
                    <div 
                      className={`relative border rounded-lg p-4 flex items-center gap-3 ${
                        dashboardHeaderSettings.enable_glass_effect ? 'backdrop-blur-sm border-white/20' : ''
                      }`}
                      style={{ 
                        backgroundColor: `${dashboardHeaderSettings.background_color}${Math.round(dashboardHeaderSettings.background_opacity * 255).toString(16).padStart(2, '0')}`,
                        backdropFilter: dashboardHeaderSettings.enable_glass_effect ? `blur(${dashboardHeaderSettings.blur_intensity}px)` : 'none'
                      }}
                    >
                      {dashboardHeaderSettings.show_logo && (
                        <img 
                          src={dashboardHeaderSettings.logo_url} 
                          alt="شعار النظام" 
                          className={`w-auto ${
                            dashboardHeaderSettings.logo_size === 'small' ? 'h-8' :
                            dashboardHeaderSettings.logo_size === 'medium' ? 'h-12' : 'h-16'
                          }`}
                        />
                      )}
                      {dashboardHeaderSettings.show_title && (
                        <h1 
                          className={`font-bold font-cairo text-${dashboardHeaderSettings.title_size}`}
                          style={{ color: dashboardHeaderSettings.title_color }}
                        >
                          {dashboardHeaderSettings.title_text}
                        </h1>
                      )}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={saveDashboardHeaderSettings} 
                  disabled={loading}
                  className="w-full"
                >
                  <Save className="h-4 w-4 ml-2" />
                  حفظ إعدادات هيدر الصفحة الرئيسية
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer" className="space-y-6 animate-fade-in" dir="rtl">
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2 justify-start text-right">
                  <Layout className="h-5 w-5" />
                  إعدادات الفوتر
                </CardTitle>
                <CardDescription className="text-right">
                  تحكم في مظهر ومحتوى الفوتر في جميع صفحات النظام
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6" dir="rtl">
                {/* إعدادات عامة للفوتر */}
                <div className="space-y-4">
                  <Label className="text-base font-medium text-right block">الإعدادات العامة</Label>
                  
                  <div className="flex items-center gap-2 justify-end">
                    <Label className="text-right">إظهار الفوتر</Label>
                    <Switch
                      checked={footerSettings.show_footer}
                      onCheckedChange={(checked) => 
                        setFooterSettings(prev => ({ ...prev, show_footer: checked }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-right block">نص الفوتر الرئيسي</Label>
                      <Input
                        value={footerSettings.footer_text}
                        onChange={(e) => setFooterSettings(prev => ({ ...prev, footer_text: e.target.value }))}
                        placeholder="نص الفوتر الرئيسي"
                        className="text-right"
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-right block">نص حقوق الطبع</Label>
                      <Input
                        value={footerSettings.copyright_text}
                        onChange={(e) => setFooterSettings(prev => ({ ...prev, copyright_text: e.target.value }))}
                        placeholder="نص حقوق الطبع"
                        className="text-right"
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-right block">لون خلفية الفوتر</Label>
                      <Input
                        type="color"
                        value={footerSettings.footer_background_color}
                        onChange={(e) => setFooterSettings(prev => ({ ...prev, footer_background_color: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-right block">لون النص</Label>
                      <Input
                        type="color"
                        value={footerSettings.footer_text_color}
                        onChange={(e) => setFooterSettings(prev => ({ ...prev, footer_text_color: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <Label className="text-right">إظهار حقوق الطبع والنشر</Label>
                    <Switch
                      checked={footerSettings.show_copyright}
                      onCheckedChange={(checked) => 
                        setFooterSettings(prev => ({ ...prev, show_copyright: checked }))
                      }
                    />
                  </div>
                </div>

                {/* إعدادات الروابط */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium text-right block">روابط الفوتر</Label>
                    {footerSettings.links.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetLinksOrder}
                        className="text-sm"
                      >
                        <RotateCcw className="h-3 w-3 ml-1" />
                        إعادة تعيين الترتيب
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 justify-end">
                    <Label className="text-right">إظهار روابط الفوتر</Label>
                    <Switch
                      checked={footerSettings.show_links}
                      onCheckedChange={(checked) => 
                        setFooterSettings(prev => ({ ...prev, show_links: checked }))
                      }
                    />
                  </div>

                  {footerSettings.show_links && (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground text-right mb-2">
                        💡 يمكنك سحب الروابط لإعادة ترتيبها
                      </div>
                      {footerSettings.links.map((link, index) => (
                        <div 
                          key={index} 
                          className={`flex gap-3 items-end transition-all duration-200 ${
                            draggedLinkIndex === index ? 'opacity-50 scale-95' : ''
                          } hover:bg-muted/30 p-3 rounded-lg border-2 border-dashed border-transparent hover:border-muted`}
                          draggable
                          onDragStart={(e) => handleLinkDragStart(e, index)}
                          onDragOver={handleLinkDragOver}
                          onDrop={(e) => handleLinkDrop(e, index)}
                        >
                          <div className="flex items-center justify-center" title="اسحب لإعادة الترتيب">
                            <GripVertical 
                              className="h-5 w-5 text-muted-foreground cursor-move hover:text-foreground transition-colors" 
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label>عنوان الرابط</Label>
                            <Input
                              value={link.title}
                              onChange={(e) => {
                                const newLinks = [...footerSettings.links];
                                newLinks[index].title = e.target.value;
                                setFooterSettings(prev => ({ ...prev, links: newLinks }));
                              }}
                              placeholder="عنوان الرابط"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label>URL الرابط</Label>
                            <Input
                              value={link.url}
                              onChange={(e) => {
                                const newLinks = [...footerSettings.links];
                                newLinks[index].url = e.target.value;
                                setFooterSettings(prev => ({ ...prev, links: newLinks }));
                              }}
                              placeholder="URL الرابط"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              const newLinks = footerSettings.links.filter((_, i) => i !== index);
                              setFooterSettings(prev => ({ ...prev, links: newLinks }));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newLinks = [...footerSettings.links, { title: '', url: '' }];
                          setFooterSettings(prev => ({ ...prev, links: newLinks }));
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة رابط جديد
                      </Button>
                    </div>
                  )}
                </div>

                {/* إعدادات وسائل التواصل الاجتماعي */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">روابط وسائل التواصل الاجتماعي</Label>
                    {footerSettings.social_links.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetSocialLinksOrder}
                        className="text-sm"
                      >
                        <RotateCcw className="h-3 w-3 ml-1" />
                        إعادة تعيين الترتيب
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground text-right mb-2">
                      💡 يمكنك سحب روابط وسائل التواصل لإعادة ترتيبها
                    </div>
                    {footerSettings.social_links.map((social, index) => (
                      <div 
                        key={index} 
                        className={`flex gap-3 items-end transition-all duration-200 ${
                          draggedSocialIndex === index ? 'opacity-50 scale-95' : ''
                        } hover:bg-muted/30 p-3 rounded-lg border-2 border-dashed border-transparent hover:border-muted`}
                        draggable
                        onDragStart={(e) => handleSocialDragStart(e, index)}
                        onDragOver={handleSocialDragOver}
                        onDrop={(e) => handleSocialDrop(e, index)}
                      >
                        <div className="flex items-center justify-center" title="اسحب لإعادة الترتيب">
                          <GripVertical 
                            className="h-5 w-5 text-muted-foreground cursor-move hover:text-foreground transition-colors" 
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>المنصة</Label>
                          <Select
                            value={social.platform}
                            onValueChange={(value) => {
                              const newSocials = [...footerSettings.social_links];
                              newSocials[index].platform = value;
                              setFooterSettings(prev => ({ ...prev, social_links: newSocials }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Facebook">Facebook</SelectItem>
                              <SelectItem value="Twitter">Twitter</SelectItem>
                              <SelectItem value="Instagram">Instagram</SelectItem>
                              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                              <SelectItem value="YouTube">YouTube</SelectItem>
                              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>رابط المنصة</Label>
                          <Input
                            value={social.url}
                            onChange={(e) => {
                              const newSocials = [...footerSettings.social_links];
                              newSocials[index].url = e.target.value;
                              setFooterSettings(prev => ({ ...prev, social_links: newSocials }));
                            }}
                            placeholder="رابط المنصة"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            const newSocials = footerSettings.social_links.filter((_, i) => i !== index);
                            setFooterSettings(prev => ({ ...prev, social_links: newSocials }));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newSocials = [...footerSettings.social_links, { platform: 'Facebook', url: '', icon: 'facebook' }];
                        setFooterSettings(prev => ({ ...prev, social_links: newSocials }));
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة رابط وسائل التواصل
                    </Button>
                  </div>
                </div>

                {/* معاينة الفوتر */}
                {footerSettings.show_footer && (
                  <div className="space-y-4">
                    <Label className="text-base font-medium">معاينة الفوتر</Label>
                    <div 
                      className="border rounded-lg p-6"
                      style={{ 
                        backgroundColor: footerSettings.footer_background_color,
                        color: footerSettings.footer_text_color 
                      }}
                    >
                      <div className="text-center space-y-4">
                        <h3 className="text-lg font-bold">{footerSettings.footer_text}</h3>
                        
                        {footerSettings.show_links && footerSettings.links.length > 0 && (
                          <div className="flex justify-center gap-4 flex-wrap">
                            {footerSettings.links.map((link, index) => (
                              <span key={index} className="text-sm underline cursor-pointer hover:opacity-80">
                                {link.title || 'رابط'}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {footerSettings.social_links.length > 0 && (
                          <div className="flex justify-center gap-3">
                            {footerSettings.social_links.map((social, index) => (
                              <span key={index} className="text-sm bg-white/20 px-3 py-1 rounded">
                                {social.platform}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {footerSettings.show_copyright && (
                          <p className="text-sm opacity-80">{footerSettings.copyright_text}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={saveFooterSettings} 
                  disabled={loading}
                  className="w-full text-right"
                  dir="rtl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  حفظ إعدادات الفوتر
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="site" className="space-y-6 animate-fade-in" dir="rtl">
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2 justify-start text-right">
                  <Globe className="h-5 w-5" />
                  إعدادات الموقع
                </CardTitle>
                <CardDescription className="text-right">
                  تحكم في إعدادات الموقع العامة والفافيكون
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6" dir="rtl">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-right block">عنوان الموقع (يظهر في التاب)</Label>
                    <Input
                      value={siteSettings.site_title}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, site_title: e.target.value }))}
                      placeholder="عنوان الموقع"
                      className="text-right"
                      dir="rtl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>وصف الموقع</Label>
                    <Textarea
                      value={siteSettings.site_description}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, site_description: e.target.value }))}
                      placeholder="وصف الموقع"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>رابط الفافيكون (الشعار المصغر)</Label>
                    <Input
                      value={siteSettings.favicon_url}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, favicon_url: e.target.value }))}
                      placeholder="رابط الفافيكون"
                    />
                    <p className="text-sm text-muted-foreground">
                      الفافيكون هو الشعار الصغير الذي يظهر في تاب المتصفح
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>لغة الموقع</Label>
                    <Select 
                      value={siteSettings.language}
                      onValueChange={(value: 'ar' | 'en') => 
                        setSiteSettings(prev => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-48">
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">الإنجليزية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* معاينة الفافيكون */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">معاينة الفافيكون</Label>
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <img 
                      src={siteSettings.favicon_url} 
                      alt="فافيكون" 
                      className="w-8 h-8"
                    />
                    <div>
                      <p className="font-medium">{siteSettings.site_title}</p>
                      <p className="text-sm text-muted-foreground">معاينة كيف سيظهر في التاب</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={saveSiteSettings} 
                  disabled={loading}
                  className="w-full text-right"
                  dir="rtl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  حفظ إعدادات الموقع
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب إعدادات المضامين التعليمية */}
          <TabsContent value="content" className="space-y-6 animate-fade-in" dir="rtl">
            <TeacherContentSettingsForm />
          </TabsContent>
        </Tabs>
      </div>
      
      <AppFooter />
    </div>
  );
};

export default SystemSettings;