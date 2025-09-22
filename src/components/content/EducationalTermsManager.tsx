import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SmartTermExtractor } from './SmartTermExtractor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useGrade11EducationalTerms, EducationalTerm } from '@/hooks/useGrade11EducationalTerms';
import { useGrade11Content } from '@/hooks/useGrade11Content';
import { Loader2, Search, CheckCircle, XCircle, Sparkles, GamepadIcon } from 'lucide-react';
import { toast } from 'sonner';

interface EducationalTermsManagerProps {
  onGameGenerated?: (gameId: string) => void;
}

export const EducationalTermsManager: React.FC<EducationalTermsManagerProps> = ({
  onGameGenerated
}) => {
  const {
    terms,
    loading,
    extracting,
    fetchTerms,
    extractTermsFromContent,
    generateMatchingGameFromTerms,
    approveTerms,
    deleteTerms,
    getTermsForSection
  } = useGrade11EducationalTerms();

  const { sections } = useGrade11Content();
  
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [filterApproved, setFilterApproved] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [gameTitle, setGameTitle] = useState('');
  const [generatingGame, setGeneratingGame] = useState(false);

  // تنقيح المصطلحات بناءً على الفلاتر
  const filteredTerms = terms.filter(term => {
    if (filterApproved !== 'all' && term.is_approved !== (filterApproved === 'true')) return false;
    if (filterDifficulty !== 'all' && term.difficulty_level !== filterDifficulty) return false;
    if (filterType !== 'all' && term.term_type !== filterType) return false;
    if (searchTerm && !term.term_text.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !term.definition.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // استخراج المصطلحات من قسم معين
  const handleExtractFromSection = async () => {
    if (!selectedSection) {
      toast.error('يرجى اختيار قسم أولاً');
      return;
    }

    try {
      const result = await extractTermsFromContent(undefined, selectedSection);
      toast.success(`تم استخراج ${result.success_count} مصطلح من ${result.total_processed} درس`);
    } catch (error) {
      toast.error('حدث خطأ في استخراج المصطلحات');
    }
  };

  // إنشاء لعبة من المصطلحات المحددة
  const handleGenerateGame = async () => {
    if (!selectedSection) {
      toast.error('يرجى اختيار قسم أولاً');
      return;
    }

    if (!gameTitle.trim()) {
      toast.error('يرجى إدخال عنوان اللعبة');
      return;
    }

    setGeneratingGame(true);
    try {
      const sectionData = sections.find(s => s.id === selectedSection);
      const finalGameTitle = gameTitle || `مطابقة مصطلحات ${sectionData?.title}`;

      const gameData = await generateMatchingGameFromTerms(
        selectedSection,
        finalGameTitle,
        {
          difficulty: filterDifficulty === 'all' ? ['easy', 'medium'] : [filterDifficulty],
          max_terms: 8,
          term_types: filterType === 'all' ? undefined : [filterType]
        }
      );

      setGameTitle('');
      toast.success('تم إنشاء اللعبة بنجاح!');
      
      if (onGameGenerated) {
        onGameGenerated(gameData.id);
      }
    } catch (error) {
      toast.error('حدث خطأ في إنشاء اللعبة');
    } finally {
      setGeneratingGame(false);
    }
  };

  // الموافقة على المصطلحات المحددة
  const handleApproveSelected = async () => {
    if (selectedTerms.length === 0) {
      toast.error('يرجى اختيار مصطلحات للموافقة عليها');
      return;
    }

    await approveTerms(selectedTerms);
    setSelectedTerms([]);
  };

  // حذف المصطلحات المحددة
  const handleDeleteSelected = async () => {
    if (selectedTerms.length === 0) {
      toast.error('يرجى اختيار مصطلحات للحذف');
      return;
    }

    if (confirm(`هل أنت متأكد من حذف ${selectedTerms.length} مصطلح؟`)) {
      await deleteTerms(selectedTerms);
      setSelectedTerms([]);
    }
  };

  // تحديد/إلغاء تحديد المصطلح
  const toggleTermSelection = (termId: string) => {
    setSelectedTerms(prev => 
      prev.includes(termId) 
        ? prev.filter(id => id !== termId)
        : [...prev, termId]
    );
  };

  // تحديد الكل
  const selectAllTerms = () => {
    setSelectedTerms(filteredTerms.map(term => term.id));
  };

  // إلغاء تحديد الكل
  const deselectAllTerms = () => {
    setSelectedTerms([]);
  };

  // تحديث الفلاتر عند تغيير القسم
  useEffect(() => {
    if (selectedSection) {
      fetchTerms(selectedSection);
    }
  }, [selectedSection]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'hard': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'device': return 'bg-blue-100 text-blue-800';
      case 'protocol': return 'bg-purple-100 text-purple-800';
      case 'technology': return 'bg-green-100 text-green-800';
      case 'concept': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            إدارة المصطلحات التعليمية
          </CardTitle>
          <CardDescription>
            استخراج وإدارة المصطلحات التعليمية من المحتوى وإنشاء ألعاب مطابقة تفاعلية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="extract" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="extract">استخراج المصطلحات</TabsTrigger>
              <TabsTrigger value="manage">إدارة المصطلحات</TabsTrigger>
              <TabsTrigger value="generate">إنشاء الألعاب</TabsTrigger>
            </TabsList>

            {/* استخراج المصطلحات */}
            <TabsContent value="extract" className="space-y-4">
              <SmartTermExtractor onExtractionComplete={() => fetchTerms()} />
            </TabsContent>

            {/* إدارة المصطلحات */}
            <TabsContent value="manage" className="space-y-4">
              {/* الفلاتر والبحث */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Input
                    placeholder="البحث في المصطلحات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterApproved} onValueChange={setFilterApproved}>
                  <SelectTrigger>
                    <SelectValue placeholder="حالة الموافقة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المصطلحات</SelectItem>
                    <SelectItem value="true">معتمدة</SelectItem>
                    <SelectItem value="false">غير معتمدة</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="مستوى الصعوبة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستويات</SelectItem>
                    <SelectItem value="easy">سهل</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="hard">صعب</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع المصطلح" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="concept">مفهوم</SelectItem>
                    <SelectItem value="device">جهاز</SelectItem>
                    <SelectItem value="protocol">بروتوكول</SelectItem>
                    <SelectItem value="technology">تقنية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* أزرار التحكم */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllTerms}
                  disabled={filteredTerms.length === 0}
                >
                  تحديد الكل ({filteredTerms.length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={deselectAllTerms}
                  disabled={selectedTerms.length === 0}
                >
                  إلغاء التحديد
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleApproveSelected}
                  disabled={selectedTerms.length === 0}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  موافقة ({selectedTerms.length})
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteSelected}
                  disabled={selectedTerms.length === 0}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  حذف ({selectedTerms.length})
                </Button>
              </div>

              {/* قائمة المصطلحات */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    جاري التحميل...
                  </div>
                ) : filteredTerms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد مصطلحات متاحة
                  </div>
                ) : (
                  filteredTerms.map((term) => (
                    <Card key={term.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedTerms.includes(term.id)}
                          onCheckedChange={() => toggleTermSelection(term.id)}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium">{term.term_text}</h4>
                            <Badge className={getDifficultyColor(term.difficulty_level)}>
                              {term.difficulty_level}
                            </Badge>
                            <Badge className={getTypeColor(term.term_type)}>
                              {term.term_type}
                            </Badge>
                            {term.is_approved ? (
                              <Badge variant="default">معتمد</Badge>
                            ) : (
                              <Badge variant="secondary">في الانتظار</Badge>
                            )}
                            <div className="text-xs text-muted-foreground">
                              أهمية: {term.importance_level}/5
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{term.definition}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* إنشاء الألعاب */}
            <TabsContent value="generate" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">اختر القسم</label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القسم التعليمي" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">عنوان اللعبة</label>
                  <Input
                    placeholder="أدخل عنوان اللعبة..."
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">مستوى الصعوبة</label>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مستوى الصعوبة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">سهل</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="hard">صعب</SelectItem>
                      <SelectItem value="all">مختلط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">نوع المصطلحات</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المصطلحات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      <SelectItem value="concept">مفاهيم</SelectItem>
                      <SelectItem value="device">أجهزة</SelectItem>
                      <SelectItem value="protocol">بروتوكولات</SelectItem>
                      <SelectItem value="technology">تقنيات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGenerateGame}
                disabled={generatingGame || !selectedSection}
                className="w-full"
                size="lg"
              >
                {generatingGame ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري إنشاء اللعبة...
                  </>
                ) : (
                  <>
                    <GamepadIcon className="mr-2 h-4 w-4" />
                    إنشاء لعبة مطابقة تفاعلية
                  </>
                )}
              </Button>

              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <strong>ملاحظة:</strong> سيتم إنشاء لعبة مطابقة تفاعلية باستخدام المصطلحات المعتمدة من القسم المحدد.
                اللعبة ستتضمن مطابقة المصطلحات مع تعريفاتها وستكون مناسبة لمستوى الصف الحادي عشر.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};