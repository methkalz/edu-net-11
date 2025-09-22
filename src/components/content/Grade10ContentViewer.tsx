import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Files, Video } from 'lucide-react';
import Grade10FileLibrary from './Grade10FileLibrary';
import Grade10VideoViewer from './Grade10VideoViewer';
import { useGrade10Files } from '@/hooks/useGrade10Files';

const Grade10ContentViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('files');
  const {
    documents,
    videos,
    loading,
    addDocument,
    addDocuments,
    addVideo,
    updateDocument,
    updateVideo,
    deleteDocument,
    deleteVideo,
    uploadFile,
    getFileUrl
  } = useGrade10Files();

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="files" className="flex items-center gap-2">
            <Files className="h-4 w-4" />
            مكتبة الملفات
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            الفيديوهات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-6">
          <Grade10FileLibrary
            documents={documents}
            loading={loading}
            onAddDocument={addDocument}
            onEditDocument={updateDocument}
            onDeleteDocument={deleteDocument}
            uploadFile={uploadFile}
            addDocuments={addDocuments}
            getFileUrl={getFileUrl}
          />
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
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