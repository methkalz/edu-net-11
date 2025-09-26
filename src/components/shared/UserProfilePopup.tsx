import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Calendar, 
  Clock, 
  Star, 
  Trophy, 
  BookOpen, 
  Activity,
  Settings,
  LogOut,
  Edit3,
  Shield,
  Users,
  GraduationCap
} from 'lucide-react';
import { UniversalAvatar } from './UniversalAvatar';
import { AvatarSelector } from './AvatarSelector';
import { useAuth } from '@/hooks/useAuth';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { useLastLogin } from '@/hooks/useLastLogin';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UserProfilePopupProps {
  children: React.ReactNode;
  profile?: any;
  stats?: {
    totalPoints?: number;
    level?: number;
    completedActivities?: number;
    currentStreak?: number;
    joinDate?: string;
    lastLogin?: string;
  };
}

export const UserProfilePopup: React.FC<UserProfilePopupProps> = ({ 
  children, 
  profile,
  stats = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const { user, signOut } = useAuth();
  const { updateAvatar } = useUserAvatar();
  const { lastLogin } = useLastLogin(profile?.user_id || user?.id);
  const { toast } = useToast();

  // استخدام البيانات من props أو من useAuth
  const currentProfile = profile || user;
  
  const handleAvatarChange = async (newAvatarUrl: string) => {
    const result = await updateAvatar(newAvatarUrl);
    if (result.success) {
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث صورة البروفايل بنجاح',
      });
      setShowAvatarSelector(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    toast({
      title: 'تم تسجيل الخروج',
      description: 'شكراً لاستخدامك المنصة',
    });
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'غير محدد';
    try {
      return formatDistanceToNow(new Date(lastLogin), { 
        addSuffix: true, 
        locale: ar 
      });
    } catch {
      return 'غير محدد';
    }
  };

  const getRoleDisplayName = (role?: string) => {
    const roleMap: Record<string, { name: string; icon: React.ComponentType<any>; color: string }> = {
      'student': { name: 'طالب', icon: GraduationCap, color: 'text-blue-600' },
      'teacher': { name: 'معلم', icon: BookOpen, color: 'text-green-600' },
      'school_admin': { name: 'مدير مدرسة', icon: Shield, color: 'text-purple-600' },
      'superadmin': { name: 'مدير النظام', icon: Settings, color: 'text-red-600' },
      'parent': { name: 'ولي أمر', icon: Users, color: 'text-orange-600' }
    };
    return roleMap[role || ''] || { name: 'مستخدم', icon: User, color: 'text-gray-600' };
  };

  const getQuickStats = () => {
    const quickStats = [];
    
    if (stats.totalPoints) {
      quickStats.push({
        icon: Star,
        label: 'النقاط',
        value: stats.totalPoints.toLocaleString(),
        color: 'text-yellow-600'
      });
    }
    
    if (stats.level) {
      quickStats.push({
        icon: Trophy,
        label: 'المستوى',
        value: stats.level,
        color: 'text-blue-600'
      });
    }
    
    if (stats.completedActivities) {
      quickStats.push({
        icon: BookOpen,
        label: 'الأنشطة المكتملة',
        value: stats.completedActivities,
        color: 'text-green-600'
      });
    }
    
    if (stats.currentStreak) {
      quickStats.push({
        icon: Activity,
        label: 'الإنجاز المتواصل',
        value: `${stats.currentStreak} أيام`,
        color: 'text-orange-600'
      });
    }
    
    return quickStats;
  };

  if (showAvatarSelector) {
    return (
      <Dialog open={showAvatarSelector} onOpenChange={setShowAvatarSelector}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>اختيار صورة البروفايل</DialogTitle>
          </DialogHeader>
          <AvatarSelector
            currentAvatarUrl={currentProfile?.avatar_url}
            userRole={currentProfile?.role}
            onAvatarChange={handleAvatarChange}
            userName={currentProfile?.full_name}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer hover:opacity-80 transition-opacity">
          {children}
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center pb-4">
          <div className="flex flex-col items-center space-y-4">
            {/* صورة البروفايل */}
            <div className="relative">
              <UniversalAvatar
                avatarUrl={currentProfile?.avatar_url}
                userName={currentProfile?.full_name}
                size="xl"
                className="ring-4 ring-primary/20"
              />
              <Button
                variant="outline"
                size="sm" 
                className="absolute -bottom-1 -right-1 rounded-full h-8 w-8 p-0"
                onClick={() => setShowAvatarSelector(true)}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>
            
            {/* اسم المستخدم والدور */}
            <div className="text-center">
              <DialogTitle className="text-xl font-bold">
                {currentProfile?.full_name || 'مستخدم'}
              </DialogTitle>
              <div className="flex items-center justify-center gap-1 mt-1">
                {(() => {
                  const roleInfo = getRoleDisplayName(currentProfile?.role);
                  const RoleIcon = roleInfo.icon;
                  return (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <RoleIcon className={`h-3 w-3 ${roleInfo.color}`} />
                      {roleInfo.name}
                    </Badge>
                  );
                })()}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* المعلومات الأساسية */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">البريد الإلكتروني:</span>
              <span className="font-medium">{currentProfile?.email}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">تاريخ الانضمام:</span>
              <span className="font-medium">
                {stats.joinDate ? new Date(stats.joinDate).toLocaleDateString('ar-SA') : 'غير محدد'}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">آخر تسجيل دخول:</span>
              <span className="font-medium">{formatLastLogin(lastLogin || stats.lastLogin)}</span>
            </div>
          </div>

          {/* الإحصائيات السريعة */}
          {getQuickStats().length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">الإحصائيات</h3>
                <div className="grid grid-cols-2 gap-3">
                  {getQuickStats().map((stat, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                        <p className="font-semibold text-sm">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* أزرار الإجراءات */}
          <Separator />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                // يمكن إضافة صفحة إعدادات لاحقاً
                toast({
                  title: 'قريباً',
                  description: 'ستتوفر صفحة الإعدادات قريباً',
                });
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              الإعدادات
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              خروج
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};