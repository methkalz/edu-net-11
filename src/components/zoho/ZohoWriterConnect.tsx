import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { useZohoWriter } from '@/hooks/useZohoWriter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ZohoWriterConnect = () => {
  const {
    isConnecting,
    isConnected,
    documents,
    isLoading,
    connectToZoho,
    disconnectFromZoho,
    checkConnection,
    listDocuments,
    createDocument,
    deleteDocument,
  } = useZohoWriter();

  const [newDocName, setNewDocName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (isConnected) {
      listDocuments();
    }
  }, [isConnected, listDocuments]);

  const handleCreateDocument = async () => {
    if (!newDocName.trim()) return;
    
    await createDocument(newDocName);
    setNewDocName('');
    setShowCreateDialog(false);
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Zoho Writer
          </CardTitle>
          <CardDescription>
            اربط حسابك مع Zoho Writer لإنشاء وإدارة المستندات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={connectToZoho}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الاتصال...
              </>
            ) : (
              <>
                <FileText className="ml-2 h-4 w-4" />
                الاتصال بـ Zoho Writer
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Zoho Writer
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                متصل
              </span>
            </CardTitle>
            <CardDescription>
              إدارة المستندات الخاصة بك
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={disconnectFromZoho}
          >
            قطع الاتصال
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">المستندات ({documents.length})</h3>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="ml-2 h-4 w-4" />
                مستند جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء مستند جديد</DialogTitle>
                <DialogDescription>
                  أدخل اسم المستند الجديد
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-name">اسم المستند</Label>
                  <Input
                    id="doc-name"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="مستند بدون عنوان"
                    className="text-right"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleCreateDocument}
                  disabled={!newDocName.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    'إنشاء'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد مستندات بعد</p>
            <p className="text-sm">ابدأ بإنشاء مستند جديد</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.document_id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.document_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.modified_time).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.document_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                      >
                        <a
                          href={doc.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          فتح
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteDocument(doc.document_id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};