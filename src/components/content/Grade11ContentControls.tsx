import React from 'react';
import { ExpandIcon, ShrinkIcon, Search, Filter, Plus, BookOpen, FileText, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    <div className="space-y-6">
      {/* Statistics - Enhanced cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sections Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 p-6 transition-all duration-300 hover:shadow-xl hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">الأقسام</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{sectionsCount}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="absolute -bottom-2 -left-2 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
        </div>

        {/* Topics Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200/50 dark:border-amber-800/50 p-6 transition-all duration-300 hover:shadow-xl hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-1">المواضيع</p>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{topicsCount}</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <FileText className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="absolute -bottom-2 -left-2 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
        </div>

        {/* Lessons Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50 p-6 transition-all duration-300 hover:shadow-xl hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">الدروس</p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{lessonsCount}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <GraduationCap className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="absolute -bottom-2 -left-2 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
        </div>
      </div>

      {/* Controls - Enhanced bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
          <Input
            placeholder="ابحث في المحتوى التعليمي..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-12 h-12 rounded-xl border-2 focus:border-primary/50 bg-background/50 backdrop-blur-sm transition-all duration-300"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 px-4 h-12 border-2 rounded-xl bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <select 
            value={filterType} 
            onChange={(e) => onFilterChange(e.target.value as 'all' | 'sections' | 'topics' | 'lessons' | 'lessons-with-media')}
            className="bg-transparent border-none outline-none text-sm font-medium cursor-pointer"
          >
            <option value="all">🎯 جميع المحتويات</option>
            <option value="lessons-with-media">🎬 الدروس مع الوسائط</option>
          </select>
        </div>

        {/* Expand/Collapse Controls */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="lg"
            onClick={onExpandAll}
            className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 dark:hover:bg-emerald-950/50 transition-all duration-300"
          >
            <ExpandIcon className="h-5 w-5 ml-2" />
            توسيع
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={onCollapseAll}
            className="rounded-xl hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 dark:hover:bg-orange-950/50 transition-all duration-300"
          >
            <ShrinkIcon className="h-5 w-5 ml-2" />
            طي
          </Button>
        </div>

        {/* Add Section Button */}
        <Button 
          onClick={onAddSection}
          size="lg"
          className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-bold"
        >
          <Plus className="h-5 w-5 ml-2" />
          إضافة قسم
        </Button>
      </div>
    </div>
  );
};

export default Grade11ContentControls;