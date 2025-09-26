import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UniversalAvatar } from './UniversalAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AvatarImage = Database['public']['Tables']['avatar_images']['Row'];
type AppRole = Database['public']['Enums']['app_role'];

interface AvatarSelectorProps {
  currentAvatarUrl?: string | null;
  userRole: AppRole;
  onAvatarChange: (avatarUrl: string) => Promise<void>;
  userName?: string;
  disabled?: boolean;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  currentAvatarUrl,
  userRole,
  onAvatarChange,
  userName,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [avatars, setAvatars] = useState<AvatarImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatarUrl);
  const { toast } = useToast();

  // Load available avatars
  useEffect(() => {
    const loadAvatars = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('avatar_images')
          .select('*')
          .eq('is_active', true)
          .or(`category.eq.${userRole},category.eq.universal`)
          .order('order_index');

        if (error) throw error;
        
        setAvatars(data || []);
      } catch (error) {
        console.error('Error loading avatars:', error);
        toast({
          title: 'خطأ',
          description: 'حدث خطأ في تحميل الأفاتار المتاحة',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadAvatars();
    }
  }, [isOpen, userRole, toast]);

  // Update selected avatar when current changes
  useEffect(() => {
    setSelectedAvatar(currentAvatarUrl);
  }, [currentAvatarUrl]);

  const handleSaveAvatar = async () => {
    if (!selectedAvatar || selectedAvatar === currentAvatarUrl) {
      setIsOpen(false);
      return;
    }

    try {
      setSaving(true);
      await onAvatarChange(selectedAvatar);
      setIsOpen(false);
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث صورة البروفايل بنجاح'
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحديث صورة البروفايل',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="relative h-auto p-2 hover:bg-muted/50"
          disabled={disabled}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <UniversalAvatar
                avatarUrl={currentAvatarUrl}
                userName={userName}
                size="lg"
              />
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <Camera className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <span className="text-sm font-medium">تغيير الصورة</span>
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>اختيار صورة البروفايل</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                {avatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar.file_path)}
                    className={`relative p-2 rounded-lg border-2 transition-all hover:bg-muted/50 ${
                      selectedAvatar === avatar.file_path
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <UniversalAvatar
                      avatarUrl={avatar.file_path}
                      userName={avatar.display_name}
                      size="lg"
                      className="mx-auto"
                    />
                    <div className="mt-2 text-xs text-center font-medium truncate">
                      {avatar.display_name}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={saving}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleSaveAvatar}
                  disabled={saving || selectedAvatar === currentAvatarUrl}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  حفظ التغييرات
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};