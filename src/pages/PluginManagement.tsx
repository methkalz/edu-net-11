import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Gamepad2, ClipboardCheck, Tag, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { PageLoading } from '@/components/ui/LoadingComponents';
import { logger } from '@/lib/logger';

interface Plugin {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  category: string;
  icon: string;
  default_status: string;
}

interface SchoolPlugin {
  plugin_id: string;
  status: string;
  enabled_at: string | null;
  settings: Record<string, any>;
}

const iconMap = {
  FileCheck,
  Gamepad2,
  ClipboardCheck,
  Tag,
  Settings
};

const statusMap = {
  enabled: { label: 'مفعّل', color: 'bg-green-500' },
  disabled: { label: 'معطّل', color: 'bg-gray-500' },
  in_development: { label: 'قيد التطوير', color: 'bg-yellow-500' },
  coming_soon: { label: 'سيفعّل قريباً', color: 'bg-blue-500' }
};

const PluginManagementPage = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [schoolPlugins, setSchoolPlugins] = useState<Record<string, SchoolPlugin>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchPlugins();
  }, [user, navigate]);

  const fetchPlugins = async () => {
    try {
      // Fetch all plugins
      const { data: pluginsData, error: pluginsError } = await supabase
        .from('plugins')
        .select('*')
        .order('name_ar');

      if (pluginsError) throw pluginsError;

      // Fetch school plugin settings
      let schoolPluginsData = [];
      if (userProfile?.school_id) {
        const { data, error } = await supabase
          .from('school_plugins')
          .select('*')
          .eq('school_id', userProfile.school_id);

        if (error) throw error;
        schoolPluginsData = data || [];
      }

      // Create a map of school plugins
      const schoolPluginsMap = schoolPluginsData.reduce((acc, sp) => {
        acc[sp.plugin_id] = sp;
        return acc;
      }, {} as Record<string, SchoolPlugin>);

      setPlugins(pluginsData || []);
      setSchoolPlugins(schoolPluginsMap);
    } catch (error) {
      logger.error('Error fetching plugins', error as Error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في جلب الإضافات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePluginStatus = async (pluginId: string, newStatus: string) => {
    if (!userProfile?.school_id) return;

    try {
      const { error } = await supabase
        .from('school_plugins')
        .upsert({
          school_id: userProfile.school_id,
          plugin_id: pluginId,
          status: newStatus as 'enabled' | 'disabled' | 'in_development' | 'coming_soon',
          enabled_at: newStatus === 'enabled' ? new Date().toISOString() : null
        }, {
          onConflict: 'school_id,plugin_id'
        });

      if (error) throw error;

      // Update local state
      setSchoolPlugins(prev => ({
        ...prev,
        [pluginId]: {
          ...prev[pluginId],
          plugin_id: pluginId,
          status: newStatus,
          enabled_at: newStatus === 'enabled' ? new Date().toISOString() : null,
          settings: prev[pluginId]?.settings || {}
        }
      }));

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الإضافة بنجاح",
      });
    } catch (error) {
      logger.error('Error updating plugin status', error as Error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث حالة الإضافة",
        variant: "destructive",
      });
    }
  };

  const getPluginStatus = (plugin: Plugin) => {
    const schoolPlugin = schoolPlugins[plugin.id];
    return schoolPlugin?.status || plugin.default_status;
  };

  const canManagePlugins = userProfile?.role === 'superadmin' || userProfile?.role === 'school_admin';

  if (loading) {
    return <PageLoading message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader 
        title="إدارة الإضافات" 
        showBackButton={true} 
        showLogout={true} 
      />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plugins.map((plugin) => {
            const IconComponent = iconMap[plugin.icon as keyof typeof iconMap] || Settings;
            const currentStatus = getPluginStatus(plugin);
            const statusInfo = statusMap[currentStatus as keyof typeof statusMap];

            return (
              <Card key={plugin.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{plugin.name_ar}</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                          {plugin.description_ar}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">الحالة:</span>
                      <Badge 
                        variant="secondary" 
                        className={`${statusInfo.color} text-white`}
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {canManagePlugins && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">تغيير الحالة:</label>
                        <Select
                          value={currentStatus}
                          onValueChange={(value) => updatePluginStatus(plugin.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحالة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">مفعّل</SelectItem>
                            <SelectItem value="disabled">معطّل</SelectItem>
                            <SelectItem value="in_development">قيد التطوير</SelectItem>
                            <SelectItem value="coming_soon">سيفعّل قريباً</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        الفئة: {plugin.category}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {plugins.length === 0 && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد إضافات متاحة</h3>
            <p className="text-muted-foreground">سيتم إضافة الإضافات قريباً</p>
          </div>
        )}
      </main>
      
      <AppFooter />
    </div>
  );
};

export default PluginManagementPage;