import React from 'react';
import { useGrade10Files } from '@/hooks/useGrade10Files';
import DirectVideoViewer from './DirectVideoViewer';

const NetworkIntroContent: React.FC = () => {
  const { videos, loading } = useGrade10Files();
  
  // Filter videos to only show Network intro category
  const networkIntroVideos = videos.filter(video => 
    video.video_category === 'network_intro'
  );

  return (
    <div className="w-full">
      <DirectVideoViewer
        videos={networkIntroVideos}
        loading={loading}
        title="مقدمة عن الشبكات"
      />
    </div>
  );
};

export default NetworkIntroContent;