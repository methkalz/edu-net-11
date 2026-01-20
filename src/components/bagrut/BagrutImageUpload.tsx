import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Upload, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BagrutImageUploadProps {
  questionNumber: string;
  description?: string;
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
}

const BagrutImageUpload: React.FC<BagrutImageUploadProps> = ({
  questionNumber,
  description,
  currentImageUrl,
  onImageUploaded
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('الرجاء اختيار ملف صورة فقط');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `q${questionNumber}_${Date.now()}.${fileExt}`;
      const filePath = `manual/${fileName}`;

      const { data, error } = await supabase.storage
        .from('bagrut-exam-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('bagrut-exam-images')
        .getPublicUrl(data.path);

      onImageUploaded(urlData.publicUrl);
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('فشل في رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  // If image exists, show it with replace option
  if (currentImageUrl) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="relative">
          <img 
            src={currentImageUrl} 
            alt={description || `صورة السؤال ${questionNumber}`}
            className="max-w-full h-auto"
          />
          <div className="absolute top-2 left-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <Button 
                variant="secondary" 
                size="sm" 
                className="gap-1 shadow-md"
                disabled={isUploading}
                asChild
              >
                <span>
                  {isUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  استبدال
                </span>
              </Button>
            </label>
          </div>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground p-2 bg-muted/50">
            {description}
          </p>
        )}
      </div>
    );
  }

  // Show upload placeholder
  return (
    <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-muted/20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">صورة مطلوبة للسؤال {questionNumber}</p>
        {description && (
          <p className="text-xs text-muted-foreground text-center max-w-md">
            وصف: {description}
          </p>
        )}
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            disabled={isUploading}
            asChild
          >
            <span>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  رفع صورة
                </>
              )}
            </span>
          </Button>
        </label>
      </div>
    </div>
  );
};

export default BagrutImageUpload;
