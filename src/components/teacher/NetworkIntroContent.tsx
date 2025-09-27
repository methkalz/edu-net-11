import React from 'react';
import { useGrade10Files } from '@/hooks/useGrade10Files';
import Grade10VideoViewer from '../content/Grade10VideoViewer';

const NetworkIntroContent: React.FC = () => {
  const { videos, loading } = useGrade10Files();
  
  // Filter videos to only show Network intro category
  const networkIntroVideos = videos.filter(video => 
    video.video_category === 'network_intro'
  );

  return (
    <div className="w-full">
      <Grade10VideoViewer
        videos={networkIntroVideos}
        loading={loading}
      />
    </div>
  );
};

export default NetworkIntroContent;