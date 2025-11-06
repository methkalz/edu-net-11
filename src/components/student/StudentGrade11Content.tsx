import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStudentGrade11Content } from '@/hooks/useStudentGrade11Content';
import { useTopicLessons } from '@/hooks/useTopicLessons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BookOpen, ChevronDown, ChevronRight, Search, FolderOpen, PlayCircle, Clock, Star, FileText, BookMarked, Target, Trophy, Video, Calendar, FileCheck, Loader2, Music } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Grade11LessonContentDisplay from '../content/Grade11LessonContentDisplay';
import { Grade11VideoViewer } from '@/components/content/Grade11VideoViewer';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useVideoInfoCards } from '@/hooks/useVideoInfoCards';
import VideoInfoCard from '../content/VideoInfoCard';
import type { Grade11LessonWithMedia } from '@/hooks/useStudentGrade11Content';
import { useDebouncedCallback } from 'use-debounce';

// Helper function to strip HTML tags from content
const stripHtml = (html: string): string => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// ⚡ Memoized Lesson Card Component
const LessonCard = React.memo<{
  lesson: Grade11LessonWithMedia;
  onClick: () => void;
}>(({ lesson, onClick }) => (
  <div 
    className="flex items-center justify-between p-5 bg-gradient-to-br from-purple-50/50 to-purple-100/30 rounded-2xl border border-purple-200/60 hover:bg-purple-50/80 transition-colors cursor-pointer group" 
    onClick={onClick}
  >
    <div className="flex items-center gap-5">
      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
        <BookOpen className="w-5 h-5 text-white" />
      </div>
      <div>
        <h5 className="font-medium text-slate-700 group-hover:text-purple-700 transition-colors">
          {lesson.title}
        </h5>
        {lesson.content && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            {stripHtml(lesson.content).substring(0, 80)}...
          </p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-3">
      {lesson.media && lesson.media.length > 0 && (
        <Badge variant="secondary" className="text-xs px-2 py-1 bg-purple-100/60 text-purple-600 border-purple-200">
          <PlayCircle className="w-3 h-3 ml-1" />
          {lesson.media.length}
        </Badge>
      )}
      {lesson.media && lesson.media.some(m => m.media_type === 'audio') && (
        <Badge variant="secondary" className="text-xs px-2 py-1 bg-orange-100/60 text-orange-600 border-orange-200">
          <Music className="w-3 h-3 ml-1" />
          صوتي
        </Badge>
      )}
      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
    </div>
  </div>
));

LessonCard.displayName = 'LessonCard';

export const StudentGrade11Content: React.FC = () => {
  const {
    sections,
    videos,
    loading,
    error,
    getContentStats
  } = useStudentGrade11Content();
  const { updateProgress, logActivity } = useStudentProgress();
  const { cards, loading: cardsLoading } = useVideoInfoCards('11');
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [openTopics, setOpenTopics] = useState<string[]>([]);
  const [loadedTopics, setLoadedTopics] = useState<Record<string, Grade11LessonWithMedia[]>>({});
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('lessons');
  const stats = getContentStats();

  // ⚡ Lazy load lessons when topic is opened
  const { data: topicLessons, isLoading: topicLessonsLoading } = useTopicLessons(currentTopicId);

  // Store loaded lessons in state
  useEffect(() => {
    if (topicLessons && currentTopicId) {
      setLoadedTopics(prev => ({
        ...prev,
        [currentTopicId]: topicLessons
      }));
    }
  }, [topicLessons, currentTopicId]);

  // ⚡ Debounced toggle functions for better performance
  const toggleSection = useDebouncedCallback((sectionId: string) => {
    setOpenSections(prev => prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]);
  }, 100);

  const toggleTopic = useDebouncedCallback((topicId: string) => {
    const isOpening = !openTopics.includes(topicId);
    setOpenTopics(prev => 
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
    
    // Lazy load lessons when opening topic
    if (isOpening && !loadedTopics[topicId]) {
      setCurrentTopicId(topicId);
    }
  }, 100);

  // ⚡ Memoized filtered data for better performance
  const filteredSections = useMemo(() => {
    if (!sections) return [];
    if (!searchQuery) return sections;
    
    const query = searchQuery.toLowerCase();
    return sections.filter(section => 
      section.title.toLowerCase().includes(query) || 
      section.description?.toLowerCase().includes(query) || 
      section.topics?.some(topic => 
        topic.title.toLowerCase().includes(query) || 
        topic.content?.toLowerCase().includes(query)
      )
    );
  }, [sections, searchQuery]);

  const filteredVideos = useMemo(() => {
    if (!videos) return [];
    if (!searchQuery) return videos;
    
    const query = searchQuery.toLowerCase();
    return videos.filter(video => 
      video.title.toLowerCase().includes(query) || 
      video.description?.toLowerCase().includes(query) || 
      video.category.toLowerCase().includes(query)
    );
  }, [videos, searchQuery]);

  // ⚡ Memoized lesson click handler
  const handleLessonClick = useCallback(async (lesson: Grade11LessonWithMedia) => {
    setSelectedLesson(lesson);
    try {
      await updateProgress(lesson.id, 'lesson', 100, 0, 10);
      await logActivity('document_read', lesson.id, 0, 10);
    } catch (error) {
      console.error('Error tracking lesson view:', error);
    }
  }, [updateProgress, logActivity]);
  if (loading) {
    return <div className="space-y-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-semibold text-slate-700">محتوى الصف الحادي عشر</h2>
          <p className="text-slate-500 font-medium">جاري تحميل المحتوى التعليمي...</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <Card key={i} className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200/60 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-slate-200/50 rounded-2xl animate-pulse"></div>
                <div className="h-6 bg-slate-200/50 rounded-xl mb-2 animate-pulse"></div>
                <div className="h-4 bg-slate-200/50 rounded-lg animate-pulse"></div>
              </CardContent>
            </Card>)}
        </div>

        <div className="space-y-6">
          {[1, 2, 3].map(i => <Card key={i} className="bg-gradient-to-br from-white to-slate-50/30 border-slate-200/60 shadow-sm">
              <CardContent className="p-8">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-16 h-16 bg-slate-200/50 rounded-3xl animate-pulse"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-slate-200/50 rounded-xl w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-slate-200/50 rounded-lg w-1/2 animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  if (error) {
    return <Card className="text-center p-12 bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/60 shadow-sm">
        <div className="space-y-6">
          <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-200/50">
            <FileText className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-red-700">حدث خطأ في تحميل المحتوى</h3>
          <p className="text-red-600/70 font-medium">{error}</p>
          <Button onClick={() => window.location.reload()} variant="ghost" className="font-medium text-red-600 hover:text-red-700 hover:bg-red-50">
            إعادة المحاولة
          </Button>
        </div>
      </Card>;
  }
  return <div className="space-y-8 max-w-7xl mx-auto">
      {/* Minimal Header */}
      <div className="text-center space-y-3">
        
        
      </div>

      {/* Clean Statistics Cards with Grade 10 Colors */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/60">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalSections}</div>
            <div className="text-sm text-blue-600/70 font-medium">أقسام</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/60">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">{stats.totalTopics}</div>
            <div className="text-sm text-green-600/70 font-medium">مواضيع</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/60">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-1">{stats.totalLessons}</div>
            <div className="text-sm text-purple-600/70 font-medium">دروس</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/60">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-orange-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlayCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">{stats.totalMedia}</div>
            <div className="text-sm text-orange-600/70 font-medium">وسائط</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200/60">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-rose-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-600 mb-1">{stats.totalVideos}</div>
            <div className="text-sm text-rose-600/70 font-medium">فيديوهات</div>
          </CardContent>
        </Card>
      </div>

      {/* Minimal Search */}
      <div className="flex gap-4 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-soft w-5 h-5" />
          <Input placeholder="ابحث في المحتوى..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-12 py-4 text-base border-divider bg-surface-light focus:bg-background transition-colors font-light" />
        </div>
        {searchQuery && <Button variant="ghost" onClick={() => setSearchQuery('')} className="px-6 py-4 text-text-soft hover:text-foreground">
            مسح
          </Button>}
      </div>

      {/* Clean Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-14 bg-surface-light border border-divider">
          <TabsTrigger value="lessons" className="flex items-center gap-3 text-base font-light py-3">
            <BookOpen className="w-5 h-5" />
            الدروس ({(sections || []).length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-3 text-base font-light py-3">
            <Video className="w-5 h-5" />
            الفيديوهات ({(videos || []).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-6 mt-8">
          {filteredSections.length === 0 ? <Card className="text-center p-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200/60">
              <div className="space-y-4">
                <Search className="w-16 h-16 mx-auto text-slate-400" />
                <h3 className="text-xl font-semibold text-slate-600">لا توجد نتائج</h3>
                <p className="text-slate-500">
                  لم يتم العثور على محتوى يطابق البحث "{searchQuery}"
                </p>
              </div>
            </Card> : filteredSections.map(section => <Card key={section.id} className="overflow-hidden bg-gradient-to-br from-white to-slate-50/30 border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                <Collapsible open={openSections.includes(section.id)} onOpenChange={() => toggleSection(section.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-50/50 transition-colors p-8">
                       <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-lg">
                            <FolderOpen className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-left">
                            <CardTitle className="text-2xl font-semibold text-slate-700">{section.title}</CardTitle>
                            {section.description && <p className="text-base text-slate-500 mt-3 font-medium">
                                {section.description}
                              </p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="text-sm px-4 py-2 bg-blue-50 text-blue-600 border-blue-200 font-medium">
                            {section.topics.length} موضوع
                          </Badge>
                          {openSections.includes(section.id) ? <ChevronDown className="w-6 h-6 text-slate-400" /> : <ChevronRight className="w-6 h-6 text-slate-400" />}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 px-8 pb-8">
                      <div className="space-y-4">
                        {section.topics.map(topic => <Card key={topic.id} className="mr-8 bg-gradient-to-br from-white to-green-50/30 border-green-200/60 shadow-sm">
                            <Collapsible open={openTopics.includes(topic.id)} onOpenChange={() => toggleTopic(topic.id)}>
                              <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-green-50/30 transition-colors py-6">
                                   <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-md">
                                        <Target className="w-6 h-6 text-white" />
                                      </div>
                                      <div className="text-left">
                                        <h4 className="font-semibold text-lg text-slate-700">{topic.title}</h4>
                                        {topic.content && <p className="text-sm text-slate-500 mt-2 line-clamp-2 font-medium">
                                            {topic.content}
                                          </p>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline" className="text-sm px-3 py-1 font-medium border-green-200 text-green-600">
                                        {topic.lessons.length} درس
                                      </Badge>
                                      {openTopics.includes(topic.id) ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                                    </div>
                                  </div>
                                </CardHeader>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <CardContent className="pt-0 px-6 pb-6">
                                   {topicLessonsLoading && currentTopicId === topic.id ? (
                                    <div className="flex items-center justify-center py-8">
                                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                      <span className="mr-3 text-sm text-slate-600">جاري تحميل الدروس...</span>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {(loadedTopics[topic.id] || []).map(lesson => (
                                        <LessonCard
                                          key={lesson.id}
                                          lesson={lesson}
                                          onClick={() => handleLessonClick(lesson)}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </CardContent>
                              </CollapsibleContent>
                            </Collapsible>
                          </Card>)}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>)}
        </TabsContent>

        <TabsContent value="videos" className="space-y-4 mt-6">
          {/* Info Cards from Database */}
          {!cardsLoading && cards.length > 0 && (
            <div className="space-y-4">
              {cards.map((card) => (
                <VideoInfoCard
                  key={card.id}
                  title={card.title}
                  description={card.description}
                  canEdit={false}
                />
              ))}
            </div>
          )}
          
          {filteredVideos.length === 0 ? <Card className="text-center p-8">
              <div className="space-y-4">
                <Video className="w-16 h-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">لا توجد فيديوهات</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? `لم يتم العثور على فيديوهات تطابق البحث "${searchQuery}"` : 'لا توجد فيديوهات متاحة حالياً'}
                </p>
              </div>
            </Card> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredVideos.map(video => <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gradient-to-r from-red-500 to-pink-500 relative overflow-hidden cursor-pointer group" onClick={async () => {
                    setSelectedVideo(video);
                    // تسجيل إكمال الفيديو فوراً
                    try {
                      await updateProgress(video.id, 'video', 100, 0, 10);
                      await logActivity('video_watch', video.id, 0, 10);
                    } catch (error) {
                      console.error('Error tracking video view:', error);
                    }
                  }}>
                    {video.thumbnail_url ? <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" onError={e => {
                e.currentTarget.style.display = 'none';
              }} /> : null}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {video.duration && <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-black/60 text-white">
                          <Clock className="w-3 h-3 ml-1" />
                          {video.duration}
                        </Badge>
                      </div>}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                    {video.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {video.description}
                      </p>}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {video.category}
                      </Badge>
                      <Button size="sm" onClick={async () => {
                        setSelectedVideo(video);
                        // تسجيل إكمال الفيديو فوراً
                        try {
                          await updateProgress(video.id, 'video', 100, 0, 10);
                          await logActivity('video_watch', video.id, 0, 10);
                        } catch (error) {
                          console.error('Error tracking video view:', error);
                        }
                      }} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
                        <PlayCircle className="w-4 h-4 ml-1" />
                        مشاهدة
                      </Button>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}
        </TabsContent>
      </Tabs>

      {/* Lesson Viewer Dialog */}
      {selectedLesson && <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
          <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-background/95 backdrop-blur-sm border-2" aria-describedby="lesson-content-description">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-4 text-2xl font-bold text-foreground">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold leading-tight">{selectedLesson.title}</h2>
                  <p className="text-base text-muted-foreground font-normal mt-1">
                    درس تفاعلي - الصف الحادي عشر
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div id="lesson-content-description" className="mt-6 px-2">
              <Grade11LessonContentDisplay lesson={selectedLesson} hideTitle={true} />
            </div>
          </DialogContent>
        </Dialog>}

      {/* Video Viewer Dialog */}
      {selectedVideo && <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-background/95 backdrop-blur-sm border-2" aria-describedby="video-content-description">
            <DialogHeader className="pb-6 border-b border-border/50">
              <DialogTitle className="flex items-center gap-4 text-2xl font-bold text-foreground">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold leading-tight">{selectedVideo.title}</h2>
                  <p className="text-base text-muted-foreground font-normal mt-1">
                    فيديو تعليمي - الصف الحادي عشر
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div id="video-content-description" className="mt-6 px-2">
              <Grade11VideoViewer video={selectedVideo} onClose={() => setSelectedVideo(null)} />
            </div>
          </DialogContent>
        </Dialog>}
    </div>;
};