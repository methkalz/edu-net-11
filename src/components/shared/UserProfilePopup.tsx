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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCreatedAt = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 bg-gradient-to-br from-background via-background to-muted/30 border-border/50 shadow-2xl" 
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
                  className="ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg text-foreground leading-tight">
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

            <Separator className="bg-border/50" />

            {/* User Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-muted/50 rounded-full">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-muted/50 rounded-full">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Last Login</p>
                  <p className="text-sm font-medium">
                    {lastLoginLoading ? 'Loading...' : formatDate(lastLogin)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-muted/50 rounded-full">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-sm font-medium">
                    {formatCreatedAt(userProfile.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Student Stats */}
            {userProfile.role === 'student' && (
              <>
                <Separator className="bg-border/50" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                      <Star className="h-4 w-4" />
                      <span className="text-xs font-medium">Points</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {userProfile.points || 0}
                    </p>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                      <Trophy className="h-4 w-4" />
                      <span className="text-xs font-medium">Level</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {userTitleData.level}
                    </p>
                  </div>
                </div>
              </>
            )}

            <Separator className="bg-border/50" />

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start gap-3 h-10 hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setOpen(false);
                  window.location.href = '/profile-settings';
                }}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start gap-3 h-10 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
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