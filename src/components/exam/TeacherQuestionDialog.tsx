import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { QuestionType, QuestionDifficulty, QuestionChoice } from "@/types/exam";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

  // Form state
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("multiple_choice");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>("medium");
  const [category, setCategory] = useState("عام");
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
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
      
      const finalCategory = showNewCategory && newCategory.trim() 
        ? newCategory.trim() 
        : category;

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
        category: finalCategory,
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
      setNewCategory("");
      setShowNewCategory(false);
      setPoints(1);
      setChoices([
        { text: "" },
        { text: "" },
      ]);
      setCorrectAnswer("");
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة سؤال جديد إلى "أسئلتي"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
              {!showNewCategory ? (
                <div className="flex gap-2">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {existingCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewCategory(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="اسم التصنيف الجديد"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setShowNewCategory(false);
                      setNewCategory("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "جاري الحفظ..." : "حفظ السؤال"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
