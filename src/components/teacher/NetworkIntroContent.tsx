import React from 'react';
import { useGrade10Files } from '@/hooks/useGrade10Files';
import DirectVideoViewer from './DirectVideoViewer';

const NetworkIntroContent: React.FC = () => {
  const { videos, loading } = useGrade10Files();
  
  // Filter videos to show network-related content from educational_explanations category
  const networkIntroVideos = videos.filter(video => {
    const isEducational = video.video_category === 'educational_explanations';
    const isNetworkRelated = video.title?.toLowerCase().includes('شبك') ||
                           video.title?.toLowerCase().includes('dns') ||
                           video.title?.toLowerCase().includes('wifi') ||
                           video.title?.toLowerCase().includes('ftp') ||
                           video.title?.toLowerCase().includes('http') ||
                           video.title?.toLowerCase().includes('خادم') ||
                           video.title?.toLowerCase().includes('server');
    
    return isEducational && isNetworkRelated;
  });

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