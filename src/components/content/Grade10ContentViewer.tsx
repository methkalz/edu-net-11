import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Video } from 'lucide-react';
import Grade10VideoViewer from './Grade10VideoViewer';
import { useGrade10Files } from '@/hooks/useGrade10Files';
import { StudentGrade10Lessons } from '@/components/student/StudentGrade10Lessons';

const Grade10ContentViewer: React.FC = () => {
  const { videos, loading } = useGrade10Files();
  const [activeTab, setActiveTab] = useState('lessons');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            الدروس
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            الفيديوهات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons">
          <StudentGrade10Lessons />
        </TabsContent>

        <TabsContent value="videos">
          <Grade10VideoViewer
            videos={videos}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Grade10ContentViewer;