import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Video, X, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGrade10Content } from '@/hooks/useGrade10Content';
import { logger } from '@/lib/logger';

interface Grade10VideoFormProps {
  onSave: (videoData: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

const Grade10VideoForm: React.FC<Grade10VideoFormProps> = ({
  onSave,
  onCancel,
  initialData
}) => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    video_url: initialData?.video_url || '',
    thumbnail_url: initialData?.thumbnail_url || '',
    duration: initialData?.duration || '',
    source_type: initialData?.source_type || 'youtube',
    category: initialData?.category || 'general',
    is_visible: initialData?.is_visible ?? true,
    allowed_roles: initialData?.allowed_roles || ['all'],
    order_index: initialData?.order_index || 0,
    ...initialData
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.video_url.trim()) return;

    setLoading(true);
    try {
      await onSave({
        ...formData,
        owner_user_id: userProfile?.user_id,
        school_id: userProfile?.school_id,
        grade_level: '10',
        is_active: true,
        published_at: new Date().toISOString()
      });
      onCancel();
    } catch (error) {
      logger.error('Error saving video', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const sourceTypeOptions = [
    { value: 'youtube', label: 'YouTube' },
    { value: 'vimeo', label: 'Vimeo' },
    { value: 'google_drive', label: 'Google Drive' },
    { value: 'direct', label: 'رابط مباشر' },
    { value: 'upload', label: 'رفع ملف' }
  ];

  const categoryOptions = [
    { value: 'general', label: 'عام' },
    { value: 'programming', label: 'البرمجة' },
    { value: 'networks', label: 'الشبكات' },
    { value: 'databases', label: 'قواعد البيانات' },
    { value: 'web_development', label: 'تطوير المواقع' },
    { value: 'mobile_apps', label: 'تطبيقات الجوال' },
    { value: 'theory', label: 'المفاهيم النظرية' }
  ];

  const roleOptions = [
    { value: 'all', label: 'جميع المستخدمين' },
    { value: 'student', label: 'الطلاب' },
    { value: 'teacher', label: 'المعلمين' },
    { value: 'school_admin', label: 'إدارة المدرسة' }
  ];

  const handleRoleChange = (role: string, checked: boolean) => {
    if (role === 'all') {
      setFormData(prev => ({
        ...prev,
        allowed_roles: checked ? ['all'] : []
      }));
    } else {
      setFormData(prev => {
        const newRoles = checked
          ? [...prev.allowed_roles.filter(r => r !== 'all'), role]
          : prev.allowed_roles.filter(r => r !== role);
        return { ...prev, allowed_roles: newRoles };
      });
    }
  };

  const convertGoogleDriveUrl = (url: string) => {
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
  };

  const convertYouTubeUrl = (url: string) => {
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0] || '';
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const handleUrlChange = (url: string) => {
    let processedUrl = url;
    
    if (formData.source_type === 'youtube' && (url.includes('youtube.com') || url.includes('youtu.be'))) {
      processedUrl = convertYouTubeUrl(url);
    } else if (formData.source_type === 'google_drive' && url.includes('drive.google.com')) {
      processedUrl = convertGoogleDriveUrl(url);
    }
    
    setFormData(prev => ({ ...prev, video_url: processedUrl }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // هنا يمكن إضافة منطق رفع الملف إلى التخزين
      const tempUrl = URL.createObjectURL(file);
      setFormData(prev => ({ 
        ...prev, 
        video_url: tempUrl,
        source_type: 'upload'
      }));
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          {initialData ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* المعلومات الأساسية */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>
              
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الفيديو *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="أدخل عنوان الفيديو"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="أدخل وصف الفيديو"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">الفئة التعليمية</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_index">ترتيب العرض</Label>
                <Input
                  id="order_index"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* مصدر الفيديو */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">مصدر الفيديو</h3>
              
              <div className="space-y-2">
                <Label htmlFor="source_type">نوع المصدر</Label>
                <Select
                  value={formData.source_type}
                  onValueChange={(value) => setFormData({ ...formData, source_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المصدر" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.source_type === 'upload' ? (
                <div className="space-y-2">
                  <Label htmlFor="video_file">رفع ملف الفيديو</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <Label htmlFor="video_file" className="cursor-pointer">
                      <span className="text-primary hover:underline">اختر ملف فيديو</span>
                      <span className="text-muted-foreground"> أو اسحبه هنا</span>
                    </Label>
                    <Input
                      id="video_file"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      الحد الأقصى: 100MB | الأنواع المدعومة: MP4, AVI, MOV
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="video_url">رابط الفيديو *</Label>
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder={
                      formData.source_type === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
                      formData.source_type === 'google_drive' ? 'https://drive.google.com/file/d/...' :
                      'أدخل رابط الفيديو'
                    }
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="thumbnail_url">رابط الصورة المصغرة</Label>
                <Input
                  id="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="أدخل رابط الصورة المصغرة"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">مدة الفيديو</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="مثال: 15:30"
                />
              </div>
            </div>
          </div>

          {/* إعدادات الرؤية والأذونات */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">إعدادات العرض والأذونات</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_visible"
                checked={formData.is_visible}
                onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked as boolean })}
              />
              <Label htmlFor="is_visible">مرئي للمستخدمين</Label>
            </div>

            <div className="space-y-3">
              <Label>المستخدمون المسموح لهم بالعرض:</Label>
              <div className="grid grid-cols-2 gap-3">
                {roleOptions.map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.value}`}
                      checked={formData.allowed_roles.includes(role.value)}
                      onCheckedChange={(checked) => handleRoleChange(role.value, checked as boolean)}
                    />
                    <Label htmlFor={`role-${role.value}`}>{role.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* معاينة الفيديو */}
          {formData.video_url && formData.source_type !== 'upload' && (
            <div className="space-y-2">
              <Label>معاينة الفيديو</Label>
              <div className="w-full max-w-md mx-auto">
                {formData.source_type === 'youtube' ? (
                  <iframe
                    src={formData.video_url}
                    className="w-full h-48 rounded border"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : formData.source_type === 'google_drive' ? (
                  <iframe
                    src={formData.video_url}
                    className="w-full h-48 rounded border"
                    allow="autoplay"
                  />
                ) : (
                  <video
                    src={formData.video_url}
                    controls
                    className="w-full h-48 rounded border"
                  />
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || !formData.title.trim() || !formData.video_url.trim()}>
              {loading ? 'جاري الحفظ...' : (initialData ? 'تحديث' : 'حفظ')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Grade10VideoForm;