import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface OrphanedUser {
  id: string;
  email: string;
  created_at: string;
}

interface CleanupResult {
  success: boolean;
  orphanedUsersCount: number;
  orphanedUsers?: OrphanedUser[];
  deletedCount?: number;
  errors?: string[];
  message?: string;
}

export const OrphanedUsersCleanup: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<CleanupResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Only show to superadmins
  if (userProfile?.role !== 'superadmin') {
    return null;
  }

  const scanOrphanedUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-orphaned-users', {
        body: {
          dryRun: true
        }
      });

      if (error) throw error;

      setScanResult(data);
      setShowConfirmation(false);
      
      toast.success(`تم العثور على ${data.orphanedUsersCount} مستخدم معلق`);
    } catch (error) {
      console.error('Error scanning orphaned users:', error);
      toast.error('فشل في فحص المستخدمين المعلقين');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrphanedUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-orphaned-users', {
        body: {
          dryRun: false,
          confirmDelete: true
        }
      });

      if (error) throw error;

      setScanResult(data);
      setShowConfirmation(false);
      
      toast.success(`تم حذف ${data.deletedCount} مستخدم معلق بنجاح`);
    } catch (error) {
      console.error('Error deleting orphaned users:', error);
      toast.error('فشل في حذف المستخدمين المعلقين');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-50">
              <Users className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">تنظيف المستخدمين المعلقين</h3>
              <p className="text-xs text-muted-foreground">
                {scanResult?.orphanedUsersCount || 0} مستخدم معلق
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={scanOrphanedUsers}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            {loading ? 'جاري الفحص...' : 'فحص'}
          </Button>
          
          {scanResult && scanResult.orphanedUsersCount > 0 && (
            <Button 
              onClick={() => setShowConfirmation(true)}
              disabled={loading}
              variant="destructive"
              size="sm"
              className="w-full text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              حذف ({scanResult.orphanedUsersCount})
            </Button>
          )}
        </div>

        {showConfirmation && scanResult && (
          <Alert className="border-red-200 bg-red-50 mt-3">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              <div className="space-y-2">
                <p className="font-medium">
                  حذف {scanResult.orphanedUsersCount} مستخدم؟
                </p>
                <div className="flex gap-1">
                  <Button 
                    onClick={deleteOrphanedUsers}
                    disabled={loading}
                    variant="destructive"
                    size="sm"
                    className="text-xs flex-1"
                  >
                    {loading ? 'حذف...' : 'نعم'}
                  </Button>
                  <Button 
                    onClick={() => setShowConfirmation(false)}
                    variant="outline"
                    size="sm"
                    className="text-xs flex-1"
                  >
                    لا
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {scanResult && scanResult.deletedCount !== undefined && (
          <Alert className="border-green-200 bg-green-50 mt-2">
            <CheckCircle className="h-3 w-3" />
            <AlertDescription className="text-xs text-green-600">
              تم حذف {scanResult.deletedCount} مستخدم
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};