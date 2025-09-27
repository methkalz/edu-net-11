import React from 'react';
import { useGrade10Files } from '@/hooks/useGrade10Files';
import Grade10VideoViewer from '../content/Grade10VideoViewer';

const WindowsBasicsContent: React.FC = () => {
  const { videos, loading } = useGrade10Files();
  
  // Filter videos to only show Windows basics category
  const windowsBasicsVideos = videos.filter(video => 
    video.video_category === 'windows_basics'
  );

  return (
    <div className="w-full">
      <Grade10VideoViewer
        videos={windowsBasicsVideos}
        loading={loading}
      />
    </div>
  );
};

export default WindowsBasicsContent;