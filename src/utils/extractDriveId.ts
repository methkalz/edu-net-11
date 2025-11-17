/**
 * Extracts Google Drive file ID from metadata or URL
 * @param metadata - Media metadata object
 * @param filePath - File path or URL
 * @returns Drive ID string or null
 */
export const extractGoogleDriveId = (
  metadata: any,
  filePath?: string
): string | null => {
  // Try to use existing drive_id from metadata
  let driveId = metadata?.drive_id;
  
  if (!driveId) {
    // Extract from file_path or video_url
    const urlToCheck = filePath || metadata?.video_url || '';
    const driveIdMatch = urlToCheck.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (driveIdMatch) {
      driveId = driveIdMatch[1];
    }
  }
  
  return driveId || null;
};
