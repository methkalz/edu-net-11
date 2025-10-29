import React from 'react';
import Grade10VideoViewer from './Grade10VideoViewer';
import { useGrade10Files } from '@/hooks/useGrade10Files';

const Grade10ContentViewer: React.FC = () => {
  const { videos, loading } = useGrade10Files();

  return (
    <div className="w-full">
      <Grade10VideoViewer
        videos={videos}
        loading={loading}
      />
    </div>
  );
};

export default Grade10ContentViewer;