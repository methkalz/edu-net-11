import React, { useState, useMemo } from 'react';
import { Plus, BookOpen, FileText, Video, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGrade11Content, Grade11SectionWithTopics, Grade11TopicWithLessons, Grade11LessonWithMedia, Grade11Section, Grade11Topic, Grade11Lesson } from '@/hooks/useGrade11Content';
import { useGrade11Files } from '@/hooks/useGrade11Files';
import { useAuth } from '@/hooks/useAuth';
import Grade11SectionForm from './Grade11SectionForm';
import Grade11TopicForm from './Grade11TopicForm';
import Grade11LessonForm from './Grade11LessonForm';
import Grade11DocumentForm from './Grade11DocumentForm';
import Grade11VideoForm from './Grade11VideoForm';
import Grade11FileLibrary from './Grade11FileLibrary';
import Grade11VideoLibrary from './Grade11VideoLibrary';
import Grade11CollapsibleSection from './Grade11CollapsibleSection';
import Grade11ContentControls from './Grade11ContentControls';
import QuestionBankManager from './QuestionBankManager';
import ExamTemplateManager from './ExamTemplateManager';
import GameLauncher from './GameLauncher';
import KnowledgeAdventureRealContent from '../games/KnowledgeAdventureRealContent';
import { logger } from '@/lib/logger';

