import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Edit2, Trash2, Plus, Users, FileText, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Grade11SectionWithTopics, Grade11TopicWithLessons, Grade11LessonWithMedia, Grade11Section, Grade11Topic, Grade11Lesson } from '@/hooks/useGrade11Content';
import Grade11CollapsibleTopic from './Grade11CollapsibleTopic';

interface Grade11CollapsibleSectionProps {
  section: Grade11SectionWithTopics;
  index: number;
  isDragged: boolean;
  onAddTopic: (sectionId: string) => void;
  onEditSection: (section: Grade11Section) => void;
  onDeleteSection: (id: string) => void;
  onAddLesson: (topicId: string) => void;
  onEditTopic: (topic: Grade11Topic) => void;
  onDeleteTopic: (id: string) => void;
  onEditLesson: (lesson: Grade11Lesson) => void;
  onDeleteLesson: (id: string) => void;
  onReorderTopics: (sectionId: string, newTopics: Grade11TopicWithLessons[]) => void;
  onReorderLessons: (topicId: string, newLessons: Grade11LessonWithMedia[]) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetIndex: number) => void;
}

const Grade11CollapsibleSection: React.FC<Grade11CollapsibleSectionProps> = ({
  section,
  index,
  isDragged,
  onAddTopic,
  onEditSection,
  onDeleteSection,
  onAddLesson,
  onEditTopic,
  onDeleteTopic,
  onEditLesson,
  onDeleteLesson,
  onReorderTopics,
  onReorderLessons,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draggedTopicIndex, setDraggedTopicIndex] = useState<number | null>(null);

  const topicsCount = section.topics.length;
  const lessonsCount = section.topics.reduce((acc, topic) => acc + (topic.lessons?.length || 0), 0);

  // Drag and drop handlers for topics
  const handleTopicDragStart = (e: React.DragEvent, topicIndex: number) => {
    setDraggedTopicIndex(topicIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };

  const handleTopicDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.stopPropagation();
  };

  const handleTopicDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedTopicIndex === null || draggedTopicIndex === targetIndex) {
      setDraggedTopicIndex(null);
      return;
    }

    const newTopics = [...section.topics];
    const draggedItem = newTopics[draggedTopicIndex];
    newTopics.splice(draggedTopicIndex, 1);
    newTopics.splice(targetIndex, 0, draggedItem);

    setDraggedTopicIndex(null);
    onReorderTopics(section.id, newTopics);
  };

  return (
    <Card 
      className={`border-l-4 border-l-primary shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${
        isDragged ? 'opacity-50 scale-95' : ''
      } hover:bg-muted/30 border-2 border-dashed border-transparent hover:border-muted`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 cursor-move" title="اسحب لإعادة الترتيب" onClick={(e) => e.stopPropagation()}>
                  <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                </div>
                <div className="flex items-center gap-2 text-primary">
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-5 w-5 transition-transform duration-200" />
                  )}
                  <BookOpen className="h-6 w-6" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-card-foreground flex items-center gap-3">
                    {section.title}
                    <Badge variant="secondary" className="text-xs font-normal">
                      ترتيب {section.order_index}
                    </Badge>
                  </h3>
                  
                  {section.description && (
                    <p className="text-muted-foreground mt-1 text-sm line-clamp-2">
                      {section.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{topicsCount} مواضيع</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span>{lessonsCount} دروس</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onAddTopic(section.id)}
                  className="hover:bg-primary/10 hover:text-primary"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  موضوع
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEditSection(section)}
                  className="hover:bg-blue-50 hover:text-blue-600"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDeleteSection(section.id)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent className="animate-accordion-down">
          <CardContent className="pt-0 pb-6">
            {section.topics.length === 0 ? (
              <div className="text-center py-8 bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg border-2 border-dashed border-muted-foreground/20">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <h4 className="font-medium text-muted-foreground mb-2">لا توجد مواضيع في هذا القسم</h4>
                <p className="text-sm text-muted-foreground/80 mb-4">ابدأ بإضافة موضوع جديد لتنظيم المحتوى</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onAddTopic(section.id)}
                  className="hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة أول موضوع
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {section.topics.map((topic, topicIndex) => (
                  <Grade11CollapsibleTopic
                    key={topic.id}
                    topic={topic}
                    topicIndex={topicIndex}
                    isDragged={draggedTopicIndex === topicIndex}
                    onAddLesson={onAddLesson}
                    onEditTopic={onEditTopic}
                    onDeleteTopic={onDeleteTopic}
                    onEditLesson={onEditLesson}
                    onDeleteLesson={onDeleteLesson}
                    onReorderLessons={onReorderLessons}
                    onDragStart={handleTopicDragStart}
                    onDragOver={handleTopicDragOver}
                    onDrop={handleTopicDrop}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default Grade11CollapsibleSection;