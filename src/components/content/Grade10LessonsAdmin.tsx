import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Plus, 
  BookOpen, 
  FileText, 
  Edit, 
  Trash2, 
  ChevronDown,
  Users,
  Calendar
} from 'lucide-react';
import { useGrade10AdminContent, Grade10SectionWithTopics, Grade10TopicWithLessons, Grade10LessonWithMedia } from '@/hooks/useGrade10AdminContent';
import Grade10SectionForm from './Grade10SectionForm';
import Grade10TopicForm from './Grade10TopicForm';
import Grade10LessonForm from './Grade10LessonForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const Grade10LessonsAdmin: React.FC = () => {
  const {
    sections,
    loading,
    saving,
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
    updateLessonMedia,
    deleteLessonMedia
  } = useGrade10AdminContent();

  // Form states
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Grade10SectionWithTopics | null>(null);
  const [editingTopic, setEditingTopic] = useState<Grade10TopicWithLessons | null>(null);
  const [editingLesson, setEditingLesson] = useState<Grade10LessonWithMedia | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const handleAddSection = () => {
    setEditingSection(null);
    setShowSectionForm(true);
  };

  const handleEditSection = (section: Grade10SectionWithTopics) => {
    setEditingSection(section);
    setShowSectionForm(true);
  };

  const handleAddTopic = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setEditingTopic(null);
    setShowTopicForm(true);
  };

  const handleEditTopic = (topic: Grade10TopicWithLessons) => {
    setEditingTopic(topic);
    setSelectedSectionId(topic.section_id);
    setShowTopicForm(true);
  };

  const handleAddLesson = (topicId: string) => {
    setSelectedTopicId(topicId);
    setEditingLesson(null);
    setShowLessonForm(true);
  };

  const handleEditLesson = (lesson: Grade10LessonWithMedia) => {
    setEditingLesson(lesson);
    setSelectedTopicId(lesson.topic_id);
    setShowLessonForm(true);
  };

  const getSectionStats = (section: Grade10SectionWithTopics) => {
    const topicsCount = section.topics.length;
    const lessonsCount = section.topics.reduce((acc, topic) => acc + topic.lessons.length, 0);
    return { topicsCount, lessonsCount };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">إدارة دروس الصف العاشر</h2>
          <p className="text-muted-foreground">
            إدارة الأقسام والمواضيع والدروس للصف العاشر
          </p>
        </div>
        <Button onClick={handleAddSection} disabled={saving}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة قسم جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{sections.length}</p>
                <p className="text-sm text-muted-foreground">الأقسام</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {sections.reduce((acc, section) => acc + section.topics.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">المواضيع</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {sections.reduce((acc, section) => 
                    acc + section.topics.reduce((topicAcc, topic) => topicAcc + topic.lessons.length, 0), 0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">الدروس</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Management */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد أقسام</h3>
            <p className="text-muted-foreground mb-4">
              ابدأ بإضافة قسم جديد لتنظيم المحتوى التعليمي
            </p>
            <Button onClick={handleAddSection}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة قسم جديد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {sections.map((section) => {
            const { topicsCount, lessonsCount } = getSectionStats(section);
            return (
              <AccordionItem key={section.id} value={section.id} className="border rounded-lg">
                <Card>
                  <AccordionTrigger className="hover:no-underline p-0">
                    <CardHeader className="w-full">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <div className="text-right">
                            <CardTitle className="text-lg">{section.title}</CardTitle>
                            {section.description && (
                              <p className="text-sm text-muted-foreground">{section.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{topicsCount} مواضيع</Badge>
                          <Badge variant="secondary">{lessonsCount} دروس</Badge>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSection(section);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>حذف القسم</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من حذف القسم "{section.title}"؟ 
                                    سيتم حذف جميع المواضيع والدروس المرتبطة به.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteSection(section.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-4">
                      {/* Add Topic Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddTopic(section.id)}
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة موضوع جديد
                      </Button>

                      {/* Topics */}
                      {section.topics.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2" />
                          <p>لا توجد مواضيع في هذا القسم</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {section.topics.map((topic) => (
                            <Card key={topic.id} className="ml-6">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                            <div>
                              <CardTitle className="text-base">{topic.title}</CardTitle>
                              {topic.content && (
                                <p className="text-sm text-muted-foreground">{topic.content}</p>
                              )}
                            </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{topic.lessons.length} دروس</Badge>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleEditTopic(topic)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="ghost">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>حذف الموضوع</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            هل أنت متأكد من حذف الموضوع "{topic.title}"؟ 
                                            سيتم حذف جميع الدروس المرتبطة به.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => deleteTopic(topic.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            حذف
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleAddLesson(topic.id)}
                                  className="mb-3"
                                >
                                  <Plus className="h-4 w-4 ml-2" />
                                  إضافة درس جديد
                                </Button>

                                {/* Lessons */}
                                {topic.lessons.length === 0 ? (
                                  <div className="text-center py-4 text-muted-foreground">
                                    <FileText className="h-6 w-6 mx-auto mb-2" />
                                    <p className="text-sm">لا توجد دروس في هذا الموضوع</p>
                                  </div>
                                ) : (
                                  <div className="grid gap-2">
                                    {topic.lessons.map((lesson) => (
                                      <div key={lesson.id} className="flex items-center justify-between p-3 border rounded-lg ml-4">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-primary" />
                                          <div>
                                            <p className="font-medium">{lesson.title}</p>
                                            {lesson.media.length > 0 && (
                                              <Badge variant="secondary" className="text-xs">
                                                {lesson.media.length} وسائط
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button 
                                            size="sm" 
                                            variant="ghost"
                                            onClick={() => handleEditLesson(lesson)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button size="sm" variant="ghost">
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>حذف الدرس</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  هل أنت متأكد من حذف الدرس "{lesson.title}"؟
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() => deleteLesson(lesson.id)}
                                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                  حذف
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Forms */}
      {showSectionForm && (
        <Grade10SectionForm
          section={editingSection}
          onSave={editingSection ? 
            (data) => updateSection(editingSection.id, data) : 
            (data) => addSection({...data, created_by: null})
          }
          onCancel={() => {
            setShowSectionForm(false);
            setEditingSection(null);
          }}
          saving={saving}
        />
      )}

      {showTopicForm && (
        <Grade10TopicForm
          topic={editingTopic}
          sectionId={selectedSectionId}
          onSave={editingTopic ? 
            (data) => updateTopic(editingTopic.id, data) : 
            (data) => addTopic(data)
          }
          onCancel={() => {
            setShowTopicForm(false);
            setEditingTopic(null);
            setSelectedSectionId('');
          }}
          saving={saving}
        />
      )}

      {showLessonForm && (
        <Grade10LessonForm
          lesson={editingLesson}
          lessonMedia={editingLesson?.media || []}
          topicId={selectedTopicId}
          onSave={editingLesson ? 
            (data) => updateLesson(editingLesson.id, data) : 
            (data) => addLesson(data)
          }
          onCancel={() => {
            setShowLessonForm(false);
            setEditingLesson(null);
            setSelectedTopicId('');
          }}
          saving={saving}
          onAddMedia={addLessonMedia}
          onDeleteMedia={deleteLessonMedia}
          onUpdateMedia={updateLessonMedia}
        />
      )}
    </div>
  );
};

export default Grade10LessonsAdmin;