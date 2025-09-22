import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FolderOpen, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  Download,
  Trash2,
  Search,
  Plus,
  Eye
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  category: string;
  type: string;
  size: string;
  upload_date: string;
  downloads: number;
  url: string;
}

interface FileLibraryManagerProps {
  onClose: () => void;
}

const FileLibraryManager: React.FC<FileLibraryManagerProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUploading, setIsUploading] = useState(false);

  const categories = [
    { value: 'all', label: 'جميع الفئات' },
    { value: 'references', label: 'مراجع علمية' },
    { value: 'templates', label: 'قوالب بحثية' },
    { value: 'examples', label: 'أمثلة مشاريع' },
    { value: 'tools', label: 'أدوات مساعدة' },
    { value: 'media', label: 'وسائط متعددة' },
    { value: 'documents', label: 'مستندات' }
  ];

  // بيانات وهمية للملفات
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: 'دليل كتابة البحث العلمي.pdf',
      category: 'references',
      type: 'pdf',
      size: '2.5 MB',
      upload_date: '2024-01-15',
      downloads: 45,
      url: '#'
    },
    {
      id: '2',
      name: 'قالب مشروع التخرج.docx',
      category: 'templates',
      type: 'docx',
      size: '1.2 MB',
      upload_date: '2024-01-16',
      downloads: 78,
      url: '#'
    },
    {
      id: '3',
      name: 'مثال مشروع فيزياء.pdf',
      category: 'examples',
      type: 'pdf',
      size: '5.8 MB',
      upload_date: '2024-01-17',
      downloads: 32,
      url: '#'
    },
    {
      id: '4',
      name: 'أدوات البحث الإحصائي.xlsx',
      category: 'tools',
      type: 'xlsx',
      size: '856 KB',
      upload_date: '2024-01-18',
      downloads: 19,
      url: '#'
    }
  ]);

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-5 w-5 text-blue-600" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Video className="h-5 w-5 text-purple-600" />;
      case 'mp3':
      case 'wav':
        return <Music className="h-5 w-5 text-green-600" />;
      case 'zip':
      case 'rar':
        return <Archive className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      references: 'bg-blue-100 text-blue-800',
      templates: 'bg-green-100 text-green-800',
      examples: 'bg-purple-100 text-purple-800',
      tools: 'bg-orange-100 text-orange-800',
      media: 'bg-pink-100 text-pink-800',
      documents: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    if (uploadedFiles.length > 0) {
      setIsUploading(true);
      
      // محاكاة رفع الملفات
      setTimeout(() => {
        const newFiles = uploadedFiles.map(file => ({
          id: Date.now().toString() + Math.random(),
          name: file.name,
          category: 'documents',
          type: file.name.split('.').pop() || 'unknown',
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          upload_date: new Date().toISOString().split('T')[0],
          downloads: 0,
          url: URL.createObjectURL(file)
        }));
        
        setFiles(prev => [...prev, ...newFiles]);
        setIsUploading(false);
      }, 2000);
    }
  };

  const handleDeleteFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            إدارة مكتبة الملفات المساعدة
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="browse" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">تصفح الملفات</TabsTrigger>
            <TabsTrigger value="upload">رفع ملفات جديدة</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* شريط البحث والتصفية */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="البحث في الملفات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="w-48">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* قائمة الملفات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>الملفات المتاحة ({filteredFiles.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        {getFileIcon(file.type)}
                        <div className="flex-1">
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3">
                            <span>الحجم: {file.size}</span>
                            <span>تاريخ الرفع: {file.upload_date}</span>
                            <span>{file.downloads} تحميل</span>
                          </div>
                        </div>
                        <Badge className={getCategoryColor(file.category)}>
                          {categories.find(c => c.value === file.category)?.label}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredFiles.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد ملفات تطابق البحث المحدد
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            {/* رفع ملفات جديدة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  رفع ملفات جديدة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                  <div className="text-center space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <Label htmlFor="library-upload" className="cursor-pointer">
                        <span className="text-lg text-primary hover:underline">
                          اختر الملفات للرفع
                        </span>
                        <br />
                        <span className="text-muted-foreground">أو اسحبها إلى هنا</span>
                      </Label>
                      <Input
                        id="library-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      الأنواع المدعومة: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, MP4, ZIP
                      <br />
                      الحد الأقصى لحجم الملف: 50MB
                    </p>
                  </div>
                </div>

                {isUploading && (
                  <div className="text-center py-4">
                    <div className="text-primary">جاري رفع الملفات...</div>
                  </div>
                )}

                {/* تصنيف الملفات المرفوعة */}
                <div className="space-y-4">
                  <Label>تصنيف الملفات:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.slice(1).map(category => (
                      <Button
                        key={category.value}
                        variant="outline"
                        className="h-auto p-3 justify-start"
                        onClick={() => {
                          // تحديد التصنيف للملفات المرفوعة حديثاً
                        }}
                      >
                        <FolderOpen className="h-4 w-4 ml-2" />
                        {category.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* إحصائيات المكتبة */}
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات المكتبة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{files.length}</div>
                    <div className="text-sm text-muted-foreground">إجمالي الملفات</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {files.reduce((sum, file) => sum + file.downloads, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">إجمالي التحميلات</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {new Set(files.map(f => f.category)).size}
                    </div>
                    <div className="text-sm text-muted-foreground">الفئات المستخدمة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {files.filter(f => f.upload_date === new Date().toISOString().split('T')[0]).length}
                    </div>
                    <div className="text-sm text-muted-foreground">رُفعت اليوم</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* أزرار الإغلاق */}
        <div className="flex gap-3 justify-end">
          <Button onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileLibraryManager;