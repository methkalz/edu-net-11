import React from 'react';
import { BookOpen, Play, FileText, Calendar, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Grade11TopicWithLessons } from '@/hooks/useGrade11Content';

interface Grade11TopicCardProps {
  topic: Grade11TopicWithLessons;
  onViewDetails: (topic: Grade11TopicWithLessons) => void;
}

const Grade11TopicCard: React.FC<Grade11TopicCardProps> = ({ topic, onViewDetails }) => {
  const totalMedia = topic.lessons.reduce((sum, lesson) => sum + (lesson.media?.length || 0), 0);
  
  const getCardClass = (index: number) => {
    const classes = [
      'stat-videos-bg',
      'stat-progress-bg',
      'stat-achievements-bg',
      'stat-projects-bg',
      'stat-points-bg',
      'glass-surface'
    ];
    return classes[index % classes.length];
  };

  return (
    <Card className={`group hover:scale-105 transition-all duration-300 hover:shadow-xl cursor-pointer ${getCardClass(topic.order_index)} border border-border/40 shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground line-clamp-2 mb-2">
              {topic.title}
            </CardTitle>
            {topic.content && (
              <p className="text-sm text-foreground-secondary line-clamp-3 leading-relaxed">
                {topic.content}
              </p>
            )}
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(topic);
            }}
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:bg-card"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Statistics */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-stat-videos">
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">{topic.lessons.length}</span>
              <span className="text-foreground-secondary">درس</span>
            </div>
            
            {totalMedia > 0 && (
              <div className="flex items-center gap-1 text-stat-achievements">
                <Play className="h-4 w-4" />
                <span className="font-medium">{totalMedia}</span>
                <span className="text-foreground-secondary">وسائط</span>
              </div>
            )}
          </div>

          {/* Date and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-foreground-secondary">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(topic.created_at), 'dd/MM/yyyy')}</span>
            </div>
            
            <Badge 
              variant="secondary" 
              className="glass-surface text-foreground text-xs border border-border/30"
            >
              {topic.lessons.length === 0 ? 'فارغ' : 'متاح'}
            </Badge>
          </div>

          {/* Preview of lessons */}
          {topic.lessons.length > 0 && (
            <div className="pt-2 border-t border-border/30">
              <div className="text-xs text-foreground-secondary">
                <span className="font-medium">آخر درس:</span> {topic.lessons[topic.lessons.length - 1]?.title}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Grade11TopicCard;