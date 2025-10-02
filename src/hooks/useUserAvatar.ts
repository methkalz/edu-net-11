import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 500 * 1024; // 500 KB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

// دالة للتحقق من صحة الصورة
const validateImage = (file: File): Promise<{ valid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    // فحص نوع الملف
    if (!ALLOWED_TYPES.includes(file.type)) {
      resolve({ valid: false, error: 'يجب أن تكون الصورة من نوع JPEG أو PNG فقط' });
      return;
    }

    // فحص حجم الملف
    if (file.size > MAX_FILE_SIZE) {
      resolve({ valid: false, error: 'حجم الصورة يجب أن لا يتجاوز 500 كيلوبايت' });
      return;
    }

    // فحص سلامة الصورة بمحاولة تحميلها
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: false, error: 'الصورة تالفة أو غير صالحة' });
    };

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

      // حذف الصورة القديمة إذا وجدت
      const { data: existingFiles } = await supabase.storage
        .from('custom-avatars')
        .list(targetUserId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${targetUserId}/${f.name}`);
        await supabase.storage
          .from('custom-avatars')
          .remove(filesToDelete);
      }

      // رفع الصورة الجديدة
      const fileExt = file.name.split('.').pop();
      const fileName = `${targetUserId}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('custom-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // الحصول على URL العام للصورة
      const { data: { publicUrl } } = supabase.storage
        .from('custom-avatars')
        .getPublicUrl(fileName);

      // تحديث الملف الشخصي
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', targetUserId);

      if (updateError) throw updateError;

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