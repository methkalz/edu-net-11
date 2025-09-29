import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  FileText, 
  Download, 
  Trash2, 
  Eye,
  Edit3,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';
import { FileUploadState, BulkUploadState } from '@/types/forms';
import { DocumentContent, VideoContent } from '@/types/entities';

interface FileManagerProps {
  title?: string;
  acceptedTypes?: Record<string, string[]>;
  maxFileSize?: number;
  multiple?: boolean;
  files: Array<DocumentContent | VideoContent>;
  loading?: boolean;
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit?: (file: DocumentContent | VideoContent) => void;
  onView?: (file: DocumentContent | VideoContent) => void;
  getFileUrl?: (path: string) => string;
  showPreview?: boolean;
  uploadFolder?: string;
}

const FileManager: React.FC<FileManagerProps> = ({
  title = 'إدارة الملفات',
  acceptedTypes = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
    'video/*': ['.mp4', '.webm', '.ogg']
  },
  maxFileSize = 50 * 1024 * 1024, // 50MB
  multiple = true,
  files,
  loading = false,
  onUpload,
  onDelete,
  onEdit,
  onView,
  getFileUrl,
  showPreview = true,
  uploadFolder = 'general'
}) => {
  const [uploadState, setUploadState] = useState<BulkUploadState>({
    files: [],
    totalProgress: 0,
    completed: 0,
    failed: 0,
    processing: false
  });
  
  const [previewFile, setPreviewFile] = useState<DocumentContent | VideoContent | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    logger.info('بدء رفع الملفات', { count: acceptedFiles.length, folder: uploadFolder });
    
    setUploadState({
      files: acceptedFiles.map(file => ({
        file,
        progress: 0,
        status: 'uploading'
      })),
      totalProgress: 0,
      completed: 0,
      failed: 0,
      processing: true
    });
    
    setShowUploadDialog(true);

    try {
      await onUpload(acceptedFiles);
      
      setUploadState(prev => ({
        ...prev,
        completed: acceptedFiles.length,
        totalProgress: 100,
        processing: false
      }));
      
      toast.success(`تم رفع ${acceptedFiles.length} ملف بنجاح`);
      
      // إغلاق النافذة بعد ثانيتين
      setTimeout(() => {
        setShowUploadDialog(false);
      }, 2000);
      
    } catch (error) {
      handleError(error, { context: 'file_upload', folder: uploadFolder });
      
      setUploadState(prev => ({
        ...prev,
        failed: acceptedFiles.length,
        processing: false
      }));
    }
  }, [onUpload, uploadFolder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize: maxFileSize,
    multiple,
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(rejection => {
        const { file, errors } = rejection;
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error(`الملف "${file.name}" كبير جداً. الحد الأقصى ${maxFileSize / 1024 / 1024}MB`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`نوع الملف "${file.name}" غير مدعوم`);
          }
        });
      });
    }
  });

  const getFileIcon = (file: DocumentContent | VideoContent) => {
    const fileType = 'file_type' in file ? file.file_type : 'video/*';
    if (fileType?.startsWith('image/')) return Image;
    if (fileType?.startsWith('video/') || 'video_url' in file) return Video;
    if (fileType?.includes('pdf')) return FileText;
    return File;
  };

  const isDocumentContent = (file: DocumentContent | VideoContent): file is DocumentContent => {
    return 'file_path' in file;
  };

  const getFileTypeForIcon = (file: DocumentContent | VideoContent): string => {
    if (isDocumentContent(file)) {
      return file.file_type;
    }
    return 'video/*';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (id: string, fileName: string) => {
    if (confirm(`هل أنت متأكد من حذف الملف "${fileName}"؟`)) {
      try {
        await onDelete(id);
        toast.success('تم حذف الملف بنجاح');
      } catch (error) {
        handleError(error, { context: 'file_delete', fileId: id });
      }
    }
  };

  const handlePreview = (file: DocumentContent | VideoContent) => {
    if (showPreview) {
      setPreviewFile(file);
    } else if (onView) {
      onView(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium text-primary">اسحب الملفات هنا...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">اسحب الملفات هنا أو اضغط للتصفح</p>
                <p className="text-sm text-muted-foreground">
                  الحد الأقصى: {formatFileSize(maxFileSize)} | الأنواع المدعومة: PDF, DOCX, PPTX, صور، فيديو
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>الملفات ({files.length})</span>
            <Badge variant="secondary">{files.length} ملف</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
                  <div className="w-10 h-10 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد ملفات</p>
              <p className="text-sm mt-1">ابدأ برفع الملفات الأولى</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => {
                const FileIcon = getFileIcon(file);
                return (
                  <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                    <div className="bg-primary/10 p-2 rounded">
                      <FileIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {isDocumentContent(file) && file.file_size && formatFileSize(file.file_size)}
                        {isDocumentContent(file) && file.file_size && ' • '}
                        {new Date(file.created_at).toLocaleDateString('en-GB')}
                      </p>
                      {file.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {file.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handlePreview(file)}
                        title="معاينة"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {getFileUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const url = getFileUrl(isDocumentContent(file) ? file.file_path : file.video_url);
                            window.open(url, '_blank');
                          }}
                          title="تحميل"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onEdit(file)}
                          title="تعديل"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(file.id, file.title)}
                        className="text-destructive hover:text-destructive"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Progress Dialog */}
      {showUploadDialog && (
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                رفع الملفات
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>التقدم الإجمالي</span>
                  <span>{uploadState.totalProgress}%</span>
                </div>
                <Progress value={uploadState.totalProgress} />
              </div>
              
              <div className="space-y-2">
                {uploadState.files.map((fileState, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border rounded">
                    {fileState.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : fileState.status === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    <span className="text-sm flex-1 truncate">
                      {'file' in fileState && fileState.file?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fileState.progress}%
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>مكتمل: {uploadState.completed}</span>
                <span>فاشل: {uploadState.failed}</span>
              </div>
              
              {!uploadState.processing && (
                <div className="flex justify-end">
                  <Button onClick={() => setShowUploadDialog(false)}>
                    إغلاق
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* File Preview Dialog */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{previewFile.title}</span>
                <Button variant="ghost" size="sm" onClick={() => setPreviewFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-auto">
              {isDocumentContent(previewFile) && previewFile.file_type?.startsWith('image/') && getFileUrl ? (
                <img 
                  src={getFileUrl(previewFile.file_path)} 
                  alt={previewFile.title}
                  className="w-full h-auto rounded"
                />
              ) : (!isDocumentContent(previewFile) || previewFile.file_type?.startsWith('video/')) && getFileUrl ? (
                <video 
                  src={getFileUrl(isDocumentContent(previewFile) ? previewFile.file_path : previewFile.video_url)}
                  controls
                  className="w-full h-auto rounded"
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <File className="h-12 w-12 mx-auto mb-4" />
                  <p>لا يمكن معاينة هذا النوع من الملفات</p>
                  <p className="text-sm mt-2">
                    {previewFile.description || 'لا يوجد وصف'}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FileManager;