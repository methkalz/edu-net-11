import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PlayCircle, 
  FileText, 
  Search, 
  Filter, 
  Grid3X3,
  List,
  Clock,
  Eye,
  ChevronRight,
  BookMarked,
  Video,
  FileIcon
} from 'lucide-react';
import ContentPreviewModal from './ContentPreviewModal';

interface GradeContent {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'document';
  created_at: string;
  thumbnail_url?: string;
  duration?: string;
  file_type?: string;
  video_url?: string;
  file_path?: string;
  owner_user_id?: string;
}

interface GradeContentViewerProps {
  grade: 'grade10' | 'grade11' | 'grade12';
  gradeLabel: string;
  contents: GradeContent[];
  onViewMore: () => void;
}

const GradeContentViewer: React.FC<GradeContentViewerProps> = ({
  grade,
  gradeLabel,
  contents,
  onViewMore
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'video' | 'document'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedContent, setSelectedContent] = useState<(GradeContent & { grade: string }) | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Filter contents based on search and type
  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (content.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesType = contentTypeFilter === 'all' || content.type === contentTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleContentClick = (content: GradeContent) => {
    setSelectedContent({ ...content, grade });
    setPreviewModalOpen(true);
  };

  const getGradeIcon = () => {
    switch (grade) {
      case 'grade10':
        return <Video className="h-5 w-5 text-blue-600" />;
      case 'grade11':
        return <BookMarked className="h-5 w-5 text-green-600" />;
      case 'grade12':
        return <FileIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <BookMarked className="h-5 w-5" />;
    }
  };

  const getGradeColor = () => {
    switch (grade) {
      case 'grade10':
        return 'border-l-blue-500';
      case 'grade11':
        return 'border-l-green-500';
      case 'grade12':
        return 'border-l-purple-500';
      default:
        return 'border-l-primary';
    }
  };

  if (contents.length === 0) {
    return null;
  }

  return (
    <>
      <Card className={`border-l-4 ${getGradeColor()}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getGradeIcon()}
              مضامين {gradeLabel}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <span>{contents.length}</span>
                <span>عنصر</span>
              </Badge>
              <Button variant="outline" size="sm" onClick={onViewMore}>
                عرض الكل
                <ChevronRight className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
          
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في المضامين..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={contentTypeFilter} onValueChange={(value: any) => setContentTypeFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="نوع المحتوى" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="video">فيديوهات</SelectItem>
                <SelectItem value="document">ملفات</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-l-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredContents.length > 0 ? (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                : "space-y-3"
            }>
              {filteredContents.slice(0, 6).map((content) => (
                <div
                  key={content.id}
                  className={`
                    border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group
                    ${viewMode === 'list' ? 'flex items-center gap-4' : ''}
                  `}
                  onClick={() => handleContentClick(content)}
                >
                  <div className={`flex ${viewMode === 'list' ? 'items-center gap-3 flex-1' : 'items-start gap-3'}`}>
                    {content.type === 'video' ? (
                      <div className="relative">
                        {content.thumbnail_url ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden">
                            <img 
                              src={content.thumbnail_url} 
                              alt={content.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                            <PlayCircle className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {content.title}
                      </h4>
                      {content.description && viewMode === 'grid' && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {content.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {content.type === 'video' ? 'فيديو' : 'ملف'}
                        </Badge>
                        {content.duration && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Clock className="h-3 w-3" />
                            {content.duration}
                          </Badge>
                        )}
                        {content.file_type && (
                          <Badge variant="outline" className="text-xs">
                            {content.file_type.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {viewMode === 'list' && (
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لم يتم العثور على مضامين تطابق البحث</p>
            </div>
          )}

          {filteredContents.length > 6 && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={onViewMore}>
                عرض جميع المضامين ({filteredContents.length})
                <ChevronRight className="h-4 w-4 mr-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ContentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        content={selectedContent}
      />
    </>
  );
};

export default GradeContentViewer;