import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGrade12Content } from '@/hooks/useGrade12Content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Video, FileText, FolderOpen, Play, Clock, CheckCircle, Star, ExternalLink, Search, Calendar, Eye, Trophy, Target, Sparkles, Plus, Edit3, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useGrade12Projects } from '@/hooks/useGrade12Projects';
import Grade12FinalProjectForm from '../content/Grade12FinalProjectForm';
export const StudentGrade12Content: React.FC<{ defaultTab?: string }> = ({ defaultTab = 'content' }) => {
  const navigate = useNavigate();
  const {
    videos,
    documents,
    loading
  } = useGrade12Content();
  const {
    updateProgress,
    logActivity
  } = useStudentProgress();
  const {
    projects,
    createProject
  } = useGrade12Projects();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [mainTab, setMainTab] = useState(defaultTab);
  const [contentTab, setContentTab] = useState('videos');
  const [showProjectForm, setShowProjectForm] = useState(false);

  // Helper functions for video thumbnails
  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };
  const extractGoogleDriveId = (url: string): string | null => {
    const regex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };
  const getVideoThumbnail = (video: any): string => {
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }
    if (video.source_type === 'youtube' || video.video_url?.includes('youtube.com') || video.video_url?.includes('youtu.be')) {
      const videoId = extractYouTubeId(video.video_url);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }
    if (video.source_type === 'google_drive' || video.video_url?.includes('drive.google.com/file/d/')) {
      const fileId = extractGoogleDriveId(video.video_url);
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300`;
      }
    }
    return '/placeholder.svg';
  };
  const getEmbedUrl = (url: string, sourceType: string): string => {
    if (sourceType === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    if (sourceType === 'google_drive' || url.includes('drive.google.com/file/d/')) {
      const fileId = extractGoogleDriveId(url);
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return url;
  };
  const openVideo = async (video: any) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);

    // تسجيل إكمال المحتوى فوراً عند فتح النافذة
    try {
      await updateProgress(video.id, 'video', 100, 0, 10);
      await logActivity('video_watch', video.id, 0, 10);
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };
  const handleVideoProgress = async (videoId: string, progress: number, timeSpent: number) => {
    try {
      await updateProgress(videoId, 'video', progress, timeSpent, 0);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };
  const handleVideoComplete = async (videoId: string, timeSpent: number) => {
    try {
      await updateProgress(videoId, 'video', 100, timeSpent, 15);
      toast.success('تم إكمال الفيديو بنجاح! +15 نقطة', {
        description: 'تم تسجيل تقدمك في النظام'
      });
    } catch (error) {
      toast.error('حدث خطأ في تسجيل التقدم');
    }
  };

  // Handle project creation
  const handleCreateProject = async (projectData: any) => {
    try {
      await createProject(projectData);
      setShowProjectForm(false);
      toast.success('تم إنشاء المشروع النهائي بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'فشل في إنشاء المشروع');
    }
  };

  // Handle project click - navigate to editor
  const handleProjectClick = (project: any) => {
    navigate(`/grade12-project-editor/${project.id}`);
  };

  const filteredVideos = videos.filter(video => video.title.toLowerCase().includes(searchTerm.toLowerCase()) || video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const renderVideoPlayer = (video: any) => {
    const embedUrl = getEmbedUrl(video.video_url, video.source_type);
    const isGoogleDrive = video.source_type === 'google_drive' || video.video_url.includes('drive.google.com');
    const isYouTube = video.source_type === 'youtube' || video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be');
    if (isYouTube || isGoogleDrive) {
      return <iframe src={embedUrl} title={video.title} className="w-full h-96 rounded-lg border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
    }
    if (video.source_type === 'direct') {
      return <video src={video.video_url} controls className="w-full h-96 rounded-lg" preload="metadata">
          متصفحك لا يدعم تشغيل الفيديو
        </video>;
    }
    return <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">لا يمكن عرض هذا الفيديو مباشرة</p>
          <Button onClick={() => window.open(video.video_url, '_blank')}>
            فتح في صفحة جديدة
          </Button>
        </div>
      </div>;
  };
  
  if (loading) {
    return <div className="container mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => <Card key={index} className="overflow-hidden animate-pulse">
                <div className="h-48 bg-muted"></div>
                <CardHeader>
                  <div className="h-6 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </div>;
  }
  
  return <div className="container mx-auto px-6 py-12" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-6 mb-12">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full shadow-lg">
          <Trophy className="h-6 w-6" />
          <span className="font-bold text-lg">الصف الثاني عشر</span>
        </div>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          استكشف الفيديوهات التعليمية والمواد الدراسية المتقدمة للصف الثاني عشر
        </p>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Video className="h-4 w-4 mr-2" />
            {videos.length} فيديو
          </Badge>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <FileText className="h-4 w-4 mr-2" />
            {documents.length} ملف
          </Badge>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <FolderOpen className="h-4 w-4 mr-2" />
            {projects.length} مشروع
          </Badge>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="البحث في المحتوى..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
        </div>
      </div>

      {/* Content based on mainTab state */}
      {mainTab === 'content' && (
        <div className="w-full">
          <Tabs value={contentTab} onValueChange={setContentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                الفيديوهات التعليمية ({videos.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                الملفات والمراجع ({documents.length})
              </TabsTrigger>
            </TabsList>

            {/* Videos Tab */}
            <TabsContent value="videos">
              {filteredVideos.length === 0 ? <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    <Video className="w-12 h-12 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {searchTerm ? 'لا توجد نتائج' : 'لا توجد فيديوهات'}
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {searchTerm ? 'جرب البحث بمصطلحات مختلفة' : 'سيتم إضافة الفيديوهات التعليمية قريباً'}
                  </p>
                </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredVideos.map(video => <Card key={video.id} className="group overflow-hidden hover:shadow-xl transition-all duration-500 border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-md hover:scale-[1.02] hover:-translate-y-1">
                      <div className="relative h-52 overflow-hidden">
                        <img src={getVideoThumbnail(video)} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={e => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }} />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-500 flex items-center justify-center cursor-pointer" onClick={() => openVideo(video)}>
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                            <div className="relative">
                              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                              <div className="relative bg-white/15 hover:bg-white/25 rounded-full p-4 backdrop-blur-md border border-white/20 shadow-2xl">
                                <Play className="w-8 h-8 text-white fill-white drop-shadow-lg" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {video.duration && <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {video.duration}
                          </div>}
                      </div>
                      
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg leading-7 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                          {video.title}
                        </CardTitle>
                        {video.description && <p className="text-sm text-muted-foreground line-clamp-2">
                            {video.description}
                          </p>}
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {video.category && <Badge variant="outline" className="text-xs">
                              {video.category}
                            </Badge>}
                        </div>

                        <Button className="w-full gap-2" onClick={() => openVideo(video)}>
                          <Play className="h-4 w-4" />
                          مشاهدة الفيديو
                        </Button>
                      </CardContent>
                    </Card>)}
                </div>}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              {documents.length === 0 ? <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">لا توجد ملفات</h3>
                  <p className="text-muted-foreground text-lg">
                    سيتم إضافة الملفات والمراجع قريباً
                  </p>
                </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.map(doc => <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          {doc.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {doc.description && <p className="text-sm text-muted-foreground mb-4">
                            {doc.description}
                          </p>}
                        <Button variant="outline" className="w-full" onClick={() => window.open(doc.file_path, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          فتح الملف
                        </Button>
                      </CardContent>
                    </Card>)}
                </div>}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Project Tab */}
      {mainTab === 'project' && (
        <div className="w-full">
          {projects.length === 0 ? <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                <FolderOpen className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">لا يوجد مشروع نهائي</h3>
              <p className="text-muted-foreground text-lg mb-6">
                أنشئ مشروعك النهائي وأظهر مهاراتك المتقدمة
              </p>
              <Button size="lg" className="gap-2" onClick={() => setShowProjectForm(true)}>
                <Plus className="h-5 w-5" />
                إنشاء مشروع نهائي
              </Button>
            </div> : <div className="space-y-6">
              <div className="flex justify-end">
                <Button className="gap-2" onClick={() => setShowProjectForm(true)}>
                  <Plus className="h-4 w-4" />
                  إنشاء مشروع جديد
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => {
                  const statusColors: Record<string, string> = {
                    'draft': 'bg-gray-100 text-gray-700',
                    'in_progress': 'bg-blue-100 text-blue-700',
                    'submitted': 'bg-yellow-100 text-yellow-700',
                    'completed': 'bg-green-100 text-green-700',
                    'reviewed': 'bg-purple-100 text-purple-700'
                  };
                  
                  const statusTexts: Record<string, string> = {
                    'draft': 'مسودة',
                    'in_progress': 'قيد التنفيذ',
                    'submitted': 'تم التسليم',
                    'completed': 'مكتمل',
                    'reviewed': 'تم المراجعة'
                  };
                  
                  return (
                    <Card key={project.id} className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-md">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg flex items-center gap-2 flex-1">
                            <Trophy className="h-5 w-5 text-amber-600" />
                            {project.title}
                          </CardTitle>
                          <Badge className={statusColors[project.status] || 'bg-gray-100'}>
                            {statusTexts[project.status] || 'غير محدد'}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {project.due_date && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>موعد التسليم: {new Date(project.due_date).toLocaleDateString('ar-EG')}</span>
                          </div>
                        )}
                        
                        {project.grade && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Target className="h-4 w-4" />
                            <span>الدرجة: {project.grade}</span>
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-2 pt-2">
                          <Button 
                            className="w-full gap-2" 
                            onClick={() => handleProjectClick(project)}
                          >
                            <Edit3 className="h-4 w-4" />
                            فتح المشروع
                          </Button>
                          
                          {project.google_doc_url && (
                            <Button 
                              variant="outline"
                              className="w-full gap-2" 
                              onClick={() => window.open(project.google_doc_url, '_blank')}
                            >
                              <FileText className="h-4 w-4" />
                              فتح مستند Google Docs
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>}
        </div>
      )}

      {/* Exams Tab */}
      {mainTab === 'exams' && (
        <div className="w-full">
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4">الامتحانات</h3>
            <p className="text-muted-foreground text-lg">
              سيتم إضافة الامتحانات قريباً
            </p>
          </div>
        </div>
      )}

      {/* Project Form Modal */}
      {showProjectForm && (
        <Grade12FinalProjectForm
          onSave={handleCreateProject}
          onClose={() => setShowProjectForm(false)}
        />
      )}

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {selectedVideo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedVideo && renderVideoPlayer(selectedVideo)}
            {selectedVideo?.description && <p className="text-muted-foreground text-right">
                {selectedVideo.description}
              </p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default StudentGrade12Content;