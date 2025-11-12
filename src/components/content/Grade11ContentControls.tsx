import React from 'react';
import { ExpandIcon, ShrinkIcon, Search, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Grade11ContentControlsProps {
  sectionsCount: number;
  topicsCount: number;
  lessonsCount: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddSection: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  filterType: 'all' | 'sections' | 'topics' | 'lessons' | 'lessons-with-media';
  onFilterChange: (filter: 'all' | 'sections' | 'topics' | 'lessons' | 'lessons-with-media') => void;
}

const Grade11ContentControls: React.FC<Grade11ContentControlsProps> = ({
  sectionsCount,
  topicsCount,
  lessonsCount,
  searchTerm,
  onSearchChange,
  onAddSection,
  onExpandAll,
  onCollapseAll,
  filterType,
  onFilterChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="flex items-center gap-4 flex-wrap">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {sectionsCount} أقسام
        </Badge>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          {topicsCount} مواضيع
        </Badge>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          {lessonsCount} دروس
        </Badge>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في المحتوى..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Filter - Simple dropdown for now */}
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              value={filterType} 
              onChange={(e) => onFilterChange(e.target.value as 'all' | 'sections' | 'topics' | 'lessons' | 'lessons-with-media')}
              className="bg-transparent border-none outline-none text-sm"
            >
              <option value="all">جميع المحتويات</option>
              <option value="sections">الأقسام فقط</option>
              <option value="topics">المواضيع فقط</option>
              <option value="lessons">الدروس فقط</option>
              <option value="lessons-with-media">الدروس مع الوسائط</option>
            </select>
          </div>

          {/* Expand/Collapse Controls */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExpandAll}
              className="hover:bg-green-50 hover:text-green-600 hover:border-green-200"
            >
              <ExpandIcon className="h-4 w-4 ml-2" />
              توسيع الكل
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCollapseAll}
              className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
            >
              <ShrinkIcon className="h-4 w-4 ml-2" />
              طي الكل
            </Button>
          </div>
        </div>

        {/* Add Section Button */}
        <Button 
          onClick={onAddSection}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة قسم جديد
        </Button>
      </div>
    </div>
  );
};

export default Grade11ContentControls;