const Grade11Content = () => {
  const { userProfile } = useAuth();
  const { 
    sections, 
    loading, 
    addSection, 
    updateSection, 
    deleteSection, 
    addTopic, 
    updateTopic, 
    deleteTopic,
    addLesson,
    updateLesson,
    deleteLesson,
    addLessonMedia,
    deleteLessonMedia,
    updateLessonMedia,
    reorderSections,
    reorderTopics,
    reorderLessons
  } = useGrade11Content();

  // تحديد الصلاحيات
  const canManageContent = userProfile?.role === 'superadmin';

  const { 
    documents, 
    videos, 
    loading: filesLoading, 
    addDocument, 
    addDocuments,
    addVideo,
    updateDocument,
    updateVideo,
    deleteDocument, 
    deleteVideo,
    uploadFile,
    getFileUrl
  } = useGrade11Files();

  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Grade11Section | undefined>();
  const [editingTopic, setEditingTopic] = useState<Grade11Topic | undefined>();
  const [editingLesson, setEditingLesson] = useState<Grade11Lesson | undefined>();
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [showGameFullscreen, setShowGameFullscreen] = useState(false);
  
  // New state for enhanced UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sections' | 'topics' | 'lessons' | 'lessons-with-media'>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Drag and drop states
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);

  // Drag and drop handlers for sections
  const handleSectionDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSectionIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSectionDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSectionIndex === null || draggedSectionIndex === targetIndex) {
      setDraggedSectionIndex(null);
      return;
    }

    const newSections = [...filteredSections];
    const draggedItem = newSections[draggedSectionIndex];
    newSections.splice(draggedSectionIndex, 1);
    newSections.splice(targetIndex, 0, draggedItem);

    setDraggedSectionIndex(null);
    reorderSections(newSections);
  };

  // Section handlers
  const handleEditSection = (section: Grade11Section) => {
    setEditingSection(section);
    setShowSectionForm(true);
  };

  const handleCloseForm = () => {
    setShowSectionForm(false);
    setShowTopicForm(false);
    setShowLessonForm(false);
    setShowDocumentForm(false);
    setShowVideoForm(false);
    setEditingSection(undefined);
    setEditingTopic(undefined);
    setEditingLesson(undefined);
    setEditingDocument(null);
    setEditingVideo(null);
    setSelectedSectionId('');
    setSelectedTopicId('');
  };

  const handleSaveSection = async (sectionData: Omit<Grade11Section, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingSection) {
        await updateSection(editingSection.id, sectionData);
      } else {
        await addSection(sectionData);
      }
      handleCloseForm();
    } catch (error) {
      logger.error('Error saving section', error as Error);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع المواضيع والدروس المرتبطة به.')) {
      try {
        await deleteSection(id);
      } catch (error) {
        logger.error('Error deleting section', error as Error);
      }
    }
  };

  // Topic handlers
  const handleAddTopic = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setEditingTopic(undefined);
    setShowTopicForm(true);
  };

  const handleEditTopic = (topic: Grade11Topic) => {
    setEditingTopic(topic);
    setSelectedSectionId(topic.section_id);
    setShowTopicForm(true);
  };

  const handleSaveTopic = async (topicData: Omit<Grade11Topic, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingTopic) {
        await updateTopic(editingTopic.id, topicData);
      } else {
        await addTopic(topicData);
      }
      handleCloseForm();
    } catch (error) {
      logger.error('Error saving topic', error as Error);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموضوع؟ سيتم حذف جميع الدروس المرتبطة به.')) {
      try {
        await deleteTopic(id);
      } catch (error) {
        logger.error('Error deleting topic', error as Error);
      }
    }
  };

  // Lesson handlers
  const handleAddLesson = (topicId: string) => {
    setSelectedTopicId(topicId);
    setEditingLesson(undefined);
    setShowLessonForm(true);
  };

  const handleEditLesson = (lesson: Grade11Lesson) => {
    setEditingLesson(lesson);
    setSelectedTopicId(lesson.topic_id);
    setShowLessonForm(true);
  };

  const handleSaveLesson = async (lessonData: Omit<Grade11Lesson, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingLesson) {
        await updateLesson(editingLesson.id, lessonData);
      } else {
        await addLesson(lessonData);
      }
      handleCloseForm();
    } catch (error) {
      logger.error('Error saving lesson', error as Error);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
      try {
        await deleteLesson(id);
      } catch (error) {
        logger.error('Error deleting lesson', error as Error);
      }
    }
  };

  // Enhanced UI handlers
  const handleExpandAll = () => {
    const allSectionIds = sections.map(section => section.id);
    setExpandedSections(new Set(allSectionIds));
  };

  const handleCollapseAll = () => {
    setExpandedSections(new Set());
  };

  // Filtered sections based on search and filter
  const filteredSections = useMemo(() => {
    let filtered = sections;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(section => 
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.topics.some(topic => 
          topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          topic.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          topic.lessons?.some(lesson => 
            lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lesson.content?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      );
    }

    // Apply filter type
    if (filterType === 'lessons-with-media') {
      filtered = filtered.map(section => ({
        ...section,
        topics: section.topics.map(topic => ({
          ...topic,
          lessons: topic.lessons?.filter(lesson => 
            lesson.media && lesson.media.length > 0
          ) || []
        })).filter(topic => topic.lessons.length > 0)
      })).filter(section => section.topics.length > 0);
    }

    return filtered;
  }, [sections, searchTerm, filterType]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const sectionsCount = filteredSections.length;
    const topicsCount = filteredSections.reduce((acc, section) => acc + section.topics.length, 0);
    const lessonsCount = filteredSections.reduce((acc, section) => 
      acc + section.topics.reduce((topicAcc, topic) => topicAcc + (topic.lessons?.length || 0), 0), 0
    );

    return { sectionsCount, topicsCount, lessonsCount };
  }, [filteredSections]);

  // File management handlers
  const handleAddDocument = () => {
    setEditingDocument(null);
    setShowDocumentForm(true);
  };

  const handleEditDocument = (document: any) => {
    setEditingDocument(document);
    setShowDocumentForm(true);
  };

  const handleSaveDocument = async (documentData: any) => {
    if (editingDocument) {
      await updateDocument(editingDocument.id, documentData);
    } else {
      await addDocument(documentData);
    }
    handleCloseForm();
  };

  const handleAddVideo = () => {
    setEditingVideo(null);
    setShowVideoForm(true);
  };

  const handleEditVideo = (video: any) => {
    setEditingVideo(video);
    setShowVideoForm(true);
  };

  const handleSaveVideo = async (videoData: any) => {
    if (editingVideo) {
      await updateVideo(editingVideo.id, videoData);
    } else {
      await addVideo(videoData);
    }
    handleCloseForm();
  };

  if (loading || filesLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[100px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">محتوى الصف الحادي عشر</h2>
          <p className="text-muted-foreground mt-2">إدارة جميع أنواع المحتوى للصف الحادي عشر</p>
        </div>
      </div>

      <Tabs defaultValue="textual" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="textual" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            المضامين النصية
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            مكتبة الملفات
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            الفيديوهات التعليمية
          </TabsTrigger>
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            الاختبارات الإلكترونية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="textual" className="space-y-6">
          <Grade11ContentControls
            sectionsCount={statistics.sectionsCount}
            topicsCount={statistics.topicsCount}
            lessonsCount={statistics.lessonsCount}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddSection={() => setShowSectionForm(true)}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
            filterType={filterType}
            onFilterChange={setFilterType}
          />

          <div className="space-y-4">
            {filteredSections.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl border-2 border-dashed border-muted-foreground/20">
                <BookOpen className="h-20 w-20 mx-auto mb-6 text-muted-foreground/50" />
                <h3 className="text-2xl font-bold mb-3 text-card-foreground">
                  {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد أقسام حتى الآن'}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                  {searchTerm 
                    ? `لم يتم العثور على أي محتوى يحتوي على "${searchTerm}". جرب مصطلحات بحث أخرى.`
                    : 'ابدأ بإضافة قسم جديد لتنظيم المحتوى التعليمي للصف الحادي عشر'
                  }
                </p>
                {!searchTerm && (
                  <button 
                    onClick={() => setShowSectionForm(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Plus className="h-5 w-5" />
                    إضافة القسم الأول
                  </button>
                )}
              </div>
            ) : (
              filteredSections.map((section, index) => (
                <Grade11CollapsibleSection
                  key={section.id}
                  section={section}
                  index={index}
                  isDragged={draggedSectionIndex === index}
                  onAddTopic={handleAddTopic}
                  onEditSection={handleEditSection}
                  onDeleteSection={handleDeleteSection}
                  onAddLesson={handleAddLesson}
                  onEditTopic={handleEditTopic}
                  onDeleteTopic={handleDeleteTopic}
                  onEditLesson={handleEditLesson}
                  onDeleteLesson={handleDeleteLesson}
                  onReorderTopics={reorderTopics}
                  onReorderLessons={reorderLessons}
                  onDragStart={handleSectionDragStart}
                  onDragOver={handleSectionDragOver}
                  onDrop={handleSectionDrop}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <div className="space-y-4">
            {canManageContent && (
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">مكتبة الملفات</h3>
                  <p className="text-muted-foreground">{documents.length} ملف متاح</p>
                </div>
                <Button onClick={handleAddDocument} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة ملف جديد
                </Button>
              </div>
            )}
            <Grade11FileLibrary
              documents={documents}
              loading={filesLoading}
              onAddDocument={canManageContent ? handleAddDocument : () => {}}
              onEditDocument={canManageContent ? handleEditDocument : () => {}}
              onDeleteDocument={canManageContent ? deleteDocument : () => {}}
              uploadFile={uploadFile}
              addDocuments={addDocuments}
              getFileUrl={getFileUrl}
            />
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          <div className="space-y-4">
            {canManageContent && (
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">مكتبة الفيديوهات</h3>
                  <p className="text-muted-foreground">{videos.length} فيديو متاح</p>
                </div>
                <Button onClick={handleAddVideo} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة فيديو جديد
                </Button>
              </div>
            )}
            <Grade11VideoLibrary
              videos={videos}
              loading={filesLoading}
              onAddVideo={canManageContent ? handleAddVideo : () => {}}
              onEditVideo={canManageContent ? handleEditVideo : () => {}}
              onDeleteVideo={canManageContent ? deleteVideo : () => {}}
            />
          </div>
        </TabsContent>

        <TabsContent value="exams" className="space-y-6">
          <div className="space-y-6">
            <Tabs defaultValue="questions" className="w-full">
              <TabsList>
                <TabsTrigger value="questions">بنك الأسئلة</TabsTrigger>
                <TabsTrigger value="templates">قوالب الاختبارات</TabsTrigger>
              </TabsList>
              
              <TabsContent value="questions">
                <QuestionBankManager />
              </TabsContent>
              
              <TabsContent value="templates">
                <ExamTemplateManager />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

      </Tabs>

      {/* Forms */}
      {showSectionForm && (
        <Grade11SectionForm
          section={editingSection}
          onSave={handleSaveSection}
          onCancel={handleCloseForm}
        />
      )}

      {showTopicForm && (
        <Grade11TopicForm
          topic={editingTopic}
          sectionId={selectedSectionId}
          onSave={handleSaveTopic}
          onCancel={handleCloseForm}
        />
      )}

      {showLessonForm && (
        <Grade11LessonForm
          lesson={editingLesson}
          topicId={selectedTopicId}
          onSave={handleSaveLesson}
          onAddMedia={addLessonMedia}
          onDeleteMedia={deleteLessonMedia}
          onUpdateMedia={updateLessonMedia}
          onCancel={handleCloseForm}
        />
      )}

      {showDocumentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Grade11DocumentForm
            onSave={handleSaveDocument}
            onCancel={handleCloseForm}
            initialData={editingDocument}
          />
        </div>
      )}

      {showVideoForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Grade11VideoForm
            onSave={handleSaveVideo}
            onCancel={handleCloseForm}
            initialData={editingVideo}
          />
        </div>
      )}
    </div>
  );
};

export default Grade11Content;
