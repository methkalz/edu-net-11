import React, { useState } from 'react';
import { useStudentGrade11Content } from '@/hooks/useStudentGrade11Content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  Search,
  FolderOpen,
  PlayCircle,
  Clock,
  Star,
  FileText,
  BookMarked,
  Target,
  Trophy
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Grade11LessonContentDisplay from '../content/Grade11LessonContentDisplay';

export const StudentGrade11Content: React.FC = () => {
  const { sections, loading, error, getContentStats } = useStudentGrade11Content();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [openTopics, setOpenTopics] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  const stats = getContentStats();

  // Toggle section open/close
  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Toggle topic open/close
  const toggleTopic = (topicId: string) => {
    setOpenTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  // Filter sections based on search
  const filteredSections = sections.filter(section => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(query) ||
      section.description?.toLowerCase().includes(query) ||
      section.topics.some(topic => 
        topic.title.toLowerCase().includes(query) ||
        topic.content?.toLowerCase().includes(query) ||
        topic.lessons.some(lesson => 
          lesson.title.toLowerCase().includes(query) ||
          lesson.content?.toLowerCase().includes(query)
        )
      )
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">محتوى الصف الحادي عشر</h2>
          <p className="text-muted-foreground">جاري تحميل المحتوى التعليمي...</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center p-8">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold">حدث خطأ في تحميل المحتوى</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>
            إعادة المحاولة
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          محتوى الصف الحادي عشر
        </h2>
        <p className="text-muted-foreground">
          استكشف المحتوى التعليمي المنظم في أقسام ومواضيع ودروس
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalSections}</div>
            <div className="text-xs text-muted-foreground">أقسام</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.totalTopics}</div>
            <div className="text-xs text-muted-foreground">مواضيع</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.totalLessons}</div>
            <div className="text-xs text-muted-foreground">دروس</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 bg-orange-100 rounded-full flex items-center justify-center">
              <PlayCircle className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{stats.totalMedia}</div>
            <div className="text-xs text-muted-foreground">وسائط</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="ابحث في المحتوى..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <Button variant="outline" onClick={() => setSearchQuery('')}>
            مسح
          </Button>
        )}
      </div>

      {/* Content Sections */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <Card className="text-center p-8">
            <div className="space-y-4">
              <Search className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">لا توجد نتائج</h3>
              <p className="text-muted-foreground">
                لم يتم العثور على محتوى يطابق البحث "{searchQuery}"
              </p>
            </div>
          </Card>
        ) : (
          filteredSections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <Collapsible 
                open={openSections.includes(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          {section.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {section.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {section.topics.length} موضوع
                        </Badge>
                        {openSections.includes(section.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {section.topics.map((topic) => (
                        <Card key={topic.id} className="ml-4">
                          <Collapsible
                            open={openTopics.includes(topic.id)}
                            onOpenChange={() => toggleTopic(topic.id)}
                          >
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                      <Target className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="text-left">
                                      <h4 className="font-medium">{topic.title}</h4>
                                      {topic.content && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                          {topic.content}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {topic.lessons.length} درس
                                    </Badge>
                                    {openTopics.includes(topic.id) ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                <div className="space-y-2">
                                  {topic.lessons.map((lesson) => (
                                    <div
                                      key={lesson.id}
                                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                      onClick={() => setSelectedLesson(lesson)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                                          <BookOpen className="w-3 h-3 text-white" />
                                        </div>
                                        <div>
                                          <h5 className="text-sm font-medium">{lesson.title}</h5>
                                          {lesson.media && lesson.media.length > 0 && (
                                            <div className="flex items-center gap-1 mt-1">
                                              <PlayCircle className="w-3 h-3 text-muted-foreground" />
                                              <span className="text-xs text-muted-foreground">
                                                {lesson.media.length} ملف وسائط
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <Button variant="ghost" size="sm">
                                        عرض
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>

      {/* Lesson Viewer Dialog */}
      {selectedLesson && (
        <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {selectedLesson.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              <Grade11LessonContentDisplay
                lesson={selectedLesson}
                defaultExpanded={true}
                showControls={true}
                hideHeader={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};