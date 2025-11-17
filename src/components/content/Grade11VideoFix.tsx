// Helper component to handle Google Drive video rendering with automatic drive_id extraction
import React from 'react';

interface Grade11VideoFixProps {
  media: any;
  metadata: any;
}

export const Grade11VideoFix: React.FC<Grade11VideoFixProps> = ({ media, metadata }) => {
  // Extract drive_id from metadata, file_path, or video_url
  let driveId = metadata.drive_id;
  
  if (!driveId && media.file_path) {
    const pathMatch = media.file_path.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (pathMatch) driveId = pathMatch[1];
  }
  
  if (!driveId && metadata.video_url) {
    const urlMatch = metadata.video_url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) driveId = urlMatch[1];
  }
  
  console.log('🎥 Google Drive Video Debug:', {
    hasMetadata: !!metadata,
    source_type: metadata.source_type,
    metadata_drive_id: metadata.drive_id,
    file_path: media.file_path,
    video_url: metadata.video_url,
    extracted_driveId: driveId
  });
  
  if (!driveId) {
    return (
      <div className="relative aspect-video rounded-lg overflow-hidden bg-red-100 p-4 text-center">
        <p className="text-red-700">فشل استخراج معرف الفيديو من Google Drive</p>
        <p className="text-xs text-red-600 mt-2">file_path: {media.file_path}</p>
      </div>
    );
  }
  
  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
      <iframe
        src={`https://drive.google.com/file/d/${driveId}/preview`}
        title={media.file_name}
        className="w-full h-full"
        frameBorder="0"
        allow="autoplay"
      />
    </div>
  );
};
