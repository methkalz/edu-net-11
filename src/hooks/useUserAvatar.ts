import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 500 * 1024; // 500 KB
const MIN_FILE_SIZE = 100; // 100 bytes (prevent empty files)
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const MIN_DIMENSION = 50; // Minimum width/height
const MAX_DIMENSION = 2000; // Maximum width/height

// تطهير اسم الملف لمنع هجمات path traversal
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .replace(/^\./, '_')
    .substring(0, 100);
};

// إنشاء اسم ملف آمن وفريد
const generateSecureFilename = (originalFile: File): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalFile.name.split('.').pop()?.toLowerCase() || 'jpg';
  
  const allowedExtensions = ['jpg', 'jpeg', 'png'];
  const safeExtension = allowedExtensions.includes(extension) ? extension : 'jpg';
  
  return `avatar_${timestamp}_${randomString}.${safeExtension}`;
};

// دالة شاملة للتحقق من صحة الصورة مع إجراءات أمنية متقدمة
const validateImage = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  // 1. فحص حجم الملف (الحد الأقصى)
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'حجم الملف يجب أن يكون أقل من 500 كيلوبايت' };
  }

  // 2. فحص حجم الملف (الحد الأدنى لمنع الملفات الفارغة)
  if (file.size < MIN_FILE_SIZE) {
    return { valid: false, error: 'حجم الملف صغير جداً' };
  }

  // 3. فحص نوع MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'نوع الملف غير مدعوم. الأنواع المدعومة: JPG, PNG' };
  }

  // 4. فحص امتداد الملف
  const filename = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => filename.endsWith(ext));
  if (!hasValidExtension) {
    return { valid: false, error: 'امتداد الملف غير صالح' };
  }

  // 5. فحص Magic Numbers (file signature) للتأكد من أنها صورة حقيقية
  try {
    const arrayBuffer = await file.slice(0, 8).arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // فحص توقيع PNG: 89 50 4E 47
    const isPNG = uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && 
                  uint8Array[2] === 0x4E && uint8Array[3] === 0x47;
    
    // فحص توقيع JPEG: FF D8 FF
    const isJPEG = uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && 
                   uint8Array[2] === 0xFF;
    
    if (!isPNG && !isJPEG) {
      return { valid: false, error: 'محتوى الملف لا يطابق نوع الصورة المتوقع' };
    }
  } catch (error) {
    return { valid: false, error: 'فشل التحقق من محتوى الملف' };
  }

  // 6. فحص سلامة الصورة وأبعادها
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      // فحص الأبعاد (الحد الأدنى)
      if (img.width < MIN_DIMENSION || img.height < MIN_DIMENSION) {
        resolve({ 
          valid: false, 
          error: `أبعاد الصورة صغيرة جداً (الحد الأدنى ${MIN_DIMENSION}x${MIN_DIMENSION})`
        });
        return;
      }
      
      // فحص الأبعاد (الحد الأقصى)
      if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
        resolve({ 
          valid: false, 
          error: `أبعاد الصورة كبيرة جداً (الحد الأقصى ${MAX_DIMENSION}x${MAX_DIMENSION})`
        });
        return;
      }
      
      resolve({ valid: true });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: false, error: 'الصورة تالفة أو غير صالحة' });
    };
    
    // تعيين مهلة زمنية لمنع التعليق
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: false, error: 'انتهت مهلة تحميل الصورة' });
    }, 5000);
    
    img.src = objectUrl;
  });
};

export const useUserAvatar = () => {
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const updateAvatar = useCallback(async (avatarUrl: string, userId?: string) => {
    try {
      setUpdating(true);
      
      // Get current user ID if not provided
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id;
      }

      if (!targetUserId) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', targetUserId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحديث صورة البروفايل',
        variant: 'destructive'
      });
      return { success: false, error };
    } finally {
      setUpdating(false);
    }
  }, [toast]);

  const getAvatarsByRole = useCallback(async (role: string) => {
    try {
      const { data, error } = await supabase
        .from('avatar_images')
        .select('*')
        .eq('is_active', true)
        .or(`category.eq.${role},category.eq.universal`)
        .order('order_index');

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching avatars:', error);
      return [];
    }
  }, []);

  const uploadCustomAvatar = useCallback(async (file: File, userId?: string) => {
    try {
      setUploading(true);

      // Get current user
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id;
      }

      if (!targetUserId) {
        throw new Error('User not authenticated');
      }

      // التحقق من أن المستخدم معلم
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', targetUserId)
        .single();

      if (!profile || profile.role !== 'teacher') {
        toast({
          title: 'غير مصرح',
          description: 'رفع الصور المخصصة متاح للمعلمين فقط',
          variant: 'destructive'
        });
        return { success: false, error: 'Unauthorized' };
      }

      // فحص الصورة
      const validation = await validateImage(file);
      if (!validation.valid) {
        toast({
          title: 'خطأ في الصورة',
          description: validation.error,
          variant: 'destructive'
        });
        return { success: false, error: validation.error };
      }

      // التحقق من وجود وإعداد bucket التخزين
      const { data: buckets } = await supabase.storage.listBuckets();
      const customAvatarsBucket = buckets?.find(b => b.id === 'custom-avatars');
      
      if (!customAvatarsBucket) {
        throw new Error('Storage bucket not configured properly');
      }

      // حذف الصورة القديمة إذا وجدت (لمنع تراكم الملفات)
      const { data: existingFiles } = await supabase.storage
        .from('custom-avatars')
        .list(targetUserId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${targetUserId}/${f.name}`);
        await supabase.storage
          .from('custom-avatars')
          .remove(filesToDelete);
      }

      // إنشاء اسم ملف آمن وفريد
      const secureFilename = generateSecureFilename(file);
      const fileName = `${targetUserId}/${secureFilename}`;

      // رفع الصورة مع خيارات أمنية
      const { error: uploadError, data } = await supabase.storage
        .from('custom-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type // تحديد نوع المحتوى صراحة
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // الحصول على URL العام للصورة
      const { data: { publicUrl } } = supabase.storage
        .from('custom-avatars')
        .getPublicUrl(fileName);

      // تحديث الملف الشخصي
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', targetUserId);

      if (updateError) {
        // في حالة فشل التحديث، حذف الصورة المرفوعة
        await supabase.storage
          .from('custom-avatars')
          .remove([fileName]);
        throw updateError;
      }

      toast({
        title: 'تم الرفع',
        description: 'تم رفع صورة البروفايل بنجاح'
      });

      return { success: true, avatarUrl: publicUrl };
    } catch (error) {
      console.error('Error uploading custom avatar:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في رفع الصورة',
        variant: 'destructive'
      });
      return { success: false, error };
    } finally {
      setUploading(false);
    }
  }, [toast]);

  return {
    updateAvatar,
    getAvatarsByRole,
    uploadCustomAvatar,
    updating,
    uploading
  };
};