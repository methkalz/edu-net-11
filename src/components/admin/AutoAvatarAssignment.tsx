import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Users } from 'lucide-react';
import { useAvatarAssignment } from '@/hooks/useAvatarAssignment';

export const AutoAvatarAssignment: React.FC = () => {
  const { isAssigning, lastResult, assignRandomAvatars } = useAvatarAssignment();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          تعيين أفاتار عشوائي للمستخدمين
        </CardTitle>
        <CardDescription>
          تعيين أفاتار عشوائي لجميع المستخدمين الذين لا يملكون أفاتار حالياً
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>• سيتم تعيين أفاتار عشوائي مناسب لكل مستخدم حسب دوره</p>
          <p>• الطلاب سيحصلون على أفاتار من فئة "student" أو "universal"</p>
          <p>• المعلمون سيحصلون على أفاتار من فئة "teacher" أو "universal"</p>
          <p>• المديرون سيحصلون على أفاتار من فئة "admin" أو "universal"</p>
        </div>
        
        <Button 
          onClick={assignRandomAvatars} 
          disabled={isAssigning}
          className="w-full"
        >
          {isAssigning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              جارٍ التعيين...
            </>
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              تعيين أفاتار عشوائي للجميع
            </>
          )}
        </Button>

        {lastResult && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              <strong>آخر عملية:</strong> {lastResult.message}
            </p>
            <p className="text-xs text-green-600 mt-1">
              تم تحديث {lastResult.updated_count} مستخدم
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};