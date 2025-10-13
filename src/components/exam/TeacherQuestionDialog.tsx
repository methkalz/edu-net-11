import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, X, FolderPlus, Trash2, Edit2 } from "lucide-react";
import { QuestionType, QuestionDifficulty, QuestionChoice } from "@/types/exam";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface TeacherQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  existingCategories: string[];
}

export const TeacherQuestionDialog = ({
  open,
  onOpenChange,
  onSuccess,
  existingCategories,
}: TeacherQuestionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("question");

  // Categories management state
  const [categoryToEdit, setCategoryToEdit] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Form state
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("multiple_choice");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>("medium");
  const [category, setCategory] = useState("عام");
  const [points, setPoints] = useState(1);
  const [choices, setChoices] = useState<{ text: string }[]>([
    { text: "" },
    { text: "" },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState("");

  const handleAddChoice = () => {
    setChoices([...choices, { text: "" }]);
  };

  const handleRemoveChoice = (index: number) => {
    if (choices.length > 2) {
      setChoices(choices.filter((_, i) => i !== index));
    }
  };

  const handleChoiceChange = (index: number, text: string) => {
    const updated = [...choices];
    updated[index].text = text;
    setChoices(updated);
  };

  const handleCorrectAnswerChange = (value: string) => {
    setCorrectAnswer(value);
  };

  const handleSubmit = async () => {
    // Validation
    if (!questionText.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال نص السؤال",
        variant: "destructive",
      });
      return;
    }

    if (questionType === "multiple_choice") {
      const filledChoices = choices.filter((c) => c.text.trim());
      if (filledChoices.length < 2) {
        toast({
          title: "خطأ",
          description: "يجب إضافة خيارين على الأقل",
          variant: "destructive",
        });
        return;
      }
      if (!correctAnswer) {
        toast({
          title: "خطأ",
          description: "يرجى تحديد الإجابة الصحيحة",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      // الحصول على school_id من المستخدم
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("user_id", user?.id)
        .single();

      if (!profile?.school_id) {
        throw new Error("لم يتم العثور على معلومات المدرسة");
      }

      // تحويل الخيارات إلى JSON مع id لكل خيار
      const formattedChoices = questionType === "multiple_choice" 
        ? choices
            .filter((c) => c.text.trim())
            .map((choice, idx) => ({
              id: `choice_${idx}`,
              text: choice.text.trim(),
            }))
        : [
            { id: "choice_0", text: "صح" },
            { id: "choice_1", text: "خطأ" },
          ];

      const questionData = {
        teacher_id: user?.id,
        school_id: profile.school_id,
        question_text: questionText.trim(),
        question_type: questionType,
        difficulty,
        grade_level: "11", // افتراضي، يمكن تحسينه لاحقاً
        category: category,
        points,
        choices: formattedChoices,
        correct_answer: questionType === "true_false" 
          ? correctAnswer 
          : formattedChoices[parseInt(correctAnswer)]?.id || "",
        tags: [],
        is_active: true,
      };

      const { error } = await supabase
        .from("teacher_custom_questions")
        .insert([questionData]);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة السؤال إلى مجموعة أسئلتك",
      });

      // Reset form
      setQuestionText("");
      setQuestionType("multiple_choice");
      setDifficulty("medium");
      setCategory("عام");
      setPoints(1);
      setChoices([
        { text: "" },
        { text: "" },
      ]);
      setCorrectAnswer("");
      setActiveTab("question");
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة السؤال",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم التصنيف",
        variant: "destructive",
      });
      return;
    }

    if (existingCategories.includes(newCategoryName.trim())) {
      toast({
        title: "خطأ",
        description: "هذا التصنيف موجود بالفعل",
        variant: "destructive",
      });
      return;
    }

    setIsAddingCategory(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      // الحصول على school_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("user_id", user?.id)
        .single();

      if (!profile?.school_id) {
        throw new Error("لم يتم العثور على معلومات المدرسة");
      }

      // إضافة سؤال وهمي بالتصنيف الجديد (سيتم حذفه لاحقاً)
      const { error } = await supabase
        .from("teacher_custom_questions")
        .insert([{
          teacher_id: user?.id,
          school_id: profile.school_id,
          question_text: `[تصنيف] ${newCategoryName.trim()}`,
          question_type: "multiple_choice",
          difficulty: "medium",
          grade_level: "11",
          category: newCategoryName.trim(),
          points: 1,
          choices: [{ id: "1", text: "مؤقت" }],
          correct_answer: "1",
          tags: [],
          is_active: false, // غير نشط لأنه مجرد تصنيف
        }]);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: `تم إضافة التصنيف "${newCategoryName.trim()}"`,
      });

      setNewCategoryName("");
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة التصنيف",
        variant: "destructive",
      });
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (categoryName === "عام") {
      toast({
        title: "تنبيه",
        description: 'لا يمكن حذف التصنيف "عام"',
        variant: "destructive",
      });
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      // حذف جميع الأسئلة غير النشطة في هذا التصنيف
      const { error } = await supabase
        .from("teacher_custom_questions")
        .delete()
        .eq("teacher_id", user?.id)
        .eq("category", categoryName)
        .eq("is_active", false);

      if (error) throw error;

      // تحديث الأسئلة النشطة لتصبح تحت "عام"
      await supabase
        .from("teacher_custom_questions")
        .update({ category: "عام" })
        .eq("teacher_id", user?.id)
        .eq("category", categoryName)
        .eq("is_active", true);

      toast({
        title: "تم بنجاح",
        description: `تم حذف التصنيف "${categoryName}" ونقل الأسئلة إلى "عام"`,
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف التصنيف",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إدارة الأسئلة والتصنيفات</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="question">➕ إضافة سؤال</TabsTrigger>
            <TabsTrigger value="categories">📁 إدارة التصنيفات</TabsTrigger>
          </TabsList>

          {/* تبويب إضافة سؤال */}
          <TabsContent value="question" className="space-y-4 py-4">
          {/* نص السؤال */}
          <div className="space-y-2">
            <Label htmlFor="question-text">نص السؤال *</Label>
            <Textarea
              id="question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="اكتب السؤال هنا..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* نوع السؤال */}
            <div className="space-y-2">
              <Label htmlFor="question-type">نوع السؤال *</Label>
              <Select
                value={questionType}
                onValueChange={(value) => {
                  setQuestionType(value as QuestionType);
                  setCorrectAnswer("");
                }}
              >
                <SelectTrigger id="question-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">اختيار من متعدد</SelectItem>
                  <SelectItem value="true_false">صح وخطأ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* مستوى الصعوبة */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">مستوى الصعوبة *</Label>
              <Select
                value={difficulty}
                onValueChange={(value) => setDifficulty(value as QuestionDifficulty)}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">سهل</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="hard">صعب</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* التصنيف */}
            <div className="space-y-2">
              <Label htmlFor="category">التصنيف/المجموعة *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {existingCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                💡 لإضافة تصنيف جديد، انتقل إلى تبويب "إدارة التصنيفات"
              </p>
            </div>

            {/* النقاط */}
            <div className="space-y-2">
              <Label htmlFor="points">النقاط *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* الخيارات */}
          {questionType === "multiple_choice" && (
            <div className="space-y-2">
              <Label>الخيارات *</Label>
              <div className="space-y-2">
                {choices.map((choice, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={choice.text}
                      onChange={(e) => handleChoiceChange(index, e.target.value)}
                      placeholder={`الخيار ${index + 1}`}
                      className="flex-1"
                    />
                    {choices.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveChoice(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {choices.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddChoice}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة خيار
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* الإجابة الصحيحة */}
          <div className="space-y-2">
            <Label htmlFor="correct-answer">الإجابة الصحيحة *</Label>
            {questionType === "multiple_choice" ? (
              <Select value={correctAnswer} onValueChange={handleCorrectAnswerChange}>
                <SelectTrigger id="correct-answer">
                  <SelectValue placeholder="اختر الإجابة الصحيحة" />
                </SelectTrigger>
                <SelectContent>
                  {choices.map((choice, index) => (
                    <SelectItem key={index} value={index.toString()} disabled={!choice.text.trim()}>
                      {choice.text || `الخيار ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
                <SelectTrigger id="correct-answer">
                  <SelectValue placeholder="اختر الإجابة الصحيحة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">صح</SelectItem>
                  <SelectItem value="false">خطأ</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ السؤال"}
            </Button>
          </DialogFooter>
          </TabsContent>

          {/* تبويب إدارة التصنيفات */}
          <TabsContent value="categories" className="space-y-4 py-4">
            {/* إضافة تصنيف جديد */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                إضافة تصنيف جديد
              </h3>
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="اسم التصنيف (مثال: الشبكات السلكية)"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddCategory();
                    }
                  }}
                />
                <Button
                  onClick={handleAddCategory}
                  disabled={isAddingCategory}
                  size="sm"
                >
                  {isAddingCategory ? "جاري الإضافة..." : "إضافة"}
                </Button>
              </div>
            </div>

            {/* قائمة التصنيفات الموجودة */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold mb-2">التصنيفات الموجودة ({existingCategories.length})</h3>
              {existingCategories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد تصنيفات بعد</p>
                  <p className="text-xs mt-1">ابدأ بإضافة تصنيف جديد أعلاه</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {existingCategories.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-normal">
                          {cat}
                        </Badge>
                      </div>
                      {cat !== "عام" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(cat)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground border-t pt-3 mt-4">
              <p>💡 <strong>ملاحظة:</strong> عند حذف تصنيف، سيتم نقل جميع الأسئلة التابعة له إلى التصنيف "عام"</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
