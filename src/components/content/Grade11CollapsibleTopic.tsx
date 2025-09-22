import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Lightbulb, Edit2, Trash2, Plus, BookOpen, Clock, GripVertical, Eye } from 'lucide-react';
import Grade11LessonContentDisplay from './Grade11LessonContentDisplay';
import LessonPreviewModal from './LessonPreviewModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Grade11TopicWithLessons, Grade11LessonWithMedia, Grade11Topic, Grade11Lesson } from '@/hooks/useGrade11Content';

interface Grade11CollapsibleTopicProps {
  topic: Grade11TopicWithLessons;
  topicIndex: number;
  isDragged: boolean;
  onAddLesson: (topicId: string) => void;
  onEditTopic: (topic: Grade11Topic) => void;
  onDeleteTopic: (id: string) => void;
  onEditLesson: (lesson: Grade11Lesson) => void;
  onDeleteLesson: (id: string) => void;
  onReorderLessons: (topicId: string, newLessons: Grade11LessonWithMedia[]) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetIndex: number) => void;
}

const Grade11CollapsibleTopic: React.FC<Grade11CollapsibleTopicProps> = ({
  topic,
  topicIndex,
  isDragged,
  onAddLesson,
  onEditTopic,
  onDeleteTopic,
  onEditLesson,
  onDeleteLesson,
  onReorderLessons,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draggedLessonIndex, setDraggedLessonIndex] = useState<number | null>(null);
  const [previewLesson, setPreviewLesson] = useState<Grade11LessonWithMedia | null>(null);

  const lessonsCount = topic.lessons?.length || 0;
  const mediaCount = topic.lessons?.reduce((acc, lesson) => acc + (lesson.media?.length || 0), 0) || 0;

  // Drag and drop handlers for lessons
  const handleLessonDragStart = (e: React.DragEvent, lessonIndex: number) => {
    setDraggedLessonIndex(lessonIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };

  const handleLessonDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.stopPropagation();
  };

  const handleLessonDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedLessonIndex === null || draggedLessonIndex === targetIndex) {
      setDraggedLessonIndex(null);
      return;
    }

    const newLessons = [...(topic.lessons || [])];
    const draggedItem = newLessons[draggedLessonIndex];
    newLessons.splice(draggedLessonIndex, 1);
    newLessons.splice(targetIndex, 0, draggedItem);

    setDraggedLessonIndex(null);
    onReorderLessons(topic.id, newLessons);
  };

  return (
    <div 
      className={`border border-border/60 rounded-lg bg-gradient-to-r from-card to-card/80 shadow-sm hover:shadow-md transition-all duration-200 ${
        isDragged ? 'opacity-50 scale-95' : ''
      } hover:bg-muted/30 border-2 border-dashed border-transparent hover:border-muted`}
      draggable
      onDragStart={(e) => onDragStart(e, topicIndex)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, topicIndex)}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer hover:bg-accent/30 transition-colors duration-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 cursor-move" title="اسحب لإعادة الترتيب" onClick={(e) => e.stopPropagation()}>
                  <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </div>
                <div className="flex items-center gap-2 text-amber-600">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                  )}
                  <Lightbulb className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-card-foreground">{topic.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      موضوع {topicIndex + 1}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      ترتيب {topic.order_index}
                    </Badge>
                  </div>
                  
                  {topic.content && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {topic.content}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      <span>{lessonsCount} دروس</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{mediaCount} ملف وسائط</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onAddLesson(topic.id)}
                  className="hover:bg-green-50 hover:text-green-600"
                >
                  <Plus className="h-3 w-3 ml-1" />
                  درس
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEditTopic(topic)}
                  className="hover:bg-blue-50 hover:text-blue-600"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDeleteTopic(topic.id)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="animate-accordion-down">
          <div className="px-4 pb-4">
            {(!topic.lessons || topic.lessons.length === 0) ? (
              <div className="text-center py-6 bg-gradient-to-br from-muted/10 to-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-3">لا توجد دروس في هذا الموضوع</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onAddLesson(topic.id)}
                  className="hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                >
                  <Plus className="h-3 w-3 ml-2" />
                  إضافة درس جديد
                </Button>
              </div>
            ) : (
              <div className="grid gap-2">
                {topic.lessons.map((lesson, lessonIndex) => (
                  <div 
                    key={lesson.id} 
                    className={`border-l-4 border-l-emerald-400 bg-gradient-to-r from-emerald-50/50 to-transparent p-3 rounded-r-lg hover:from-emerald-50 transition-colors duration-200 ${
                      draggedLessonIndex === lessonIndex ? 'opacity-50 scale-95' : ''
                    } hover:bg-muted/30 border border-dashed border-transparent hover:border-muted cursor-move`}
                    draggable
                    onDragStart={(e) => handleLessonDragStart(e, lessonIndex)}
                    onDragOver={handleLessonDragOver}
                    onDrop={(e) => handleLessonDrop(e, lessonIndex)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="cursor-move" title="اسحب لإعادة الترتيب" onClick={(e) => e.stopPropagation()}>
                          <GripVertical className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                        </div>
                        <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-200">
                          درس {lessonIndex + 1}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          ترتيب {lesson.order_index}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setPreviewLesson(lesson)}
                          className="h-7 w-7 p-0 hover:bg-purple-100 hover:text-purple-600"
                          title="معاينة الدرس"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onEditLesson(lesson)}
                          className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-600"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onDeleteLesson(lesson.id)}
                          className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <Grade11LessonContentDisplay 
                      lesson={lesson}
                      defaultExpanded={false}
                      showControls={true}
                    />
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-2 border-t border-emerald-200">
                      <div className="flex items-center gap-3">
                        <span>{lesson.media?.length || 0} ملف وسائط</span>
                      </div>
                      <span>تم الإنشاء: {new Date(lesson.created_at).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <LessonPreviewModal 
        lesson={previewLesson}
        isOpen={!!previewLesson}
        onClose={() => setPreviewLesson(null)}
      />
    </div>
  );
};

export default Grade11CollapsibleTopic;