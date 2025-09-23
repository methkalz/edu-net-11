import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, FolderOpen } from 'lucide-react';
import Grade10VideoLibrary from './Grade10VideoLibrary';
import Grade10MiniProjects from './Grade10MiniProjects';
import { useGrade10Files } from '@/hooks/useGrade10Files';

const Grade10Content: React.FC = () => {
  const [activeTab, setActiveTab] = useState('videos');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            الفيديوهات
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            المشاريع المصغرة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-6">
          <Grade10VideoLibrary />
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <Grade10MiniProjects />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Grade10Content;