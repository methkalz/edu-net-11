import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useGrade12Content } from '@/hooks/useGrade12Content';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  BookOpen,
  Video,
  FileText,
  Download,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Calendar,
  User,
  BarChart3,
  TrendingUp,
  Target,
  Star,
  Trophy,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Grade12FinalProjectManager from './Grade12FinalProjectManager';
import Grade12VideoLibrary from './Grade12VideoLibrary';
import Grade12DefaultTasks from './Grade12DefaultTasks';
import FileLibraryManager from './FileLibraryManager';

const Grade12Content: React.FC = () => {
  const { userProfile } = useAuth();
  const {
    projects,
    documents,
    videos,
    loading,
    addProject,
    deleteProject,
    refetch,
  } = useGrade12Content();

  const [showLibraryManager, setShowLibraryManager] = useState(false);

  const canManageContent = userProfile?.role === 'school_admin' || userProfile?.role === 'superadmin';

  const handleCloseLibrary = () => {
    setShowLibraryManager(false);
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">محتوى الصف الثاني عشر</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          إدارة شاملة للمشاريع النهائية ومحتوى الصف الثاني عشر
        </p>
      </div>

      <Tabs defaultValue="final-projects" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-3xl mx-auto">
          <TabsTrigger value="final-projects" className="gap-2">
            <Trophy className="h-4 w-4" />
            المشاريع النهائية
          </TabsTrigger>
          <TabsTrigger value="default-tasks" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            المهام الافتراضية
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="h-4 w-4" />
            الفيديوهات
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-2">
            <BookOpen className="h-4 w-4" />
            المكتبة
          </TabsTrigger>
        </TabsList>

        {/* Final Projects Tab */}
        <TabsContent value="final-projects" className="space-y-6">
          <Grade12FinalProjectManager />
        </TabsContent>

        {/* Default Tasks Tab */}
        <TabsContent value="default-tasks" className="space-y-6">
          <Grade12DefaultTasks />
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          <Grade12VideoLibrary />
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">مكتبة المستندات</h2>
            {canManageContent && (
              <Button onClick={() => setShowLibraryManager(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                إدارة المكتبة
              </Button>
            )}
          </div>

          {/* Library Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{documents.length}</p>
                  <p className="text-sm text-muted-foreground">مستندات</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Video className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{videos.length}</p>
                  <p className="text-sm text-muted-foreground">فيديوهات</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="bg-green-100 p-3 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{documents.length + videos.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الملفات</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Star className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-sm text-muted-foreground">مشاريع نهائية</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                المستندات الحديثة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد مستندات</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.slice(0, 6).map((document) => (
                    <div key={document.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="bg-blue-100 p-2 rounded">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{document.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(document.created_at), 'dd MMM', { locale: ar })}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Library Manager Modal */}
      {showLibraryManager && (
        <FileLibraryManager onClose={handleCloseLibrary} />
      )}
    </div>
  );
};

export default Grade12Content;