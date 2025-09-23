import React from 'react';
import Grade11VirtualizedViewer from './Grade11VirtualizedViewer';

interface Grade11StudentContentViewerProps {
  onContentClick?: (content: any, contentType: 'lesson') => void;
  onContentComplete?: (contentId: string, contentType: string, timeSpent: number) => void;
}

const Grade11StudentContentViewer: React.FC<Grade11StudentContentViewerProps> = (props) => {
  // Use the new virtualized viewer for better performance
  return <Grade11VirtualizedViewer {...props} />;
};

export default Grade11StudentContentViewer;