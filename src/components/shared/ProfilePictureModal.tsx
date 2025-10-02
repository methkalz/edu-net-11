import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UniversalAvatar } from './UniversalAvatar';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfilePictureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string | null;
  userRole?: string;
}

export const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({
  open,
  onOpenChange,
  currentAvatarUrl,
  userRole = 'student'
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [availableAvatars, setAvailableAvatars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateAvatar, getAvatarsByRole, uploadCustomAvatar, updating, uploading } = useUserAvatar();
  const { refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const isTeacher = userRole === 'teacher';

  useEffect(() => {
    const fetchAvatars = async () => {
      if (open) {
        setLoading(true);
        const avatars = await getAvatarsByRole(userRole);
        setAvailableAvatars(avatars);
        setLoading(false);
      }
    };

    fetchAvatars();
  }, [open, userRole, getAvatarsByRole]);

  useEffect(() => {
    if (currentAvatarUrl) {
      setSelectedAvatar(currentAvatarUrl);
    }
  }, [currentAvatarUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({
        title: 'نوع ملف غير مدعوم',
        description: 'يجب أن تكون الصورة من نوع JPEG أو PNG',
        variant: 'destructive'
      });
      return;
    }

    // التحقق من حجم الملف
    if (file.size > 500 * 1024) {
      toast({
        title: 'حجم الملف كبير',
        description: 'حجم الصورة يجب أن لا يتجاوز 500 كيلوبايت',
        variant: 'destructive'
      });
      return;
    }

    setCustomFile(file);
    
    // إنشاء معاينة للصورة
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomPreview(reader.result as string);
      setSelectedAvatar(null); // إلغاء اختيار الأفاتارات المحددة مسبقاً
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // إذا كان هناك ملف مخصص، رفعه
    if (customFile && isTeacher) {
      const result = await uploadCustomAvatar(customFile);
      
      if (result.success) {
        await refreshProfile();
        toast({
          title: 'تم التحديث',
          description: 'تم رفع صورة البروفايل بنجاح',
        });
        onOpenChange(false);
        setCustomFile(null);
        setCustomPreview(null);
      }
      return;
    }

    // وإلا تحديث الأفاتار المختار
    if (!selectedAvatar) return;

    const result = await updateAvatar(selectedAvatar);
    
    if (result.success) {
      await refreshProfile();
      
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث صورة البروفايل بنجاح',
      });
      onOpenChange(false);
    }
  };

  const getAvatarUrl = (avatar: any) => {
    if (avatar.file_path.startsWith('/') || avatar.file_path.startsWith('http')) {
      return avatar.file_path;
    }
    return `/avatars/${avatar.file_path}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">اختر صورة البروفايل</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Current Selection Preview */}
              <div className="flex justify-center mb-6">
                <div className="text-center space-y-2">
                  <UniversalAvatar
                    avatarUrl={customPreview || selectedAvatar}
                    size="xl"
                    className="ring-4 ring-primary/20"
                  />
                  <p className="text-sm text-muted-foreground">
                    {customPreview ? 'الصورة المرفوعة' : 'الصورة المختارة'}
                  </p>
                </div>
              </div>

              {/* Custom Upload for Teachers */}
              {isTeacher && (
                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="ml-2 h-4 w-4" />
                    رفع صورة مخصصة (JPEG/PNG - حتى 500 KB)
                  </Button>
                  {customPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-muted-foreground"
                      onClick={() => {
                        setCustomFile(null);
                        setCustomPreview(null);
                      }}
                    >
                      إلغاء الصورة المرفوعة
                    </Button>
                  )}
                </div>
              )}

              {/* Avatar Grid */}
              <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                {availableAvatars.map((avatar) => {
                  const avatarUrl = getAvatarUrl(avatar);
                  const isSelected = selectedAvatar === avatarUrl || selectedAvatar === avatar.file_path;
                  
                  return (
                    <button
                      key={avatar.id}
                      onClick={() => {
                        setSelectedAvatar(avatarUrl);
                        setCustomFile(null);
                        setCustomPreview(null);
                      }}
                      className={cn(
                        "p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105",
                        isSelected && !customPreview
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <UniversalAvatar
                        avatarUrl={avatarUrl}
                        size="md"
                        className="w-full h-full"
                      />
                    </button>
                  );
                })}
              </div>

              {availableAvatars.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد صور متاحة لهذا الدور
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setCustomFile(null);
              setCustomPreview(null);
            }}
            disabled={updating || uploading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={(!selectedAvatar && !customFile) || (selectedAvatar === currentAvatarUrl && !customFile) || updating || uploading}
          >
            {(updating || uploading) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};