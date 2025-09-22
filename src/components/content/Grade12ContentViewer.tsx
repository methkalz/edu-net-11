import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, FileText, Eye, Calendar, Clock, User } from 'lucide-react';
import { useGrade12Content } from '@/hooks/useGrade12Content';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Grade12VideoViewer from './Grade12VideoViewer';

const Grade12ContentViewer: React.FC = () => {
  // استخدام hook قاعدة البيانات للعرض فقط
  const { videos, documents, loading } = useGrade12Content();

  const openVideo = (videoUrl: string) => {
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  };

  const openDocument = (documentPath: string) => {
    if (documentPath) {
      window.open(documentPath, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h3 className="text-3xl font-bold text-foreground">
          محتوى الصف الثاني عشر
        </h3>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          استعراض الفيديوهات التعليمية وملفات العمل المتاحة للطلاب
        </p>
        <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">وضع العرض فقط</span>
        </div>
      </div>

      <Tabs defaultValue="videos" dir="rtl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            الفيديوهات التعليمية ({videos.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            ملفات العمل ({documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-6">
          <Grade12VideoViewer videos={videos} loading={loading} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                ملفات العمل
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                              <FileText className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground mb-1 line-clamp-2">
                                {doc.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {doc.description || 'لا يوجد وصف'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                ملف
                              </Badge>
                              {doc.file_type && (
                                <Badge variant="outline" className="text-xs">
                                  {doc.file_type.toUpperCase()}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ar })}
                              </Badge>
                            </div>
                            
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => openDocument(doc.file_path)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              عرض الملف
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد ملفات</h3>
                  <p className="text-muted-foreground">لم يتم إضافة أي ملفات عمل بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Grade12ContentViewer;