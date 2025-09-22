import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProfessionalDocumentEditor } from '@/components/editor/ProfessionalDocumentEditor';
import { useProfessionalDocuments } from '@/hooks/useProfessionalDocuments';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ProfessionalDocumentPage: React.FC = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    currentDocument,
    fetchDocument,
    createDocument,
    saveDocument,
    loading
  } = useProfessionalDocuments();
  
  const [isNewDocument, setIsNewDocument] = useState(!documentId);

  useEffect(() => {
    if (documentId && documentId !== 'new') {
      fetchDocument(documentId);
      setIsNewDocument(false);
    } else if (documentId === 'new') {
      setIsNewDocument(true);
    }
  }, [documentId, fetchDocument]);

  const handleCreateDocument = async () => {
    const newDoc = await createDocument('مستند جديد');
    if (newDoc) {
      navigate(`/professional-document/${newDoc.id}`);
      setIsNewDocument(false);
    }
  };

  const handleSave = async (content: any) => {
    if (!currentDocument) {
      if (isNewDocument) {
        await handleCreateDocument();
      }
      return;
    }
    
    const html = JSON.stringify(content);
    const plainText = extractPlainText(content);
    
    await saveDocument(currentDocument.id, content, html, plainText);
  };

  const extractPlainText = (content: any): string => {
    // استخراج النص العادي من محتوى Tiptap
    let text = '';
    
    const traverse = (node: any) => {
      if (node.type === 'text') {
        text += node.text || '';
      } else if (node.content) {
        node.content.forEach(traverse);
      }
      if (node.type === 'paragraph' || node.type === 'heading') {
        text += '\n';
      }
    };
    
    if (content.content) {
      content.content.forEach(traverse);
    }
    
    return text.trim();
  };

  if (loading && !isNewDocument) {
    return <div className="flex items-center justify-center h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 ml-1" />
            رجوع
          </Button>
          <h1 className="text-xl font-bold">
            {isNewDocument ? 'مستند جديد' : currentDocument?.title || 'محرر المستندات الاحترافي'}
          </h1>
        </div>
        
        {isNewDocument && (
          <Button onClick={handleCreateDocument} className="gap-1">
            <Plus className="h-4 w-4" />
            إنشاء مستند
          </Button>
        )}
      </div>

      <div className="flex-1">
        {isNewDocument ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">مرحباً بك في المحرر الاحترافي</h2>
              <p className="text-muted-foreground mb-6">
                ابدأ بإنشاء مستند جديد للكتابة والتحرير الاحترافي
              </p>
              <Button onClick={handleCreateDocument} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                إنشاء مستند جديد
              </Button>
            </div>
          </div>
        ) : (
          <ProfessionalDocumentEditor
            documentId={currentDocument?.id}
            initialContent={currentDocument?.content}
            onSave={handleSave}
            title={currentDocument?.title}
            enableCollaboration={true}
            autoSave={true}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
};

export default ProfessionalDocumentPage;