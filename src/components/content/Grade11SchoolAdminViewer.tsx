import React, { useState, useMemo } from 'react';
import { Search, Filter, Grid3X3, List, BookOpen, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGrade11Content, Grade11TopicWithLessons } from '@/hooks/useGrade11Content';
import Grade11TopicCard from './Grade11TopicCard';
import Grade11TopicModal from './Grade11TopicModal';

const Grade11SchoolAdminViewer: React.FC = () => {
  const { sections, loading } = useGrade11Content();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTopic, setSelectedTopic] = useState<Grade11TopicWithLessons | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Flatten all topics from all sections
  const allTopics = useMemo(() => {
    return sections.flatMap(section => 
      section.topics.map(topic => ({
        ...topic,
        sectionTitle: section.title,
        sectionId: section.id
      }))
    );
  }, [sections]);

  // Filter topics based on search and section
  const filteredTopics = useMemo(() => {
    return allTopics.filter(topic => {
      const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (topic.content && topic.content.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSection = selectedSection === 'all' || topic.sectionId === selectedSection;
      return matchesSearch && matchesSection;
    });
  }, [allTopics, searchTerm, selectedSection]);

  const handleViewTopic = (topic: Grade11TopicWithLessons) => {
    setSelectedTopic(topic);
    setIsModalOpen(true);
  };

  const totalLessons = allTopics.reduce((sum, topic) => sum + topic.lessons.length, 0);
  const totalMedia = allTopics.reduce((sum, topic) => 
    sum + topic.lessons.reduce((lessonSum, lesson) => lessonSum + (lesson.media?.length || 0), 0), 0
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading header */}
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        
        {/* Loading filters */}
        <div className="flex gap-4 justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Loading grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-6 py-3 rounded-full">
          <BookOpen className="h-6 w-6" />
          <span className="font-semibold">محتوى الصف الحادي عشر</span>
        </div>
        
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            {sections.length} قسم
          </Badge>
          <Badge variant="secondary" className="bg-green-50 text-green-700">
            {allTopics.length} موضوع
          </Badge>
          <Badge variant="secondary" className="bg-purple-50 text-purple-700">
            {totalLessons} درس
          </Badge>
          {totalMedia > 0 && (
            <Badge variant="secondary" className="bg-orange-50 text-orange-700">
              {totalMedia} وسائط
            </Badge>
          )}
        </div>
      </div>

      {/* Filters and Controls */}
      <Card className="bg-gradient-to-r from-background to-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 items-center w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في المواضيع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              {/* Section Filter */}
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Display */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || selectedSection !== 'all' ? 'لا توجد نتائج' : 'لا يوجد محتوى متاح'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedSection !== 'all' 
              ? 'جرب تغيير مصطلحات البحث أو الفلتر'
              : 'لم يتم إضافة أي محتوى للصف الحادي عشر حتى الآن'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              عرض {filteredTopics.length} من {allTopics.length} موضوع
            </p>
          </div>

          {/* Topics Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTopics.map((topic, index) => (
                <div key={topic.id} onClick={() => handleViewTopic(topic)}>
                  <Grade11TopicCard 
                    topic={topic} 
                    onViewDetails={handleViewTopic}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTopics.map((topic) => (
                <Card key={topic.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewTopic(topic)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{topic.title}</CardTitle>
                        <CardDescription className="mt-1">
                          من قسم: {(topic as any).sectionTitle}
                        </CardDescription>
                        {topic.content && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {topic.content}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-blue-600 font-medium">{topic.lessons.length} درس</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-purple-600 font-medium">
                        {topic.lessons.reduce((sum, lesson) => sum + (lesson.media?.length || 0), 0)} وسائط
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Topic Details Modal */}
      <Grade11TopicModal
        topic={selectedTopic}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTopic(null);
        }}
      />
    </div>
  );
};

export default Grade11SchoolAdminViewer;