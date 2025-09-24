import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, FolderOpen, Box, BookOpen } from 'lucide-react';
import Grade10VideoLibrary from './Grade10VideoLibrary';
import Grade10MiniProjects from './Grade10MiniProjects';
import Grade10ThreeDModelManager from './Grade10ThreeDModelManager';
import Grade10LessonsAdmin from './Grade10LessonsAdmin';
import { useGrade10Files } from '@/hooks/useGrade10Files';

const Grade10Content: React.FC = () => {
  const [activeTab, setActiveTab] = useState('lessons');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            الدروس التعليمية
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            الفيديوهات
          </TabsTrigger>
          <TabsTrigger value="3d-models" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            النماذج ثلاثية الأبعاد
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            المشاريع المصغرة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="mt-6">
          <Grade10LessonsAdmin />
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          <Grade10VideoLibrary />
        </TabsContent>

        <TabsContent value="3d-models" className="mt-6">
          <Grade10ThreeDModelManager />
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <Grade10MiniProjects />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Grade10Content;