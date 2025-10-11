import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Question, QuestionType, QuestionDifficulty } from '@/types/exam';
import { Plus, X } from 'lucide-react';

const questionSchema = z.object({
  question_text: z.string().min(5, 'يجب أن يكون السؤال 5 أحرف على الأقل'),
  question_type: z.enum(['multiple_choice', 'true_false', 'essay', 'short_answer']),
  choices: z.array(z.object({
    id: z.string(),
    text: z.string().min(1, 'يجب إدخال نص الخيار')
  })).optional(),
  correct_answer: z.string().min(1, 'يجب إدخال الإجابة الصحيحة'),
  points: z.number().min(1, 'يجب أن تكون النقاط 1 على الأقل'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  grade_level: z.string().min(1, 'يجب اختيار المستوى الدراسي'),
  section_name: z.string().optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  question?: Question;
  onSubmit: (data: Omit<Question, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  // جلب أقسام الصف الحادي عشر
  const { data: sections = [] } = useQuery({
    queryKey: ['grade11-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grade11_sections')
        .select('id, title')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_text: question?.question_text || '',
      question_type: question?.question_type || 'multiple_choice',
      choices: question?.choices || [{ id: '1', text: '' }, { id: '2', text: '' }],
      correct_answer: question?.correct_answer || '',
      points: question?.points || 1,
      difficulty: question?.difficulty || 'medium',
      grade_level: question?.grade_level || '11',
      section_name: question?.section_name || '',
    },
  });

  const questionType = form.watch('question_type');
  const choices = form.watch('choices');

  useEffect(() => {
    if (questionType === 'true_false') {
      form.setValue('choices', [
        { id: 'true', text: 'صح' },
        { id: 'false', text: 'خطأ' }
      ]);
    } else if (questionType === 'multiple_choice' && (!choices || choices.length < 2)) {
      form.setValue('choices', [{ id: '1', text: '' }, { id: '2', text: '' }]);
    }
  }, [questionType]);

  const addChoice = () => {
    const currentChoices = form.getValues('choices') || [];
    form.setValue('choices', [...currentChoices, { id: String(currentChoices.length + 1), text: '' }]);
  };

  const removeChoice = (index: number) => {
    const currentChoices = form.getValues('choices') || [];
    if (currentChoices.length > 2) {
      form.setValue('choices', currentChoices.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (data: QuestionFormData) => {
    onSubmit({
      ...data,
      is_active: true,
    } as any);
  };

  const showChoices = questionType === 'multiple_choice' || questionType === 'true_false';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="question_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نوع السؤال</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="multiple_choice">اختيار متعدد</SelectItem>
                  <SelectItem value="true_false">صح/خطأ</SelectItem>
                  <SelectItem value="short_answer">إجابة قصيرة</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="question_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نص السؤال</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder="أدخل نص السؤال..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showChoices && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel>الخيارات</FormLabel>
              {questionType === 'multiple_choice' && (
                <Button type="button" variant="outline" size="sm" onClick={addChoice}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة خيار
                </Button>
              )}
            </div>
            {choices?.map((choice, index) => (
              <div key={choice.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`choices.${index}.text`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={`الخيار ${index + 1}`}
                          disabled={questionType === 'true_false'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {questionType === 'multiple_choice' && choices.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeChoice(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <FormField
          control={form.control}
          name="correct_answer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الإجابة الصحيحة</FormLabel>
              <FormControl>
                {showChoices ? (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الإجابة الصحيحة" />
                    </SelectTrigger>
                    <SelectContent>
                      {choices?.filter(c => c.text.trim()).map((choice) => (
                        <SelectItem key={choice.id} value={choice.text}>
                          {choice.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input {...field} placeholder="الإجابة الصحيحة" />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="points"
            render={({ field }) => (
              <FormItem>
                <FormLabel>النقاط</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>مستوى الصعوبة</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="easy">سهل</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="hard">صعب</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="grade_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المستوى الدراسي</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="10">الصف العاشر</SelectItem>
                  <SelectItem value="11">الصف الحادي عشر</SelectItem>
                  <SelectItem value="12">الصف الثاني عشر</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="section_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>القسم (اختياري)</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} 
                value={field.value || 'none'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">بدون قسم</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.title}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الحفظ...' : question ? 'تحديث السؤال' : 'إضافة السؤال'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
