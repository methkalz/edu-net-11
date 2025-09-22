import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, Code, FileText, Image, Move3D } from 'lucide-react';

interface MatchingCardProps {
  id: string;
  content: string;
  type: string;
  side: 'left' | 'right';
  isSelected: boolean;
  isMatched: boolean;
  isCorrect?: boolean;
  matchNumber?: number;
  matchColor?: string;
  onClick: (id: string) => void;
  onDragStart?: (id: string, content: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (id: string) => void;
  disabled?: boolean;
  isDragOver?: boolean;
}

export const MatchingCard: React.FC<MatchingCardProps> = ({
  id,
  content,
  type,
  side,
  isSelected,
  isMatched,
  isCorrect,
  matchNumber,
  matchColor,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  disabled = false,
  isDragOver = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const getTypeIcon = () => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'image':
        return 'bg-purple-mystic/10 text-purple-mystic border-purple-mystic/30';
      case 'code':
        return 'bg-cyan-electric/10 text-cyan-electric border-cyan-electric/30';
      default:
        return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  return (
    <Card
      className={cn(
        'relative p-5 cursor-pointer transition-all duration-300 group',
        'border-2 min-h-[140px] flex flex-col justify-center items-center text-center',
        'backdrop-blur-sm bg-gradient-to-br from-card/90 to-card/70',
        {
          // حالة السحب
          'scale-105 rotate-2 shadow-2xl z-20 cursor-grabbing': isDragging,
          
          // حالة التحديد
          'border-primary bg-gradient-to-br from-primary/15 to-primary/5 shadow-lg shadow-primary/25 scale-[1.02]': 
            isSelected && !isMatched && !isDragging,
          
          // حالة المطابقة الصحيحة
          'border-green-500 bg-gradient-to-br from-green-500/15 to-emerald-500/5 shadow-lg shadow-green-500/25': 
            isMatched && isCorrect,
          
          // حالة المطابقة الخاطئة
          'border-red-500 bg-gradient-to-br from-red-500/15 to-red-500/5 shadow-lg shadow-red-500/25': 
            isMatched && isCorrect === false,
          
          // حالة الإفلات
          'border-dashed border-amber-400 bg-gradient-to-br from-amber-400/15 to-yellow-400/5 shadow-lg shadow-amber-400/25 scale-[1.02]': 
            isDragOver && !isMatched,
          
          // حالة عادية
          'border-border/60 bg-gradient-to-br from-card to-muted/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.01]': 
            !isSelected && !isMatched && !isDragOver && !isDragging,
          
          // حالة معطلة
          'opacity-40 grayscale pointer-events-none': disabled,
          
          // قابلية السحب للجانب الأيسر
          'cursor-grab': side === 'left' && !disabled && !isMatched,
          
          // قابلية الإفلات للجانب الأيمن
          'cursor-pointer': side === 'right' && !disabled && !isMatched,
        }
      )}
      draggable={side === 'left' && !disabled && !isMatched}
      onDragStart={(e) => {
        if (side === 'left' && onDragStart) {
          setIsDragging(true);
          onDragStart(id, content);
          e.dataTransfer.effectAllowed = 'move';
        }
      }}
      onDragEnd={() => setIsDragging(false)}
      onDragOver={(e) => {
        if (side === 'right' && !isMatched && onDragOver) {
          e.preventDefault();
          onDragOver(e);
        }
      }}
      onDrop={(e) => {
        if (side === 'right' && onDrop) {
          e.preventDefault();
          onDrop(id);
        }
      }}
      onClick={() => !disabled && !isMatched && !isDragging && onClick(id)}
    >
      {/* أيقونة النوع والسحب */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <Badge variant="outline" className={cn('text-xs shadow-sm', getTypeColor())}>
          {getTypeIcon()}
        </Badge>
        {side === 'left' && !isMatched && !disabled && (
          <Badge variant="outline" className="text-xs bg-muted/80 border-muted-foreground/30">
            <Move3D className="h-3 w-3" />
          </Badge>
        )}
      </div>

      {/* تاغ المطابقة الناجحة مع الرقم واللون */}
      {isMatched && isCorrect && matchNumber && matchColor && (
        <div 
          className="absolute top-3 left-3 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold animate-scale-in shadow-lg border-2 border-white"
          style={{ backgroundColor: matchColor }}
        >
          {matchNumber}
        </div>
      )}
      
      {/* مؤشر منطقة الإفلات */}
      {isDragOver && side === 'right' && !isMatched && (
        <div className="absolute inset-2 border-2 border-dashed border-amber-400 rounded-lg bg-amber-400/10 animate-pulse flex items-center justify-center">
          <div className="text-amber-600 font-medium text-sm">اسحب هنا</div>
        </div>
      )}

      {/* المحتوى */}
      <div className="flex-1 flex items-center justify-center w-full px-2">
        {type === 'image' ? (
          <div className="w-full h-20 bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl flex items-center justify-center border border-muted-foreground/10">
            <Image className="h-10 w-10 text-muted-foreground/70" />
            <span className="text-sm text-muted-foreground mr-2 font-medium">صورة</span>
          </div>
        ) : type === 'code' ? (
          <div className="code-ltr-container w-full">
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/80 rounded-xl p-4 font-mono text-sm border border-cyan-500/20">
              <code className="text-cyan-400 block text-center leading-relaxed">{content}</code>
            </div>
          </div>
        ) : (
          <p className="text-base font-semibold leading-relaxed text-foreground group-hover:text-primary transition-colors px-2 text-center">
            {content}
          </p>
        )}
      </div>

      {/* مؤشر الجانب المحسن */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-1">
        <div 
          className={cn(
            'w-3 h-3 rounded-full shadow-sm border-2 border-white',
            side === 'left' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-orange-500 to-red-500'
          )} 
        />
        <span className={cn(
          'text-xs font-medium px-2 py-1 rounded-full',
          side === 'left' ? 'bg-blue-500/10 text-blue-700' : 'bg-orange-500/10 text-orange-700'
        )}>
          {side === 'left' ? 'اسحب' : 'اسقط'}
        </span>
      </div>

      {/* تأثيرات التحديد المحسنة */}
      {isSelected && !isMatched && !isDragging && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5 rounded-lg pointer-events-none animate-pulse" />
      )}

      {/* تأثيرات النجاح المحسنة */}
      {isMatched && isCorrect && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-lg pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-green-400/10 to-transparent animate-pulse rounded-lg" />
        </div>
      )}
      
      {/* تأثير السحب */}
      {isDragging && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10 rounded-lg pointer-events-none animate-pulse" />
      )}

    </Card>
  );
};