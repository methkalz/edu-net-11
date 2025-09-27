import React from 'react';
import { useGrade10Files } from '@/hooks/useGrade10Files';
import DirectVideoViewer from './DirectVideoViewer';

const WindowsBasicsContent: React.FC = () => {
  const { videos, loading } = useGrade10Files();
  
  // Filter videos to only show Windows basics category
  const windowsBasicsVideos = videos.filter(video => 
    video.video_category === 'windows_basics'
  );

  return (
    <div className="w-full">
      <DirectVideoViewer
        videos={windowsBasicsVideos}
        loading={loading}
        title="أساسيات الويندوز"
      />
    </div>
  );
};

export default WindowsBasicsContent;