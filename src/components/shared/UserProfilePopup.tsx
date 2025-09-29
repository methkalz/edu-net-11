import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UniversalAvatar } from './UniversalAvatar';
import { UserTitleBadge } from './UserTitleBadge';
import { ProfilePictureModal } from './ProfilePictureModal';
import { useAuth } from '@/hooks/useAuth';
import { useLastLogin } from '@/hooks/useLastLogin';
import { useUserTitle } from '@/hooks/useUserTitle';
import { Settings, LogOut, Camera, Calendar, Mail, User, Star, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfilePopupProps {
  children: React.ReactNode;
}

export const UserProfilePopup: React.FC<UserProfilePopupProps> = ({ children }) => {
  const { user, userProfile, signOut } = useAuth();
  const { lastLogin, loading: lastLoginLoading } = useLastLogin();
  const [open, setOpen] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const userTitleData = useUserTitle({
    role: userProfile?.role || 'student',
    displayTitle: userProfile?.display_title,
    points: userProfile?.points,
    level: userProfile?.level
  });

  if (!user || !userProfile) return <>{children}</>;

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير متاح';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  };

  const formatCreatedAt = (dateString: string | null) => {
    if (!dateString) return 'غير متاح';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 bg-gradient-to-br from-background via-background to-muted/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 border-border/50 dark:border-slate-700/50 shadow-2xl dark:shadow-slate-950/50 transition-colors duration-300" 
          align="end"
          sideOffset={8}
        >
          <div className="p-6 space-y-4">
            {/* Header with Avatar */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group">
                <UniversalAvatar
                  avatarUrl={userProfile.avatar_url}
                  userName={userProfile.full_name}
                  size="xl"
                  className="ring-4 ring-primary/20 dark:ring-primary/30 group-hover:ring-primary/40 dark:group-hover:ring-primary/50 transition-all duration-300"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 shadow-lg hover:shadow-xl dark:shadow-slate-950/50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all duration-300"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <Camera className="h-4 w-4 text-foreground dark:text-foreground transition-colors duration-300" />
                </Button>
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg text-foreground dark:text-foreground leading-tight transition-colors duration-300">
                  {userProfile.full_name || 'User'}
                </h3>
                <UserTitleBadge
                  role={userProfile.role}
                  displayTitle={userProfile.display_title}
                  points={userProfile.points}
                  level={userProfile.level}
                  size="sm"
                  variant="secondary"
                />
              </div>
            </div>

            <Separator className="bg-border/50 dark:bg-slate-700/50 transition-colors duration-300" />

            {/* User Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-muted/50 dark:bg-slate-800/60 rounded-full transition-colors duration-300">
                  <Mail className="h-4 w-4 text-muted-foreground dark:text-slate-400 transition-colors duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground dark:text-slate-400 transition-colors duration-300">البريد الإلكتروني</p>
                  <p className="text-sm font-medium truncate text-foreground dark:text-foreground transition-colors duration-300">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-muted/50 dark:bg-slate-800/60 rounded-full transition-colors duration-300">
                  <Calendar className="h-4 w-4 text-muted-foreground dark:text-slate-400 transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground dark:text-slate-400 transition-colors duration-300">زيارتك الأخيرة</p>
                  <p className="text-sm font-medium text-foreground dark:text-foreground transition-colors duration-300">
                    {lastLoginLoading ? 'جارٍ التحميل...' : formatDate(lastLogin)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-muted/50 dark:bg-slate-800/60 rounded-full transition-colors duration-300">
                  <User className="h-4 w-4 text-muted-foreground dark:text-slate-400 transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground dark:text-slate-400 transition-colors duration-300">مستخدم للنظام منذ</p>
                  <p className="text-sm font-medium text-foreground dark:text-foreground transition-colors duration-300">
                    {formatCreatedAt(userProfile.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Student Stats */}
            {userProfile.role === 'student' && (
              <>
                <Separator className="bg-border/50 dark:bg-slate-700/50 transition-colors duration-300" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-muted/30 dark:bg-slate-800/40 rounded-lg transition-colors duration-300">
                    <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-500 mb-1 transition-colors duration-300">
                      <Star className="h-4 w-4" />
                      <span className="text-xs font-medium">نقاط</span>
                    </div>
                    <p className="text-lg font-bold text-foreground dark:text-foreground transition-colors duration-300">
                      {userProfile.points || 0}
                    </p>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/30 dark:bg-slate-800/40 rounded-lg transition-colors duration-300">
                    <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-500 mb-1 transition-colors duration-300">
                      <Trophy className="h-4 w-4" />
                      <span className="text-xs font-medium">المرحلة</span>
                    </div>
                    <p className="text-lg font-bold text-foreground dark:text-foreground transition-colors duration-300">
                      {userTitleData.level}
                    </p>
                  </div>
                </div>
              </>
            )}

            <Separator className="bg-border/50 dark:bg-slate-700/50 transition-colors duration-300" />

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start gap-3 h-10 text-destructive dark:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-500/10 hover:text-destructive dark:hover:text-red-300 border-destructive/20 dark:border-red-500/20 transition-all duration-300"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <ProfilePictureModal
        open={showAvatarModal}
        onOpenChange={setShowAvatarModal}
        currentAvatarUrl={userProfile.avatar_url}
        userRole={userProfile.role}
      />
    </>
  );
};