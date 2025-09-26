import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UniversalAvatar } from './UniversalAvatar';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
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
  const { updateAvatar, getAvatarsByRole, updating } = useUserAvatar();
  const { refreshProfile } = useAuth();
  const { toast } = useToast();

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

  const handleSave = async () => {
    if (!selectedAvatar) return;

    const result = await updateAvatar(selectedAvatar);
    
    if (result.success) {
      // Refresh profile to update the UI immediately
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
                    avatarUrl={selectedAvatar}
                    size="xl"
                    className="ring-4 ring-primary/20"
                  />
                  <p className="text-sm text-muted-foreground">الصورة المختارة</p>
                </div>
              </div>

              {/* Avatar Grid */}
              <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                {availableAvatars.map((avatar) => {
                  const avatarUrl = getAvatarUrl(avatar);
                  const isSelected = selectedAvatar === avatarUrl || selectedAvatar === avatar.file_path;
                  
                  return (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatarUrl)}
                      className={cn(
                        "p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105",
                        isSelected 
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
            onClick={() => onOpenChange(false)}
            disabled={updating}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedAvatar || selectedAvatar === currentAvatarUrl || updating}
          >
            {updating && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};