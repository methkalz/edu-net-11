import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database, RefreshCw } from 'lucide-react';

interface AvatarData {
  file_path: string;
  category: string;
  display_name: string;
  filename: string;
  is_active: boolean;
  order_index: number;
}

const AVATAR_DATA: AvatarData[] = [
  // Student avatars
  { file_path: '/avatars/student-boy-1.png', filename: 'student-boy-1.png', category: 'student', display_name: 'طالب 1', is_active: true, order_index: 1 },
  { file_path: '/avatars/student-boy-2.png', filename: 'student-boy-2.png', category: 'student', display_name: 'طالب 2', is_active: true, order_index: 2 },
  { file_path: '/avatars/student-girl-1.png', filename: 'student-girl-1.png', category: 'student', display_name: 'طالبة 1', is_active: true, order_index: 3 },
  { file_path: '/avatars/student-girl-2.png', filename: 'student-girl-2.png', category: 'student', display_name: 'طالبة 2', is_active: true, order_index: 4 },
  { file_path: '/avatars/student-creative.png', filename: 'student-creative.png', category: 'student', display_name: 'طالب مبدع', is_active: true, order_index: 5 },
  
  // Teacher avatars
  { file_path: '/avatars/teacher-male-1.png', filename: 'teacher-male-1.png', category: 'teacher', display_name: 'معلم 1', is_active: true, order_index: 6 },
  { file_path: '/avatars/teacher-male-2.png', filename: 'teacher-male-2.png', category: 'teacher', display_name: 'معلم 2', is_active: true, order_index: 7 },
  { file_path: '/avatars/teacher-female-1.png', filename: 'teacher-female-1.png', category: 'teacher', display_name: 'معلمة 1', is_active: true, order_index: 8 },
  { file_path: '/avatars/teacher-female-2.png', filename: 'teacher-female-2.png', category: 'teacher', display_name: 'معلمة 2', is_active: true, order_index: 9 },
  
  // Admin avatars
  { file_path: '/avatars/admin-school-male.png', filename: 'admin-school-male.png', category: 'admin', display_name: 'مدير مدرسة', is_active: true, order_index: 10 },
  { file_path: '/avatars/admin-school-female.png', filename: 'admin-school-female.png', category: 'admin', display_name: 'مديرة مدرسة', is_active: true, order_index: 11 },
  { file_path: '/avatars/admin-school-formal.png', filename: 'admin-school-formal.png', category: 'admin', display_name: 'مدير رسمي', is_active: true, order_index: 12 },
  
  // Super admin avatars
  { file_path: '/avatars/superadmin-1.png', filename: 'superadmin-1.png', category: 'superadmin', display_name: 'مدير نظام 1', is_active: true, order_index: 13 },
  { file_path: '/avatars/superadmin-2.png', filename: 'superadmin-2.png', category: 'superadmin', display_name: 'مدير نظام 2', is_active: true, order_index: 14 },
  
  // Universal avatar
  { file_path: '/avatars/universal-default.png', filename: 'universal-default.png', category: 'universal', display_name: 'افتراضي', is_active: true, order_index: 15 }
];

export const AvatarDatabaseSeeder: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const { toast } = useToast();

  const seedAvatarDatabase = async () => {
    try {
      setIsSeeding(true);
      
      // First, clear existing avatar data
      const { error: deleteError } = await supabase
        .from('avatar_images')
        .delete()
        .neq('id', '0'); // Delete all records
      
      if (deleteError) {
        console.warn('Warning clearing existing avatars:', deleteError);
      }
      
      // Insert new avatar data
      const { data, error } = await supabase
        .from('avatar_images')
        .insert(AVATAR_DATA);
      
      if (error) {
        throw error;
      }
      
      const result = {
        success: true,
        message: `تم تحديث قاعدة بيانات الأفاتار بنجاح - تم إضافة ${AVATAR_DATA.length} صورة`,
        count: AVATAR_DATA.length
      };
      
      setLastResult(result);
      
      toast({
        title: 'تم بنجاح',
        description: result.message,
        variant: 'default'
      });
      
    } catch (error) {
      console.error('Error seeding avatar database:', error);
      const errorResult = {
        success: false,
        message: 'فشل في تحديث قاعدة بيانات الأفاتار'
      };
      
      setLastResult(errorResult);
      
      toast({
        title: 'خطأ',
        description: errorResult.message,
        variant: 'destructive'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          تحديث قاعدة بيانات الأفاتار
        </CardTitle>
        <CardDescription>
          يقوم هذا بتحديث جدول avatar_images بجميع الأفاتار المتاحة وتصنيفها حسب الأدوار
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>سيتم إضافة {AVATAR_DATA.length} صورة أفاتار:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>5 أفاتار للطلاب</li>
            <li>4 أفاتار للمعلمين</li>
            <li>3 أفاتار لمديري المدارس</li>
            <li>2 أفاتار لمديري النظام</li>
            <li>1 أفاتار افتراضي عام</li>
          </ul>
        </div>
        
        <Button 
          onClick={seedAvatarDatabase}
          disabled={isSeeding}
          className="w-full"
        >
          {isSeeding ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              جاري التحديث...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              تحديث قاعدة البيانات
            </>
          )}
        </Button>
        
        {lastResult && (
          <div className={`p-3 rounded-md text-sm ${
            lastResult.success 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <p className="font-medium">{lastResult.message}</p>
            {lastResult.count && (
              <p className="mt-1">عدد الأفاتار المضافة: {lastResult.count}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};