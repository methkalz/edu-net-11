import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useGrade10MiniProjects } from '@/hooks/useGrade10MiniProjects';
import AdvancedProjectEditor from './AdvancedProjectEditor';
import { 
  Save, 
  X, 
  Clock, 
  FileText, 
  Users,
  CheckCircle,
  Calendar,
  Upload,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Grade10MiniProjectEditorProps {
  project: any;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const Grade10MiniProjectEditor: React.FC<Grade10MiniProjectEditorProps> = ({
  project,
  isOpen,
  onClose,
  onSave
}) => {
  const { userProfile } = useAuth();
  const { updateProjectContent, updateProjectStatus } = useGrade10MiniProjects();
  const [content, setContent] = useState(project?.content || '');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save functionality
  useEffect(() => {
    if (!project?.id || content === project?.content) return;

    const autoSaveTimer = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        await updateProjectContent(project.id, content);
        setLastSaved(new Date());
        toast({
          title: "حُفظ تلقائياً",
          description: "تم حفظ المشروع تلقائياً",
          duration: 2000
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }, 600000); // Auto-save after 10 minutes of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [content, project?.id, project?.content, updateProjectContent]);

  const handleSave = async () => {
    if (!project?.id) return;

    try {
      await updateProjectContent(project.id, content);
      setLastSaved(new Date());
      toast({
        title: "تم الحفظ",
        description: "تم حفظ المشروع بنجاح"
      });
      onSave?.();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ المشروع",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !project?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف صورة صالح",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('grade10-documents')
        .upload(`projects/${project.id}/${fileName}`, file);

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('grade10-documents')
        .getPublicUrl(data.path);

      // Insert image into editor
      const imageHTML = `<img src="${publicUrlData.publicUrl}" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="صورة المشروع" />`;
      
      setContent(prev => prev + imageHTML);

      toast({
        title: "تم رفع الصورة",
        description: "تم إدراج الصورة في المشروع بنجاح"
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "خطأ",
        description: "فشل في رفع الصورة",
        variant: "destructive"
      });
    }
  };

  const handlePasteImage = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          // Create a fake input event to reuse the upload logic
          const fakeEvent = {
            target: { files: [file] }
          } as any;
          handleImageUpload(fakeEvent);
        }
        break;
      }
    }
  };

  useEffect(() => {
    document.addEventListener('paste', handlePasteImage);
    return () => document.removeEventListener('paste', handlePasteImage);
  }, [project?.id]);

  const isStudent = userProfile?.role === 'student';
  const canEdit = isStudent && project?.student_id === userProfile?.user_id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'مسودة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'reviewed': return 'تم المراجعة';
      default: return status;
    }
  };

  if (!project) return null;

  return (
    <AdvancedProjectEditor
      project={project}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
    />
  );
};

export default Grade10MiniProjectEditor;