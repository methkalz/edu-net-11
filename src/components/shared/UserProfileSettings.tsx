import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { UniversalAvatar } from './UniversalAvatar';
import { ProfilePictureModal } from './ProfilePictureModal';
import { UserTitleBadge } from './UserTitleBadge';
import { useAuth } from '@/hooks/useAuth';
import { useUserTitle } from '@/hooks/useUserTitle';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Camera } from 'lucide-react';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';

export const UserProfileSettings: React.FC = () => {
  const { userProfile, user } = useAuth();
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  if (!userProfile || !user) {
    return null;
  }

  const { 
    title, 
    level, 
    badgeInfo, 
    nextLevelPoints, 
    progressToNextLevel, 
    isStudent 
  } = useUserTitle({
    role: userProfile.role,
    displayTitle: userProfile.display_title,
    points: userProfile.points,
    level: userProfile.level
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            البروفايل الشخصي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Selection */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <UniversalAvatar
                avatarUrl={userProfile.avatar_url}
                userName={userProfile.full_name}
                size="xl"
                className="ring-4 ring-primary/20"
              />
              <Button
                size="sm"
                variant="secondary"
                className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 shadow-lg"
                onClick={() => setShowAvatarModal(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">{userProfile.full_name}</h2>
              <p className="text-muted-foreground">{userProfile.email}</p>
            </div>
          </div>

          <Separator />

          {/* User Title and Role */}
          <div className="flex justify-center">
            <UserTitleBadge
              role={userProfile.role}
              displayTitle={userProfile.display_title}
              points={userProfile.points}
              level={userProfile.level}
              size="lg"
            />
          </div>

          {/* Student Progress Section */}
          {isStudent && userProfile.points !== null && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  التقدم والمستوى
                </h3>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">
                      {userProfile.points}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      النقاط الكلية
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-yellow-600">
                      {level}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      المستوى
                    </div>
                  </div>
                </div>

                {badgeInfo.hasBadge && (
                  <div className="flex flex-col items-center gap-2 pt-2">
                    <div className="text-sm text-muted-foreground">الوسام</div>
                    <BadgeDisplay badge={badgeInfo.badge} size="lg" showName={true} />
                  </div>
                )}

                {nextLevelPoints && progressToNextLevel !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        المستوى التالي
                      </span>
                      <span>
                        {nextLevelPoints - userProfile.points} نقطة متبقية
                      </span>
                    </div>
                    <Progress value={progressToNextLevel} className="h-2" />
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات إضافية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              الدور في النظام
            </label>
            <p className="mt-1 font-medium">
              {userProfile.role === 'teacher' && 'معلم'}
              {userProfile.role === 'school_admin' && 'مدير مدرسة'}
              {userProfile.role === 'superadmin' && 'مدير النظام'}
              {userProfile.role === 'student' && 'طالب'}
              {userProfile.role === 'parent' && 'ولي أمر'}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              تاريخ التسجيل
            </label>
            <p className="mt-1 font-medium">
              {new Date(userProfile.created_at).toLocaleDateString('ar-SA')}
            </p>
          </div>
        </CardContent>
      </Card>

      <ProfilePictureModal
        open={showAvatarModal}
        onOpenChange={setShowAvatarModal}
        currentAvatarUrl={userProfile.avatar_url}
        userRole={userProfile.role}
      />
    </div>
  );
};